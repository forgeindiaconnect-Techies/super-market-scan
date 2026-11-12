const express = require("express");

const router = express.Router();

const {
  createProduct,
  getProducts,
  getProductById,
  getProductByBarcode,
  getProductByQr,
  getGeneratedBarcode,
  updateProduct,
  updateProductStock,
  deleteProduct,
  lookupExternalProduct,
} = require("../controllers/productController");

// Auto-generate unique barcode
router.get("/generate-barcode", getGeneratedBarcode);

// Create a product
router.post("/", createProduct);

// Get all active products
router.get("/", getProducts);

// Find product using original barcode
router.get("/barcode/:barcode", getProductByBarcode);

// Find product using Supermarket QR code ID
router.get("/qr/:id", getProductByQr);

// External product lookup by barcode
router.get('/external/:barcode', lookupExternalProduct);

// Find product using MongoDB ID or barcode
router.get("/:id", getProductById);

// Update existing product details, including image URL
router.put("/:id", updateProduct);

// Update product stock
router.patch("/:id/stock", updateProductStock);

// Soft-delete product
router.delete("/:id", deleteProduct);

module.exports = router;
