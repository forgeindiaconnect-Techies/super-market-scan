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
    ownerName: {
      type: String,
      trim: true,
      default: "",
    },
    contactPerson: {
      type: String,
      trim: true,
      default: "",
    },
    gstNumber: {
      type: String,
      trim: true,
      default: "",
    },
    storeType: {
      type: String,
      default: "Grocery & Supermarket",
      trim: true,
    },
    billingCycle: {
      type: String,
      enum: ["Monthly", "Yearly"],
      default: "Monthly",
    },
    subscriptionAmount: {
      type: Number,
      default: 19999,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
    },
    trialPeriodDays: {
      type: Number,
      default: 0,
    },
    autoRenewal: {
      type: Boolean,
      default: true,
    },
    planFeatures: [
      {
        type: String,
      },
    ],
    branchesCount: {
      type: Number,
      default: 1,
    },
    maxStaffUsers: {
      type: Number,
      default: 15,
    },
    timeZone: {
      type: String,
      default: "Asia/Kolkata",
    },
    forcePasswordChange: {
      type: Boolean,
      default: true,
    },
    sendCredentialsEmail: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Suspended", "Trial"],
      default: "Active",
    },
    plan: {
      type: String,
      default: "Premium",
      trim: true,
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

