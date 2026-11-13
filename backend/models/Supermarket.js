const mongoose = require("mongoose");

const supermarketSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
    },
    tagline: {
      type: String,
      default: "Smart Supermarket & Instant Gate Clearance",
      trim: true,
    },
    address: {
      type: String,
      default: "123 Market High Street",
      trim: true,
    },
    city: {
      type: String,
      default: "Bangalore",
      trim: true,
    },
    state: {
      type: String,
      default: "Karnataka",
      trim: true,
    },
    pincode: {
      type: String,
      default: "560001",
      trim: true,
    },
    phone: {
      type: String,
      default: "+91 98765 43210",
      trim: true,
    },
    email: {
      type: String,
      default: "store@grocerease.store",
      trim: true,
      lowercase: true,
    },
    adminUsername: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    adminPassword: {
      type: String,
      default: "StoreAdmin@123",
    },
    adminName: {
      type: String,
      default: "Store Admin",
      trim: true,
    },
    status: {
      type: String,
      enum: ["Active", "Suspended", "Trial"],
      default: "Active",
    },
    plan: {
      type: String,
      enum: ["Starter", "Professional", "Enterprise"],
      default: "Enterprise",
    },
    maxProducts: {
      type: Number,
      default: 5000,
    },
    logoUrl: {
      type: String,
      default: "",
    },
    themeColor: {
      type: String,
      default: "#1455d9",
    },
    settings: {
      currency: { type: String, default: "₹" },
      taxRate: { type: Number, default: 5 },
      turnstilesCount: { type: Number, default: 4 },
      allowCashPayment: { type: Boolean, default: true },
      allowUpiPayment: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

supermarketSchema.index({ code: 1 }, { unique: true });
supermarketSchema.index({ status: 1 });

module.exports = mongoose.model("Supermarket", supermarketSchema);

