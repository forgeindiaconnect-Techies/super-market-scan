import React, { useState, useEffect, useRef, useMemo } from "react";
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
  Check,
  Clock,
  User,
  CheckCircle2,
  ArrowRight,
  Package,
  Boxes,
  X,
  Sparkles,
  Users,
  Barcode,
} from "lucide-react";
import { io } from "socket.io-client";
import API from "../services/api";

const NOTIF_READ_KEY = "grocerease_notif_read_ids";

// Formats timestamp exactly matching user's image: "11 Nov 2026, 05:48 PM"
const formatNotifTime = (timestamp) => {
  if (!timestamp) return "Just now";
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return "Just now";

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = String(hours).padStart(2, "0");

  return `${day} ${month} ${year}, ${hoursStr}:${minutes} ${ampm}`;
};

export default function Header({ onMenuClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [backendOnline, setBackendOnline] = useState(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [catalogOrders, setCatalogOrders] = useState([]);
  const [catalogCustomers, setCatalogCustomers] = useState([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);

  const notifDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Preload catalog data when search input is focused or user types
  const loadSearchCatalog = async () => {
    try {
      const [prodRes, ordRes] = await Promise.allSettled([
        API.get("/products"),
        API.get("/orders"),
      ]);

      if (prodRes.status === "fulfilled" && prodRes.value.data?.success && Array.isArray(prodRes.value.data.products)) {
        setCatalogProducts(prodRes.value.data.products);
      }
      if (ordRes.status === "fulfilled" && ordRes.value.data?.success && Array.isArray(ordRes.value.data.orders)) {
        const ords = ordRes.value.data.orders;
        setCatalogOrders(ords);

        // Derive unique customers from orders
        const customerMap = new Map();
        ords.forEach((o) => {
          if (o.customer && (o.customer.name || o.customer.phone)) {
            const key = o.customer.phone || o.customer.name;
            if (!customerMap.has(key)) {
              customerMap.set(key, {
                name: o.customer.name || "Customer",
                phone: o.customer.phone || "",
                email: o.customer.email || "",
                ordersCount: 1,
                lastOrder: o.orderNumber,
              });
            } else {
              customerMap.get(key).ordersCount += 1;
            }
          }
        });
        setCatalogCustomers(Array.from(customerMap.values()));
      }
      setCatalogLoaded(true);
    } catch (_) {}
  };

  // Filtered Results for Search Dropdown
  const cleanQuery = searchQuery.toLowerCase().trim();

  const matchingProducts = useMemo(() => {
    if (!cleanQuery) return [];
    return catalogProducts
      .filter((p) =>
        p.name?.toLowerCase().includes(cleanQuery) ||
        p.brand?.toLowerCase().includes(cleanQuery) ||
        p.category?.toLowerCase().includes(cleanQuery) ||
        p.barcode?.toLowerCase().includes(cleanQuery)
      )
      .slice(0, 4);
  }, [catalogProducts, cleanQuery]);

  const matchingOrders = useMemo(() => {
    if (!cleanQuery) return [];
    return catalogOrders
      .filter((o) =>
        o.orderNumber?.toLowerCase().includes(cleanQuery) ||
        o.customer?.name?.toLowerCase().includes(cleanQuery) ||
        o.customer?.phone?.toLowerCase().includes(cleanQuery) ||
        o.paymentStatus?.toLowerCase().includes(cleanQuery) ||
        o.paymentMethod?.toLowerCase().includes(cleanQuery)
      )
      .slice(0, 4);
  }, [catalogOrders, cleanQuery]);

  const matchingCustomers = useMemo(() => {
    if (!cleanQuery) return [];
    return catalogCustomers
      .filter((c) =>
        c.name?.toLowerCase().includes(cleanQuery) ||
        c.phone?.toLowerCase().includes(cleanQuery) ||
        c.email?.toLowerCase().includes(cleanQuery)
      )
      .slice(0, 3);
  }, [catalogCustomers, cleanQuery]);

  const totalResultsCount = matchingProducts.length + matchingOrders.length + matchingCustomers.length;

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    const trimmed = searchQuery.trim();
    setSearchDropdownOpen(false);

    // If query looks like an order (e.g. starts with ORD, or orders matched but no products matched)
    if (
      trimmed.toLowerCase().startsWith("ord") ||
      (matchingOrders.length > 0 && matchingProducts.length === 0)
    ) {
      navigate(`/admin/orders?search=${encodeURIComponent(trimmed)}`);
    } else if (matchingCustomers.length > 0 && matchingProducts.length === 0 && matchingOrders.length === 0) {
      navigate(`/admin/customers?search=${encodeURIComponent(trimmed)}`);
    } else {
      // Default: Search in Products
      navigate(`/admin/products?search=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleSelectProduct = (product) => {
    setSearchDropdownOpen(false);
    navigate(`/admin/products?search=${encodeURIComponent(product.name)}`);
  };

  const handleSelectOrder = (order) => {
    setSearchDropdownOpen(false);
    navigate(`/admin/orders?search=${encodeURIComponent(order.orderNumber)}`);
  };

  const handleSelectCustomer = (customer) => {
    setSearchDropdownOpen(false);
    navigate(`/admin/customers?search=${encodeURIComponent(customer.name)}`);
  };

  // Live Real-Time Notifications: ONLY Cart additions, Payment Pending, Payment Approved
  const [notifications, setNotifications] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);

  const isNotifPage = location.pathname.startsWith("/admin/notifications");

  // Load ONLY real-time customer cart, pending payment, and approved payment notifications
  const loadRealNotifications = async () => {
    try {
      const [ordersRes, cartRes] = await Promise.allSettled([
        API.get("/orders"),
        API.get("/orders/cart-activity"),
      ]);

      let readSet = new Set();
      try {
        readSet = new Set(JSON.parse(localStorage.getItem(NOTIF_READ_KEY) || "[]"));
      } catch (_) {}

      const items = [];

      // 1. Orders: ONLY "Payment Pending" and "Payment Approved"
      if (
        ordersRes.status === "fulfilled" &&
        ordersRes.value.data?.success &&
        Array.isArray(ordersRes.value.data.orders)
      ) {
        ordersRes.value.data.orders.forEach((o) => {
          const custName = o.customer?.name || "Mobile Shopper";
          const amount = Number(o.totalAmount || 0).toFixed(2);
          const method = o.paymentMethod || "UPI";

          if (o.paymentStatus === "Pending") {
            const notifId = `pending-${o._id || o.orderNumber}`;
            items.push({
              id: notifId,
              type: "pending",
              badge: "PRE-BOOKING",
              title: "New Pre-Booking",
              actor: custName,
              message: `${custName} is waiting for approval.`,
              timestamp: o.createdAt || new Date().toISOString(),
              read: readSet.has(notifId),
              order: o,
            });
          } else if (o.paymentStatus === "Approved" || o.paymentStatus === "Completed") {
            const notifId = `approved-${o._id || o.orderNumber}`;
            items.push({
              id: notifId,
              type: "approved",
              badge: "APPROVED",
              title: "Pre-Booking Approved",
              actor: custName,
              message: `${custName} was approved by Super Admin.`,
              timestamp: o.approvedAt || o.completedAt || o.createdAt || new Date().toISOString(),
              read: readSet.has(notifId),
              order: o,
            });
          }
        });
      }

      // 2. Customer Add to Cart: ONLY "Cart Item Added"
      if (
        cartRes.status === "fulfilled" &&
        cartRes.value.data?.success &&
        Array.isArray(cartRes.value.data.activities)
      ) {
        cartRes.value.data.activities.forEach((act) => {
          const custName = act.customerName || "Mobile Shopper";
          const prodName = act.productName || "Product";
          const notifId = `cart-${act._id || Math.random()}`;

          items.push({
            id: notifId,
            type: "cart",
            badge: "ADDED TO CART",
            title: "Cart Item Added",
            actor: custName,
            message: `${custName} added ${prodName} (Qty: ${act.quantity || 1}) to cart.`,
            timestamp: act.createdAt || new Date().toISOString(),
            read: readSet.has(notifId),
          });
        });
      }

      // Sort newest first
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setNotifications(items);
    } catch (err) {
      console.warn("Failed to load notifications:", err.message);
    }
  };

  useEffect(() => {
    loadRealNotifications();

    const socket = io("http://localhost:5001");

    socket.on("connect", () => {
      setSocketConnected(true);
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    // Real-Time Socket Event when Customer Adds to Cart, Places Order, or Payment is Approved
    socket.on("admin:notification", (data) => {
      if (!data) return;

      setNotifications((prev) => {
        const filtered = prev.filter((n) => n.id !== data.id);
        const newNotif = {
          id: data.id || `notif-${Date.now()}`,
          type: data.type || "pending",
          badge:
            data.badge ||
            (data.type === "approved"
              ? "APPROVED"
              : data.type === "cart"
              ? "ADDED TO CART"
              : "PRE-BOOKING"),
          title:
            data.title ||
            (data.type === "approved"
              ? "Pre-Booking Approved"
              : data.type === "cart"
              ? "Cart Item Added"
              : "New Pre-Booking"),
          actor: data.actor || data.customerName || "Shopper",
          message: data.message,
          timestamp: data.timestamp || new Date().toISOString(),
          read: false,
          order: data.order,
        };
        return [newNotif, ...filtered];
      });
    });

    socket.on("new-order", (data) => {
      if (!data || !data.order) return;
      const order = data.order;
      const custName = order.customer?.name || "Shopper";

      setNotifications((prev) => {
        const notifId = `pending-${order._id || order.orderNumber}`;
        const filtered = prev.filter((n) => n.id !== notifId);
        const newNotif = {
          id: notifId,
          type: "pending",
          badge: "PRE-BOOKING",
          title: "New Pre-Booking",
          actor: custName,
          message: `${custName} is waiting for approval.`,
          timestamp: order.createdAt || new Date().toISOString(),
          read: false,
          order,
        };
        return [newNotif, ...filtered];
      });
    });

    const interval = setInterval(loadRealNotifications, 8000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, []);

  const unreadCount = notifications.filter((item) => !item.read).length;

  // Mark all notifications as read
  const handleMarkAllRead = () => {
    try {
      const allIds = notifications.map((n) => n.id);
      localStorage.setItem(NOTIF_READ_KEY, JSON.stringify(allIds));
    } catch (_) {}
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Click on a notification: mark as read and navigate
  const handleNotificationClick = (item) => {
    try {
      const readSet = new Set(JSON.parse(localStorage.getItem(NOTIF_READ_KEY) || "[]"));
      readSet.add(item.id);
      localStorage.setItem(NOTIF_READ_KEY, JSON.stringify(Array.from(readSet)));
    } catch (_) {}

    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    setNotifDropdownOpen(false);

    if (item.type === "pending") {
      navigate("/admin/orders");
    } else if (item.type === "approved") {
      navigate("/admin/orders");
    } else if (item.type === "cart") {
      navigate("/admin/notifications");
    }
  };

  // Health check for backend
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

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        notifDropdownRef.current &&
        !notifDropdownRef.current.contains(e.target)
      ) {
        setNotifDropdownOpen(false);
      }
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(e.target)
      ) {
        setProfileDropdownOpen(false);
      }
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target)
      ) {
        setSearchDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut Ctrl+K to focus search and load catalog
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const searchInput = document.getElementById("admin-global-search");
        if (searchInput) {
          searchInput.focus();
          loadSearchCatalog();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="admin-header-bar">
      {/* Compact Global Search Box */}
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

        {/* Interactive Global Search with Live Dropdown */}
        <div ref={searchContainerRef} className="header-search-container">
          <form onSubmit={handleSearchSubmit} className="header-search-box">
            <Search size={15} className="search-icon" />
            <input
              id="admin-global-search"
              type="text"
              placeholder="Search products, orders, customers..."
              value={searchQuery}
              onFocus={() => {
                if (!catalogLoaded) loadSearchCatalog();
                if (searchQuery.trim()) setSearchDropdownOpen(true);
              }}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim()) {
                  if (!catalogLoaded) loadSearchCatalog();
                  setSearchDropdownOpen(true);
                } else {
                  setSearchDropdownOpen(false);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setSearchDropdownOpen(false);
                }
              }}
              aria-label="Global search"
              autoComplete="off"
            />
            {searchQuery ? (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => {
                  setSearchQuery("");
                  setSearchDropdownOpen(false);
                }}
                title="Clear search"
              >
                <X size={13} />
              </button>
            ) : (
              <div className="kbd-shortcut-pill">Ctrl + K</div>
            )}
          </form>

          {/* Interactive Live Global Search Results Dropdown */}
          {searchDropdownOpen && searchQuery.trim() && (
            <div className="header-search-dropdown">
              <div className="search-dropdown-header">
                <span className="search-dropdown-title">
                  Search Results for "{searchQuery}"
                </span>
                <span className="search-count-badge">
                  {totalResultsCount} found
                </span>
              </div>

              <div className="search-dropdown-body">
                {/* 1. Products Section */}
                {matchingProducts.length > 0 && (
                  <div className="search-section">
                    <div className="search-section-label">
                      <Package size={13} color="#2563EB" />
                      <span>Products ({matchingProducts.length})</span>
                    </div>
                    {matchingProducts.map((p) => (
                      <div
                        key={p._id || p.barcode}
                        className="search-result-row product"
                        onClick={() => handleSelectProduct(p)}
                      >
                        <div className="search-thumb">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} />
                          ) : (
                            <span>🏷️</span>
                          )}
                        </div>
                        <div className="search-info">
                          <strong className="search-name">{p.name}</strong>
                          <span className="search-meta">
                            {p.category} &bull; ₹{Number(p.price || 0).toFixed(2)} &bull; {p.stock} units
                          </span>
                        </div>
                        {p.barcode && (
                          <span className="search-barcode-pill">
                            {p.barcode}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. Orders Section */}
                {matchingOrders.length > 0 && (
                  <div className="search-section">
                    <div className="search-section-label">
                      <ShoppingCart size={13} color="#D97706" />
                      <span>Orders ({matchingOrders.length})</span>
                    </div>
                    {matchingOrders.map((o) => (
                      <div
                        key={o._id || o.orderNumber}
                        className="search-result-row order"
                        onClick={() => handleSelectOrder(o)}
                      >
                        <div className="search-order-icon">
                          📦
                        </div>
                        <div className="search-info">
                          <strong className="search-name">{o.orderNumber}</strong>
                          <span className="search-meta">
                            {o.customer?.name || "Mobile Shopper"} &bull; ₹{Number(o.totalAmount || 0).toFixed(2)} &bull; {o.paymentMethod}
                          </span>
                        </div>
                        <span className={`search-status-tag ${String(o.paymentStatus).toLowerCase()}`}>
                          {o.paymentStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. Customers Section */}
                {matchingCustomers.length > 0 && (
                  <div className="search-section">
                    <div className="search-section-label">
                      <Users size={13} color="#059669" />
                      <span>Customers ({matchingCustomers.length})</span>
                    </div>
                    {matchingCustomers.map((c, idx) => (
                      <div
                        key={c.phone || c.name || idx}
                        className="search-result-row customer"
                        onClick={() => handleSelectCustomer(c)}
                      >
                        <div className="search-avatar-init">
                          {c.name ? c.name[0].toUpperCase() : "C"}
                        </div>
                        <div className="search-info">
                          <strong className="search-name">{c.name}</strong>
                          <span className="search-meta">
                            {c.phone || "No phone"} {c.email ? `• ${c.email}` : ""}
                          </span>
                        </div>
                        <span className="search-badge-pill">
                          {c.ordersCount || 1} orders
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {totalResultsCount === 0 && (
                  <div className="search-empty-state">
                    <Search size={22} color="#94A3B8" />
                    <p>No products, orders, or customers found matching "<strong>{searchQuery}</strong>".</p>
                    <div className="search-quick-links">
                      <button
                        type="button"
                        onClick={() => {
                          setSearchDropdownOpen(false);
                          navigate("/admin/products");
                        }}
                      >
                        All Products &rarr;
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchDropdownOpen(false);
                          navigate("/admin/orders");
                        }}
                      >
                        All Orders &rarr;
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchDropdownOpen(false);
                          navigate("/admin/barcodes");
                        }}
                      >
                        All Barcodes &rarr;
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Dropdown Footer */}
              <div className="search-dropdown-footer">
                <span>Press <strong>Enter</strong> to search in {matchingOrders.length > 0 && matchingProducts.length === 0 ? "Orders" : "Products"} &bull; <strong>ESC</strong> to dismiss</span>
                <button
                  type="button"
                  className="search-view-all-btn"
                  onClick={handleSearchSubmit}
                >
                  View All &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Header Right Controls */}
      <div className="header-right">
        {/* System Online Status Pill */}
        <div
          className={`backend-status-pill ${backendOnline ? "online" : "offline"}`}
          title={backendOnline ? "Backend Database & POS Connected" : "Connecting..."}
        >
          <span className="status-dot" />
          <span className="status-label">
            {backendOnline ? "System Online" : "Connecting..."}
          </span>
        </div>

        {/* Real-time Order & Cart Notifications Dropdown */}
        <div ref={notifDropdownRef} style={{ position: "relative" }}>
          <button
            type="button"
            className={`header-icon-btn ${notifDropdownOpen ? "active" : ""}`}
            onClick={() => setNotifDropdownOpen((prev) => !prev)}
            aria-label="Notifications"
            title={
              unreadCount > 0
                ? `${unreadCount} unread customer notifications`
                : "Customer Notifications"
            }
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="notification-badge-count">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* Exact Notification Modal Panel Matching Reference Image */}
          {notifDropdownOpen && (
            <div className="notif-modal-panel">
              <div className="notif-modal-header">
                <h3 className="notif-modal-title">Notifications</h3>
                <button
                  type="button"
                  className="notif-mark-read-btn"
                  onClick={handleMarkAllRead}
                  title="Mark all notifications as read"
                >
                  <Check size={14} />
                  <span>Mark All Read</span>
                </button>
              </div>

              <div className="notif-modal-list">
                {notifications.length === 0 ? (
                  <div className="notif-modal-empty">
                    <Bell size={28} color="#94A3B8" />
                    <p>No new customer cart or payment notifications.</p>
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`notif-card-row ${item.read ? "read" : "unread"}`}
                      onClick={() => handleNotificationClick(item)}
                    >
                      {/* Left Circular Avatar Circle matching reference image */}
                      <div className={`notif-avatar-circle ${item.type}`}>
                        {item.type === "approved" ? (
                          <CheckCircle2 size={19} color="#15803D" strokeWidth={2.4} />
                        ) : item.type === "cart" ? (
                          <ShoppingCart size={19} color="#1D4ED8" strokeWidth={2.4} />
                        ) : (
                          <User size={19} color="#D97706" strokeWidth={2.4} />
                        )}
                      </div>

                      {/* Content block */}
                      <div className="notif-content-block">
                        <div className="notif-title-row">
                          <h4 className="notif-card-title">{item.title}</h4>
                          <span className={`notif-card-badge ${item.type}`}>
                            {item.badge}
                          </span>
                        </div>

                        <p className="notif-card-desc">{item.message}</p>

                        <div className="notif-time-row">
                          <Clock size={12} color="#94A3B8" />
                          <span>{formatNotifTime(item.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="notif-modal-footer">
                <Link
                  to="/admin/notifications"
                  onClick={() => setNotifDropdownOpen(false)}
                  className="notif-modal-footer-link"
                >
                  Open Full Notification Center & Actions →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Compact Admin Profile: Pooja V, Super Admin */}
        <div
          ref={profileDropdownRef}
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
