import React from "react";
import { NavLink, useLocation, Link } from "react-router-dom";
import {
  Home,
  Package,
  PlusCircle,
  Boxes,
  Barcode,
  ShoppingCart,
  Users,
  BarChart2,
  Settings,
  LogOut,
  X,
} from "lucide-react";

let sidebarWavesBg = "/sidebar-waves-bg.jpg";
try {
  sidebarWavesBg = new URL("../assets/sidebar-waves-bg.jpg", import.meta.url).href;
} catch (_) {
  sidebarWavesBg = "/sidebar-waves-bg.jpg";
}

let groceryBasketImg = "/grocery-basket-3d.jpg";
try {
  groceryBasketImg = new URL("../assets/grocery-basket-3d.jpg", import.meta.url).href;
} catch (_) {
  groceryBasketImg = "/grocery-basket-3d.jpg";
}

const navItems = [
  { path: "/admin", label: "Dashboard", icon: Home, end: true },
  { path: "/admin/products", label: "Products", icon: Package },
  { path: "/admin/add-product", label: "Add Product", icon: PlusCircle },
  { path: "/admin/inventory", label: "Inventory", icon: Boxes },
  { path: "/admin/barcodes", label: "Barcodes", icon: Barcode },
  { path: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { path: "/admin/customers", label: "Customers", icon: Users },
  { path: "/admin/reports", label: "Reports", icon: BarChart2 },
  { path: "/admin/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

  return (
    <aside
      className={`admin-sidebar ${isOpen ? "open" : ""}`}
      style={{
        backgroundImage: `url(${sidebarWavesBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center bottom",
        backgroundRepeat: "no-repeat",
      }}
    >
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

      {/* 2. Navigation Items matching target reference */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.end
            ? location.pathname === "/admin" || location.pathname === "/admin/"
            : item.path === "/admin/reports"
            ? location.pathname.startsWith("/admin/reports") ||
              location.pathname.startsWith("/admin/analytics")
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
                <Icon size={16} strokeWidth={isActive ? 2.4 : 2} />
              </div>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          );
        })}

        {/* Logout Navigation Item */}
        <button
          type="button"
          className="nav-item sidebar-logout-btn"
          onClick={() => {
            if (window.confirm("Switch to Customer Self-Checkout Web Mirror?")) {
              window.location.href = "/customer";
            }
          }}
        >
          <div className="nav-icon-wrap">
            <LogOut size={16} strokeWidth={2} />
          </div>
          <span className="nav-label">Logout</span>
        </button>
      </nav>

      {/* 3. Bottom Supermarket Promo Card & Version Footer */}
      <div className="sidebar-promo-wrap">
        <div className="sidebar-store-card">
          <div className="store-basket-art">
            <img
              src={groceryBasketImg}
              alt="Smart Shopping"
              className="store-basket-art-img"
              onError={(e) => {
                e.currentTarget.src = "/storefront-3d.jpg";
              }}
            />
          </div>

          <div className="store-card-text">
            <h4 className="store-card-heading">Smart Shopping</h4>
            <p className="store-card-sub">Better Living</p>
            <span className="store-card-script">Together Always...</span>
          </div>
        </div>

        <div className="sidebar-version-pill">
          <span>v1.0.0 | GrocerEase © 2026</span>
        </div>
      </div>
    </aside>
  );
}
