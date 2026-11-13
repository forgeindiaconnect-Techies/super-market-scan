const Supermarket = require("../models/Supermarket");

// Cache for default supermarket
let cachedDefaultSupermarket = null;

async function getDefaultSupermarket() {
  if (cachedDefaultSupermarket) return cachedDefaultSupermarket;
  let defaultStore = await Supermarket.findOne({ status: "Active" }).sort({ createdAt: 1 });
  if (!defaultStore) {
    defaultStore = await Supermarket.findOne();
  }
  if (defaultStore) {
    cachedDefaultSupermarket = defaultStore;
  }
  return defaultStore;
}

// Clear default store cache when supermarkets change
function clearTenantCache() {
  cachedDefaultSupermarket = null;
}

async function tenantMiddleware(req, res, next) {
  try {
    // 1. If user is authenticated as STORE_ADMIN, enforce their supermarket strictly from server-side identity
    // NEVER trust any tenant ID supplied in frontend headers, query params, or body
    if (req.user && req.user.role === "STORE_ADMIN") {
      if (!req.user.supermarket) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Store Admin has no assigned supermarket tenant.",
        });
      }
      const store = typeof req.user.supermarket === "object" && req.user.supermarket._id
        ? req.user.supermarket
        : await Supermarket.findById(req.user.supermarket);

      if (!store) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Assigned supermarket tenant not found.",
        });
      }

      req.supermarketId = store._id.toString();
      req.supermarket = store;
      req.supermarketCode = store.code;
      req.supermarketName = store.name;
      return next();
    }

    // 2. If SUPER_ADMIN, allow selecting an individual supermarket or viewing all
    if (req.user && req.user.role === "SUPER_ADMIN") {
      const headerId = req.headers["x-supermarket-id"];
      const headerCode = req.headers["x-supermarket-code"];
      const queryId = req.query.supermarketId;
      const requestedId = queryId || headerId;

      if (requestedId && requestedId !== "all" && requestedId !== "null" && requestedId !== "undefined") {
        let store = null;
        if (requestedId.match(/^[0-9a-fA-F]{24}$/)) {
          store = await Supermarket.findById(requestedId);
        }
        if (!store && (headerCode || requestedId)) {
          store = await Supermarket.findOne({ code: String(headerCode || requestedId).toUpperCase() });
        }
        if (store) {
          req.supermarketId = store._id.toString();
          req.supermarket = store;
          req.supermarketCode = store.code;
          req.supermarketName = store.name;
          return next();
        }
      }

      // If SUPER_ADMIN requests all stores or omitted
      req.supermarketId = null;
      req.supermarket = null;
      req.supermarketCode = "ALL";
      req.supermarketName = "Platform Consolidated";
      return next();
    }

    // 3. For guest/customer endpoints (e.g. customer self-checkout /customer):
    // Allow identifying store via header or query, fallback to primary default store
    const headerId = req.headers["x-supermarket-id"];
    const headerCode = req.headers["x-supermarket-code"];
    const queryId = req.query.supermarketId;
    const requestedId = queryId || headerId;

    if (requestedId && requestedId !== "all" && requestedId !== "null" && requestedId !== "undefined") {
      let store = null;
      if (requestedId.match(/^[0-9a-fA-F]{24}$/)) {
        store = await Supermarket.findById(requestedId);
      }
      if (!store && (headerCode || requestedId)) {
        store = await Supermarket.findOne({ code: String(headerCode || requestedId).toUpperCase() });
      }
      if (store) {
        req.supermarketId = store._id.toString();
        req.supermarket = store;
        req.supermarketCode = store.code;
        req.supermarketName = store.name;
        return next();
      }
    }

    // Fallback for customer checkout without explicit store selection
    const defaultStore = await getDefaultSupermarket();
    if (defaultStore) {
      req.supermarketId = defaultStore._id.toString();
      req.supermarket = defaultStore;
      req.supermarketCode = defaultStore.code;
      req.supermarketName = defaultStore.name;
    }

    next();
  } catch (error) {
    console.error("Tenant middleware error:", error);
    next();
  }
}

module.exports = {
  tenantMiddleware,
  getDefaultSupermarket,
  clearTenantCache,
};

