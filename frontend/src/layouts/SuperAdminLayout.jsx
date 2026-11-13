import React, { useState, useRef, useEffect } from "react";
import { Outlet, NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  PackageSearch,
  Boxes,
  ShoppingCart,
  Users,
  ShieldCheck,
  BarChart2,
  CreditCard,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Store,
  Menu,
  X,
  Sparkles,
  Bell,
  HelpCircle,
  PlusCircle,
  FileText,
  TrendingUp,
  Headphones,
  Rocket,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./SuperAdminLayout.css";

export default function SuperAdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const mainWrapperRef = useRef(null);
  const { user, logout, supermarkets, currentSupermarket, switchSupermarket } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Collapsible Menu Groups State (all open by default for rich display)
  const [openGroups, setOpenGroups] = useState({
    supermarkets: true,
    plans: true,
    registered: true,
    analytics: true,
    settings: false,
  });

  const toggleGroup = (groupKey) => {
    setOpenGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  // Smooth scroll to top on path change
  useEffect(() => {
    if (mainWrapperRef.current) {
      mainWrapperRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  const handleNavClick = () => {
    setSidebarOpen(false);
  };

  const isCurrent = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="super-admin-container">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="sa-sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Deep Forest Green Super Admin Sidebar */}
      <aside className={`sa-sidebar ${sidebarOpen ? "open" : ""}`}>
        {/* Brand Header */}
        <div className="sa-sidebar-header">
          <Link to="/super-admin" className="sa-brand-link" onClick={handleNavClick}>
            <div className="sa-brand-logo-wrap">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 3H5L6.68 14.39C6.77 15.03 7.32 15.5 7.96 15.5H18.04C18.68 15.5 19.23 15.03 19.32 14.39L20.5 6.5H6"
                  stroke="#22c55e"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="9" cy="19.5" r="1.5" fill="#22c55e" />
                <circle cx="17" cy="19.5" r="1.5" fill="#22c55e" />
                <path
                  d="M16 2.5C14 2 12.5 3.5 12 5.5C14 6 16.5 4.5 16 2.5Z"
                  fill="#4ade80"
                />
              </svg>
            </div>
            <div className="sa-brand-text">
              <div style={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
                <span className="sa-brand-name">GrocerEase</span>
              </div>
              <span className="sa-brand-tagline">Smart Supermarket Solutions &mdash;</span>
            </div>
          </Link>
          <button
            type="button"
            className="sa-mobile-close"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="sa-sidebar-nav">
          {/* Main Dashboard item */}
          <NavLink
            to="/super-admin"
            end
            onClick={handleNavClick}
            className={({ isActive }) => `sa-nav-pill-main ${isActive ? "active" : ""}`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          {/* Group 1: Supermarket Management */}
          <div className="sa-nav-group">
            <button
              type="button"
              className="sa-group-header"
              onClick={() => toggleGroup("supermarkets")}
            >
              <div className="sa-group-header-left">
                <Store size={16} />
                <span>Supermarket Management</span>
              </div>
              <ChevronDown
                size={14}
                className={`sa-chevron ${openGroups.supermarkets ? "open" : ""}`}
              />
            </button>
            {openGroups.supermarkets && (
              <div className="sa-group-subitems">
                <NavLink
                  to="/super-admin/add-supermarket"
                  onClick={handleNavClick}
                  className={({ isActive }) => `sa-subitem ${isActive ? "active-sub" : ""}`}
                >
                  <span className="sa-dot">&rsaquo;</span>
                  <span>Add Supermarket</span>
                </NavLink>
                <NavLink
                  to="/super-admin/supermarkets"
                  onClick={handleNavClick}
                  className={({ isActive }) => `sa-subitem ${isActive ? "active-sub" : ""}`}
                >
                  <span className="sa-dot">&rsaquo;</span>
                  <span>Manage Supermarkets</span>
                </NavLink>
              </div>
            )}
          </div>

          {/* Group 2: Subscription Plans */}
          <div className="sa-nav-group">
            <button
              type="button"
              className="sa-group-header"
              onClick={() => toggleGroup("plans")}
            >
              <div className="sa-group-header-left">
                <CreditCard size={16} />
                <span>Subscription Plans</span>
              </div>
              <ChevronDown
                size={14}
                className={`sa-chevron ${openGroups.plans ? "open" : ""}`}
              />
            </button>
            {openGroups.plans && (
              <div className="sa-group-subitems">
                <NavLink
                  to="/super-admin/plans"
                  onClick={handleNavClick}
                  className={({ isActive }) => `sa-subitem ${isActive ? "active-sub" : ""}`}
                >
                  <span className="sa-dot">&rsaquo;</span>
                  <span>Create Plan</span>
                </NavLink>
                <NavLink
                  to="/super-admin/plans"
                  onClick={handleNavClick}
                  className={({ isActive }) => `sa-subitem ${isActive ? "active-sub" : ""}`}
                >
                  <span className="sa-dot">&rsaquo;</span>
                  <span>Manage Plans</span>
                </NavLink>
              </div>
            )}
          </div>

          {/* Group 3: Registered Supermarkets */}
          <div className="sa-nav-group">
            <button
              type="button"
              className="sa-group-header"
              onClick={() => toggleGroup("registered")}
            >
              <div className="sa-group-header-left">
                <Users size={16} />
                <span>Registered Supermarkets</span>
              </div>
              <ChevronDown
                size={14}
                className={`sa-chevron ${openGroups.registered ? "open" : ""}`}
              />
            </button>
            {openGroups.registered && (
              <div className="sa-group-subitems">
                <NavLink
                  to="/super-admin/registered-supermarkets"
                  onClick={handleNavClick}
                  className={({ isActive }) => `sa-subitem ${isActive ? "active-sub" : ""}`}
                >
                  <span className="sa-dot">&rsaquo;</span>
                  <span>View All Stores</span>
                </NavLink>
                <NavLink
                  to="/super-admin/registered-supermarkets"
                  onClick={handleNavClick}
                  className={({ isActive }) => `sa-subitem ${isActive ? "active-sub" : ""}`}
                >
                  <span className="sa-dot">&rsaquo;</span>
                  <span>Subscription Status</span>
                </NavLink>
              </div>
            )}
          </div>

          {/* Group 4: Analytics & Reports */}
          <div className="sa-nav-group">
            <button
              type="button"
              className="sa-group-header"
              onClick={() => toggleGroup("analytics")}
            >
              <div className="sa-group-header-left">
                <BarChart2 size={16} />
                <span>Analytics & Reports</span>
              </div>
              <ChevronDown
                size={14}
                className={`sa-chevron ${openGroups.analytics ? "open" : ""}`}
              />
            </button>
            {openGroups.analytics && (
              <div className="sa-group-subitems">
                <NavLink
                  to="/super-admin/reports"
                  onClick={handleNavClick}
                  className={({ isActive }) => `sa-subitem ${isActive ? "active-sub" : ""}`}
                >
                  <span className="sa-dot">&rsaquo;</span>
                  <span>Platform Reports</span>
                </NavLink>
                <NavLink
                  to="/super-admin/product-sales"
                  onClick={handleNavClick}
                  className={({ isActive }) => `sa-subitem ${isActive ? "active-sub" : ""}`}
                >
                  <span className="sa-dot">&rsaquo;</span>
                  <span>Sales Overview</span>
                </NavLink>
              </div>
            )}
          </div>

          {/* Group 5: Settings */}
          <div className="sa-nav-group">
            <button
              type="button"
              className="sa-group-header"
              onClick={() => toggleGroup("settings")}
            >
              <div className="sa-group-header-left">
                <Settings size={16} />
                <span>Settings</span>
              </div>
              <ChevronDown
                size={14}
                className={`sa-chevron ${openGroups.settings ? "open" : ""}`}
              />
            </button>
            {openGroups.settings && (
              <div className="sa-group-subitems">
                <NavLink
                  to="/super-admin/settings"
                  onClick={handleNavClick}
                  className={({ isActive }) => `sa-subitem ${isActive ? "active-sub" : ""}`}
                >
                  <span className="sa-dot">&rsaquo;</span>
                  <span>System Settings</span>
                </NavLink>
                <NavLink
                  to="/super-admin/settings"
                  onClick={handleNavClick}
                  className={({ isActive }) => `sa-subitem ${isActive ? "active-sub" : ""}`}
                >
                  <span className="sa-dot">&rsaquo;</span>
                  <span>Notifications</span>
                </NavLink>
              </div>
            )}
          </div>

          {/* Help & Support */}
          <div className="sa-nav-single">
            <button
              type="button"
              className="sa-group-header-single"
              onClick={() => navigate("/super-admin/settings")}
            >
              <Headphones size={16} />
              <span>Help & Support</span>
            </button>
          </div>
        </nav>

        {/* Sidebar Footer Rocket Banner */}
        <div className="sa-sidebar-bottom-promo">
          <div className="sa-promo-card">
            <div className="sa-promo-icon-wrap">
              <Rocket size={20} color="#facc15" />
            </div>
            <h4>Grow Your Supermarket Business</h4>
            <button
              type="button"
              className="sa-promo-btn"
              onClick={() => navigate("/super-admin/plans")}
            >
              <span>Learn More</span>
              <span>&rarr;</span>
            </button>
          </div>
          <span className="sa-copyright-text">
            &copy; 2025 GrocerEase. All rights reserved.
          </span>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="sa-main-wrapper" ref={mainWrapperRef}>
        {/* Top Header Bar matching reference image */}
        <header className="sa-top-header">
          <div className="sa-header-left">
            <button
              type="button"
              className="sa-mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="sa-header-welcome">
              <div className="sa-welcome-title">
                <span className="sa-wave-emoji">👋</span>
                <h2>Welcome Back, Super Admin!</h2>
              </div>
              <p className="sa-welcome-subtitle">
                Manage your entire supermarket network efficiently
              </p>
            </div>
          </div>

          <div className="sa-header-right">
            {/* Notification Bell with Badge 3 */}
            <button
              type="button"
              className="sa-header-bell-btn"
              onClick={() => navigate("/super-admin/reports")}
              title="3 Platform Notifications"
            >
              <Bell size={18} color="#0f172a" />
              <span className="sa-bell-badge">3</span>
            </button>

            {/* Super Admin User Profile Pill */}
            <div
              className="sa-user-profile-pill"
              onClick={() => setProfileDropdownOpen((prev) => !prev)}
            >
              <div className="sa-avatar-circle-green">SA</div>
              <div className="sa-user-text">
                <strong className="sa-user-title">Super Admin</strong>
                <span className="sa-user-sub">superadmin</span>
              </div>
              <ChevronDown size={13} color="#64748b" />
            </div>

            {profileDropdownOpen && (
              <div className="sa-profile-dropdown">
                <div className="sa-pd-header">
                  <strong>Platform Super Admin</strong>
                  <small>admin@grocerease.store</small>
                </div>
                <div className="sa-pd-divider" />
                <button
                  type="button"
                  className="sa-pd-item"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    navigate("/super-admin/settings");
                  }}
                >
                  <Settings size={14} />
                  <span>Platform Settings</span>
                </button>
                <button
                  type="button"
                  className="sa-pd-item logout"
                  onClick={logout}
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page Canvas */}
        <main className="sa-page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
