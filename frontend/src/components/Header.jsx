import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Bell,
  Search,
  Menu,
  ChevronDown,
  ShoppingCart,
  Store,
  Shield,
  ExternalLink,
  AlertTriangle,
  ShoppingBag,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { io } from "socket.io-client";
import API from "../services/api";
import { getPersistentProducts } from "../utils/realtimeStorage";

export default function Header({ onMenuClick }) {
  const navigate = useNavigate();
  const [backendOnline, setBackendOnline] = useState(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Live Real-Time Socket.IO & Inventory Notifications
  const [notifications, setNotifications] = useState([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    const socket = io("http://localhost:5001");

    socket.on("connect", () => {
      setSocketConnected(true);
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    socket.on("new-order", (data) => {
      setNotifications((prev) => {
        if (prev.some((item) => item.order?._id === data.order?._id)) {
          return prev;
        }
        return [{ ...data, read: false }, ...prev];
      });
    });

    socket.on("admin:notification", (data) => {
      setNotifications((prev) => {
        if (data.id && prev.some((item) => item.id === data.id)) {
          return prev;
        }
        return [{ ...data, read: false }, ...prev];
      });
    });

    return () => socket.disconnect();
  }, []);

  const unreadCount = notifications.filter((item) => !item.read).length;

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

  // Load active inventory low-stock alerts
  useEffect(() => {
    const loadInventoryAlerts = async () => {
      try {
        const res = await API.get("/products");
        const list =
          res.data?.success && Array.isArray(res.data.products)
            ? res.data.products
            : getPersistentProducts();

        const lowStock = list.filter(
          (p) => Number(p.stock) <= Number(p.lowStockThreshold || 5)
        );

        const alerts = lowStock.map((p) => ({
          id: `low-${p._id || p.barcode}`,
          title: `Low Stock: ${p.name}`,
          message: `Only ${p.stock} units remaining (Threshold: ${
            p.lowStockThreshold || 5
          }). Click to review inventory.`,
          type: "warning",
          link: "/admin/inventory",
          time: "Active alert",
          read: false,
        }));

        setNotifications((prev) => {
          const socketOrders = prev.filter((n) => !n.id?.startsWith("low-"));
          const existingIds = new Set(socketOrders.map((n) => n.id));
          const freshAlerts = alerts.filter((a) => !existingIds.has(a.id));
          return [...socketOrders, ...freshAlerts];
        });
      } catch (_) {
        const list = getPersistentProducts();
        const lowStock = list.filter(
          (p) => Number(p.stock) <= Number(p.lowStockThreshold || 5)
        );
        const alerts = lowStock.map((p) => ({
          id: `low-${p._id || p.barcode}`,
          title: `Low Stock: ${p.name}`,
          message: `Only ${p.stock} units remaining (Threshold: ${
            p.lowStockThreshold || 5
          }).`,
          type: "warning",
          link: "/admin/inventory",
          time: "Active alert",
          read: false,
        }));
        setNotifications((prev) => {
          const socketOrders = prev.filter((n) => !n.id?.startsWith("low-"));
          return [...socketOrders, ...alerts];
        });
      }
    };

    loadInventoryAlerts();
    const invInterval = setInterval(loadInventoryAlerts, 15000);
    window.addEventListener("grocerease_storage_updated", loadInventoryAlerts);

    return () => {
      clearInterval(invInterval);
      window.removeEventListener("grocerease_storage_updated", loadInventoryAlerts);
    };
  }, []);

  // Dismiss dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

        {/* Real-time Order Notifications */}
        <div className="notification-wrapper" ref={notifRef}>
          <button
            type="button"
            className="header-icon-btn"
            aria-label="Notifications"
            aria-expanded={notificationOpen}
            onClick={() => {
              setNotificationOpen((prev) => !prev);
              setNotifications((prev) =>
                prev.map((item) => ({ ...item, read: true }))
              );
            }}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="notification-badge-count">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {notificationOpen && (
            <div className="notification-panel">
              <div className="notification-panel-header">
                <div>
                  <strong>Order Notifications</strong>
                  <p>New customer purchases</p>
                </div>
                <span>{notifications.length} Orders</span>
              </div>

              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div className="notification-empty">
                    <Bell size={25} />
                    <strong>No new orders</strong>
                    <p>Customer orders will appear here.</p>
                  </div>
                ) : (
                  notifications.map((item, idx) => {
                    const order = item.order || item;

                    return (
                      <div className="notification-order-item" key={order._id || idx}>
                        <div className="notification-order-top">
                          <strong>New Customer Order</strong>
                          <span>{order.paymentStatus || "Pending"}</span>
                        </div>

                        <p><strong>Order:</strong> {order.orderNumber || order._id}</p>
                        <p><strong>Customer:</strong> {order.customer?.name || "Guest Shopper"}</p>
                        <p><strong>Phone:</strong> {order.customer?.phone || "Not provided"}</p>

                        <div className="notification-products">
                          {order.items?.map((product, index) => (
                            <div key={`${product.product || product.name || index}-${index}`}>
                              {product.name} × {product.quantity}
                              <span>
                                ₹{Number(product.subtotal || (product.price * product.quantity) || 0).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>

                        <p><strong>Payment:</strong> {order.paymentMethod || "UPI"}</p>
                        <p>
                          <strong>Discount:</strong>{" "}
                          ₹{Number(order.discountAmount || 0).toFixed(2)}
                        </p>

                        <div className="notification-total">
                          Total: ₹{Number(order.totalAmount || 0).toFixed(2)}
                        </div>

                        <small>
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleString()
                            : "Recently placed"}
                        </small>

                        <Link
                          to="/admin/orders"
                          className="notification-view-order"
                          onClick={() => setNotificationOpen(false)}
                        >
                          View & Approve Order →
                        </Link>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

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
