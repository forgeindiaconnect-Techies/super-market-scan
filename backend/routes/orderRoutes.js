const express = require("express");
const router = express.Router();
const {
  checkout,
  confirmCashPayment,
  getOrders,
  getOrderById,
  getAdminStats,
  logCartActivity,
  getCartActivity,
} = require("../controllers/orderController");

// Public/Customer routes
router.post("/checkout", checkout);
router.post("/cart-activity", logCartActivity);
router.get("/cart-activity", getCartActivity);

// Staff confirmation for cash at exit
router.post("/:id/confirm-cash", confirmCashPayment);

// Admin stats
router.get("/stats", getAdminStats);

// Orders query
router.get("/", getOrders);
router.get("/:id", getOrderById);

module.exports = router;
