// Real-Time Persistent Storage Helper
// Ensures all product updates, additions, stock steppers, and edits
// persist permanently across browser refreshes and sync with MongoDB Atlas.

export const STORAGE_KEY_PRODUCTS = "grocerease_real_products";
export const STORAGE_KEY_ORDERS = "grocerease_real_orders";

export const DEFAULT_SUPERMARKET_PRODUCTS = [
  {
    _id: "prod-real-1",
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
    _id: "prod-real-2",
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
    _id: "prod-real-3",
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
    _id: "prod-real-4",
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
  {
    _id: "prod-real-5",
    name: "Rice",
    brand: "Rice no 1",
    category: "Groceries",
    barcode: "1234567",
    price: 2500.0,
    costPrice: 2100.0,
    stock: 20,
    lowStockThreshold: 5,
    imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=120&auto=format&fit=crop&q=80",
    description: "Polished everyday long grain rice.",
  },
];

// Read persistent products from storage or fallback
export function getPersistentProducts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Storage read failed, using defaults:", err);
  }
  // Initialize storage with defaults on first run
  savePersistentProducts(DEFAULT_SUPERMARKET_PRODUCTS);
  return DEFAULT_SUPERMARKET_PRODUCTS;
}

// Save persistent products to localStorage
export function savePersistentProducts(products) {
  try {
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
    // Dispatch custom event for real-time tab sync
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
  if (!Array.isArray(apiProducts) || apiProducts.length === 0) {
    return getPersistentProducts();
  }
  const current = getPersistentProducts();

  const merged = apiProducts.map((apiP) => {
    return {
      ...apiP,
      stock: typeof apiP.stock === "number" ? apiP.stock : (current.find((c) => c._id === apiP._id)?.stock ?? 0),
    };
  });

  // Keep any newly added local products not yet synced to MongoDB
  for (const local of current) {
    const exists = merged.some(
      (m) => m._id === local._id || (local.barcode && m.barcode === local.barcode)
    );
    if (!exists) {
      merged.push(local);
    }
  }

  savePersistentProducts(merged);
  return merged;
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
