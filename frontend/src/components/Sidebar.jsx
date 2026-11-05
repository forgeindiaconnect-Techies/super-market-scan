import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  Boxes,
  Barcode,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  Store,
  Sparkles,
  ExternalLink,
} from "lucide-react";

const navItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/products", label: "Product Management", icon: Package },
  { path: "/admin/add-product", label: "Add Product", icon: PlusCircle },
  { path: "/admin/inventory", label: "Inventory Management", icon: Boxes },
  { path: "/admin/barcodes", label: "Barcode Management", icon: Barcode },
  { path: "/admin/orders", label: "Orders & Sales", icon: ShoppingCart },
  { path: "/admin/customers", label: "Customers", icon: Users },
  { path: "/admin/analytics", label: "Reports & Analytics", icon: BarChart3 },
  { path: "/admin/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ isOpen, onClose }) {
  return (
    <aside className={`admin-sidebar ${isOpen ? "open" : ""}`}>
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-icon-box">
          <Store size={22} className="brand-icon" />
        </div>
        <div className="brand-text">
          <h2 className="brand-title">GrocerEase</h2>
          <span className="brand-sub">Smart Supermarket</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin"}
              onClick={onClose}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <Icon size={19} className="nav-icon" />
              <span className="nav-label">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Upgrade / Pro Plan Widget (matching Behance GrocerEase mockup) */}
      <div className="sidebar-promo-card">
        <div className="promo-badge">
          <Sparkles size={14} /> PRO SYSTEM
        </div>
        <h4>Upgrade to Pro</h4>
        <p>Maximize your sales with our smart self-checkout AI.</p>
        <button
          type="button"
          className="promo-btn"
          onClick={() => alert("Smart Supermarket Pro Edition is active.")}
        >
          Active Plan
        </button>
      </div>

      {/* Footer Shortcut to Customer Mobile View */}
      <div className="sidebar-footer">
        <NavLink to="/customer" className="customer-view-link">
          <ExternalLink size={16} />
          <span>Open Customer App</span>
        </NavLink>
      </div>
    </aside>
  );
}
