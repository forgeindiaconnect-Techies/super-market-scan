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
import { io } from "socket.io-client";
import API from "../services/api";
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

  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [croppedBannerUrl, setCroppedBannerUrl] = useState(null);

  // Crop the exact top 56px header banner from master reference image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "/super-admin-reference-master.jpg";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const origW = img.naturalWidth || 618;
        const origH = img.naturalHeight || 383;
        // In the master reference image (618x383), the header banner is exactly the top 56px
        const bannerH = Math.round(origH * (56 / 383));
        canvas.width = origW;
        canvas.height = bannerH;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, origW, bannerH, 0, 0, origW, bannerH);
        setCroppedBannerUrl(canvas.toDataURL("image/png"));
      } catch (err) {
        console.warn("Banner crop fallback:", err);
      }
    };
  }, []);

  useEffect(() => {
    const fetchCentralNotifs = async () => {
      try {
        const res = await API.get("/orders/notifications");
        if (res.data?.success && Array.isArray(res.data.notifications)) {
          setUnreadNotifCount(res.data.notifications.length);
        }
      } catch (_) {}
    };

    fetchCentralNotifs();

    const socket = io("http://localhost:5001", {
      transports: ["websocket", "polling"],
      query: { role: "SUPER_ADMIN" },
      auth: {
        token: localStorage.getItem("grocerease_token") || "",
        role: "SUPER_ADMIN",
      },
    });

    socket.on("connect", () => {
      socket.emit("join-tenant", { role: "SUPER_ADMIN", supermarketCode: "ALL" });
    });

    socket.on("admin:notification", () => {
      setUnreadNotifCount((prev) => prev + 1);
    });

    socket.on("new-order", () => {
      setUnreadNotifCount((prev) => prev + 1);
    });

    const timer = setInterval(fetchCentralNotifs, 15000);
    return () => {
      socket.disconnect();
      clearInterval(timer);
    };
  }, []);

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
              <span className="sa-brand-tagline">Smart Supermarket Solutions</span>
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
                  to="/super-admin/create-plan"
                  onClick={handleNavClick}
                  className={({ isActive }) => `sa-subitem ${isActive || location.pathname === "/super-admin/create-plan" ? "active-sub" : ""}`}
                >
                  <span className="sa-dot">&rsaquo;</span>
                  <span>Create Plan</span>
                </NavLink>
                <NavLink
                  to="/super-admin/manage-plans"
                  onClick={handleNavClick}
                  className={({ isActive }) => `sa-subitem ${isActive || location.pathname === "/super-admin/manage-plans" || location.pathname === "/super-admin/plans" ? "active-sub" : ""}`}
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
        {/* Top Fixed Header Bar with user exact provided banner */}
        <header className="sa-top-header">
          <div className="sa-exact-header-banner-box">
            {/* Background Storefront Panoramic Banner cropped from Master Reference */}
            <img
              src={croppedBannerUrl || "/super-admin-reference-master.jpg"}
              alt="GrocerEase Super Admin Storefront Banner"
              className="sa-exact-header-banner-img"
              onError={(e) => {
                e.currentTarget.src = "/supermarket-storefront-banner.png";
              }}
            />

            {/* Seamless Interactive Clickable Overlay Hotspots */}
            <div className="sa-banner-hotspot-container">
              {/* Hotspot 1: Notification Bell */}
              <button
                type="button"
                className="sa-hotspot-bell-btn"
                onClick={() => navigate("/super-admin/reports")}
                title={unreadNotifCount > 0 ? `${unreadNotifCount} Platform Notifications` : "Platform Notifications"}
                aria-label="Platform Notifications"
              >
                {unreadNotifCount > 0 && (
                  <span className="sa-hotspot-bell-badge">{unreadNotifCount}</span>
                )}
              </button>

              {/* Hotspot 2: Super Admin Profile Pill */}
              <div
                className="sa-hotspot-profile-pill"
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                title="Super Admin Profile Menu"
                role="button"
                tabIndex={0}
                aria-label="Super Admin Profile"
              />
            </div>

            {/* Mobile Menu Hamburger (Visible on small screens) */}
            <button
              type="button"
              className="sa-banner-mobile-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Toggle Navigation Menu"
              title="Menu"
            >
              <Menu size={18} />
            </button>

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && (
              <div className="sa-profile-dropdown sa-banner-dropdown-pos">
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
