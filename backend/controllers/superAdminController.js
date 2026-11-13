const mongoose = require("mongoose");
const Supermarket = require("../models/Supermarket");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const { clearTenantCache } = require("../middleware/tenantMiddleware");

// Default initial catalog template for newly created supermarkets
const INITIAL_STORE_PRODUCTS_TEMPLATE = [
  {
    name: "Fresh Red Apples (Washington)",
    brand: "Fresh Orchard",
    category: "Fruits & Vegetables",
    barcodePrefix: "2001",
    price: 180.0,
    costPrice: 130.0,
    stock: 65,
    lowStockThreshold: 15,
    imageUrl: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=120&auto=format&fit=crop&q=80",
    description: "Crisp and juicy sweet Washington red apples.",
  },
  {
    name: "Chocolate",
    brand: "Zero Sugar",
    category: "Beverages",
    barcodePrefix: "2002",
    price: 352.0,
    costPrice: 280.0,
    stock: 25,
    lowStockThreshold: 10,
    imageUrl: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=120&auto=format&fit=crop&q=80",
    description: "Premium dark chocolate with zero added sugar.",
  },
  {
    name: "Lays Potato Chips",
    brand: "Lays",
    category: "Snacks",
    barcodePrefix: "2003",
    price: 20.0,
    costPrice: 14.0,
    stock: 50,
    lowStockThreshold: 10,
    imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=120&auto=format&fit=crop&q=80",
    description: "Classic salted crispy potato chips.",
  },
  {
    name: "Shampoo 180 ml",
    brand: "Dove",
    category: "Household",
    barcodePrefix: "2004",
    price: 250.0,
    costPrice: 195.0,
    stock: 30,
    lowStockThreshold: 8,
    imageUrl: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=120&auto=format&fit=crop&q=80",
    description: "Nourishing daily shampoo for smooth hair.",
  },
  {
    name: "Basmati Rice 5kg",
    brand: "Royal Heritage",
    category: "Groceries",
    barcodePrefix: "2005",
    price: 650.0,
    costPrice: 520.0,
    stock: 40,
    lowStockThreshold: 10,
    imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=120&auto=format&fit=crop&q=80",
    description: "Premium aged long-grain aromatic basmati rice.",
  },
  {
    name: "Farm Fresh Whole Milk 1L",
    brand: "Amul",
    category: "Dairy",
    barcodePrefix: "2006",
    price: 68.0,
    costPrice: 58.0,
    stock: 45,
    lowStockThreshold: 12,
    imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=120&auto=format&fit=crop&q=80",
    description: "Pasteurized homogenized full-cream cow milk.",
  },
];

// Helper: Seed initial products for a new supermarket
async function seedProductsForSupermarket(supermarket) {
  try {
    const productsToInsert = INITIAL_STORE_PRODUCTS_TEMPLATE.map((tpl, idx) => {
      const randomSuffix = Math.floor(10000000 + Math.random() * 90000000).toString();
      const code = `${tpl.barcodePrefix}${randomSuffix}`.slice(0, 13);
      return {
        ...tpl,
        barcode: code,
        supermarket: supermarket._id,
        supermarketCode: supermarket.code,
        isActive: true,
      };
    });
    await Product.insertMany(productsToInsert);
  } catch (err) {
    console.warn("Auto-seeding new store products error:", err.message);
  }
}

// 1. GET /api/super-admin/supermarkets - List all supermarkets with sales & operational metrics
exports.getAllSupermarkets = async (req, res) => {
  try {
    // Purge legacy dummy mock orders
    await Order.deleteMany({
      $or: [
        { orderNumber: { $in: ["ORD-948102-1001", "ORD-772109-2001", "ORD-289409", "ORD-289410", "ORD-STR001-1001", "ORD-STR002-2001"] } },
        { "customer.name": { $in: ["Kavitha R", "Vikram Mehta", "Arun Kumar", "Priya Sharma", "Neha Patel", "Rahul Verma"] } },
        { totalAmount: { $in: [510, 9450] } },
      ],
    });

    const supermarkets = await Supermarket.find().sort({ createdAt: -1 });

    // Aggregate metrics per supermarket in parallel
    const enrichedSupermarkets = await Promise.all(
      supermarkets.map(async (store) => {
        const storeId = store._id;

        const [orderStats, productCount] = await Promise.all([
          Order.aggregate([
            { $match: { supermarket: storeId, paymentStatus: { $in: ["Completed", "Approved", "Pending"] } } },
            {
              $group: {
                _id: null,
                totalSales: { $sum: "$totalAmount" },
                totalOrders: { $sum: 1 },
                completedOrders: {
                  $sum: { $cond: [{ $in: ["$paymentStatus", ["Completed", "Approved"]] }, 1, 0] },
                },
              },
            },
          ]),
          Product.countDocuments({ supermarket: storeId, isActive: { $ne: false } }),
        ]);

        const sales = orderStats[0]?.totalSales || 0;
        const orders = orderStats[0]?.totalOrders || 0;
        const completed = orderStats[0]?.completedOrders || 0;

        return {
          ...store.toObject(),
          totalSales: sales,
          totalOrders: orders,
          completedOrders: completed,
          totalProducts: productCount,
          healthScore: store.status === "Active" ? 98 : store.status === "Trial" ? 85 : 40,
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: enrichedSupermarkets.length,
      supermarkets: enrichedSupermarkets,
    });
  } catch (error) {
    console.error("Get all supermarkets error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve supermarkets list.",
      error: error.message,
    });
  }
};

// 2. POST /api/super-admin/supermarkets - Create new supermarket with custom Admin login credentials
exports.createSupermarket = async (req, res) => {
  try {
    const {
      name,
      code,
      tagline,
      address,
      city,
      state,
      pincode,
      phone,
      email,
      adminUsername,
      adminPassword = "StoreAdmin@123",
      adminName,
      plan = "Premium",
      status = "Active",
      themeColor = "#16a34a",
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Supermarket name is required.",
      });
    }

    const trimmedName = name.trim();
    let cleanUsername = adminUsername ? String(adminUsername).trim().toLowerCase() : "";
    if (!cleanUsername) {
      cleanUsername = trimmedName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10);
      if (!cleanUsername) cleanUsername = "storeadmin" + Math.floor(100 + Math.random() * 900);
    }

    let cleanCode = code ? String(code).trim().toUpperCase() : "";
    if (!cleanCode) {
      const prefix = trimmedName.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "STR";
      cleanCode = `${prefix}-${Math.floor(100 + Math.random() * 900)}`;
    }

    // Ensure code uniqueness
    let existingCode = await Supermarket.findOne({ code: cleanCode });
    let counter = 1;
    while (existingCode) {
      cleanCode = `STR-${Math.floor(100 + Math.random() * 900)}${counter}`;
      existingCode = await Supermarket.findOne({ code: cleanCode });
      counter++;
    }

    // Check username uniqueness
    const existingUser = await User.findOne({ username: cleanUsername });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `Admin username "${cleanUsername}" is already in use. Please assign a unique username.`,
      });
    }

    // 1. Create Supermarket
    const newSupermarket = await Supermarket.create({
      name: trimmedName,
      code: cleanCode,
      slug: cleanCode.toLowerCase(),
      tagline: tagline || "Smart Supermarket & Instant Gate Clearance",
      address: address || "Supermarket Branch Location",
      city: city || "Bangalore",
      state: state || "Karnataka",
      pincode: pincode || "560001",
      phone: phone || "+91 98765 43210",
      email: email || `${cleanUsername}@grocerease.store`,
      adminUsername: cleanUsername,
      adminPassword: adminPassword,
      adminName: adminName || `${trimmedName} Manager`,
      plan: plan || "Premium",
      status: status || "Active",
      themeColor: themeColor || "#16a34a",
    });

    // 2. Create Store Admin User with the credentials created by Super Admin
    await User.create({
      name: adminName || `${name.trim()} Admin`,
      username: cleanUsername,
      password: adminPassword,
      role: "STORE_ADMIN",
      supermarket: newSupermarket._id,
      supermarketCode: newSupermarket.code,
      supermarketName: newSupermarket.name,
      status: status === "Suspended" ? "Suspended" : "Active",
    });

    clearTenantCache();

    return res.status(201).json({
      success: true,
      message: `Supermarket "${newSupermarket.name}" created successfully with credentials: ${cleanUsername}`,
      supermarket: newSupermarket,
    });
  } catch (error) {
    console.error("Create supermarket error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create supermarket.",
      error: error.message,
    });
  }
};

// 3. PUT /api/super-admin/supermarkets/:id - Update supermarket & credentials
exports.updateSupermarket = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      tagline,
      address,
      city,
      state,
      pincode,
      phone,
      email,
      plan,
      status,
      adminUsername,
      adminPassword,
      adminName,
      themeColor,
    } = req.body;

    const supermarket = await Supermarket.findById(id);
    if (!supermarket) {
      return res.status(404).json({
        success: false,
        message: "Supermarket not found.",
      });
    }

    if (name) supermarket.name = name.trim();
    if (tagline !== undefined) supermarket.tagline = tagline.trim();
    if (address !== undefined) supermarket.address = address.trim();
    if (city !== undefined) supermarket.city = city.trim();
    if (state !== undefined) supermarket.state = state.trim();
    if (pincode !== undefined) supermarket.pincode = pincode.trim();
    if (phone !== undefined) supermarket.phone = phone.trim();
    if (email !== undefined) supermarket.email = email.trim().toLowerCase();
    if (plan !== undefined) supermarket.plan = plan;
    if (themeColor !== undefined) supermarket.themeColor = themeColor;

    let credentialsUpdated = false;
    let oldUsername = supermarket.adminUsername;

    if (adminUsername && adminUsername.trim().toLowerCase() !== supermarket.adminUsername) {
      const newUsername = adminUsername.trim().toLowerCase();
      const duplicate = await User.findOne({ username: newUsername, supermarket: { $ne: supermarket._id } });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Username "${newUsername}" is already taken by another account.`,
        });
      }
      supermarket.adminUsername = newUsername;
      credentialsUpdated = true;
    }

    if (adminPassword) {
      supermarket.adminPassword = adminPassword;
      credentialsUpdated = true;
    }

    if (adminName) {
      supermarket.adminName = adminName;
    }

    if (status && status !== supermarket.status) {
      supermarket.status = status;
      // Sync user status
      await User.updateMany(
        { supermarket: supermarket._id },
        { status: status === "Suspended" ? "Suspended" : "Active" }
      );
    }

    await supermarket.save();

    // Update associated User credentials if changed
    if (credentialsUpdated || adminName) {
      const user = await User.findOne({
        $or: [{ supermarket: supermarket._id }, { username: oldUsername }],
      });
      if (user) {
        if (adminName) user.name = adminName;
        if (supermarket.adminUsername) user.username = supermarket.adminUsername;
        if (adminPassword) user.password = adminPassword; // Triggers bcrypt pre-save
        user.supermarketName = supermarket.name;
        await user.save();
      }
    }

    clearTenantCache();

    return res.status(200).json({
      success: true,
      message: `Supermarket "${supermarket.name}" updated successfully.`,
      supermarket,
    });
  } catch (error) {
    console.error("Update supermarket error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update supermarket.",
      error: error.message,
    });
  }
};

// 4. DELETE /api/super-admin/supermarkets/:id - Delete supermarket
exports.deleteSupermarket = async (req, res) => {
  try {
    const { id } = req.params;
    const supermarket = await Supermarket.findById(id);
    if (!supermarket) {
      return res.status(404).json({
        success: false,
        message: "Supermarket not found.",
      });
    }

    // Delete associated store users
    await User.deleteMany({ supermarket: supermarket._id });
    // Soft-delete products
    await Product.updateMany({ supermarket: supermarket._id }, { isActive: false });
    // Remove supermarket
    await Supermarket.findByIdAndDelete(id);

    clearTenantCache();

    return res.status(200).json({
      success: true,
      message: `Supermarket "${supermarket.name}" and its credentials were deleted.`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete supermarket.",
      error: error.message,
    });
  }
};

// 5. POST /api/super-admin/supermarkets/:id/reset-password - Reset store admin password
exports.resetStorePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword = "StoreAdmin@123" } = req.body;

    const supermarket = await Supermarket.findById(id);
    if (!supermarket) {
      return res.status(404).json({
        success: false,
        message: "Supermarket not found.",
      });
    }

    supermarket.adminPassword = newPassword;
    await supermarket.save();

    let user = await User.findOne({ supermarket: supermarket._id });
    if (user) {
      user.password = newPassword; // Hashes via pre-save hook
      await user.save();
    } else {
      await User.create({
        name: supermarket.adminName || `${supermarket.name} Admin`,
        username: supermarket.adminUsername,
        password: newPassword,
        role: "STORE_ADMIN",
        supermarket: supermarket._id,
        supermarketCode: supermarket.code,
        supermarketName: supermarket.name,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Password reset successfully for "${supermarket.name}". New password: ${newPassword}`,
      adminUsername: supermarket.adminUsername,
      adminPassword: newPassword,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to reset password.",
      error: error.message,
    });
  }
};

// 6. GET /api/super-admin/analytics - Platform-wide SaaS Analytics
exports.getPlatformAnalytics = async (req, res) => {
  try {
    const [supermarkets, totalOrdersAgg, allProductsCount] = await Promise.all([
      Supermarket.find().sort({ createdAt: -1 }),
      Order.aggregate([
        { $match: { paymentStatus: { $in: ["Completed", "Approved", "Pending"] } } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalAmount" },
            totalOrdersCount: { $sum: 1 },
          },
        },
      ]),
      Product.countDocuments({ isActive: { $ne: false } }),
    ]);

    const totalStoreSales = totalOrdersAgg[0]?.totalRevenue || 0;
    const totalOrders = totalOrdersAgg[0]?.totalOrdersCount || 0;

    const totalSupermarkets = supermarkets.length;
    const activeSupermarkets = supermarkets.filter((s) => s.status === "Active").length;
    const inactiveSupermarkets = supermarkets.filter((s) => s.status === "Suspended" || s.status === "Inactive").length;
    const pendingRegistrations = supermarkets.filter((s) => s.status === "Pending" || s.status === "Trial").length;

    // SaaS Recurring Revenue Calculation based on subscription tiers
    const planRateMap = {
      Basic: 4999,
      Standard: 9999,
      Business: 12499,
      Premium: 19999,
      Enterprise: 24999,
    };
    const subscriptionRevenue = supermarkets.reduce((sum, s) => {
      const rate = planRateMap[s.plan] || 9999;
      return sum + rate;
    }, 0);

    const totalRevenue = subscriptionRevenue + totalStoreSales;
    const platformGrowth = 25; // 25% platform growth

    // Per-supermarket breakdown
    const supermarketPerformance = await Promise.all(
      supermarkets.map(async (s) => {
        const stats = await Order.aggregate([
          { $match: { supermarket: s._id, paymentStatus: { $in: ["Completed", "Approved", "Pending"] } } },
          {
            $group: {
              _id: null,
              sales: { $sum: "$totalAmount" },
              orders: { $sum: 1 },
            },
          },
        ]);

        const sales = stats[0]?.sales || 0;
        const orders = stats[0]?.orders || 0;

        return {
          supermarketId: s._id,
          name: s.name,
          code: s.code,
          city: s.city,
          status: s.status,
          plan: s.plan,
          sales,
          orders,
          avgOrderValue: orders > 0 ? Math.round(sales / orders) : 0,
        };
      })
    );

    const recentSupermarkets = supermarkets.slice(0, 10).map((s) => ({
      _id: s._id,
      name: s.name,
      code: s.code,
      adminUsername: s.adminUsername,
      adminName: s.adminName || `${s.name} Manager`,
      email: s.email || `${s.adminUsername}@store.com`,
      plan: s.plan || "Premium",
      status: s.status || "Active",
      createdAt: s.createdAt,
    }));

    return res.status(200).json({
      success: true,
      summary: {
        totalRevenue,
        subscriptionRevenue,
        totalStoreSales,
        totalOrders,
        totalSupermarkets,
        activeSupermarkets,
        activeSubscriptions: activeSupermarkets,
        inactiveSupermarkets,
        pendingRegistrations,
        totalProductsCount: allProductsCount,
        platformGrowth,
      },
      supermarketPerformance,
      recentSupermarkets,
    });
  } catch (error) {
    console.error("Platform analytics error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to calculate platform analytics.",
      error: error.message,
    });
  }
};

// 7. GET /api/super-admin/plans - List subscription plans
exports.getSubscriptionPlans = async (req, res) => {
  try {
    let plans = await SubscriptionPlan.find().sort({ price: 1 });
    if (plans.length === 0) {
      const defaultPlans = [
        {
          name: "Basic Plan",
          tierCode: "BASIC",
          price: 4999,
          billingCycle: "Monthly",
          durationDays: 30,
          description: "Ideal for boutique single-counter minimarts and local grocery shops.",
          features: [
            "1 Supermarket Store Branch",
            "Up to 500 Active SKUs",
            "Standard Barcode Scanning",
            "Daily POS Order Reports",
            "Email & Chat Support",
          ],
          maxProducts: 500,
          maxTurnstiles: 1,
          status: "Active",
          isPopular: false,
        },
        {
          name: "Standard Business Plan",
          tierCode: "STANDARD",
          price: 9999,
          billingCycle: "Monthly",
          durationDays: 30,
          description: "Designed for busy supermarkets requiring autonomous checkout & AI scanning.",
          features: [
            "Up to 3 Supermarket Branches",
            "Unlimited Products & SKUs",
            "Automated Turnstile QR Integration",
            "Real-time Inventory & Low-Stock Alerts",
            "WhatsApp & SMS Digital Receipts",
            "24/7 Priority Support",
          ],
          maxProducts: 5000,
          maxTurnstiles: 3,
          status: "Active",
          isPopular: false,
        },
        {
          name: "Premium Supermarket Suite",
          tierCode: "PREMIUM",
          price: 19999,
          billingCycle: "Monthly",
          durationDays: 30,
          description: "Full-scale autonomous retail intelligence with multi-gate loss prevention.",
          features: [
            "Up to 10 Supermarket Branches",
            "High-Speed QR Barrier Clearance",
            "Predictive Reorder & AI Stock Forecasting",
            "Custom Store Admin Branding & Domain",
            "Automated Tax Invoicing & Ledger Export",
            "Dedicated Account Manager",
          ],
          maxProducts: 25000,
          maxTurnstiles: 8,
          status: "Active",
          isPopular: true,
        },
        {
          name: "Enterprise Multi-Chain",
          tierCode: "ENTERPRISE",
          price: 34999,
          billingCycle: "Monthly",
          durationDays: 30,
          description: "Enterprise tier for supermarket franchises and regional retail chains.",
          features: [
            "Unlimited Supermarket Branches",
            "Cryptographic Data Isolation",
            "Multi-Gate IoT Turnstile Hardware Sync",
            "Custom ERP & SAP Integration",
            "White-Label Mobile App & Web Mirrors",
            "99.9% Uptime Guarantee with SLA",
          ],
          maxProducts: 100000,
          maxTurnstiles: 20,
          status: "Active",
          isPopular: false,
        },
      ];
      plans = await SubscriptionPlan.insertMany(defaultPlans);
    }

    return res.status(200).json({
      success: true,
      count: plans.length,
      plans,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch subscription plans.",
      error: error.message,
    });
  }
};

// 8. POST /api/super-admin/plans - Create new subscription plan
exports.createSubscriptionPlan = async (req, res) => {
  try {
    const { name, tierCode, price, billingCycle, durationDays, description, features, maxProducts, maxTurnstiles, isPopular } = req.body;
    if (!name || !price) {
      return res.status(400).json({ success: false, message: "Plan name and price are required." });
    }
    const plan = await SubscriptionPlan.create({
      name: name.trim(),
      tierCode: tierCode || name.replace(/[^a-zA-Z]/g, "").slice(0, 8).toUpperCase(),
      price: Number(price),
      billingCycle: billingCycle || "Monthly",
      durationDays: Number(durationDays) || 30,
      description: description || "Supermarket SaaS subscription plan.",
      features: Array.isArray(features) ? features : (features ? String(features).split("\n").filter(Boolean) : []),
      maxProducts: Number(maxProducts) || 1000,
      maxTurnstiles: Number(maxTurnstiles) || 2,
      isPopular: !!isPopular,
      status: "Active",
    });
    return res.status(201).json({ success: true, message: `Plan "${plan.name}" created successfully.`, plan });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to create subscription plan.", error: error.message });
  }
};

// 9. PUT /api/super-admin/plans/:id - Update plan
exports.updateSubscriptionPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await SubscriptionPlan.findByIdAndUpdate(id, req.body, { new: true });
    if (!plan) return res.status(404).json({ success: false, message: "Subscription plan not found." });
    return res.status(200).json({ success: true, message: "Subscription plan updated successfully.", plan });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update plan.", error: error.message });
  }
};

// 10. DELETE /api/super-admin/plans/:id - Delete plan
exports.deleteSubscriptionPlan = async (req, res) => {
  try {
    const { id } = req.params;
    await SubscriptionPlan.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: "Subscription plan deleted successfully." });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete plan.", error: error.message });
  }
};

// Helper to resolve supermarket ID from ObjectId, branch code, or slug
async function resolveSupermarketId(input) {
  if (!input || input === "all") return null;
  const str = String(input).trim();
  if (mongoose.Types.ObjectId.isValid(str) && /^[0-9a-fA-F]{24}$/.test(str)) {
    return new mongoose.Types.ObjectId(str);
  }
  const store = await Supermarket.findOne({
    $or: [
      { code: str.toUpperCase() },
      { slug: str.toLowerCase() },
      { adminUsername: str.toLowerCase() },
    ],
  });
  return store ? store._id : null;
}

// 7. GET /api/super-admin/product-sales - Product-wise sales counts breakdown per supermarket
// User explicitly required: "For example, if one supermarket sells 50 apples, the dashboard should display the supermarket name and the apple sales count separately."
exports.getProductWiseSalesReport = async (req, res) => {
  try {
    const { supermarketId, search, category } = req.query;

    const matchStage = {
      paymentStatus: { $in: ["Completed", "Approved", "Pending"] },
    };

    if (supermarketId && supermarketId !== "all") {
      const resolvedId = await resolveSupermarketId(supermarketId);
      if (resolvedId) {
        matchStage.supermarket = resolvedId;
      } else {
        matchStage.supermarket = new mongoose.Types.ObjectId();
      }
    }

    const salesMatrix = await Order.aggregate([
      { $match: matchStage },
      { $unwind: "$items" },
      {
        $group: {
          _id: {
            supermarket: "$supermarket",
            productName: "$items.name",
          },
          supermarketName: { $first: "$supermarketName" },
          supermarketCode: { $first: "$supermarketCode" },
          category: { $first: "$items.category" },
          barcode: { $first: "$items.barcode" },
          imageUrl: { $first: "$items.imageUrl" },
          unitsSold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.subtotal" },
          ordersCount: { $sum: 1 },
          lastSoldAt: { $max: "$createdAt" },
        },
      },
      {
        $lookup: {
          from: "supermarkets",
          localField: "_id.supermarket",
          foreignField: "_id",
          as: "supermarketDoc",
        },
      },
      {
        $project: {
          _id: 0,
          supermarketId: "$_id.supermarket",
          supermarketName: {
            $ifNull: [{ $arrayElemAt: ["$supermarketDoc.name", 0] }, "$supermarketName"],
          },
          supermarketCode: {
            $ifNull: [{ $arrayElemAt: ["$supermarketDoc.code", 0] }, "$supermarketCode"],
          },
          productName: "$_id.productName",
          category: { $ifNull: ["$category", "Groceries"] },
          barcode: "$barcode",
          imageUrl: "$imageUrl",
          unitsSold: "$unitsSold",
          totalRevenue: "$totalRevenue",
          ordersCount: "$ordersCount",
          avgUnitPrice: { $round: [{ $divide: ["$totalRevenue", { $max: ["$unitsSold", 1] }] }, 2] },
          lastSoldAt: "$lastSoldAt",
        },
      },
      { $sort: { unitsSold: -1 } },
    ]);

    // Apply client filter keywords if passed
    let filtered = salesMatrix;
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.productName.toLowerCase().includes(q) ||
          item.supermarketName.toLowerCase().includes(q) ||
          item.supermarketCode.toLowerCase().includes(q) ||
          (item.barcode && item.barcode.includes(q))
      );
    }

    if (category && category !== "All Categories") {
      filtered = filtered.filter((item) => item.category === category);
    }

    return res.status(200).json({
      success: true,
      count: filtered.length,
      productSales: filtered,
    });
  } catch (error) {
    console.error("Product-wise sales aggregation error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate product-wise sales report.",
      error: error.message,
    });
  }
};

// 8. GET /api/super-admin/orders - Consolidated orders across all supermarkets
exports.getConsolidatedOrders = async (req, res) => {
  try {
    const { supermarketId, search, status, paymentMethod } = req.query;
    const filter = {};

    if (supermarketId && supermarketId !== "all") {
      const resolvedId = await resolveSupermarketId(supermarketId);
      if (resolvedId) {
        filter.supermarket = resolvedId;
      } else {
        filter.supermarket = new mongoose.Types.ObjectId();
      }
    }

    if (status && status !== "all") {
      filter.paymentStatus = status;
    }

    if (paymentMethod && paymentMethod !== "all") {
      filter.paymentMethod = paymentMethod;
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { orderId: { $regex: q, $options: "i" } },
        { customerName: { $regex: q, $options: "i" } },
        { customerPhone: { $regex: q, $options: "i" } },
        { supermarketName: { $regex: q, $options: "i" } },
      ];
    }

    const orders = await Order.find(filter)
      .populate("supermarket", "name code city")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Consolidated orders error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve consolidated orders.",
      error: error.message,
    });
  }
};

// 9. GET /api/super-admin/catalog - Master product catalog across all supermarkets
exports.getGlobalCatalog = async (req, res) => {
  try {
    const { supermarketId, search, category } = req.query;
    const filter = {};

    if (supermarketId && supermarketId !== "all") {
      const resolvedId = await resolveSupermarketId(supermarketId);
      if (resolvedId) {
        filter.supermarket = resolvedId;
      } else {
        filter.supermarket = new mongoose.Types.ObjectId();
      }
    }

    if (category && category !== "All Categories") {
      filter.category = category;
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { barcode: { $regex: q, $options: "i" } },
        { brand: { $regex: q, $options: "i" } },
      ];
    }

    const products = await Product.find(filter)
      .populate("supermarket", "name code city")
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Global catalog error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve global catalog.",
      error: error.message,
    });
  }
};


