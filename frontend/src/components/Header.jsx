import React, { useState, useEffect } from "react";
import { Bell, Search, Menu, CheckCircle2, ShieldCheck } from "lucide-react";
import API from "../services/api";

export default function Header({ onMenuClick }) {
  const [backendOnline, setBackendOnline] = useState(true);

  useEffect(() => {
    API.get("/products")
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false));
  }, []);

  return (
    <header className="admin-header-bar">
      <div className="header-left">
        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={onMenuClick}
          aria-label="Toggle navigation"
        >
          <Menu size={22} />
        </button>

        <div className="header-search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search products, orders, categories..."
            aria-label="Global search"
          />
        </div>
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

        {/* Notifications */}
        <button
          type="button"
          className="header-icon-btn"
          aria-label="Notifications"
          onClick={() => alert("All inventory systems running smoothly.")}
        >
          <Bell size={20} />
          <span className="notification-ping" />
        </button>

        {/* User Profile (matching Eleanor Pena from mockup) */}
        <div className="user-profile-widget">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
            alt="Eleanor Pena"
            className="user-avatar"
          />
          <div className="user-meta">
            <span className="user-name">Eleanor Pena</span>
            <span className="user-email">eleanor45@mail.com</span>
          </div>
        </div>
      </div>
    </header>
  );
}
