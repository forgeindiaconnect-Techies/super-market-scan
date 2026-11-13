// Real-Time Multi-Tenant Persistent Storage Helper
// Ensures each supermarket's products, inventory, orders, and barcodes
// are strictly isolated by supermarket ID across browser refreshes and sync with MongoDB Atlas.

export function getActiveSupermarketId() {
  try {
    const raw = localStorage.getItem("grocerease_current_supermarket");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?._id) return parsed._id;
      if (parsed?.code) return parsed.code;
    }
  } catch (_) {}
  return "default";
}

export function getStorageKeyProducts() {
  return `grocerease_real_products_${getActiveSupermarketId()}`;
}

export function getStorageKeyOrders() {
  return `grocerease_real_orders_${getActiveSupermarketId()}`;
}

export const DEFAULT_SUPERMARKET_PRODUCTS_STORE1 = [
  {
    _id: "prod-s1-1",
    name: "Fresh Red Apples (Washington)",
    brand: "Fresh Orchard",
    category: "Fruits & Vegetables",
    barcode: "2001984210342",
    price: 180.0,
    costPrice: 130.0,
    stock: 45,
    lowStockThreshold: 10,
    imageUrl: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=120&auto=format&fit=crop&q=80",
    description: "Crisp and juicy sweet Washington red apples.",
  },
  {
    _id: "prod-s1-2",
    name: "Chocolate",
    brand: "Zero sugar",
    category: "Beverages",
    barcode: "87654367",
    price: 352.0,
    costPrice: 280.0,
    stock: 5,
    lowStockThreshold: 10,
    imageUrl: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=120&auto=format&fit=crop&q=80",
    description: "Premium chocolate zero sugar.",
  },
  {
    _id: "prod-s1-3",
    name: "Lays",
    brand: "NO 1",
    category: "Beverages",
    barcode: "12356",
    price: 10.0,
    costPrice: 8.0,
    stock: 27,
    lowStockThreshold: 5,
    imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=120&auto=format&fit=crop&q=80",
    description: "Crispy salted potato chips.",
  },
  {
    _id: "prod-s1-4",
    name: "Shmapoo 180 ml",
    brand: "Dove",
    category: "Household",
    barcode: "1234561",
    price: 250.0,
    costPrice: 200.0,
    stock: 8,
    lowStockThreshold: 5,
    imageUrl: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=120&auto=format&fit=crop&q=80",
    description: "Dove daily hair nourishment.",
  },
  {
    _id: "prod-s1-5",
    name: "Rice",
    brand: "Rice no 1",
    category: "Groceries",
    barcode: "1234566",
    price: 2500.0,
    costPrice: 2100.0,
    stock: 20,
    lowStockThreshold: 5,
    imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=120&auto=format&fit=crop&q=80",
    description: "Aromatic basmati rice 5kg pack.",
  },
];

export const DEFAULT_SUPERMARKET_PRODUCTS_STORE2 = [
  {
    _id: "prod-s2-1",
    name: "Fresh Red Apples (Washington)",
    brand: "Green Valley",
    category: "Fruits & Vegetables",
    barcode: "2002773410982",
    price: 175.0,
    costPrice: 125.0,
    stock: 35,
    lowStockThreshold: 10,
    imageUrl: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=120&auto=format&fit=crop&q=80",
    description: "Crisp and sweet farm apples.",
  },
  {
    _id: "prod-s2-2",
    name: "Chocolate",
    brand: "Zero Sugar",
    category: "Beverages",
    barcode: "2002884102941",
    price: 350.0,
    costPrice: 275.0,
    stock: 20,
    lowStockThreshold: 8,
    imageUrl: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=120&auto=format&fit=crop&q=80",
    description: "Premium chocolate zero sugar.",
  },
  {
    _id: "prod-s2-3",
    name: "Basmati Rice 5kg",
    brand: "Kohinoor",
    category: "Groceries",
    barcode: "2002995201473",
    price: 640.0,
    costPrice: 510.0,
    stock: 25,
    lowStockThreshold: 5,
    imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=120&auto=format&fit=crop&q=80",
    description: "Premium long grain basmati rice.",
  },
  {
    _id: "prod-s2-4",
    name: "Farm Fresh Whole Milk 1L",
    brand: "Amul",
    category: "Dairy",
    barcode: "2002661029381",
    price: 68.0,
    costPrice: 58.0,
    stock: 40,
    lowStockThreshold: 10,
    imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=120&auto=format&fit=crop&q=80",
    description: "Pasteurized full cream cow milk.",
  },
];

export const DEFAULT_SUPERMARKET_PRODUCTS = DEFAULT_SUPERMARKET_PRODUCTS_STORE1;

// Read persistent products for current supermarket tenant
export function getPersistentProducts() {
  const key = getStorageKeyProducts();
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Storage read failed:", err);
  }

  // When no data exists yet for this tenant, return clean empty list
  return [];
}

// Save persistent products to localStorage scoped to current supermarket
export function savePersistentProducts(products) {
  const key = getStorageKeyProducts();
  try {
    localStorage.setItem(key, JSON.stringify(Array.isArray(products) ? products : []));
    window.dispatchEvent(new Event("grocerease_storage_updated"));
  } catch (err) {
    console.warn("Storage write failed:", err);
  }
}

// Update single product stock by _id or barcode
export function updatePersistentStock(identifier, newStock) {
  const products = getPersistentProducts();
  const safeStock = Math.max(0, Number(newStock));
  const updated = products.map((p) =>
    p._id === identifier || p.barcode === identifier || String(p.barcode) === String(identifier)
      ? { ...p, stock: safeStock }
      : p
  );
  savePersistentProducts(updated);
  return updated;
}

// Merge backend API products with local persistent storage
export function mergeApiWithStorage(apiProducts) {
  if (!Array.isArray(apiProducts)) {
    return getPersistentProducts();
  }

  // Backend API is the source of truth for this tenant
  savePersistentProducts(apiProducts);
  return apiProducts;
}

// Add a newly created product
export function addPersistentProduct(newProduct) {
  const products = getPersistentProducts();
  const exists = products.find(
    (p) => p._id === newProduct._id || (newProduct.barcode && p.barcode === newProduct.barcode)
  );
  let updated;
  if (exists) {
    updated = products.map((p) => (p._id === exists._id ? { ...p, ...newProduct } : p));
  } else {
    updated = [newProduct, ...products];
  }
  savePersistentProducts(updated);
  return updated;
}

// Delete product
export function deletePersistentProduct(productId) {
  const products = getPersistentProducts();
  const updated = products.filter((p) => p._id !== productId);
  savePersistentProducts(updated);
  return updated;
}
