const mongoose = require("mongoose");

const cartActivitySchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      default: "guest-shopper",
    },
    customerName: {
      type: String,
      default: "Mobile Shopper",
    },
    productName: {
      type: String,
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    quantity: {
      type: Number,
      default: 1,
    },
    price: {
      type: Number,
      default: 0,
    },
    action: {
      type: String,
      enum: ["added", "updated", "removed", "cleared"],
      default: "added",
    },
    totalCartItems: {
      type: Number,
      default: 1,
    },
    totalCartAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CartActivity", cartActivitySchema);

