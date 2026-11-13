const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    brand: {
      type: String,
      trim: true,
      default: "",
    },

    barcode: {
      type: String,
      trim: true,
      default: null,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    costPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: "Stock must be a whole number",
      },
    },

    lowStockThreshold: {
      type: Number,
      default: 5,
      min: 0,
    },

    imageUrl: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    supermarket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supermarket",
      default: null,
      index: true,
    },

    supermarketCode: {
      type: String,
      default: "DEFAULT",
      trim: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index(
  { supermarket: 1, barcode: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: {
      barcode: { $type: "string" },
    },
  }
);
productSchema.index({ supermarket: 1, isActive: 1 });

module.exports = mongoose.model("Product", productSchema);

