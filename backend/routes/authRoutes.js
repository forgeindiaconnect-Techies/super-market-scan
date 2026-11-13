const express = require("express");
const router = express.Router();
const { login, getMe } = require("../controllers/authController");
const { authMiddleware, requireAuth } = require("../middleware/authMiddleware");

router.post("/login", login);
router.get("/me", authMiddleware, requireAuth, getMe);

module.exports = router;

