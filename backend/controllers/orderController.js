const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const CartActivity = require("../models/CartActivity");

// Helper function to safely deduct order inventory once
async function deductOrderInventory(order) {
  if (order.inventoryDeducted) return;

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const currentOrder = await Order.findById(order._id).session(session);

      if (!currentOrder) {
        throw new Error("Order not found.");
      }

      if (currentOrder.inventoryDeducted) {
        return;
      }

      for (const item of currentOrder.items) {
        const result = await Product.updateOne(
          {
            _id: item.product,
            stock: { $gte: item.quantity },
          },
          {
            $inc: { stock: -item.quantity },
          },
          { session }
        );

        if (result.matchedCount !== 1) {
          throw new Error(
            `Insufficient stock or product unavailable: ${item.name}`
          );
        }
      }

      currentOrder.inventoryDeducted = true;
      await currentOrder.save({ session });
    });

    order.inventoryDeducted = true;
  } finally {
    await session.endSession();
  }
}

// Checkout and place order
exports.checkout = async (req, res) => {
  try {
    const { items, paymentMethod = "UPI", customer } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty. Please scan products before checkout.",
      });
    }

    // 1. Verify all products and check stock availability
    const verifiedItems = [];
    let grossSubtotal = 0;
    let totalDiscount = 0;

    for (const item of items) {
      const productId = item.productId || item._id;
      const quantity = Number(item.quantity);

      if (!productId || !Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid product or quantity in cart.",
        });
      }

      const product = await Product.findOne({ _id: productId, isActive: { $ne: false } });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product "${item.name || productId}" is no longer available.`,
        });
      }

      if (product.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Only ${product.stock} units available.`,
        });
      }

      const rawPrice = Number(product.price || 0);
      const rawCostPrice = Number(product.costPrice || 0);
      const explicitDiscount = Number(product.discount || 0);

      let originalMrp = rawPrice;
      let effectivePrice = rawPrice;
      let discountPerUnit = explicitDiscount;

      if (rawCostPrice > 0 && rawCostPrice !== rawPrice) {
        originalMrp = Math.max(rawPrice, rawCostPrice);
        effectivePrice = Math.min(rawPrice, rawCostPrice);
        discountPerUnit = Math.max(explicitDiscount, originalMrp - effectivePrice);
      } else if (explicitDiscount > 0) {
        originalMrp = rawPrice;
        effectivePrice = Math.max(0, rawPrice - explicitDiscount);
        discountPerUnit = explicitDiscount;
      }

      const itemSubtotal = effectivePrice * quantity;

      grossSubtotal += originalMrp * quantity;
      totalDiscount += discountPerUnit * quantity;

      verifiedItems.push({
        product: product._id,
        name: product.name,
        brand: product.brand || "",
        category: product.category,
        barcode: product.barcode || "",
        imageUrl: product.imageUrl || "",
        price: effectivePrice,
        originalPrice: originalMrp,
        discount: discountPerUnit,
        quantity,
        subtotal: itemSubtotal,
      });
    }

    // 2. Compute final order summary
    const discountAmount = totalDiscount;
    const taxAmount = 0;
    const totalAmount = Math.max(0, grossSubtotal - discountAmount + taxAmount);
    const totalItems = verifiedItems.reduce((acc, curr) => acc + curr.quantity, 0);

    // 3. Set initial payment status:
    // Flow: 1. Customer places order (Pending) -> 2. Super Admin approves (Approved) -> 3. Payment completed & verified (Completed)
    const isCashPayment = paymentMethod === "Cash";

    // Customer checkout must always start as Pending.
    const paymentStatus = "Pending";
    const inventoryDeducted = false;

    // 4. Generate unique Order number and Exit Receipt Barcode
    const timestampStr = Date.now().toString().slice(-6);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${timestampStr}-${randomSuffix}`;
    const exitBarcode = `EXIT-${Date.now().toString().slice(-8)}`;
    const paymentId = isCashPayment
      ? `PENDING-CASH-${Date.now().toString().slice(-6)}`
      : `PENDING-${paymentMethod.toUpperCase()}-${Date.now().toString().slice(-6)}`;

    const order = await Order.create({
      orderNumber,
      items: verifiedItems,
      totalItems,
      subtotalAmount: grossSubtotal,
      discountAmount,
      taxAmount,
      totalAmount,
      paymentMethod,
      paymentStatus,
      paymentId,
      customer: {
        name: customer?.name || "Mobile Shopper",
        phone: customer?.phone || "",
        email: customer?.email || "",
        address: customer?.address || "",
      },
      exitBarcode,
      inventoryDeducted,
      supermarket: req.supermarketId || null,
      supermarketCode: req.supermarketCode || "DEFAULT",
      supermarketName: req.supermarketName || "GrocerEase Supermarket",
    });

    // 5. Log Cart completed
    try {
      await CartActivity.create({
        sessionId: customer?.phone || "mobile-shopper",
        customerName: customer?.name || "Mobile Shopper",
        productName: `Completed Order (${totalItems} items)`,
        quantity: totalItems,
        price: totalAmount,
        action: "cleared",
        totalCartItems: 0,
        totalCartAmount: 0,
        supermarket: req.supermarketId || null,
        supermarketCode: req.supermarketCode || "DEFAULT",
      });
    } catch (_) { }

    try {
      const io = req.app?.get("io");
      if (io) {
        const notifData = {
          id: `pending-${order._id || order.orderNumber}`,
          type: "pending",
          badge: "PRE-BOOKING",
          title: "New Pre-Booking",
          actor: order.customer?.name || "Shopper",
          message: `${order.customer?.name || "Shopper"} is waiting for approval.`,
          timestamp: order.createdAt || new Date().toISOString(),
          order,
          customerName: order.customer?.name || "Shopper",
          totalAmount: order.totalAmount,
          paymentMethod: order.paymentMethod,
          supermarketId: req.supermarketId,
          supermarketCode: req.supermarketCode,
        };
        io.emit("admin:notification", notifData);
        io.emit("new-order", {
          ...notifData,
          order,
        });
      }
    } catch (_) { }

    return res.status(201).json({
      success: true,
      message: isCashPayment
        ? "Order registered. Please pay cash at the exit counter."
        : "Order placed successfully! Awaiting payment verification.",
      order,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return res.status(500).json({
      success: false,
      message: "Checkout failed",
      error: error.message,
    });
  }
};

// Log customer cart activity
exports.logCartActivity = async (req, res) => {
  try {
    const {
      sessionId = "mobile-shopper",
      customerName = "Mobile Shopper",
      productName,
      productId,
      quantity = 1,
      price = 0,
      action = "added",
      totalCartItems = 1,
      totalCartAmount = 0,
    } = req.body;

    if (!productName) {
      return res.status(400).json({
        success: false,
        message: "Product name is required",
      });
    }

    const activity = await CartActivity.create({
      sessionId,
      customerName,
      productName,
      productId,
      quantity,
      price,
      action,
      totalCartItems,
      totalCartAmount,
      supermarket: req.supermarketId || null,
      supermarketCode: req.supermarketCode || "DEFAULT",
    });

    try {
      const io = req.app?.get("io");
      if (io) {
        io.emit("admin:notification", {
          id: `cart-${activity._id || Date.now()}`,
          type: "cart",
          badge: "ADDED TO CART",
          title: "Cart Item Added",
          actor: customerName || "Mobile Shopper",
          message: `${customerName || "Customer"} added ${productName} (Qty: ${quantity}) to cart.`,
          timestamp: activity.createdAt || new Date().toISOString(),
          customerName: customerName || "Mobile Shopper",
          productName,
          quantity,
          price,
          supermarketId: req.supermarketId,
          supermarketCode: req.supermarketCode,
        });
      }
    } catch (_) {}

    return res.status(201).json({
      success: true,
      activity,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to record cart activity",
      error: error.message,
    });
  }
};

// Master purge function to ensure zero dummy/sample/seeded test data in database
async function purgeLegacyDummyRecords() {
  try {
    await Order.deleteMany({
      $or: [
        { orderNumber: { $in: ["ORD-948102-1001", "ORD-772109-2001", "ORD-289409", "ORD-289410", "ORD-STR001-1001", "ORD-STR002-2001", "ORD-DUMMY", "ORD-DEMO"] } },
        { "customer.name": { $in: ["Kavitha R", "Vikram Mehta", "Arun Kumar", "Priya Sharma", "Neha Patel", "Rahul Verma"] } },
        { totalAmount: { $in: [510, 9450] } },
      ],
    });
    await CartActivity.deleteMany({
      $or: [
        { customerName: { $in: ["Kavitha R", "Vikram Mehta", "Arun Kumar", "Priya Sharma", "Neha Patel", "Rahul Verma"] } },
        { sessionId: { $in: ["live-priya-sharma", "live-neha-patel", "live-rahul-verma"] } },
      ],
    });
  } catch (err) {
    console.warn("Purge dummy records note:", err.message);
  }
}

// Get live customer cart activities
exports.getCartActivity = async (req, res) => {
  try {
    const filter = {};
    if (req.supermarketId) {
      filter.supermarket = req.supermarketId;
    }
    const activities = await CartActivity.find(filter).sort({ createdAt: -1 }).limit(20);

    return res.status(200).json({
      success: true,
      count: activities.length,
      activities,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch cart activities",
      error: error.message,
    });
  }
};

// Get all orders (Strict Multi-Tenant Scoping & Real-Time only)
exports.getOrders = async (req, res) => {
  try {
    const filter = {};
    if (req.supermarketId) {
      filter.supermarket = req.supermarketId;
    }
    const orders = await Order.find(filter).sort({ createdAt: -1 });

    // Ensure no mock order slips through
    const genuineOrders = orders.filter((order) => {
      const orderNum = String(order.orderNumber || "").toUpperCase();
      const custName = String(order.customer?.name || "").toLowerCase().trim();
      const total = Number(order.totalAmount || 0);
      return !(
        ["ORD-948102-1001", "ORD-772109-2001", "ORD-289409", "ORD-289410"].includes(orderNum) ||
        ["kavitha r", "vikram mehta", "arun kumar", "priya sharma", "neha patel", "rahul verma"].includes(custName) ||
        total === 510 ||
        total === 9450
      );
    });

    return res.status(200).json({
      success: true,
      count: genuineOrders.length,
      orders: genuineOrders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

// Get order by ID or orderNumber
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = {
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { orderNumber: id }],
    };
    if (req.user && req.user.role === "STORE_ADMIN" && req.supermarketId) {
      query.supermarket = req.supermarketId;
    }

    const order = await Order.findOne(query);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message,
    });
  }
};

// Super Admin / Store Admin approves customer payment (Status: Approved)
exports.approvePayment = async (req, res) => {
  try {
    const { id } = req.params;

    const query = {
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { orderNumber: id },
        { exitBarcode: id },
      ],
    };
    if (req.user && req.user.role === "STORE_ADMIN" && req.supermarketId) {
      query.supermarket = req.supermarketId;
    }

    const order = await Order.findOne(query);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or you do not have permission to access it.",
      });
    }

    if (order.paymentStatus !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot approve this order because its status is ${order.paymentStatus}.`,
      });
    }

    order.paymentStatus = "Approved";
    order.approvedAt = new Date();
    await order.save();

    try {
      const io = req.app?.get("io");
      if (io) {
        io.emit("admin:notification", {
          id: `approved-${order._id || order.orderNumber}`,
          type: "approved",
          badge: "APPROVED",
          title: "Pre-Booking Approved",
          actor: order.customer?.name || "Shopper",
          message: `${order.customer?.name || "Shopper"} was approved for store exit.`,
          timestamp: order.approvedAt || new Date().toISOString(),
          order,
          supermarketId: order.supermarket,
          customerName: order.customer?.name || "Shopper",
          totalAmount: order.totalAmount,
        });
      }
    } catch (_) {}

    return res.status(200).json({
      success: true,
      message: `Order #${order.orderNumber} payment approved. Ready for store exit.`,
      order,
    });
  } catch (error) {
    console.error("Approve payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to approve payment",
      error: error.message,
    });
  }
};

// Super Admin / System completes customer payment and verifies transaction (Status: Completed)
exports.completePayment = async (req, res) => {
  try {
    const { id } = req.params;

    const query = {
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { orderNumber: id },
        { exitBarcode: id },
      ],
    };
    if (req.user && req.user.role === "STORE_ADMIN" && req.supermarketId) {
      query.supermarket = req.supermarketId;
    }

    const order = await Order.findOne(query);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or you do not have permission to access it.",
      });
    }

    if (order.paymentStatus !== "Approved") {
      return res.status(400).json({
        success: false,
        message: "Payment must be approved before completion.",
      });
    }

    // Atomically deduct stock from inventory if not done already
    await deductOrderInventory(order);

    order.paymentStatus = "Completed";
    order.completedAt = new Date();
    if (!order.paymentId || order.paymentId.startsWith("PENDING")) {
      order.paymentId = `${order.paymentMethod.toUpperCase()}-${Date.now().toString().slice(-6)}`;
    }
    await order.save();

    return res.status(200).json({
      success: true,
      message: `Order #${order.orderNumber} marked as Completed & stock verified.`,
      order,
    });
  } catch (error) {
    console.error("Complete payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to complete payment",
      error: error.message,
    });
  }
};

// Update order payment status dynamically
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, failureReason } = req.body;

    if (!["Pending", "Approved", "Completed", "Failed", "Network Error"].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status. Must be Pending, Approved, Completed, Failed, or Network Error.",
      });
    }

    const query = {
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { orderNumber: id },
        { exitBarcode: id },
      ],
    };
    if (req.user && req.user.role === "STORE_ADMIN" && req.supermarketId) {
      query.supermarket = req.supermarketId;
    }

    const order = await Order.findOne(query);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or you do not have permission to access it.",
      });
    }

    if (paymentStatus === "Completed" && order.paymentStatus !== "Approved") {
      return res.status(400).json({
        success: false,
        message: "Payment must be approved before completion.",
      });
    }

    if (paymentStatus === "Completed" && order.paymentMethod === "Cash") {
      return res.status(400).json({
        success: false,
        message: "Cash orders must use the cash confirmation workflow.",
      });
    }

    if (paymentStatus === "Completed") {
      await deductOrderInventory(order);
      order.completedAt = new Date();
      if (!order.paymentId || order.paymentId.startsWith("PENDING")) {
        order.paymentId = `${order.paymentMethod.toUpperCase()}-${Date.now().toString().slice(-6)}`;
      }
    } else if (paymentStatus === "Approved") {
      order.approvedAt = new Date();
    }

    order.paymentStatus = paymentStatus;
    if (failureReason !== undefined) {
      order.failureReason = failureReason;
    }
    await order.save();

    return res.status(200).json({
      success: true,
      message: `Order #${order.orderNumber} status changed to ${paymentStatus}.`,
      order,
    });
  } catch (error) {
    console.error("Update payment status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update payment status",
      error: error.message,
    });
  }
};

// Confirm cash payment by supermarket cashier/staff & atomically deduct inventory
exports.confirmCashPayment = async (req, res) => {
  try {
    const { id } = req.params;

    const query = {
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { orderNumber: id },
        { exitBarcode: id },
      ],
    };
    if (req.user && req.user.role === "STORE_ADMIN" && req.supermarketId) {
      query.supermarket = req.supermarketId;
    }

    const order = await Order.findOne(query);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or you do not have permission to access it.",
      });
    }

    if (order.paymentMethod !== "Cash") {
      return res.status(400).json({
        success: false,
        message: "This order is not a cash payment.",
      });
    }

    if (order.paymentStatus !== "Approved") {
      return res.status(400).json({
        success: false,
        message: "Order must be approved before cash confirmation.",
      });
    }

    // Atomically deduct stock from inventory now that cash is collected
    await deductOrderInventory(order);

    order.paymentStatus = "Completed";
    order.completedAt = new Date();
    order.paymentId = `CASH-${Date.now().toString().slice(-6)}`;
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Cash payment confirmed successfully! Stock deducted.",
      order,
    });
  } catch (error) {
    console.error("Confirm cash error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to confirm cash payment",
      error: error.message,
    });
  }
};

// Get consolidated Admin Dashboard statistics (Strict Multi-Tenant Scoping)
exports.getAdminStats = async (req, res) => {
  try {
    const prodFilter = { isActive: { $ne: false } };
    const ordFilter = {};
    const cartFilter = {};
    if (req.supermarketId) {
      prodFilter.supermarket = req.supermarketId;
      ordFilter.supermarket = req.supermarketId;
      cartFilter.supermarket = req.supermarketId;
    }
    const products = await Product.find(prodFilter);
    const rawOrders = await Order.find(ordFilter).sort({ createdAt: -1 });

    // Filter out any mock / test dummy orders
    const allOrders = rawOrders.filter((order) => {
      const orderNum = String(order.orderNumber || "").toUpperCase();
      const custName = String(order.customer?.name || "").toLowerCase().trim();
      const total = Number(order.totalAmount || 0);
      return !(
        ["ORD-948102-1001", "ORD-772109-2001", "ORD-289409", "ORD-289410"].includes(orderNum) ||
        ["kavitha r", "vikram mehta", "arun kumar", "priya sharma", "neha patel", "rahul verma"].includes(custName) ||
        total === 510 ||
        total === 9450
      );
    });

    const completedOrders = allOrders.filter(
      (o) => o.paymentStatus === "Completed" || o.paymentStatus === "Approved"
    );
    const approvedOrders = allOrders.filter((o) => o.paymentStatus === "Approved");
    const pendingOrders = allOrders.filter((o) => o.paymentStatus === "Pending");
    const pendingCashOrders = allOrders.filter(
      (o) => o.paymentMethod === "Cash" && o.paymentStatus === "Pending"
    );

    const totalProducts = products.length;

    let totalInventoryValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    const categoryMap = {};

    for (const p of products) {
      const stock = Number(p.stock || 0);
      const price = Number(p.price || 0);
      totalInventoryValue += stock * price;

      const threshold = Number(p.lowStockThreshold || 5);
      if (stock === 0) {
        outOfStockCount++;
      } else if (stock <= threshold) {
        lowStockCount++;
      }

      const cat = p.category || "Other";
      if (!categoryMap[cat]) {
        categoryMap[cat] = { count: 0, value: 0 };
      }
      categoryMap[cat].count += 1;
      categoryMap[cat].value += stock * price;
    }

    const totalSales = completedOrders.reduce((sum, ord) => sum + (ord.totalAmount || 0), 0);
    const totalOrders = completedOrders.length;
    const pendingCashOrdersCount = pendingCashOrders.length;

    // Format category distribution for charts
    const categoryDistribution = Object.keys(categoryMap).map((cat) => ({
      name: cat,
      count: categoryMap[cat].count,
      value: categoryMap[cat].value,
    }));

    // Recent orders (last 8)
    const recentOrders = allOrders.slice(0, 8);

    // Live customer cart activities (latest 8) scoped to supermarket
    const recentCartActivity = await CartActivity.find(cartFilter).sort({ createdAt: -1 }).limit(8);

    // Active carts (within past 2 hours)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    let activeCartsCount = 0;
    try {
      const activeSessions = await CartActivity.distinct("sessionId", {
        createdAt: { $gte: twoHoursAgo },
        action: { $in: ["added", "updated"] },
        ...(req.supermarketId ? { supermarket: req.supermarketId } : {}),
      });
      activeCartsCount = activeSessions.length;
    } catch (_) {
      activeCartsCount = 0;
    }

    // Distinct registered customers count
    const customerPhoneSet = new Set();
    allOrders.forEach((o) => {
      const p = o.customer?.phone || o.customer?.name;
      if (p) customerPhoneSet.add(p);
    });
    const totalCustomers = customerPhoneSet.size;

    return res.status(200).json({
      success: true,
      stats: {
        totalProducts,
        totalInventoryValue,
        totalSales,
        totalOrders,
        totalCustomers,
        pendingCashOrdersCount,
        allOrdersCount: allOrders.length,
        lowStockCount,
        outOfStockCount,
        categoryDistribution,
        recentOrders,
        recentCartActivity,
        activeCartsCount,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to generate dashboard statistics",
      error: error.message,
    });
  }
};

// Reports Management - Uses only existing MongoDB records (Strict Multi-Tenant Scoping)
exports.getReports = async (req, res) => {
  try {
    const { from, to } = req.query;

    const startDate = from ? new Date(from) : null;
    const endDate = to ? new Date(to) : null;

    if (
      (from && Number.isNaN(startDate.getTime())) ||
      (to && Number.isNaN(endDate.getTime()))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid report date range.",
      });
    }

    if (endDate) {
      endDate.setHours(23, 59, 59, 999);
    }

    const ordQuery = {};
    const prodQuery = { isActive: { $ne: false } };
    if (req.supermarketId) {
      ordQuery.supermarket = req.supermarketId;
      prodQuery.supermarket = req.supermarketId;
    }
    const rawOrders = await Order.find(ordQuery).sort({ createdAt: -1 }).lean();
    const products = await Product.find(prodQuery).sort({ createdAt: -1 }).lean();

    // Strictly exclude any dummy/mock orders
    const allOrders = rawOrders.filter((order) => {
      const orderNum = String(order.orderNumber || "").toUpperCase();
      const custName = String(order.customer?.name || "").toLowerCase().trim();
      const total = Number(order.totalAmount || 0);
      return !(
        ["ORD-948102-1001", "ORD-772109-2001", "ORD-289409", "ORD-289410"].includes(orderNum) ||
        ["kavitha r", "vikram mehta", "arun kumar", "priya sharma", "neha patel", "rahul verma"].includes(custName) ||
        total === 510 ||
        total === 9450
      );
    });

    const filteredOrders = allOrders.filter((order) => {
      const reportDate = new Date(
        order.paymentStatus === "Completed"
          ? order.completedAt || order.createdAt
          : order.createdAt
      );

      if (Number.isNaN(reportDate.getTime())) return false;
      if (startDate && reportDate < startDate) return false;
      if (endDate && reportDate > endDate) return false;

      return true;
    });

    const completedOrders = filteredOrders.filter(
      (order) => order.paymentStatus === "Completed" || order.paymentStatus === "Approved"
    );

    const totalSales = completedOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount || 0),
      0
    );

    const productsSold = completedOrders.reduce(
      (sum, order) =>
        sum +
        (order.items || []).reduce(
          (itemSum, item) => itemSum + Number(item.quantity || 0),
          0
        ),
      0
    );

    const customerKeys = new Set();

    filteredOrders.forEach((order) => {
      const customer = order.customer || {};
      const key = customer.phone || customer.email || customer.name;

      if (key) customerKeys.add(String(key).trim().toLowerCase());
    });

    const lowStockProducts = products.filter(
      (product) =>
        Number(product.stock) > 0 &&
        Number(product.stock) <= Number(product.lowStockThreshold ?? 5)
    );

    const outOfStockProducts = products.filter(
      (product) => Number(product.stock) <= 0
    );

    const paymentMethods = {};

    completedOrders.forEach((order) => {
      const method = order.paymentMethod || "Unknown";

      if (!paymentMethods[method]) {
        paymentMethods[method] = { orders: 0, sales: 0 };
      }

      paymentMethods[method].orders += 1;
      paymentMethods[method].sales += Number(order.totalAmount || 0);
    });

    return res.status(200).json({
      success: true,
      summary: {
        totalSales,
        totalOrders: filteredOrders.length,
        completedOrders: completedOrders.length,
        pendingOrders: filteredOrders.filter(
          (order) => order.paymentStatus === "Pending"
        ).length,
        approvedOrders: filteredOrders.filter(
          (order) => order.paymentStatus === "Approved"
        ).length,
        failedOrders: filteredOrders.filter(
          (order) => order.paymentStatus === "Failed"
        ).length,
        networkErrorOrders: filteredOrders.filter(
          (order) => order.paymentStatus === "Network Error"
        ).length,
        networkErrorAmount: filteredOrders
          .filter((order) => order.paymentStatus === "Network Error")
          .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0),
        productsSold,
        totalCustomers: customerKeys.size,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length,
      },
      paymentMethods,
      orders: filteredOrders,
      completedOrders,
      products,
      lowStockProducts,
      outOfStockProducts,
    });
  } catch (error) {
    console.error("Reports API Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate reports.",
      error: error.message,
    });
  }
};

