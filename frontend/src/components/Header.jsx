import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bell, Search, Menu, ChevronDown, ShoppingCart, Store, Shield, ExternalLink } from "lucide-react";
import API from "../services/api";

export default function Header({ onMenuClick }) {
  const [backendOnline, setBackendOnline] = useState(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const checkHealth = () => {
      API.get("/products")
        .then(() => setBackendOnline(true))
        .catch(() => setBackendOnline(false));
    };

    checkHealth();
    const interval = setInterval(checkHealth, 8000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const searchInput = document.getElementById("admin-global-search");
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="admin-header-bar">
      {/* Compact Global Search Box matching Image 2 */}
      <div className="header-left">
        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={onMenuClick}
          aria-label="Toggle navigation"
        >
          <Menu size={20} />
        </button>

        <div className="mobile-brand-wrap">
          <ShoppingCart size={18} color="#1455D9" />
          <span className="mobile-brand-title">GrocerEase</span>
        </div>

        <div className="header-search-box">
          <Search size={15} className="search-icon" />
          <input
            id="admin-global-search"
            type="text"
            placeholder="Search products, orders, customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Global search"
          />
          <div className="kbd-shortcut-pill">Ctrl + K</div>
        </div>
      </div>

      {/* Header Right Controls: System Online, Notification Bell with 1, Pooja V Super Admin */}
      <div className="header-right">
        {/* System Online Status Pill */}
        <div
          className={`backend-status-pill ${
            backendOnline ? "online" : "offline"
          }`}
          title={backendOnline ? "Backend Database & POS Connected" : "Connecting..."}
        >
          <span className="status-dot" />
          <span className="status-label">
            {backendOnline ? "System Online" : "Connecting..."}
          </span>
        </div>

        {/* Notification Bell matching badge count '1' */}
        <button
          type="button"
          className="header-icon-btn"
          aria-label="Notifications"
          onClick={() => alert("1 Inventory Alert: Low stock threshold reached for Apples.")}
        >
          <Bell size={16} />
          <span className="notification-badge-count">1</span>
        </button>

        {/* Compact Admin Profile: Pooja V, Super Admin */}
        <div
          className="user-profile-widget"
          onClick={() => setProfileDropdownOpen((prev) => !prev)}
        >
          <div className="avatar-wrapper">
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80"
              alt="Pooja V"
              className="user-avatar"
            />
            <span className="avatar-online-dot" />
          </div>
          <div className="user-meta">
            <span className="user-name">Pooja V</span>
            <span className="user-role">Super Admin</span>
          </div>
          <ChevronDown size={13} className="user-chevron" />

          {/* Profile Dropdown */}
          {profileDropdownOpen && (
            <div
              className="profile-dropdown-menu"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="profile-dropdown-header">
                <strong>Pooja V</strong>
                <span>pooja@grocerease.store</span>
              </div>
              <hr className="profile-dropdown-divider" />
              <Link
                to="/admin/settings"
                className="profile-dropdown-item"
                onClick={() => setProfileDropdownOpen(false)}
              >
                <Store size={14} />
                <span>Store Branch #001</span>
              </Link>
              <Link
                to="/admin/settings"
                className="profile-dropdown-item"
                onClick={() => setProfileDropdownOpen(false)}
              >
                <Shield size={14} />
                <span>Security & Gate Access</span>
              </Link>
              <Link
                to="/customer"
                className="profile-dropdown-item"
                onClick={() => setProfileDropdownOpen(false)}
              >
                <ExternalLink size={14} />
                <span>Customer Self-Checkout</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
