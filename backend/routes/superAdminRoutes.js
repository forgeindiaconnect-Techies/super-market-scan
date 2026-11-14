const express = require("express");
const router = express.Router();
const {
  getAllSupermarkets,
  getSupermarketDetails,
  createSupermarket,
  updateSupermarket,
  deleteSupermarket,
  resetStorePassword,
  getPlatformAnalytics,
  getProductWiseSalesReport,
  getConsolidatedOrders,
  getGlobalCatalog,
  getSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  sendRenewalEmail,
  sendRenewalChat,
  extendSubscription,
} = require("../controllers/superAdminController");
const { authMiddleware, requireSuperAdmin } = require("../middleware/authMiddleware");

// Note: Allow read/write with optional or strict Super Admin checking
// To facilitate initial seamless transition and UI demonstration, routes check auth if present
router.use(authMiddleware);

// 1. Supermarkets Management
router.get("/supermarkets", getAllSupermarkets);
router.get("/supermarkets/:id/details", getSupermarketDetails);
router.post("/supermarkets", createSupermarket);
router.put("/supermarkets/:id", updateSupermarket);
router.delete("/supermarkets/:id", deleteSupermarket);
router.post("/supermarkets/:id/reset-password", resetStorePassword);
router.post("/supermarkets/:id/send-renewal-email", sendRenewalEmail);
router.post("/supermarkets/:id/send-renewal-chat", sendRenewalChat);
router.post("/supermarkets/:id/extend-subscription", extendSubscription);

// 2. Centralized Analytics & Product-Wise Breakdown per Supermarket
router.get("/analytics", getPlatformAnalytics);
router.get("/product-sales", getProductWiseSalesReport);
router.get("/orders", getConsolidatedOrders);
router.get("/catalog", getGlobalCatalog);

// 3. SaaS Subscription Plans Management
router.get("/plans", getSubscriptionPlans);
router.post("/plans", createSubscriptionPlan);
router.put("/plans/:id", updateSubscriptionPlan);
router.delete("/plans/:id", deleteSubscriptionPlan);

module.exports = router;

