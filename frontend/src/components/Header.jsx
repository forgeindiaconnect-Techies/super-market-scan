import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bell, Search, Menu, ChevronDown, ShoppingCart } from "lucide-react";
import API from "../services/api";

export default function Header({ onMenuClick }) {
  const [backendOnline, setBackendOnline] = useState(true);

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

  return (
    <header className="admin-header-wrapper">
      <div className="admin-header-bar">
        <div className="header-brand-wrap">
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={onMenuClick}
            aria-label="Toggle navigation"
          >
            <Menu size={22} />
          </button>

          <Link to="/admin" className="header-brand-link">
            <div className="header-brand-icon">
              <ShoppingCart size={22} color="#1D4ED8" strokeWidth={2.5} />
            </div>
            <div className="header-brand-text">
              <h1 className="header-brand-title">GrocerEase</h1>
              <span className="header-brand-sub">Smart Supermarket</span>
            </div>
          </Link>
        </div>

        <div className="header-search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search products, brands, categories..."
            aria-label="Global search"
          />
          <div className="kbd-shortcut-pill">⌘ K</div>
        </div>

        <div className="header-right">
          {/* Backend Status indicator */}
          <div
            className={`backend-status-pill ${
              backendOnline ? "online" : "offline"
            }`}
            title={backendOnline ? "Backend API Online" : "Backend Disconnected"}
          >
            <span className="status-dot" />
            <span className="status-label">
              {backendOnline ? "System Online" : "Connecting..."}
            </span>
          </div>

          {/* Notifications with badge '3' matching reference */}
          <button
            type="button"
            className="header-icon-btn"
            aria-label="Notifications"
            onClick={() => alert("3 new inventory alerts.")}
          >
            <Bell size={19} />
            <span className="notification-badge-count">3</span>
          </button>

          {/* User Profile matching reference: Eleanor Pena, Admin */}
          <div className="user-profile-widget">
            <div className="avatar-wrapper">
              <img
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"
                alt="Eleanor Pena"
                className="user-avatar"
              />
              <span className="avatar-online-dot" />
            </div>
            <div className="user-meta">
              <span className="user-name">Eleanor Pena</span>
              <span className="user-role">Admin</span>
            </div>
            <ChevronDown size={14} className="user-chevron" />
          </div>
        </div>
      </div>
    </header>
  );
}
