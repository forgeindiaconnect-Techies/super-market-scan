const mongoose = require("mongoose");
const Product = require("../models/Product");
const Supermarket = require("../models/Supermarket");
const { getDefaultSupermarket } = require("../middleware/tenantMiddleware");
const { emitTenantNotification } = require("../utils/notificationEmitter");

// Standard store product templates for barcode auto-recovery & multi-tenant seeding
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

// Helper: Calculate valid EAN-13 checksum digit
function calculateEan13CheckDigit(code12) {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(code12[i], 10) * (i % 2 === 0 ? 1 : 3);
  }
  return (10 - (sum % 10)) % 10;
}

// Helper: Generate collision-free EAN-13 standard barcode
async function generateUniqueBarcode() {
  let attempts = 0;
  while (attempts < 20) {
    // Prefix 200 is GS1 standard for internal in-store restricted distribution
    const raw = "200" + Math.floor(100000000 + Math.random() * 900000000).toString();
    const check = calculateEan13CheckDigit(raw);
    const barcode = raw + check;

    const exists = await Product.findOne({ barcode });
    if (!exists) return barcode;
    attempts++;
  }
  return "200" + Date.now().toString().slice(-10);
}

// Endpoint to fetch an auto-generated barcode
exports.getGeneratedBarcode = async (req, res) => {
  try {
    const barcode = await generateUniqueBarcode();
    return res.status(200).json({
      success: true,
      barcode,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to generate barcode",
      error: error.message,
    });
  }
};

// Add a new product
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      category,
      brand,
      barcode,
      price,
      costPrice,
      stock,
      lowStockThreshold,
      imageUrl,
      description,
      autoGenerateBarcode,
    } = req.body;

    if (
      !name?.trim() ||
      !category?.trim() ||
      price === undefined ||
      stock === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, category, price and stock are required",
      });
    }

    const numericPrice = Number(price);
    const numericCostPrice = Number(costPrice || 0);
    const numericStock = Number(stock);
    const numericThreshold = Number(lowStockThreshold || 5);

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be greater than zero",
      });
    }

    if (!Number.isInteger(numericStock) || numericStock < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock must be a non-negative whole number",
      });
    }

    let cleanBarcode = barcode?.trim() || null;

    // Automatically generate unique standard EAN-13 barcode if not provided
    if (!cleanBarcode) {
      cleanBarcode = await generateUniqueBarcode();
    }

    if (cleanBarcode) {
      const existingQuery = {
        barcode: cleanBarcode,
        isActive: { $ne: false },
      };
      if (req.supermarketId) {
        existingQuery.supermarket = req.supermarketId;
      }
      const existingProduct = await Product.findOne(existingQuery);

      if (existingProduct) {
        return res.status(409).json({
          success: false,
          message: "This barcode already exists in your supermarket inventory",
        });
      }
    }

    const numericDiscount = Number(req.body.discount || 0);

    const product = await Product.create({
      name: name.trim(),
      category: category.trim(),
      brand: brand?.trim() || "",
      barcode: cleanBarcode,
      price: numericPrice,
      discount: numericDiscount >= 0 ? numericDiscount : 0,
      costPrice: numericCostPrice,
      stock: numericStock,
      lowStockThreshold: numericThreshold,
      imageUrl: imageUrl?.trim() || "",
      description: description?.trim() || "",
      supermarket: req.supermarketId || null,
      supermarketCode: req.supermarketCode || "DEFAULT",
    });

    try {
      const io = req.app?.get("io");
      if (io) {
        emitTenantNotification(io, "admin:notification", {
          id: "prod-" + Date.now(),
          type: product.stock <= (product.lowStockThreshold || 5) ? "warning" : "success",
          title: product.stock <= (product.lowStockThreshold || 5) ? `Low Stock Alert: ${product.name}` : `Product Added: ${product.name}`,
          message: product.stock <= (product.lowStockThreshold || 5)
            ? `Stock is down to ${product.stock} units (Threshold: ${product.lowStockThreshold || 5})`
            : `Added to inventory at ₹${product.price} (${product.stock} units)`,
          time: "Just now",
          supermarketId: req.supermarketId ? req.supermarketId.toString() : (product.supermarket ? product.supermarket.toString() : null),
          supermarketCode: req.supermarketCode || product.supermarketCode,
        });
      }
    } catch (_) {}

    return res.status(201).json({
      success: true,
      message: "Product added successfully",
      product,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This barcode already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to add product",
      error: error.message,
    });
  }
};

// Get all active products
exports.getProducts = async (req, res) => {
  try {
    const filter = {
      isActive: { $ne: false },
    };
    if (req.supermarketId) {
      filter.supermarket = req.supermarketId;
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};

// Helper to build barcode search candidates (exact, unpadded, padded, digits-only)
function getBarcodeVariants(rawBarcode) {
  if (!rawBarcode) return [];
  const clean = String(rawBarcode).trim();
  const digitsOnly = clean.replace(/\D/g, "");
  const stripped = digitsOnly.replace(/^0+/, "");

  const candidates = new Set([clean, digitsOnly, stripped]);
  if (stripped) {
    candidates.add(stripped.padStart(7, "0"));
    candidates.add(stripped.padStart(8, "0"));
    candidates.add(stripped.padStart(12, "0"));
    candidates.add(stripped.padStart(13, "0"));
    candidates.add(stripped.padStart(14, "0"));
  }
  return Array.from(candidates).filter(Boolean);
}

// Find product using barcode (with multi-tenant fallback & template auto-recovery)
exports.getProductByBarcode = async (req, res) => {
  try {
    const rawBarcode = req.params.barcode;
    if (!rawBarcode) {
      return res.status(400).json({
        success: false,
        message: "Barcode is required",
      });
    }

    const cleanBarcode = String(rawBarcode).trim();
    const candidates = getBarcodeVariants(cleanBarcode);
    const numBarcode = Number(cleanBarcode.replace(/\D/g, ""));

    let product = null;

    // Build comprehensive query that handles String or Number barcodes
    const barcodeMatchOr = [
      { barcode: { $in: candidates } },
    ];
    if (Number.isFinite(numBarcode) && numBarcode > 0) {
      barcodeMatchOr.push({ barcode: numBarcode });
    }

    // 1. Try finding in the scoped supermarket (if specified)
    if (req.supermarketId) {
      product = await Product.findOne({
        $or: barcodeMatchOr,
        supermarket: req.supermarketId,
        isActive: { $ne: false },
      }).populate("supermarket", "name code logoUrl address phone");
    }

    // 2. Fallback: Search across all supermarkets / global active products
    if (!product) {
      product = await Product.findOne({
        $or: barcodeMatchOr,
        isActive: { $ne: false },
      }).populate("supermarket", "name code logoUrl address phone");
    }

    // 3. Fallback: Case-insensitive / stripped leading zero regex match across all supermarkets
    if (!product) {
      const stripped = cleanBarcode.replace(/\D/g, "").replace(/^0+/, "");
      if (stripped) {
        product = await Product.findOne({
          isActive: { $ne: false },
          $or: [
            { barcode: { $regex: new RegExp(`^0*${stripped}$`, "i") } },
            { barcode: { $regex: new RegExp(`^${cleanBarcode}$`, "i") } },
          ],
        }).populate("supermarket", "name code logoUrl address phone");
      }
    }

    // 4. Fallback: If not in DB, check if it matches initial store product templates (e.g. 2001-2006 prefix)
    if (!product) {
      const matchedTemplate = INITIAL_STORE_PRODUCTS_TEMPLATE.find((tpl) =>
        cleanBarcode.startsWith(tpl.barcodePrefix)
      );

      if (matchedTemplate) {
        // Resolve target supermarket for auto-seeding
        let targetSupermarketId = req.supermarketId;
        let targetSupermarketCode = req.supermarketCode || "DEFAULT";

        if (!targetSupermarketId) {
          const defaultStore = await getDefaultSupermarket();
          if (defaultStore) {
            targetSupermarketId = defaultStore._id;
            targetSupermarketCode = defaultStore.code;
          }
        }

        // Dynamically persist the product so subsequent requests and inventory operations succeed permanently
        try {
          product = await Product.create({
            name: matchedTemplate.name,
            brand: matchedTemplate.brand,
            category: matchedTemplate.category,
            barcode: cleanBarcode,
            price: matchedTemplate.price,
            costPrice: matchedTemplate.costPrice,
            stock: matchedTemplate.stock,
            lowStockThreshold: matchedTemplate.lowStockThreshold,
            imageUrl: matchedTemplate.imageUrl,
            description: matchedTemplate.description,
            supermarket: targetSupermarketId || null,
            supermarketCode: targetSupermarketCode,
            isActive: true,
          });

          if (product && targetSupermarketId) {
            product = await Product.findById(product._id).populate(
              "supermarket",
              "name code logoUrl address phone"
            );
          }
        } catch (createErr) {
          // If concurrent insert created it, find it
          product = await Product.findOne({ barcode: cleanBarcode, isActive: { $ne: false } }).populate(
            "supermarket",
            "name code logoUrl address phone"
          );
        }
      }
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found for this barcode",
      });
    }

    return res.status(200).json({
      success: true,
      product,
      supermarket: product.supermarket || req.supermarket || null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to find product",
      error: error.message,
    });
  }
};

// Find product using MongoDB ID (for Supermarket QR label or deep link)
exports.getProductByQr = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Product identifier is required",
      });
    }

    let product = null;

    // 1. Try finding by Mongo ObjectId in scoped supermarket
    if (mongoose.Types.ObjectId.isValid(id)) {
      if (req.supermarketId) {
        product = await Product.findOne({
          _id: id,
          supermarket: req.supermarketId,
          isActive: { $ne: false },
        }).populate("supermarket", "name code logoUrl address phone");
      }
      if (!product) {
        product = await Product.findOne({
          _id: id,
          isActive: { $ne: false },
        }).populate("supermarket", "name code logoUrl address phone");
      }
    }

    // 2. Try matching by barcode
    if (!product) {
      const candidates = getBarcodeVariants(id);
      if (req.supermarketId) {
        product = await Product.findOne({
          barcode: { $in: candidates },
          supermarket: req.supermarketId,
          isActive: { $ne: false },
        }).populate("supermarket", "name code logoUrl address phone");
      }
      if (!product) {
        product = await Product.findOne({
          barcode: { $in: candidates },
          isActive: { $ne: false },
        }).populate("supermarket", "name code logoUrl address phone");
      }
    }

    // 3. Regex fallback
    if (!product) {
      const clean = String(id).trim();
      const stripped = clean.replace(/^0+/, "");
      product = await Product.findOne({
        isActive: { $ne: false },
        $or: [
          { barcode: { $regex: new RegExp(`^0*${stripped}$`, "i") } },
          { barcode: { $regex: new RegExp(`^${clean}$`, "i") } },
        ],
      }).populate("supermarket", "name code logoUrl address phone");
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found for this ID",
      });
    }

    return res.status(200).json({
      success: true,
      product,
      supermarket: product.supermarket || req.supermarket || null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to find product",
      error: error.message,
    });
  }
};

// Find product by MongoDB ID or barcode
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Product identifier is required",
      });
    }

    let product = null;

    // 1. Try finding by Mongo ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      if (req.supermarketId) {
        product = await Product.findOne({
          _id: id,
          supermarket: req.supermarketId,
          isActive: { $ne: false },
        }).populate("supermarket", "name code logoUrl address phone");
      }
      if (!product) {
        product = await Product.findOne({
          _id: id,
          isActive: { $ne: false },
        }).populate("supermarket", "name code logoUrl address phone");
      }
    }

    // 2. If not found, try matching by barcode
    if (!product) {
      const candidates = getBarcodeVariants(id);
      const numId = Number(String(id).replace(/\D/g, ""));
      const matchCriteria = [{ barcode: { $in: candidates } }];
      if (Number.isFinite(numId) && numId > 0) {
        matchCriteria.push({ barcode: numId });
      }

      if (req.supermarketId) {
        product = await Product.findOne({
          $or: matchCriteria,
          supermarket: req.supermarketId,
          isActive: { $ne: false },
        }).populate("supermarket", "name code logoUrl address phone");
      }
      if (!product) {
        product = await Product.findOne({
          $or: matchCriteria,
          isActive: { $ne: false },
        }).populate("supermarket", "name code logoUrl address phone");
      }
    }

    // 3. Fallback regex
    if (!product) {
      const clean = String(id).trim();
      const stripped = clean.replace(/^0+/, "");
      product = await Product.findOne({
        isActive: { $ne: false },
        $or: [
          { barcode: { $regex: new RegExp(`^0*${stripped}$`, "i") } },
          { barcode: { $regex: new RegExp(`^${clean}$`, "i") } },
        ],
      }).populate("supermarket", "name code logoUrl address phone");
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      product,
      supermarket: product.supermarket || req.supermarket || null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to find product",
      error: error.message,
    });
  }
};

// Edit product details
exports.updateProduct = async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "category",
      "brand",
      "barcode",
      "price",
      "discount",
      "costPrice",
      "stock",
      "lowStockThreshold",
      "imageUrl",
      "description",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] =
          typeof req.body[field] === "string"
            ? req.body[field].trim()
            : req.body[field];

        if (field === "barcode" && !updates[field]) {
          updates[field] = null;
        }
      }
    }

    if (updates.name !== undefined && !updates.name) {
      return res.status(400).json({
        success: false,
        message: "Product name cannot be empty",
      });
    }

    if (updates.category !== undefined && !updates.category) {
      return res.status(400).json({
        success: false,
        message: "Category cannot be empty",
      });
    }

    if (updates.price !== undefined) {
      updates.price = Number(updates.price);
      if (!Number.isFinite(updates.price) || updates.price <= 0) {
        return res.status(400).json({
          success: false,
          message: "Price must be greater than zero",
        });
      }
    }

    if (updates.stock !== undefined) {
      updates.stock = Number(updates.stock);
      if (!Number.isInteger(updates.stock) || updates.stock < 0) {
        return res.status(400).json({
          success: false,
          message: "Stock must be a non-negative whole number",
        });
      }
    }

    const { id } = req.params;
    let query = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      const candidates = getBarcodeVariants(id);
      query = { barcode: { $in: candidates } };
    }
    if (req.supermarketId) {
      query.supermarket = req.supermarketId;
    }

    // Ensure all numeric fields are correctly parsed as numbers
    if (updates.price !== undefined) updates.price = Number(updates.price);
    if (updates.costPrice !== undefined) updates.costPrice = Number(updates.costPrice) || 0;
    if (updates.discount !== undefined) updates.discount = Number(updates.discount) || 0;
    if (updates.stock !== undefined) updates.stock = Number(updates.stock);
    if (updates.lowStockThreshold !== undefined) updates.lowStockThreshold = Number(updates.lowStockThreshold) || 5;
    updates.isActive = true;

    let product = await Product.findOneAndUpdate(
      query,
      { $set: updates },
      { new: true }
    );

    // Fallback: check barcode in request body if not matched by id parameter
    if (!product && req.body.barcode) {
      const candidates = getBarcodeVariants(req.body.barcode);
      const fallbackQuery = { barcode: { $in: candidates } };
      if (req.supermarketId) {
        fallbackQuery.supermarket = req.supermarketId;
      }
      product = await Product.findOneAndUpdate(
        fallbackQuery,
        { $set: updates },
        { new: true }
      );
    }

    // If product does not exist in MongoDB yet (was only in browser storage), upsert/create it now
    if (!product) {
      const barcodeToUse = req.body.barcode || (id && !id.startsWith("local_") && !id.startsWith("prod_") ? id : undefined);
      product = await Product.create({
        name: updates.name || "Product",
        category: updates.category || "Groceries",
        brand: updates.brand || "",
        barcode: barcodeToUse || undefined,
        price: updates.price || 10,
        costPrice: updates.costPrice || 0,
        discount: updates.discount || 0,
        stock: updates.stock !== undefined ? updates.stock : 10,
        lowStockThreshold: updates.lowStockThreshold || 5,
        imageUrl: updates.imageUrl || "",
        description: updates.description || "",
        supermarket: req.supermarketId || null,
        supermarketCode: req.supermarketCode || "DEFAULT",
        isActive: true,
      });
    }

    try {
      const io = req.app?.get("io");
      if (io) {
        io.emit("product:updated", { product });
      }
    } catch (_) {}

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This barcode is already assigned to another product",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message,
    });
  }
};

// Update stock quantity
exports.updateProductStock = async (req, res) => {
  try {
    const stock = Number(req.body.stock);

    if (!Number.isInteger(stock) || stock < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock must be a non-negative whole number",
      });
    }

    const { id } = req.params;
    let query = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      const candidates = getBarcodeVariants(id);
      query = { barcode: { $in: candidates } };
    }
    if (req.supermarketId) {
      query.supermarket = req.supermarketId;
    }

    let product = await Product.findOneAndUpdate(
      query,
      { $set: { stock } },
      { new: true }
    );

    // Fallback to barcode in body if not matched by id parameter
    if (!product && req.body?.barcode) {
      const candidates = getBarcodeVariants(req.body.barcode);
      const fallbackQuery = { barcode: { $in: candidates } };
      if (req.supermarketId) {
        fallbackQuery.supermarket = req.supermarketId;
      }
      product = await Product.findOneAndUpdate(
        fallbackQuery,
        { $set: { stock } },
        { new: true }
      );
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    try {
      const io = req.app?.get("io");
      if (io) {
        io.emit("product:updated", { product });
        const isLow = product.stock <= (product.lowStockThreshold || 5);
        emitTenantNotification(io, "admin:notification", {
          id: "stock-" + Date.now(),
          type: isLow ? "warning" : "info",
          title: isLow ? `Low Stock Alert: ${product.name}` : `Stock Updated: ${product.name}`,
          message: isLow
            ? `Warning: Only ${product.stock} units remaining (Threshold: ${product.lowStockThreshold || 5})`
            : `Stock set to ${product.stock} units.`,
          time: "Just now",
          supermarketId: req.supermarketId ? req.supermarketId.toString() : (product.supermarket ? product.supermarket.toString() : null),
          supermarketCode: req.supermarketCode || product.supermarketCode,
        });
      }
    } catch (_) {}

    return res.status(200).json({
      success: true,
      message: "Stock updated successfully",
      product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update stock",
      error: error.message,
    });
  }
};

// Soft-delete a product (preserves its database record)
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    let query = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id, isActive: true };
    } else {
      const candidates = getBarcodeVariants(id);
      query = { barcode: { $in: candidates }, isActive: true };
    }
    if (req.supermarketId) {
      query.supermarket = req.supermarketId;
    }

    let product = await Product.findOneAndUpdate(
      query,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!product && req.body?.barcode) {
      const candidates = getBarcodeVariants(req.body.barcode);
      const fallbackQuery = { barcode: { $in: candidates }, isActive: true };
      if (req.supermarketId) {
        fallbackQuery.supermarket = req.supermarketId;
      }
      product = await Product.findOneAndUpdate(
        fallbackQuery,
        { $set: { isActive: false } },
        { new: true }
      );
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    try {
      const io = req.app?.get("io");
      if (io) {
        io.emit("product:deleted", { id, barcode: req.body?.barcode });
      }
    } catch (_) {}

    return res.status(200).json({
      success: true,
      message: "Product removed from active inventory",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: error.message,
    });
  }
};

// External barcode lookup (does not modify inventory)
exports.lookupExternalProduct = async (req, res) => {
  const barcode = String(req.params.barcode || "").replace(/\D/g, "");

  if (!/^\d{8,14}$/.test(barcode)) {
    return res.status(400).json({ success: false, message: "Invalid barcode" });
  }

  try {
    // Source 1: Open Food Facts
    const offResponse = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      { signal: AbortSignal.timeout(8000) }
    );

    if (offResponse.ok) {
      const data = await offResponse.json();
      const p = data.product;
      const returnedCode = String(p?.code || "").replace(/\D/g, "");

      if (data.status === 1 && p && returnedCode === barcode && (p.image_front_url || p.image_url || p.image_front_small_url || p.image_small_url)) {
        return res.json({
          success: true,
          source: "Open Food Facts",
          product: {
            barcode,
            name: p.product_name || p.generic_name || "",
            brand: p.brands || "",
            imageUrl: p.image_front_url || p.image_url || "",
            category: p.categories || "",
          },
        });
      }
    }

    // Source 2: UPCitemdb trial
    const upcResponse = await fetch(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`,
      { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) }
    );

    if (upcResponse.ok) {
      const data = await upcResponse.json();
      const item = data.items?.find(p =>
        [p.ean, p.upc].some(v => String(v || "").replace(/\D/g, "") === barcode)
      );

      if (item && item.images?.[0]) {
        let imgUrl = String(item.images[0]).trim();
        if (imgUrl.startsWith("http://")) {
          imgUrl = imgUrl.replace("http://", "https://");
        }
        return res.json({
          success: true,
          source: "UPCitemdb",
          product: {
            barcode,
            name: item.title || "",
            brand: item.brand || "",
            imageUrl: imgUrl,
            category: item.category || "",
          },
        });
      }
    }

    return res.status(404).json({
      success: false,
      message: "No verified product match found. Please upload the actual product photo.",
    });
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: "External barcode lookup temporarily unavailable.",
    });
  }
};
