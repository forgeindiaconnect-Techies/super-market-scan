import React from "react";
import { NavLink, useLocation } from "react-router-dom";
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
  TrendingUp,
  ArrowRight,
} from "lucide-react";

const navItems = [
  { path: "/admin", label: "Dashboard", icon: Home },
  { path: "/admin/products", label: "Product Management", icon: Package },
  { path: "/admin/add-product", label: "+ Add Product", icon: PlusCircle, isAdd: true },
  { path: "/admin/inventory", label: "Inventory Management", icon: Boxes },
  { path: "/admin/barcodes", label: "Barcode Management", icon: Barcode },
  { path: "/admin/orders", label: "Orders & Sales", icon: ShoppingCart },
  { path: "/admin/customers", label: "Customers", icon: Users },
  { path: "/admin/reports", label: "Reports", icon: BarChart2 },
  { path: "/admin/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const isDashboardActive = location.pathname === "/admin" || location.pathname === "/admin/";

  return (
    <aside className={`admin-sidebar ${isOpen ? "open" : ""}`}>
      {/* Golden Top-Left Wing Accent behind Active Dashboard tab matching Image 1 */}
      {isDashboardActive && <div className="sidebar-yellow-crescent" />}

      {/* Navigation List matching Image 1 design with user's 9 required items */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isDashboard = item.path === "/admin";
          const isActive = isDashboard
            ? location.pathname === "/admin" || location.pathname === "/admin/"
            : item.path === "/admin/reports"
            ? location.pathname.startsWith("/admin/reports") || location.pathname.startsWith("/admin/analytics")
            : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={isDashboard}
              onClick={onClose}
              className={`nav-item ${isActive ? "active" : ""}`}
            >
              <div className="nav-icon-wrap">
                <Icon size={19} strokeWidth={item.isAdd ? 2.2 : 2.4} />
              </div>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Promo Card matching Image 1: Grow Your Business, Upgrade Plan -> */}
      <div className="sidebar-grow-card">
        <div className="grow-icon-badge">
          {/* Custom SVG rising 3 gold bars with arrow matching Image 1 */}
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="14" width="3.5" height="7" rx="1" fill="#FBBF24" />
            <rect x="9" y="10" width="3.5" height="11" rx="1" fill="#FBBF24" />
            <rect x="15" y="6" width="3.5" height="15" rx="1" fill="#FBBF24" />
            <path
              d="M3 10L10 3L14 7L20 1"
              stroke="#FBBF24"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16 1H20V5"
              stroke="#FBBF24"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h4 className="grow-title">Grow Your Business</h4>
        <button
          type="button"
          className="grow-upgrade-btn"
          onClick={() => alert("Smart Supermarket Pro Plan is active.")}
        >
          <span>Upgrade Plan</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </aside>
  );
}
