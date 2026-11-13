import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import API from "../services/api";

const AuthContext = createContext(null);

const DEFAULT_SUPERMARKET_STORE1 = {
  _id: "store-real-001",
  name: "GrocerEase Supermarket",
  code: "STR-001",
  tagline: "Autonomous Smart Retail & High-Speed Clearance",
  city: "Bangalore",
  status: "Active",
  plan: "Enterprise",
  adminUsername: "pooja",
  adminName: "Pooja V",
};

const DEFAULT_SUPERMARKET_STORE2 = {
  _id: "store-real-002",
  name: "FreshMart Supermarket",
  code: "STR-002",
  tagline: "Farm Fresh Groceries & Express Clearance",
  city: "Bangalore",
  status: "Active",
  plan: "Professional",
  adminUsername: "storeb",
  adminName: "Rohan Gupta",
};

export const INITIAL_SUPERMARKETS_CATALOG = [
  DEFAULT_SUPERMARKET_STORE1,
  DEFAULT_SUPERMARKET_STORE2,
];

export function AuthProvider({ children }) {
  // 1. Initial State from localStorage
  const [token, setToken] = useState(() => localStorage.getItem("grocerease_auth_token") || "mock_jwt_token_2026");
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("grocerease_user");
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return {
      _id: "user-pooja-admin-1",
      name: "Pooja V",
      username: "pooja",
      email: "poojasree@gmail.com",
      role: "STORE_ADMIN",
      supermarketCode: "STR-001",
      supermarketName: "GrocerEase Flagship - Indiranagar",
    };
  });

  const [currentSupermarket, setCurrentSupermarket] = useState(() => {
    try {
      const saved = localStorage.getItem("grocerease_current_supermarket");
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return DEFAULT_SUPERMARKET_STORE1;
  });

  const [supermarkets, setSupermarkets] = useState(INITIAL_SUPERMARKETS_CATALOG);
  const [loading, setLoading] = useState(false);

  // Sync currentSupermarket to localStorage
  useEffect(() => {
    if (currentSupermarket) {
      try {
        localStorage.setItem("grocerease_current_supermarket", JSON.stringify(currentSupermarket));
      } catch (_) {}
    }
  }, [currentSupermarket]);

  // Load all supermarkets from backend
  const loadSupermarkets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get("/super-admin/supermarkets");
      if (res.data?.success && Array.isArray(res.data.supermarkets) && res.data.supermarkets.length > 0) {
        setSupermarkets(res.data.supermarkets);

        // If current supermarket ID matches one from DB, sync updated attributes
        const activeId = currentSupermarket?._id;
        const matched = res.data.supermarkets.find((s) => s._id === activeId || s.code === currentSupermarket?.code);
        if (matched) {
          setCurrentSupermarket(matched);
        }
      }
    } catch (err) {
      console.warn("Using offline supermarkets catalog:", err.message);
    } finally {
      setLoading(false);
    }
  }, [currentSupermarket?.code, currentSupermarket?._id]);

  useEffect(() => {
    loadSupermarkets();
  }, [loadSupermarkets]);

  // Login handler
  const login = async (username, password) => {
    try {
      const res = await API.post("/auth/login", { username, password });
      if (res.data?.success) {
        const { token: receivedToken, user: receivedUser } = res.data;

        localStorage.setItem("grocerease_auth_token", receivedToken);
        localStorage.setItem("grocerease_user", JSON.stringify(receivedUser));

        setToken(receivedToken);
        setUser(receivedUser);

        if (receivedUser.role === "STORE_ADMIN" && receivedUser.supermarket) {
          const storeObj = typeof receivedUser.supermarket === "object"
            ? receivedUser.supermarket
            : {
                _id: receivedUser.supermarket,
                code: receivedUser.supermarketCode || "STR-001",
                name: receivedUser.supermarketName || "My Supermarket",
              };

          localStorage.setItem("grocerease_current_supermarket", JSON.stringify(storeObj));
          setCurrentSupermarket(storeObj);
        } else if (receivedUser.role === "SUPER_ADMIN") {
          // Default to platform view or first supermarket
          if (!currentSupermarket) {
            setCurrentSupermarket(DEFAULT_SUPERMARKET_STORE1);
          }
        }

        window.dispatchEvent(new Event("grocerease_storage_updated"));
        return { success: true, user: receivedUser };
      }
      return { success: false, message: res.data?.message || "Login failed" };
    } catch (err) {
      // Offline fallback demo login handler so testing works anywhere without internet/db
      const cleanU = String(username).trim().toLowerCase();
      const p = String(password).trim().toLowerCase();

      // 1. Pooja Admin: mail id "pooja" / password "pooja@123" -> Admin Dashboard
      if (
        (cleanU === "pooja" || cleanU === "poojasree@gmail.com" || cleanU.includes("pooja")) &&
        (p === "pooja@123" || p === "pooja123" || p === "pooja")
      ) {
        const poojaAdminUser = {
          _id: "user-pooja-admin-1",
          name: "Pooja V",
          username: "pooja",
          email: "poojasree@gmail.com",
          role: "STORE_ADMIN",
          supermarket: DEFAULT_SUPERMARKET_STORE1,
          supermarketCode: "STR-001",
          supermarketName: "GrocerEase Flagship - Indiranagar",
        };
        localStorage.setItem("grocerease_auth_token", "mock_pooja_token");
        localStorage.setItem("grocerease_user", JSON.stringify(poojaAdminUser));
        localStorage.setItem("grocerease_current_supermarket", JSON.stringify(DEFAULT_SUPERMARKET_STORE1));
        setToken("mock_pooja_token");
        setUser(poojaAdminUser);
        setCurrentSupermarket(DEFAULT_SUPERMARKET_STORE1);
        window.dispatchEvent(new Event("grocerease_storage_updated"));
        return { success: true, user: poojaAdminUser };
      }

      // 2. Super Admin: username "admin" / password "admin123"
      if (
        (cleanU === "admin" || cleanU === "superadmin@grocerease.store") &&
        (p === "admin123" || p === "admin@123" || p === "admin")
      ) {
        const superAdminUser = {
          _id: "user-super-admin-1",
          name: "Super Admin",
          username: "admin",
          email: "superadmin@grocerease.store",
          role: "SUPER_ADMIN",
        };
        localStorage.setItem("grocerease_auth_token", "mock_super_admin_token");
        localStorage.setItem("grocerease_user", JSON.stringify(superAdminUser));
        setToken("mock_super_admin_token");
        setUser(superAdminUser);
        return { success: true, user: superAdminUser };
      }

      // 3. Store Admin B: username "storeb" / password "StoreB@123"
      if (
        (cleanU === "storeb" || cleanU === "storeb@freshmart.store" || cleanU === "str-002" || cleanU.includes("freshmart")) &&
        (p === "storeb@123" || p === "storeb123" || p === "storeb")
      ) {
        const storeBUser = {
          _id: "user-store-b",
          name: "Rohan Gupta",
          username: "storeb",
          email: "storeb@freshmart.store",
          role: "STORE_ADMIN",
          supermarket: DEFAULT_SUPERMARKET_STORE2,
          supermarketCode: "STR-002",
          supermarketName: "FreshMart Supermarket",
        };
        localStorage.setItem("grocerease_auth_token", "mock_storeb_token");
        localStorage.setItem("grocerease_user", JSON.stringify(storeBUser));
        localStorage.setItem("grocerease_current_supermarket", JSON.stringify(DEFAULT_SUPERMARKET_STORE2));
        setToken("mock_storeb_token");
        setUser(storeBUser);
        setCurrentSupermarket(DEFAULT_SUPERMARKET_STORE2);
        window.dispatchEvent(new Event("grocerease_storage_updated"));
        return { success: true, user: storeBUser };
      }

      const msg = err.response?.data?.message || err.message || "Invalid credentials.";
      return { success: false, message: msg };
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem("grocerease_auth_token");
    localStorage.removeItem("grocerease_user");
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  };

  // Switch supermarket (Super Admin privilege)
  const switchSupermarket = (supermarketOrId) => {
    let storeToSet = null;
    if (typeof supermarketOrId === "object" && supermarketOrId !== null) {
      storeToSet = supermarketOrId;
    } else {
      storeToSet = supermarkets.find((s) => s._id === supermarketOrId || s.code === supermarketOrId);
    }

    if (storeToSet) {
      setCurrentSupermarket(storeToSet);
      try {
        localStorage.setItem("grocerease_current_supermarket", JSON.stringify(storeToSet));
      } catch (_) {}
      window.dispatchEvent(new Event("grocerease_storage_updated"));
      return storeToSet;
    }
    return null;
  };

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isStoreAdmin = user?.role === "STORE_ADMIN";

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        role: user?.role || null,
        isSuperAdmin,
        isStoreAdmin,
        currentSupermarket,
        supermarkets,
        loading,
        login,
        logout,
        switchSupermarket,
        loadSupermarkets,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

