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
  Tag,
} from "lucide-react";
let giftBoxImg = "/gift-box-3d.jpg";
try {
  // eslint-disable-next-line
  giftBoxImg = new URL("../assets/gift-box-3d.jpg", import.meta.url).href;
} catch (_) {
  giftBoxImg = "/gift-box-3d.jpg";
}

const navItems = [
  { path: "/admin", label: "Dashboard", icon: Home, end: true },
  { path: "/admin/products", label: "Products", icon: Package },
  { path: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { path: "/admin/customers", label: "Customers", icon: Users },
  { path: "/admin/inventory", label: "Inventory", icon: Boxes },
  { path: "/admin/reports", label: "Reports", icon: BarChart2 },
  { path: "/admin/barcodes", label: "Offers", icon: Tag },
  { path: "/admin/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

  return (
    <aside className={`admin-sidebar ${isOpen ? "open" : ""}`}>
      {/* 1. GrocerEase Brand Header - Compact Matching Image 2 */}
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

      {/* 2. Navigation Items - Compact Density Matching Image 2 */}
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

        {/* Logout Navigation Item - Neutral slate/white matching reference */}
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

      {/* 3. Bottom Supermarket Basket Promo Card & Version Footer - Compact */}
      <div className="sidebar-promo-wrap">
        <div className="sidebar-store-card">
          <div className="store-basket-art">
            <img
              src="/storefront-3d.jpg"
              alt="GrocerEase Store"
              className="store-basket-art-img"
              onError={(e) => {
                e.currentTarget.src = "/grocery-basket-3d.jpg";
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
