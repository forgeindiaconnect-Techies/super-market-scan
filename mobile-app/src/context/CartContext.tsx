import React, { createContext, useContext, useState } from "react";
import { API_URL } from "../constants/api";

export type CartItem = {
  _id: string;
  name: string;
  brand?: string;
  category?: string;
  barcode?: string;
  price: number;
  discount?: number;
  effectivePrice: number;
  stock: number;
  imageUrl?: string;
  description?: string;
  quantity: number;
};

export type OrderRecord = {
  _id: string;
  orderNumber: string;
  items: CartItem[];
  totalItems: number;
  subtotalAmount?: number;
  discountAmount?: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  exitBarcode: string;
  createdAt: string;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (product: any, qty?: number) => boolean;
  updateQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  totalCount: number;
  grossAmount: number;
  totalSavings: number;
  totalAmount: number;
  recentOrders: OrderRecord[];
  addRecentOrder: (order: OrderRecord) => void;
  updateRecentOrder: (order: OrderRecord) => void;
};

const CartContext = createContext<CartContextType | null>(null);

// Helper to notify backend Admin Dashboard of live cart changes
const notifyAdminCartActivity = (data: {
  productName: string;
  productId?: string;
  quantity: number;
  price: number;
  action: "added" | "updated" | "removed" | "cleared";
  totalCartItems: number;
  totalCartAmount: number;
}) => {
  if (!API_URL) return;
  fetch(`${API_URL}/orders/cart-activity`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "customer-mobile",
      customerName: "Mobile Shopper",
      ...data,
    }),
  }).catch(() => {});
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [recentOrders, setRecentOrders] = useState<OrderRecord[]>([]);

  const addToCart = (product: any, qty: number = 1): boolean => {
    if (!product || product.stock <= 0) return false;
    const addQty = Math.max(1, qty);

    let success = true;
    let updatedCart: CartItem[] = [];

    const rawPrice = Number(product.price);
    const discount = Number(product.discount || 0);
    const effectivePrice = Math.max(0, rawPrice - discount);

    setCart((current) => {
      const existing = current.find((item) => item._id === product._id);

      if (existing) {
        if (existing.quantity + addQty > product.stock) {
          success = false;
          updatedCart = current;
          return current;
        }

        updatedCart = current.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + addQty }
            : item
        );
      } else {
        if (addQty > product.stock) {
          success = false;
          updatedCart = current;
          return current;
        }

        updatedCart = [
          ...current,
          {
            _id: product._id,
            name: product.name,
            brand: product.brand || "",
            category: product.category || "",
            barcode: product.barcode || "",
            price: rawPrice,
            discount: discount,
            effectivePrice: effectivePrice,
            stock: Number(product.stock),
            imageUrl: product.imageUrl || "",
            description: product.description || "",
            quantity: addQty,
          },
        ];
      }

      return updatedCart;
    });

    if (success) {
      const newTotalItems = cart.reduce((sum, it) => sum + it.quantity, 0) + addQty;
      const newTotalAmount =
        cart.reduce((sum, it) => sum + it.effectivePrice * it.quantity, 0) +
        effectivePrice * addQty;

      notifyAdminCartActivity({
        productName: product.name,
        productId: product._id,
        quantity: addQty,
        price: effectivePrice,
        action: "added",
        totalCartItems: newTotalItems,
        totalCartAmount: newTotalAmount,
      });
    }

    return success;
  };

  const updateQuantity = (id: string, delta: number) => {
    let affectedItem: CartItem | undefined;

    setCart((current) => {
      const updated = current
        .map((item) => {
          if (item._id === id) {
            affectedItem = item;
            const newQty = item.quantity + delta;
            if (newQty > item.stock) return item;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);

      const newTotalItems = updated.reduce((sum, it) => sum + it.quantity, 0);
      const newTotalAmount = updated.reduce(
        (sum, it) => sum + it.effectivePrice * it.quantity,
        0
      );

      if (affectedItem) {
        notifyAdminCartActivity({
          productName: affectedItem.name,
          productId: affectedItem._id,
          quantity: delta,
          price: affectedItem.effectivePrice,
          action: "updated",
          totalCartItems: newTotalItems,
          totalCartAmount: newTotalAmount,
        });
      }

      return updated;
    });
  };

  const removeFromCart = (id: string) => {
    setCart((current) => {
      const item = current.find((it) => it._id === id);
      const updated = current.filter((it) => it._id !== id);

      if (item) {
        const newTotalItems = updated.reduce((sum, it) => sum + it.quantity, 0);
        const newTotalAmount = updated.reduce(
          (sum, it) => sum + it.effectivePrice * it.quantity,
          0
        );

        notifyAdminCartActivity({
          productName: item.name,
          productId: item._id,
          quantity: item.quantity,
          price: item.effectivePrice,
          action: "removed",
          totalCartItems: newTotalItems,
          totalCartAmount: newTotalAmount,
        });
      }

      return updated;
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const addRecentOrder = (order: OrderRecord) => {
    setRecentOrders((prev) => [order, ...prev.slice(0, 19)]);
  };

  const updateRecentOrder = (updated: OrderRecord) => {
    setRecentOrders((prev) => {
      const idx = prev.findIndex((o) => o._id === updated._id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...updated };
        return next;
      }
      return [updated, ...prev];
    });
  };

  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const grossAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalAmount = cart.reduce(
    (sum, item) => sum + item.effectivePrice * item.quantity,
    0
  );
  const totalSavings = Math.max(0, grossAmount - totalAmount);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalCount,
        grossAmount,
        totalSavings,
        totalAmount,
        recentOrders,
        addRecentOrder,
        updateRecentOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
