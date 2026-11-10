const fs = require('fs');
const sidebarPath = 'd:\\PROJECTS\\Super market\\frontend\\src\\components\\Sidebar.jsx';
const layoutCssPath = 'd:\\PROJECTS\\Super market\\frontend\\src\\layouts\\AdminLayout.css';

// 1. Update Sidebar.jsx: Proper Title Case labels & Logout placed AFTER the 3D storefront image card
const updatedSidebarJsx = `import React from "react";
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
    <aside className={\`admin-sidebar \${isOpen ? "open" : ""}\`}>
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
              className={\`nav-item \${isActive ? "active" : ""}\`}
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
          onClick={() => {
            if (window.confirm("Switch to Customer Self-Checkout Web Mirror?")) {
              window.location.href = "/customer";
            }
          }}
        >
          <div className="nav-icon-wrap">
            <LogOut size={16} strokeWidth={2.2} />
          </div>
          <span className="nav-label">Logout</span>
        </button>

        <div className="sidebar-version-pill">
          <span>v1.0.0 | GrocerEase © 2026</span>
        </div>
      </div>
    </aside>
  );
}
`;

fs.writeFileSync(sidebarPath, updatedSidebarJsx, 'utf8');

// 2. Append Ultra-Bright Sidebar Styles to AdminLayout.css
const brightSidebarCss = `
/* ===================================================================
   ULTRA-BRIGHT SIDEBAR NAVIGATION TABS & ENHANCED CONTRAST
   =================================================================== */
.admin-sidebar {
  background-color: #031336 !important;
  border-right: 1.5px solid rgba(59, 130, 246, 0.3) !important;
}

.sidebar-brand-title {
  color: #FFFFFF !important;
  font-weight: 800 !important;
}

.sidebar-brand-sub {
  color: #60A5FA !important;
  font-weight: 600 !important;
}

/* Bright Inactive Nav Tabs */
.nav-item {
  color: #E2E8F0 !important;
  font-weight: 600 !important;
  font-size: 13px !important;
  padding: 8px 12px !important;
  border-radius: 10px !important;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
  text-transform: capitalize !important;
}

.nav-item:hover {
  background: rgba(59, 130, 246, 0.25) !important;
  color: #FFFFFF !important;
  transform: translateX(3px) !important;
  box-shadow: 0 2px 10px rgba(37, 99, 235, 0.2) !important;
}

.nav-item .nav-icon-wrap {
  color: #93C5FD !important;
}

.nav-item:hover .nav-icon-wrap {
  color: #FFFFFF !important;
}

/* Luminous Glowing Electric Blue Active Nav Tab */
.nav-item.active {
  background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%) !important;
  color: #FFFFFF !important;
  font-weight: 800 !important;
  border: 1px solid rgba(147, 197, 253, 0.6) !important;
  box-shadow: 0 4px 18px rgba(37, 99, 235, 0.7), 0 0 12px rgba(96, 165, 250, 0.4) !important;
}

.nav-item.active .nav-icon-wrap {
  color: #FFFFFF !important;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3)) !important;
}

/* Logout Button styling placed after the 3D storefront image card */
.sidebar-logout-btn {
  margin-top: 6px !important;
  background: rgba(239, 68, 68, 0.15) !important;
  border: 1.5px solid rgba(239, 68, 68, 0.4) !important;
  color: #FCA5A5 !important;
  font-weight: 700 !important;
}

.sidebar-logout-btn:hover {
  background: rgba(239, 68, 68, 0.35) !important;
  color: #FFFFFF !important;
  border-color: rgba(239, 68, 68, 0.7) !important;
  transform: translateX(3px) !important;
}

.sidebar-logout-btn .nav-icon-wrap {
  color: #F87171 !important;
}
.sidebar-logout-btn:hover .nav-icon-wrap {
  color: #FFFFFF !important;
}

/* 3D Storefront Card */
.sidebar-store-card {
  background: linear-gradient(135deg, rgba(14, 45, 105, 0.95) 0%, rgba(8, 30, 75, 0.95) 100%) !important;
  border: 1.5px solid rgba(96, 165, 250, 0.4) !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4) !important;
}

.store-card-heading {
  color: #FFFFFF !important;
  font-weight: 800 !important;
}

.store-card-sub {
  color: #93C5FD !important;
  font-weight: 600 !important;
}

.store-card-script {
  color: #FBBF24 !important;
  font-weight: 700 !important;
}
`;

fs.appendFileSync(layoutCssPath, brightSidebarCss, 'utf8');
console.log('SUCCESS: Sidebar tabs updated with bright colors, strict Title Case, and Logout placed after the image card!');
