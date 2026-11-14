const express = require("express");
const router = express.Router();
const {
  checkout,
  approvePayment,
  completePayment,
  updatePaymentStatus,
  confirmCashPayment,
  getOrders,
  getOrderById,
  getAdminStats,
  logCartActivity,
  getCartActivity,
  getReports,
  getNotifications,
} = require("../controllers/orderController");

// Public/Customer routes
router.post("/checkout", checkout);
router.post("/cart-activity", logCartActivity);
router.get("/cart-activity", getCartActivity);

// Super Admin approval & completion workflow routes
router.post("/:id/approve", approvePayment);
router.put("/:id/approve", approvePayment);

router.post("/:id/complete", completePayment);
router.put("/:id/complete", completePayment);

router.patch("/:id/status", updatePaymentStatus);
router.put("/:id/status", updatePaymentStatus);

// Staff confirmation for cash at exit
router.post("/:id/confirm-cash", confirmCashPayment);

// Admin stats
router.get("/stats", getAdminStats);

// Reports Management
router.get("/reports", getReports);

// Dedicated isolated notifications query
router.get("/notifications", getNotifications);

// Orders query
router.get("/", getOrders);
router.get("/:id", getOrderById);

module.exports = router;
