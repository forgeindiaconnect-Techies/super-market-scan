const mongoose = require("mongoose");
const Product = require("../models/Product");

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
      const existingProduct = await Product.findOne({
        barcode: cleanBarcode,
      });

      if (existingProduct) {
        return res.status(409).json({
          success: false,
          message: "This barcode already exists",
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
    });

    try {
      const io = req.app?.get("io");
      if (io) {
        io.emit("admin:notification", {
          id: "prod-" + Date.now(),
          type: product.stock <= (product.lowStockThreshold || 5) ? "warning" : "success",
          title: product.stock <= (product.lowStockThreshold || 5) ? `Low Stock Alert: ${product.name}` : `Product Added: ${product.name}`,
          message: product.stock <= (product.lowStockThreshold || 5)
            ? `Stock is down to ${product.stock} units (Threshold: ${product.lowStockThreshold || 5})`
            : `Added to inventory at ₹${product.price} (${product.stock} units)`,
          time: "Just now",
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
    const products = await Product.find({
      isActive: { $ne: false },
    }).sort({ createdAt: -1 });

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

// Helper to build barcode search candidates (exact, unpadded, padded)
function getBarcodeVariants(rawBarcode) {
  if (!rawBarcode) return [];
  const clean = String(rawBarcode).trim();
  const stripped = clean.replace(/^0+/, "");
  const candidates = new Set([clean, stripped]);
  if (stripped) {
    candidates.add(stripped.padStart(7, "0"));
    candidates.add(stripped.padStart(8, "0"));
    candidates.add(stripped.padStart(12, "0"));
    candidates.add(stripped.padStart(13, "0"));
  }
  return Array.from(candidates).filter(Boolean);
}

// Find product using barcode
exports.getProductByBarcode = async (req, res) => {
  try {
    const rawBarcode = req.params.barcode;
    const candidates = getBarcodeVariants(rawBarcode);

    const product = await Product.findOne({
      barcode: { $in: candidates },
      isActive: { $ne: false },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found for this barcode",
      });
    }

    return res.status(200).json({
      success: true,
      product,
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
    let product = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findOne({
        _id: id,
        isActive: { $ne: false },
      });
    }

    if (!product) {
      const candidates = getBarcodeVariants(id);
      product = await Product.findOne({
        barcode: { $in: candidates },
        isActive: { $ne: false },
      });
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
      product = await Product.findOne({
        _id: id,
        isActive: { $ne: false },
      });
    }

    // 2. If not found, try matching by barcode
    if (!product) {
      const candidates = getBarcodeVariants(id);
      product = await Product.findOne({
        barcode: { $in: candidates },
        isActive: { $ne: false },
      });
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
      query = { _id: id, isActive: true };
    } else {
      const candidates = getBarcodeVariants(id);
      query = { barcode: { $in: candidates }, isActive: true };
    }

    const product = await Product.findOneAndUpdate(
      query,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

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
      query = { _id: id, isActive: true };
    } else {
      const candidates = getBarcodeVariants(id);
      query = { barcode: { $in: candidates }, isActive: true };
    }

    const product = await Product.findOneAndUpdate(
      query,
      { $set: { stock } },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    try {
      const io = req.app?.get("io");
      if (io) {
        const isLow = product.stock <= (product.lowStockThreshold || 5);
        io.emit("admin:notification", {
          id: "stock-" + Date.now(),
          type: isLow ? "warning" : "info",
          title: isLow ? `Low Stock Alert: ${product.name}` : `Stock Updated: ${product.name}`,
          message: isLow
            ? `Warning: Only ${product.stock} units remaining (Threshold: ${product.lowStockThreshold || 5})`
            : `Stock set to ${product.stock} units.`,
          time: "Just now",
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

    const product = await Product.findOneAndUpdate(
      query,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

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
