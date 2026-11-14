import React from "react";
import { NavLink, useLocation, Link } from "react-router-dom";
import {
  Home,
  Package,
  PlusCircle,
  Camera,
  Boxes,
  Barcode,
  ShoppingCart,
  Users,
  BarChart2,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

let storefrontImg = "/storefront-3d.jpg";
try {
  storefrontImg = new URL("../assets/storefront-3d.jpg", import.meta.url).href;
} catch (_) {
  storefrontImg = "/storefront-3d.jpg";
}

// 9 Primary Navigation Tabs in strict Title Case
const navItems = [
  { path: "/admin", label: "Dashboard", icon: Home, end: true },
  { path: "/admin/products", label: "Products", icon: Package },
  { path: "/admin/add-product", label: "Add Product", icon: PlusCircle },
  { path: "/admin/scan-enter", label: "Scan & Enter", icon: Camera },
  { path: "/admin/inventory", label: "Inventory", icon: Boxes },
  { path: "/admin/barcodes", label: "Barcodes", icon: Barcode },
  { path: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { path: "/admin/customers", label: "Customers", icon: Users },
  { path: "/admin/reports", label: "Reports", icon: BarChart2 },
  { path: "/admin/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { user, isSuperAdmin, currentSupermarket, logout } = useAuth();

  const storeName = currentSupermarket?.name || "GrocerEase";
  const storeSub = currentSupermarket?.code
    ? `${currentSupermarket.code} • ${currentSupermarket.city || "Store"}`
    : "Smart Supermarket";
  const storeLogo = currentSupermarket?.logoUrl;
  const storeTagline = currentSupermarket?.tagline || "Smart Shopping";

  return (
    <aside className={`admin-sidebar ${isOpen ? "open" : ""}`}>
      {/* 1. Dynamic Supermarket Brand Header */}
      <div className="sidebar-brand-header">
        <Link to="/admin" className="sidebar-brand-link" onClick={onClose} title={`${storeName} (${storeSub})`}>
          <div className="sidebar-brand-icon">
            {storeLogo ? (
              <img
                src={storeLogo}
                alt={storeName}
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  if (e.currentTarget.nextSibling) {
                    e.currentTarget.nextSibling.style.display = "flex";
                  }
                }}
              />
            ) : null}
            <div
              style={{
                display: storeLogo ? "none" : "flex",
                width: "100%",
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                color: "#ffffff",
                fontSize: "14px",
              }}
            >
              {storeName ? storeName[0].toUpperCase() : <ShoppingCart size={18} color="#FFFFFF" strokeWidth={2.4} />}
            </div>
          </div>
          <div className="sidebar-brand-text">
            <h2 className="sidebar-brand-title" style={{ maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {storeName}
            </h2>
            <span className="sidebar-brand-sub">{storeSub}</span>
          </div>
        </Link>
        <button
          type="button"
          className="sidebar-mobile-close"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X size={16} />
        </button>
      </div>

      {/* 2. Permanent Navigation Items */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.end
            ? location.pathname === "/admin" || location.pathname === "/admin/"
            : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={onClose}
              className={`nav-item ${isActive ? "active" : ""}`}
            >
              <div className="nav-icon-wrap">
                <Icon size={17} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* 3. Bottom Supermarket Showcase Card */}
      <div className="sidebar-promo-wrap">
        <div className="sidebar-store-card">
          <div className="store-basket-art">
            {storeLogo ? (
              <img
                src={storeLogo}
                alt={storeName}
                className="store-basket-art-img"
                onError={(e) => {
                  e.currentTarget.src = storefrontImg;
                }}
              />
            ) : (
              <img
                src={storefrontImg}
                alt={storeName}
                className="store-basket-art-img"
              />
            )}
          </div>

          <div className="store-card-text">
            <h4 className="store-card-heading" style={{ maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {storeName}
            </h4>
            <p className="store-card-sub">{currentSupermarket?.city ? `${currentSupermarket.city} Branch` : "Active Supermarket"}</p>
            <span className="store-card-script">{storeTagline}</span>
          </div>
        </div>

        {/* Logout Button Fixed immediately AFTER the 3D storefront image card */}
        <button
          type="button"
          className="nav-item sidebar-logout-btn"
          onClick={logout}
          title="Sign out of Admin Portal"
        >
          <div className="nav-icon-wrap">
            <LogOut size={16} strokeWidth={2.2} />
          </div>
          <span className="nav-label">Logout</span>
        </button>

        <div className="sidebar-version-pill">
          <span>{storeName} &bull; {currentSupermarket?.code || "Portal"}</span>
        </div>
      </div>
    </aside>
  );
}
