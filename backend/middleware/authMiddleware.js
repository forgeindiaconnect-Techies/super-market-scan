const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Supermarket = require("../models/Supermarket");

const JWT_SECRET = process.env.JWT_SECRET || "grocerease_multitenant_saas_secret_2026";

// Extract user from token
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(); // Guest or unauthenticated request
    }

    const token = authHeader.split(" ")[1];
    if (!token) return next();

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password").populate("supermarket");

    if (user && user.status === "Active") {
      req.user = user;
      if (user.supermarket) {
        req.supermarketId = user.supermarket._id.toString();
        req.supermarket = user.supermarket;
        req.supermarketCode = user.supermarket.code;
      }
    }

    next();
  } catch (error) {
    // If token invalid/expired, proceed as guest rather than hard-failing
    next();
  }
}

// Require authenticated user
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. Please log in.",
    });
  }
  next();
}

// Require Super Admin
function requireSuperAdmin(req, res, next) {
  if (!req.user || req.user.role !== "SUPER_ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Super Admin privileges required.",
    });
  }
  next();
}

// Require Store Admin or Super Admin
function requireStoreAdminOrSuperAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }
  if (req.user.role !== "SUPER_ADMIN" && req.user.role !== "STORE_ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Store Admin or Super Admin privileges required.",
    });
  }
  next();
}

module.exports = {
  authMiddleware,
  requireAuth,
  requireSuperAdmin,
  requireStoreAdminOrSuperAdmin,
  JWT_SECRET,
};

