const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: { type: String, required: true },
  brand: { type: String, default: "" },
  category: { type: String, default: "" },
  barcode: { type: String, default: "" },
  imageUrl: { type: String, default: "" },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  subtotal: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    items: [orderItemSchema],
    totalItems: {
      type: Number,
      required: true,
      min: 1,
    },
    subtotalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["UPI", "Card", "Cash", "Razorpay"],
      default: "UPI",
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Approved", "Completed", "Failed", "Network Error"],
      default: "Pending",
    },
    failureReason: {
      type: String,
      default: "",
    },
    approvedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    inventoryDeducted: {
      type: Boolean,
      default: false,
    },
    paymentId: {
      type: String,
      default: "",
    },
    customer: {
      name: { type: String, default: "Guest Shopper" },
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
      address: { type: String, default: "" },
    },
    exitBarcode: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);

