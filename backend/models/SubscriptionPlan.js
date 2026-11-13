const mongoose = require("mongoose");

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    tierCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      default: 4999,
    },
    billingCycle: {
      type: String,
      enum: ["Monthly", "Quarterly", "Annual"],
      default: "Monthly",
    },
    durationDays: {
      type: Number,
      default: 30,
    },
    description: {
      type: String,
      default: "Comprehensive supermarket management subscription.",
    },
    features: [
      {
        type: String,
      },
    ],
    maxProducts: {
      type: Number,
      default: 1000,
    },
    maxTurnstiles: {
      type: Number,
      default: 2,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);

