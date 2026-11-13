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

  return (
    <aside className={`admin-sidebar ${isOpen ? "open" : ""}`}>
      {/* 1. GrocerEase Brand Header */}
      <div className="sidebar-brand-header">
        <Link to="/admin" className="sidebar-brand-link" onClick={onClose}>
          <div className="sidebar-brand-icon">
            <ShoppingCart size={18} color="#FFFFFF" strokeWidth={2.4} />
          </div>
          <div className="sidebar-brand-text">
            <h2 className="sidebar-brand-title">GrocerEase</h2>
            <span className="sidebar-brand-sub">Smart Supermarket</span>
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

      {/* 3. Bottom 3D Supermarket Showcase Card */}
      <div className="sidebar-promo-wrap">
        <div className="sidebar-store-card">
          <div className="store-basket-art">
            <img
              src={storefrontImg}
              alt="Smart Shopping"
              className="store-basket-art-img"
            />
          </div>

          <div className="store-card-text">
            <h4 className="store-card-heading">Smart Shopping</h4>
            <p className="store-card-sub">Better Living</p>
            <span className="store-card-script">Together Always...</span>
          </div>
        </div>

        {/* Logout Button Fixed immediately AFTER the 3D storefront image card */}
        <button
          type="button"
          className="nav-item sidebar-logout-btn"
          onClick={logout}
        >
          <div className="nav-icon-wrap">
            <LogOut size={16} strokeWidth={2.2} />
          </div>
          <span className="nav-label">Logout</span>
        </button>

        <div className="sidebar-version-pill">
          <span>v1.0.0 | GrocerEase &copy; 2026</span>
        </div>
      </div>
    </aside>
  );
}
