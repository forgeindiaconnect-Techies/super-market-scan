import React, { useState, useEffect, useRef } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingCart,
  Search,
  Bell,
  ChevronDown,
  LayoutDashboard,
  Package,
  PlusCircle,
  Boxes,
  Barcode,
  ShoppingBag,
  Users,
  BarChart3,
  Settings,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Sparkles,
} from "lucide-react";
import API from "../services/api";

const NAV_ITEMS = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { path: "/admin/products", label: "Product Management", icon: Package },
  { path: "/admin/add-product", label: "Add Product", icon: PlusCircle },
  { path: "/admin/inventory", label: "Inventory Management", icon: Boxes },
  { path: "/admin/barcodes", label: "Barcode Management", icon: Barcode },
  { path: "/admin/orders", label: "Orders & Sales", icon: ShoppingBag },
  { path: "/admin/customers", label: "Customers", icon: Users },
  { path: "/admin/reports", label: "Reports", icon: BarChart3 },
  { path: "/admin/settings", label: "Settings", icon: Settings },
];

export default function TopNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const [backendOnline, setBackendOnline] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Check backend health & live pending orders count
  useEffect(() => {
    const checkStatus = () => {
      API.get("/products")
        .then(() => setBackendOnline(true))
        .catch(() => setBackendOnline(false));

      API.get("/orders")
        .then((res) => {
          if (res.data?.success) {
            const pending = (res.data.orders || []).filter(
              (o) => o.paymentStatus === "Pending"
            ).length;
            setPendingOrdersCount(pending);
          }
        })
        .catch(() => {});
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/admin/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="innovative-top-header">
      {/* =================================================================== */}
      {/* TIER 1: BRAND LOGO + GLOBAL SEARCH + SYSTEM STATUS + ADMIN PROFILE */}
      {/* =================================================================== */}
      <div className="header-primary-tier">
        {/* Left: Brand Identity */}
        <div className="header-brand-section">
          <button
            type="button"
            className="mobile-hamburger-btn"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link to="/admin" className="innovative-brand-link">
            <div className="brand-logo-badge">
              <ShoppingCart size={22} color="#FFFFFF" strokeWidth={2.4} />
            </div>
            <div className="brand-title-group">
              <div className="brand-heading-row">
                <h1 className="brand-primary-name">GrocerEase</h1>
                <span className="brand-pro-tag">SaaS</span>
              </div>
              <span className="brand-subtext">Smart Supermarket Admin</span>
            </div>
          </Link>
        </div>

        {/* Center: Global Search Bar */}
        <form className="header-search-container" onSubmit={handleSearchSubmit}>
          <Search size={18} className="search-icon-svg" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products, barcodes, orders, customers..."
            aria-label="Global supermarket search"
          />
          <div className="search-shortcut-badge">
            <kbd>⌘</kbd> <kbd>K</kbd>
          </div>
        </form>

        {/* Right: Status Pill, Notifications & Profile */}
        <div className="header-controls-section">
          {/* Live System Status Pill */}
          <div
            className={`system-status-indicator ${
              backendOnline ? "online" : "offline"
            }`}
            title={backendOnline ? "All Backend & MongoDB Services Operational" : "Backend Disconnected"}
          >
            <span className="status-pulse-dot" />
            <span className="status-text-label">
              {backendOnline ? "System Online" : "Connecting..."}
            </span>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative-control-wrap" ref={notifRef}>
            <button
              type="button"
              className="action-icon-circle"
              onClick={() => setNotificationsOpen((prev) => !prev)}
              aria-label="Notifications"
            >
              <Bell size={19} />
              {pendingOrdersCount > 0 ? (
                <span className="notification-pill-badge pulse">
                  {pendingOrdersCount}
                </span>
              ) : (
                <span className="notification-pill-badge">3</span>
              )}
            </button>

            {notificationsOpen && (
              <div className="header-flyout-dropdown notif-flyout">
                <div className="dropdown-header-row">
                  <h4 className="dropdown-heading">Real-Time Alerts</h4>
                  <span className="unread-counter-tag">
                    {pendingOrdersCount > 0 ? `${pendingOrdersCount} Pending` : "3 Alerts"}
                  </span>
                </div>
                <div className="dropdown-items-list">
                  {pendingOrdersCount > 0 && (
                    <Link
                      to="/admin/orders"
                      className="flyout-item alert-highlight"
                      onClick={() => setNotificationsOpen(false)}
                    >
                      <div className="flyout-icon-box alert">
                        <ShoppingBag size={16} />
                      </div>
                      <div className="flyout-item-content">
                        <p className="flyout-item-title">Payment Pending</p>
                        <p className="flyout-item-desc">
                          {pendingOrdersCount} customer order(s) awaiting admin approval.
                        </p>
                      </div>
                    </Link>
                  )}
                  <Link
                    to="/admin/inventory"
                    className="flyout-item"
                    onClick={() => setNotificationsOpen(false)}
                  >
                    <div className="flyout-icon-box warn">
                      <AlertTriangle size={16} />
                    </div>
                    <div className="flyout-item-content">
                      <p className="flyout-item-title">Low Stock Alert</p>
                      <p className="flyout-item-desc">
                        Chocolate & Dove Shampoo are below threshold.
                      </p>
                    </div>
                  </Link>
                  <Link
                    to="/admin/barcodes"
                    className="flyout-item"
                    onClick={() => setNotificationsOpen(false)}
                  >
                    <div className="flyout-icon-box success">
                      <CheckCircle2 size={16} />
                    </div>
                    <div className="flyout-item-content">
                      <p className="flyout-item-title">Barcode System Online</p>
                      <p className="flyout-item-desc">
                        All scanners and turnstile exit gates calibrated.
                      </p>
                    </div>
                  </Link>
                </div>
                <div className="dropdown-footer-row">
                  <Link
                    to="/admin/orders"
                    className="dropdown-footer-link"
                    onClick={() => setNotificationsOpen(false)}
                  >
                    View All Orders & Alerts →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Admin Profile Dropdown */}
          <div className="relative-control-wrap" ref={profileRef}>
            <button
              type="button"
              className="admin-profile-pill-btn"
              onClick={() => setProfileDropdownOpen((prev) => !prev)}
              aria-label="Admin Profile menu"
            >
              <div className="admin-avatar-container">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                  alt="Eleanor Pena"
                  className="admin-avatar-img"
                />
                <span className="avatar-live-indicator" />
              </div>
              <div className="admin-meta-text">
                <span className="admin-name">Eleanor Pena</span>
                <span className="admin-badge-role">Super Admin</span>
              </div>
              <ChevronDown
                size={15}
                className={`dropdown-chevron ${profileDropdownOpen ? "rotated" : ""}`}
              />
            </button>

            {profileDropdownOpen && (
              <div className="header-flyout-dropdown profile-flyout">
                <div className="profile-hero-card">
                  <p className="profile-full-name">Eleanor Pena</p>
                  <p className="profile-email">eleanor.pena@grocerease.com</p>
                  <span className="profile-verified-badge">
                    <ShieldCheck size={13} /> Store Administrator
                  </span>
                </div>
                <div className="dropdown-divider-line" />
                <div className="dropdown-items-list">
                  <Link
                    to="/admin/settings"
                    className="profile-menu-item"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <Settings size={16} />
                    <span>Store Settings & Turnstile Config</span>
                  </Link>
                  <Link
                    to="/customer"
                    target="_blank"
                    className="profile-menu-item"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <ExternalLink size={16} />
                    <span>Open Customer App Mirror</span>
                  </Link>
                </div>
                <div className="dropdown-divider-line" />
                <button
                  type="button"
                  className="profile-menu-item sign-out-item"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    alert("Admin signed out successfully.");
                  }}
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* TIER 2: INNOVATIVE HORIZONTAL STICKY NAVIGATION BAR                */}
      {/* Highlights Active Route with Clean Blue SaaS Indicator            */}
      {/* =================================================================== */}
      <nav className="header-navigation-tier">
        <div className="nav-links-track">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? location.pathname === "/admin" || location.pathname === "/admin/"
              : location.pathname.startsWith(item.path);

            const isOrders = item.path === "/admin/orders";

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={`top-nav-link ${isActive ? "active" : ""}`}
              >
                <div className="nav-link-icon-wrap">
                  <Icon size={17} strokeWidth={isActive ? 2.4 : 2} />
                </div>
                <span className="nav-link-title">{item.label}</span>
                {isOrders && pendingOrdersCount > 0 && (
                  <span className="nav-pending-dot-badge">
                    {pendingOrdersCount}
                  </span>
                )}
                {isActive && <span className="active-blue-indicator-bar" />}
              </NavLink>
            );
          })}
        </div>

        {/* Quick Shortcut on the far right of nav bar */}
        <div className="nav-right-quick-action">
          <Link to="/admin/add-product" className="nav-quick-add-btn">
            <PlusCircle size={16} strokeWidth={2.4} />
            <span>+ Add Product</span>
          </Link>
        </div>
      </nav>

      {/* =================================================================== */}
      {/* MOBILE RESPONSIVE SLIDE-DOWN DRAWER MENU                           */}
      {/* =================================================================== */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-drawer-card" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <div className="brand-heading-row">
                <div className="brand-logo-badge mini">
                  <ShoppingCart size={18} color="#FFFFFF" strokeWidth={2.4} />
                </div>
                <h3 className="brand-primary-name">GrocerEase Menu</h3>
              </div>
              <button
                type="button"
                className="close-drawer-btn"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="mobile-drawer-nav-list">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact
                  ? location.pathname === "/admin" || location.pathname === "/admin/"
                  : location.pathname.startsWith(item.path);

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.exact}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`mobile-nav-link ${isActive ? "active" : ""}`}
                  >
                    <Icon size={19} />
                    <span>{item.label}</span>
                    {item.path === "/admin/orders" && pendingOrdersCount > 0 && (
                      <span className="mobile-pending-badge">
                        {pendingOrdersCount} Pending
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>

            <div className="mobile-drawer-footer">
              <Link
                to="/customer"
                target="_blank"
                className="mobile-customer-app-btn"
                onClick={() => setMobileMenuOpen(false)}
              >
                <ExternalLink size={16} />
                <span>Open Customer App</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

