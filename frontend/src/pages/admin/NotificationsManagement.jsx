import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  BellRing,
  ShoppingCart,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Check,
  CheckCheck,
  RefreshCw,
  ExternalLink,
  Volume2,
  VolumeX,
  CreditCard,
  QrCode,
  DollarSign,
  Package,
  Boxes,
  ArrowRight,
  Eye,
  Trash2,
  ShieldCheck,
  Phone,
  User,
  ShoppingBag,
  Sparkles,
  Printer,
  X,
  Copy,
  ChevronRight,
  Radio,
  TrendingUp,
  AlertCircle,
  Calendar,
  Layers,
  Layout,
  Table,
  Columns,
  Terminal,
} from "lucide-react";
import { io } from "socket.io-client";
import API from "../../services/api";
import BarcodeSVG from "../../components/BarcodeSVG";
import ErpPageBanner from "../../components/ErpPageBanner";
import {
  getPersistentProducts,
  updatePersistentStock,
  mergeApiWithStorage,
} from "../../utils/realtimeStorage";
import "./NotificationsManagement.css";

const NOTIF_SOUND_KEY = "grocerease_notif_sound_enabled";
const NOTIF_READ_KEY = "grocerease_notif_read_ids";
const NOTIF_DISMISSED_KEY = "grocerease_notif_dismissed_ids";

// Gentle dual-tone Web Audio synthesizer chime
function playToneChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);

    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime + 0.1);
    osc1.stop(ctx.currentTime + 0.3);
    osc2.stop(ctx.currentTime + 0.55);
  } catch (_) {}
}

// Formats timestamp exactly matching user's reference image: "11 Nov 2026, 05:48 PM"
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

export default function NotificationsManagement() {
  const navigate = useNavigate();

  // Data states
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState(getPersistentProducts);
  const [cartActivities, setCartActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  // Layout View Mode: "console" (Master-Detail Split) | "table" (Data Ledger) | "kanban" (Action Board)
  const [viewMode, setViewMode] = useState("console");
  const [selectedId, setSelectedId] = useState(null);

  // Preference & filter states
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const val = localStorage.getItem(NOTIF_SOUND_KEY);
    return val !== null ? val === "true" : true;
  });

  const [readIds, setReadIds] = useState(() => {
    try {
      const saved = localStorage.getItem(NOTIF_READ_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      const saved = localStorage.getItem(NOTIF_DISMISSED_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  const [activeTab, setActiveTab] = useState("ALL"); // ALL | PENDING | ORDERS | INVENTORY | ACTIVITY
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | unread | action_needed

  // Interaction feedback & modals
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toastMessage, setToastMessage] = useState({ type: "", text: "" });
  const [copiedId, setCopiedId] = useState("");
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  const showToast = (text, type = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage({ type: "", text: "" }), 4000);
  };

  const handleToggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    localStorage.setItem(NOTIF_SOUND_KEY, String(nextVal));
    if (nextVal) {
      playToneChime();
      showToast("Audio chime enabled", "info");
    } else {
      showToast("Audio chime muted", "info");
    }
  };

  // Sync read/dismissed to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(NOTIF_READ_KEY, JSON.stringify(readIds));
    } catch (_) {}
  }, [readIds]);

  useEffect(() => {
    try {
      localStorage.setItem(NOTIF_DISMISSED_KEY, JSON.stringify(dismissedIds));
    } catch (_) {}
  }, [dismissedIds]);

  // Load all data sources
  const fetchAllSources = async (showSpin = false) => {
    if (showSpin) setRefreshing(true);
    try {
      const [ordersRes, productsRes, cartRes] = await Promise.allSettled([
        API.get("/orders"),
        API.get("/products"),
        API.get("/orders/cart-activity"),
      ]);

      if (
        ordersRes.status === "fulfilled" &&
        ordersRes.value.data?.success &&
        Array.isArray(ordersRes.value.data.orders)
      ) {
        setOrders(ordersRes.value.data.orders);
      }

      if (
        productsRes.status === "fulfilled" &&
        productsRes.value.data?.success &&
        Array.isArray(productsRes.value.data.products)
      ) {
        const merged = mergeApiWithStorage(productsRes.value.data.products);
        setProducts(merged);
      } else {
        setProducts(getPersistentProducts());
      }

      if (
        cartRes.status === "fulfilled" &&
        cartRes.value.data?.success &&
        Array.isArray(cartRes.value.data.activities)
      ) {
        setCartActivities(cartRes.value.data.activities);
      }
    } catch (err) {
      console.warn("Notifications data load notice:", err.message);
    } finally {
      setLoading(false);
      if (showSpin) setRefreshing(false);
    }
  };

  // Socket & polling initialization
  useEffect(() => {
    fetchAllSources(false);

    const socket = io("http://localhost:5001");

    socket.on("connect", () => {
      setSocketConnected(true);
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    socket.on("new-order", (data) => {
      if (soundEnabled) playToneChime();
      showToast(`⚡ New order received: ${data.order?.orderNumber || "Just now"}!`, "order");

      if (data.order) {
        setOrders((prev) => {
          if (prev.some((o) => o._id === data.order._id)) return prev;
          return [data.order, ...prev];
        });
        setSelectedId(`order-${data.order._id || data.order.orderNumber}`);
      }
    });

    socket.on("admin:notification", (data) => {
      if (soundEnabled) playToneChime();
      showToast(`🔔 ${data.title || "New notification"}`, "info");
    });

    const pollInterval = setInterval(() => {
      fetchAllSources(false);
    }, 5000);

    const handleStorageUpdate = () => {
      fetchAllSources(false);
    };
    window.addEventListener("grocerease_storage_updated", handleStorageUpdate);

    return () => {
      socket.disconnect();
      clearInterval(pollInterval);
      window.removeEventListener("grocerease_storage_updated", handleStorageUpdate);
    };
  }, [soundEnabled]);

  // Aggregate unified notifications: ONLY Cart additions, Payment Pending, Payment Approved
  const unifiedNotifications = useMemo(() => {
    const list = [];
    const dismissedSet = new Set(dismissedIds);
    const readSet = new Set(readIds);

    // 1. Orders: ONLY "Payment Pending" and "Payment Approved"
    orders.forEach((o) => {
      const notifId = `order-${o._id || o.orderNumber}`;
      if (dismissedSet.has(notifId)) return;

      const isPending = o.paymentStatus === "Pending";
      const isApproved = o.paymentStatus === "Approved" || o.paymentStatus === "Completed";
      if (!isPending && !isApproved) return;

      const custName = o.customer?.name || "Mobile Shopper";
      const totalVal = Number(o.totalAmount || 0);
      const amount = totalVal.toFixed(2);
      const subtotalVal = Number(
        o.subtotalAmount ||
        o.items?.reduce((s, i) => s + (Number(i.originalPrice || i.price || 0) * (i.quantity || 1)), 0) ||
        totalVal
      );
      const discountVal = Math.max(0, Number(o.discountAmount || (subtotalVal - totalVal)));

      if (isPending) {
        list.push({
          id: notifId,
          type: "pending",
          sourceType: "order",
          badge: "PRE-BOOKING",
          title: "New Pre-Booking",
          actor: custName,
          subTitle: `${custName} is waiting for approval.`,
          message: `${custName} is waiting for payment approval (₹${amount} • ${o.paymentMethod || "UPI"}).`,
          timestamp: o.createdAt || new Date().toISOString(),
          order: o,
          read: readSet.has(notifId),
          paymentMethod: o.paymentMethod || "UPI",
          paymentStatus: "Pending",
          subtotalAmount: subtotalVal,
          discountAmount: discountVal,
          totalAmount: totalVal,
          customerName: custName,
          customerPhone: o.customer?.phone || "Not provided",
          items: o.items || [],
          actionNeeded: true,
        });
      } else if (isApproved) {
        list.push({
          id: notifId,
          type: "approved",
          sourceType: "order",
          badge: "APPROVED",
          title: "Pre-Booking Approved",
          actor: custName,
          subTitle: `${custName} was approved by Super Admin.`,
          message: `Payment of ₹${amount} for order #${o.orderNumber || o._id} was approved.`,
          timestamp: o.approvedAt || o.completedAt || o.createdAt || new Date().toISOString(),
          order: o,
          read: readSet.has(notifId),
          paymentMethod: o.paymentMethod || "UPI",
          paymentStatus: o.paymentStatus,
          subtotalAmount: subtotalVal,
          discountAmount: discountVal,
          totalAmount: totalVal,
          customerName: custName,
          customerPhone: o.customer?.phone || "Not provided",
          items: o.items || [],
          actionNeeded: false,
        });
      }
    });

    // 2. Customer Add to Cart: ONLY "Cart Item Added"
    cartActivities.forEach((act) => {
      const notifId = `cart-act-${act._id || Math.random()}`;
      if (dismissedSet.has(notifId)) return;

      const custName = act.customerName || "Mobile Shopper";
      const prodName = act.productName || "Product";

      list.push({
        id: notifId,
        type: "cart",
        sourceType: "activity",
        badge: "ADDED TO CART",
        title: "Cart Item Added",
        actor: custName,
        subTitle: `${custName} added ${prodName} to cart.`,
        message: `${custName} added "${prodName}" (Qty: ${act.quantity || 1}) to cart • Cart Value: ₹${Number(act.price || 0).toFixed(2)}`,
        timestamp: act.createdAt || new Date().toISOString(),
        read: readSet.has(notifId),
        actionNeeded: false,
        totalAmount: Number(act.price || 0),
        customerName: custName,
        productName: prodName,
        quantity: act.quantity || 1,
      });
    });

    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return list;
  }, [orders, cartActivities, dismissedIds, readIds]);

  // Filter & Search
  const filteredNotifications = useMemo(() => {
    let result = unifiedNotifications.filter((item) => {
      if (activeTab === "PENDING" && item.type !== "pending") return false;
      if (activeTab === "APPROVED" && item.type !== "approved") return false;
      if (activeTab === "CART" && item.type !== "cart") return false;

      if (statusFilter === "unread" && item.read) return false;
      if (statusFilter === "action_needed" && !item.actionNeeded) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchSub = item.subTitle?.toLowerCase().includes(q);
        const matchCust = item.customerName?.toLowerCase().includes(q);
        const matchOrderNum = item.order?.orderNumber?.toLowerCase().includes(q);
        const matchItem = item.items?.some((i) => i.name?.toLowerCase().includes(q));

        if (!matchTitle && !matchSub && !matchCust && !matchOrderNum && !matchItem) {
          return false;
        }
      }

      return true;
    });

    return result;
  }, [unifiedNotifications, activeTab, statusFilter, searchQuery]);

  // Keep selectedId valid
  useEffect(() => {
    if (filteredNotifications.length > 0) {
      if (!selectedId || !filteredNotifications.some((n) => n.id === selectedId)) {
        // Prioritize pending action item if available
        const pendingItem = filteredNotifications.find((n) => n.actionNeeded);
        setSelectedId(pendingItem ? pendingItem.id : filteredNotifications[0].id);
      }
    } else {
      setSelectedId(null);
    }
  }, [filteredNotifications, selectedId]);

  // Currently inspected notification in Master-Detail
  const activeInspectedItem = useMemo(() => {
    return filteredNotifications.find((n) => n.id === selectedId) || filteredNotifications[0] || null;
  }, [filteredNotifications, selectedId]);

  // Stats: strictly 3 real-time categories (Cart additions, Pending approvals, Approved payments)
  const stats = useMemo(() => {
    const unread = unifiedNotifications.filter((n) => !n.read).length;
    const pendingOrders = unifiedNotifications.filter((n) => n.type === "pending").length;
    const cartCount = unifiedNotifications.filter((n) => n.type === "cart").length;
    const approvedCount = unifiedNotifications.filter((n) => n.type === "approved").length;

    return {
      total: unifiedNotifications.length,
      unread,
      pendingOrders,
      cartCount,
      approvedCount,
    };
  }, [unifiedNotifications]);

  // Action handlers
  const handleToggleRead = (id) => {
    setReadIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleDismiss = (id) => {
    setDismissedIds((prev) => [...prev, id]);
    showToast("Notification archived", "info");
  };

  const handleMarkAllRead = () => {
    const allIds = unifiedNotifications.map((n) => n.id);
    setReadIds((prev) => Array.from(new Set([...prev, ...allIds])));
    showToast("✓ All notifications marked as read", "success");
  };

  const handleApproveOrder = async (orderId, orderNumber) => {
    try {
      setActionLoadingId(orderId);
      const res = await API.post(`/orders/${orderId}/approve`);
      if (res.data?.success) {
        showToast(`✓ Order #${orderNumber} approved! Exit clearance authorized.`, "success");
        window.dispatchEvent(new Event("grocerease_storage_updated"));
        await fetchAllSources(false);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to approve payment", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCompleteOrder = async (orderId, orderNumber) => {
    try {
      setActionLoadingId(orderId);
      const res = await API.post(`/orders/${orderId}/complete`);
      if (res.data?.success) {
        showToast(`✓ Order #${orderNumber} marked Completed & stock updated!`, "success");
        window.dispatchEvent(new Event("grocerease_storage_updated"));
        await fetchAllSources(false);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to complete transaction", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmCash = async (orderId, orderNumber) => {
    try {
      setActionLoadingId(orderId);
      const res = await API.post(`/orders/${orderId}/confirm-cash`);
      if (res.data?.success) {
        showToast(`✓ Cash received for #${orderNumber}! Exit barcode unlocked.`, "success");
        window.dispatchEvent(new Event("grocerease_storage_updated"));
        await fetchAllSources(false);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Cash confirmation failed", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleQuickRestock = (product, addCount = 10) => {
    const newStock = Number(product.stock || 0) + addCount;
    updatePersistentStock(product._id || product.barcode, newStock);
    showToast(`✓ Restocked +${addCount} units for "${product.name}" (Now: ${newStock})`, "success");
    fetchAllSources(false);
  };

  const handleCopy = (text) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(""), 2000);
    showToast("Copied to clipboard", "info");
  };

  return (
    <div className="notif-console-page">
      {/* Toast Alert Pill */}
      {toastMessage.text && (
        <div className={`notif-toast-pill ${toastMessage.type}`}>
          <Sparkles size={16} />
          <span>{toastMessage.text}</span>
          <button
            type="button"
            className="toast-close"
            onClick={() => setToastMessage({ type: "", text: "" })}
          >
            ×
          </button>
        </div>
      )}

      {/* 1. Header Banner */}
      <ErpPageBanner
        title="Live Operations Command & Notification Console"
        subtitle="Real-time supermarket customer checkout stream, cashier verifications & shelf inventory alerts"
        badges={[
          "Dual-Pane Interactive Console",
          "WebSocket Real-time Broadcast",
          "Instant Clearance Approvals",
          "One-Click Shelf Restock",
        ]}
        icon={<Terminal size={24} color="#FFFFFF" strokeWidth={2.4} />}
      />

      {/* 2. Top Interactive Mission Control Bar */}
      <div className="mission-control-ribbon">
        <div className="mission-left">
          {/* Live Status Pill */}
          <div className={`mc-status-pill ${socketConnected ? "live" : "sync"}`}>
            <span className="mc-pulse-dot" />
            <span>{socketConnected ? "Socket Stream Live" : "Polling POS Engine"}</span>
          </div>

          {/* Quick Metrics Badges: strictly 3 real-time categories */}
          <div className="mc-stats-cluster">
            <span
              className={`mc-stat-chip ${activeTab === "PENDING" ? "active" : ""}`}
              onClick={() => setActiveTab((p) => (p === "PENDING" ? "ALL" : "PENDING"))}
            >
              <span className="dot amber" />
              <strong>{stats.pendingOrders}</strong> Payment Pending
            </span>

            <span
              className={`mc-stat-chip ${activeTab === "CART" ? "active" : ""}`}
              onClick={() => setActiveTab((p) => (p === "CART" ? "ALL" : "CART"))}
            >
              <span className="dot blue" />
              <strong>{stats.cartCount}</strong> Added to Cart
            </span>

            <span
              className={`mc-stat-chip ${activeTab === "APPROVED" ? "active" : ""}`}
              onClick={() => setActiveTab((p) => (p === "APPROVED" ? "ALL" : "APPROVED"))}
            >
              <span className="dot green" />
              <strong>{stats.approvedCount}</strong> Payment Approved
            </span>
          </div>
        </div>

        <div className="mission-right">
          {/* Layout Mode Switcher */}
          <div className="view-mode-toggle-group">
            <button
              type="button"
              className={`view-mode-btn ${viewMode === "console" ? "active" : ""}`}
              onClick={() => setViewMode("console")}
              title="Split Inspector Console (Master-Detail)"
            >
              <Layout size={14} />
              <span>Inspector</span>
            </button>

            <button
              type="button"
              className={`view-mode-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
              title="Data Ledger Table (High-Density)"
            >
              <Table size={14} />
              <span>Data Ledger</span>
            </button>

            <button
              type="button"
              className={`view-mode-btn ${viewMode === "kanban" ? "active" : ""}`}
              onClick={() => setViewMode("kanban")}
              title="Pipeline Board View"
            >
              <Columns size={14} />
              <span>Pipeline</span>
            </button>
          </div>

          {/* Audio Chime Button */}
          <button
            type="button"
            className={`mc-icon-toggle ${soundEnabled ? "on" : "off"}`}
            onClick={handleToggleSound}
            title={soundEnabled ? "Audio chimes active" : "Audio muted"}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            className="mc-icon-btn"
            onClick={() => fetchAllSources(true)}
            disabled={refreshing}
            title="Refresh stream"
          >
            <RefreshCw size={14} className={refreshing ? "spinning" : ""} />
          </button>

          {/* Mark All Read */}
          <button
            type="button"
            className="mc-pill-btn secondary"
            onClick={handleMarkAllRead}
            disabled={stats.unread === 0}
          >
            <CheckCheck size={14} />
            <span>Mark All Read</span>
          </button>
        </div>
      </div>

      {/* 3. Filter & Search Strip: strictly the 3 real-time categories */}
      <div className="console-filter-strip">
        <div className="filter-chips-container">
          <button
            type="button"
            className={`console-filter-chip ${activeTab === "ALL" ? "active" : ""}`}
            onClick={() => setActiveTab("ALL")}
          >
            <span>All Notifications</span>
            <span className="chip-counter">{stats.total}</span>
          </button>

          <button
            type="button"
            className={`console-filter-chip ${activeTab === "CART" ? "active" : ""}`}
            onClick={() => setActiveTab("CART")}
          >
            <span>Added to Cart</span>
            <span className="chip-counter info">{stats.cartCount}</span>
          </button>

          <button
            type="button"
            className={`console-filter-chip ${activeTab === "PENDING" ? "active" : ""}`}
            onClick={() => setActiveTab("PENDING")}
          >
            <span>Payment Pending</span>
            <span className="chip-counter alert">{stats.pendingOrders}</span>
          </button>

          <button
            type="button"
            className={`console-filter-chip ${activeTab === "APPROVED" ? "active" : ""}`}
            onClick={() => setActiveTab("APPROVED")}
          >
            <span>Payment Approved</span>
            <span className="chip-counter success">{stats.approvedCount}</span>
          </button>
        </div>

        <div className="search-and-status-group">
          <div className="console-search-input-wrap">
            <Search size={14} className="console-search-icon" />
            <input
              type="text"
              placeholder="Search order ID, shopper, phone, product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="console-search-clear"
                onClick={() => setSearchQuery("")}
              >
                ×
              </button>
            )}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="console-status-select"
            aria-label="Filter status"
          >
            <option value="all">All Events</option>
            <option value="unread">Unread Only</option>
            <option value="action_needed">Action Required</option>
          </select>
        </div>
      </div>

      {/* =========================================================================
          VIEW MODE 1: MASTER-DETAIL SPLIT INSPECTOR CONSOLE (DEFAULT UNIQUE DESIGN)
          ========================================================================= */}
      {viewMode === "console" && (
        <div className="console-split-layout">
          {/* Left Column: Interactive Event Stream Timeline */}
          <div className="console-stream-column">
            <div className="stream-header-bar">
              <span className="stream-title">Real-Time Event Stream</span>
              <span className="stream-count-tag">{filteredNotifications.length} Events</span>
            </div>

            <div className="stream-scroll-list">
              {loading ? (
                <div className="stream-loading-placeholder">
                  <RefreshCw size={24} className="spinning" color="#1455D9" />
                  <p>Streaming supermarket events...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="stream-empty-placeholder">
                  <Bell size={32} color="#94A3B8" />
                  <h4>No Notifications</h4>
                  <p>Events and alerts will appear in this live stream.</p>
                </div>
              ) : (
                filteredNotifications.map((item) => {
                  const isSelected = selectedId === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`notif-card-row ${item.read ? "read" : "unread"} ${
                        isSelected ? "selected" : ""
                      }`}
                      onClick={() => setSelectedId(item.id)}
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

                        <p className="notif-card-desc">{item.subTitle || item.message}</p>

                        <div className="notif-time-row">
                          <Clock size={12} color="#94A3B8" />
                          <span>{formatNotifTime(item.timestamp)}</span>
                        </div>
                      </div>

                      {/* Active Chevron Indicator */}
                      <ChevronRight
                        size={16}
                        className={`stream-chevron ${isSelected ? "active" : ""}`}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Live Action & Receipt Inspector Console */}
          <div className="console-inspector-column">
            {activeInspectedItem ? (
              <div className="inspector-panel">
                {/* Top Inspection Ribbon */}
                <div className="inspector-top-bar">
                  <div className="inspector-status-badge">
                    <span className="pulse-green-dot" />
                    <span>POS Terminal Clearance Station</span>
                  </div>

                  <div className="inspector-quick-tools">
                    <button
                      type="button"
                      className="inspector-tool-btn"
                      onClick={() => handleToggleRead(activeInspectedItem.id)}
                      title={activeInspectedItem.read ? "Mark Unread" : "Mark Read"}
                    >
                      <Check
                        size={14}
                        className={activeInspectedItem.read ? "icon-checked" : ""}
                      />
                      <span>{activeInspectedItem.read ? "Read" : "Mark Read"}</span>
                    </button>

                    <button
                      type="button"
                      className="inspector-tool-btn dismiss"
                      onClick={() => handleDismiss(activeInspectedItem.id)}
                      title="Dismiss from console"
                    >
                      <X size={14} />
                      <span>Dismiss</span>
                    </button>
                  </div>
                </div>

                {/* =========================================================
                    CASE A: ORDER INSPECTION TERMINAL (DIGITAL RECEIPT & ACTION)
                    ========================================================= */}
                {activeInspectedItem.sourceType === "order" && (
                  <div className="inspector-order-workspace">
                    {/* Header Info Banner */}
                    <div className="order-inspector-header">
                      <div className="order-id-headline">
                        <h2>{activeInspectedItem.order?.orderNumber || activeInspectedItem.order?._id}</h2>
                        <button
                          type="button"
                          className="inspector-copy-btn"
                          onClick={() =>
                            handleCopy(
                              activeInspectedItem.order?.orderNumber ||
                                activeInspectedItem.order?._id
                            )
                          }
                        >
                          <Copy size={13} />
                          <span>{copiedId ? "Copied" : "Copy Order ID"}</span>
                        </button>
                      </div>

                      <div className="order-meta-pills-row">
                        <span
                          className={`order-status-badge ${activeInspectedItem.paymentStatus.toLowerCase()}`}
                        >
                          Status: {activeInspectedItem.paymentStatus}
                        </span>
                        <span className="order-payment-badge">
                          Payment: <strong>{activeInspectedItem.paymentMethod}</strong>
                        </span>
                        <span className="order-time-badge">
                          Placed:{" "}
                          {activeInspectedItem.timestamp
                            ? new Date(activeInspectedItem.timestamp).toLocaleString("en-IN")
                            : "Recently"}
                        </span>
                      </div>
                    </div>

                    {/* Customer Profile Strip */}
                    <div className="customer-dossier-card">
                      <div className="customer-avatar-badge">
                        <User size={18} color="#1455D9" />
                      </div>
                      <div className="customer-fields">
                        <div className="field">
                          <span className="label">Customer Name</span>
                          <strong>{activeInspectedItem.customerName}</strong>
                        </div>
                        <div className="field">
                          <span className="label">Phone Contact</span>
                          <strong>{activeInspectedItem.customerPhone}</strong>
                        </div>
                        <div className="field">
                          <span className="label">Clearance Turnstile</span>
                          <strong style={{ color: "#059669" }}>Self-Checkout Exit #01</strong>
                        </div>
                      </div>
                    </div>

                    {/* Exit Turnstile Clearance Barcode */}
                    {activeInspectedItem.order?.exitBarcode && (
                      <div className="exit-turnstile-barcode-terminal">
                        <div className="barcode-terminal-head">
                          <QrCode size={16} color="#1455D9" />
                          <span>Turnstile Exit Barcode (Automated Gate Clearance)</span>
                        </div>
                        <div className="barcode-render-box">
                          <BarcodeSVG
                            value={activeInspectedItem.order.exitBarcode}
                            width={1.6}
                            height={44}
                            displayValue={true}
                          />
                        </div>
                      </div>
                    )}

                    {/* Itemized Line Items Table */}
                    <div className="inspector-items-ledger">
                      <div className="ledger-head">
                        <span>Purchased Items ({activeInspectedItem.items.length})</span>
                        <span>Itemized Total</span>
                      </div>
                      <div className="ledger-body">
                        {activeInspectedItem.items.map((prod, idx) => {
                          const qty = Number(prod.quantity || 1);
                          const effectivePrice = Number(prod.price || 0);
                          const originalMrp = Number(prod.originalPrice || prod.costPrice || effectivePrice);
                          const hasDiscount = originalMrp > effectivePrice;
                          const itemTotal = Number(prod.subtotal || effectivePrice * qty);

                          return (
                            <div
                              className="ledger-row"
                              key={`${prod.product || prod.name}-${idx}`}
                            >
                              <div className="item-meta-cell">
                                <span className="item-num">{idx + 1}.</span>
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span className="item-title">{prod.name}</span>
                                    <span className="item-qty-tag">× {qty}</span>
                                  </div>
                                  {hasDiscount && (
                                    <span style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>
                                      MRP: <span style={{ textDecoration: "line-through" }}>₹{originalMrp.toFixed(2)}</span>
                                      {" "}• Rate: <strong style={{ color: "#0F172A" }}>₹{effectivePrice.toFixed(2)}</strong>
                                      {" "}<span style={{ color: "#059669", fontWeight: 700 }}>(Save ₹{(originalMrp - effectivePrice).toFixed(2)})</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className="item-price-cell">
                                ₹{itemTotal.toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Calculations Foot */}
                      <div className="ledger-calculations">
                        {(() => {
                          const calculatedItemsSubtotal = activeInspectedItem.items?.reduce(
                            (sum, item) => sum + Number(item.subtotal || item.price * (item.quantity || 1) || 0),
                            0
                          ) || 0;
                          const total = Number(activeInspectedItem.totalAmount || calculatedItemsSubtotal || 0);
                          const grossSub = Number(
                            activeInspectedItem.subtotalAmount ||
                            activeInspectedItem.order?.subtotalAmount ||
                            calculatedItemsSubtotal ||
                            total
                          );
                          // Ensure displaySubtotal matches genuine purchased items sum
                          const displaySubtotal = calculatedItemsSubtotal > 0 ? calculatedItemsSubtotal : grossSub;
                          const discount = Math.max(
                            0,
                            Number(activeInspectedItem.discountAmount || activeInspectedItem.order?.discountAmount || (displaySubtotal - total))
                          );
                          const taxable = total / 1.05;
                          const gst = total - taxable;
                          const cgst = (gst / 2).toFixed(2);
                          const sgst = (gst / 2).toFixed(2);

                          return (
                            <>
                              <div className="calc-row">
                                <span>Subtotal</span>
                                <strong style={{ color: "#0F172A" }}>₹{displaySubtotal.toFixed(2)}</strong>
                              </div>
                              {discount > 0 && (
                                <div className="calc-row green" style={{ fontWeight: 700, color: "#059669" }}>
                                  <span>Supermarket Promotional Savings</span>
                                  <span>-₹{discount.toFixed(2)}</span>
                                </div>
                              )}
                              <div className="calc-row" style={{ fontSize: "11px", color: "#64748B" }}>
                                <span>Taxes (CGST 2.5% + SGST 2.5% Included)</span>
                                <span>₹{cgst} + ₹{sgst}</span>
                              </div>
                              <div className="calc-row total">
                                <span>Grand Total Clearance Amount</span>
                                <span className="grand-total-amount">
                                  ₹{total.toFixed(2)}
                                </span>
                              </div>
                              {discount > 0 && (
                                <div className="order-savings-banner">
                                  ★ YOU SAVED ₹{discount.toFixed(2)} ON THIS ORDER ★
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Big Tactile Action Command Center Bar */}
                    <div className="inspector-action-command-bar">
                      {activeInspectedItem.paymentStatus === "Pending" && (
                        <>
                          {activeInspectedItem.paymentMethod === "Cash" ? (
                            <button
                              type="button"
                              className="terminal-command-btn success"
                              onClick={() =>
                                handleConfirmCash(
                                  activeInspectedItem.order._id,
                                  activeInspectedItem.order.orderNumber ||
                                    activeInspectedItem.order._id
                                )
                              }
                              disabled={actionLoadingId === activeInspectedItem.order._id}
                            >
                              <CheckCircle2 size={18} />
                              <span>
                                {actionLoadingId === activeInspectedItem.order._id
                                  ? "Confirming..."
                                  : "Confirm Cash Received & Unlock Exit"}
                              </span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="terminal-command-btn primary"
                              onClick={() =>
                                handleApproveOrder(
                                  activeInspectedItem.order._id,
                                  activeInspectedItem.order.orderNumber ||
                                    activeInspectedItem.order._id
                                )
                              }
                              disabled={actionLoadingId === activeInspectedItem.order._id}
                            >
                              <ShieldCheck size={18} />
                              <span>
                                {actionLoadingId === activeInspectedItem.order._id
                                  ? "Authorizing..."
                                  : "Approve Payment & Authorize Clearance"}
                              </span>
                            </button>
                          )}
                        </>
                      )}

                      {activeInspectedItem.paymentStatus === "Approved" && (
                        <button
                          type="button"
                          className="terminal-command-btn success"
                          onClick={() =>
                            handleCompleteOrder(
                              activeInspectedItem.order._id,
                              activeInspectedItem.order.orderNumber ||
                                activeInspectedItem.order._id
                            )
                          }
                          disabled={actionLoadingId === activeInspectedItem.order._id}
                        >
                          <CheckCircle2 size={18} />
                          <span>
                            {actionLoadingId === activeInspectedItem.order._id
                              ? "Completing..."
                              : "Mark Completed & Gate Verified"}
                          </span>
                        </button>
                      )}

                      <button
                        type="button"
                        className="terminal-command-btn outline"
                        onClick={() => window.print()}
                      >
                        <Printer size={15} />
                        <span>Print Receipt</span>
                      </button>

                      <Link
                        to="/admin/orders"
                        className="terminal-command-btn ghost"
                      >
                        <span>Open in Orders Portal</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                )}

                {/* =========================================================
                    CASE B: LOW STOCK INVENTORY INSPECTOR
                    ========================================================= */}
                {activeInspectedItem.sourceType === "inventory" && (
                  <div className="inspector-inventory-workspace">
                    <div className="inventory-inspector-header">
                      <div className="warning-badge-large">
                        <AlertTriangle size={20} color="#DC2626" />
                        <span>Critical Shelf Restock Required</span>
                      </div>
                      <h2>{activeInspectedItem.product?.name}</h2>
                      <p className="product-category-text">
                        Category: <strong>{activeInspectedItem.product?.category || "Groceries"}</strong> • Barcode: <code>{activeInspectedItem.product?.barcode}</code>
                      </p>
                    </div>

                    <div className="stock-level-radar-card">
                      <div className="radar-metric">
                        <span className="radar-label">Shelf Count Remaining</span>
                        <span className="radar-val critical">{activeInspectedItem.stock} Units</span>
                      </div>
                      <div className="radar-metric">
                        <span className="radar-label">Threshold Warning Point</span>
                        <span className="radar-val">{activeInspectedItem.threshold} Units</span>
                      </div>
                      <div className="radar-metric">
                        <span className="radar-label">Restock Recommended</span>
                        <span className="radar-val restock">+20 Units</span>
                      </div>
                    </div>

                    <div className="quick-restock-action-panel">
                      <h4>Instant Restock Operations:</h4>
                      <div className="restock-stepper-buttons">
                        <button
                          type="button"
                          className="restock-step-btn"
                          onClick={() => handleQuickRestock(activeInspectedItem.product, 10)}
                        >
                          <Boxes size={14} />
                          <span>+10 Units</span>
                        </button>

                        <button
                          type="button"
                          className="restock-step-btn"
                          onClick={() => handleQuickRestock(activeInspectedItem.product, 25)}
                        >
                          <Boxes size={14} />
                          <span>+25 Units</span>
                        </button>

                        <button
                          type="button"
                          className="restock-step-btn"
                          onClick={() => handleQuickRestock(activeInspectedItem.product, 50)}
                        >
                          <Boxes size={14} />
                          <span>+50 Units</span>
                        </button>

                        <Link
                          to="/admin/inventory"
                          className="restock-step-btn link"
                        >
                          <span>Full Inventory Manager</span>
                          <ExternalLink size={13} />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {/* =========================================================
                    CASE C: LIVE SHOPPER TELEMETRY
                    ========================================================= */}
                {activeInspectedItem.sourceType === "activity" && (
                  <div className="inspector-activity-workspace">
                    <div className="activity-inspector-header">
                      <div className="shopper-live-badge">
                        <ShoppingBag size={18} color="#7C3AED" />
                        <span>Live Shopper Cart Telemetry</span>
                      </div>
                      <h2>{activeInspectedItem.title}</h2>
                      <p>{activeInspectedItem.message}</p>
                    </div>

                    <div className="activity-telemetry-box">
                      <div className="telemetry-stat">
                        <span>Event Time</span>
                        <strong>
                          {new Date(activeInspectedItem.timestamp).toLocaleTimeString()}
                        </strong>
                      </div>
                      <div className="telemetry-stat">
                        <span>Current Basket Value</span>
                        <strong style={{ color: "#1455D9" }}>
                          ₹{activeInspectedItem.totalAmount.toFixed(2)}
                        </strong>
                      </div>
                    </div>

                    <div style={{ marginTop: "20px" }}>
                      <Link
                        to="/admin/orders"
                        className="terminal-command-btn primary"
                        style={{ display: "inline-flex" }}
                      >
                        <ShoppingCart size={15} />
                        <span>View Live Mobile Shopper Orders</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="inspector-empty-state">
                <Terminal size={36} color="#94A3B8" />
                <h3>No Notification Selected</h3>
                <p>Click on any event in the left stream to inspect and authorize.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 2: HIGH-DENSITY ENTERPRISE DATA LEDGER TABLE
          ========================================================================= */}
      {viewMode === "table" && (
        <div className="console-ledger-table-wrapper">
          <table className="console-ledger-table">
            <thead>
              <tr>
                <th style={{ width: "35px" }}></th>
                <th>Type</th>
                <th>Identifier / Subject</th>
                <th>Entity / Customer</th>
                <th>Purchased Items / Stock</th>
                <th>Amount (₹)</th>
                <th>Status</th>
                <th>Timestamp</th>
                <th style={{ textAlign: "right" }}>Quick Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotifications.map((item) => (
                <tr
                  key={item.id}
                  className={`ledger-data-row ${item.read ? "read" : "unread"}`}
                >
                  <td>
                    {!item.read && <span className="ledger-unread-dot" />}
                  </td>
                  <td>
                    <span className={`ledger-type-chip ${item.type}`}>
                      {item.type === "pending" && <User size={12} />}
                      {item.type === "approved" && <CheckCircle2 size={12} />}
                      {item.type === "cart" && <ShoppingCart size={12} />}
                      <span>{item.badge}</span>
                    </span>
                  </td>
                  <td>
                    <strong>{item.title}</strong>
                  </td>
                  <td>
                    <span>{item.customerName || "Mobile Shopper"}</span>
                  </td>
                  <td>
                    <span className="ledger-items-text">
                      {item.items && item.items.length > 0
                        ? item.items.map((i) => `${i.name} (${i.quantity})`).join(", ")
                        : item.subTitle || item.message}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: "#1455D9" }}>
                      {item.totalAmount > 0 ? `₹${item.totalAmount.toFixed(2)}` : "—"}
                    </strong>
                  </td>
                  <td>
                    <span className={`notif-card-badge ${item.type}`}>
                      {item.badge}
                    </span>
                  </td>
                  <td>
                    <small>
                      {formatNotifTime(item.timestamp)}
                    </small>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div className="ledger-actions-cell">
                      {item.type === "pending" && item.order && (
                        <button
                          type="button"
                          className="table-mini-action-btn primary"
                          onClick={() =>
                            handleApproveOrder(
                              item.order._id,
                              item.order.orderNumber || item.order._id
                            )
                          }
                        >
                          Approve
                        </button>
                      )}
                      <button
                        type="button"
                        className="table-mini-action-btn ghost"
                        onClick={() => {
                          setSelectedId(item.id);
                          setViewMode("console");
                        }}
                      >
                        Inspect
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 3: KANBAN ACTION PIPELINE BOARD
          ========================================================================= */}
      {viewMode === "kanban" && (
        <div className="console-kanban-board">
          {/* Column 1: Payment Pending */}
          <div className="kanban-column urgent">
            <div className="kanban-column-header">
              <span className="column-title">🚨 Payment Pending</span>
              <span className="column-count">
                {filteredNotifications.filter((n) => n.type === "pending").length}
              </span>
            </div>
            <div className="kanban-column-cards">
              {filteredNotifications
                .filter((n) => n.type === "pending")
                .map((n) => (
                  <div key={n.id} className="kanban-card urgent">
                    <div className="kanban-card-top">
                      <span className="kanban-tag amber">PRE-BOOKING</span>
                      <small>{formatNotifTime(n.timestamp)}</small>
                    </div>
                    <h4>{n.title}</h4>
                    <p>{n.subTitle || n.message}</p>
                    {n.totalAmount > 0 && (
                      <span className="kanban-val">Total: ₹{n.totalAmount.toFixed(2)}</span>
                    )}
                    <div className="kanban-card-actions">
                      {n.order && (
                        <button
                          type="button"
                          className="kanban-action-btn"
                          onClick={() =>
                            handleApproveOrder(n.order._id, n.order.orderNumber || n.order._id)
                          }
                        >
                          Approve Payment
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Column 2: Added to Cart */}
          <div className="kanban-column live">
            <div className="kanban-column-header">
              <span className="column-title">🛒 Added to Cart</span>
              <span className="column-count">
                {filteredNotifications.filter((n) => n.type === "cart").length}
              </span>
            </div>
            <div className="kanban-column-cards">
              {filteredNotifications
                .filter((n) => n.type === "cart")
                .map((n) => (
                  <div key={n.id} className="kanban-card">
                    <div className="kanban-card-top">
                      <span className="kanban-tag blue">ADDED TO CART</span>
                      <small>{formatNotifTime(n.timestamp)}</small>
                    </div>
                    <h4>{n.title}</h4>
                    <p>{n.subTitle || n.message}</p>
                    {n.totalAmount > 0 && (
                      <span className="kanban-val">Item Price: ₹{n.totalAmount.toFixed(2)}</span>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* Column 3: Payment Approved */}
          <div className="kanban-column cleared">
            <div className="kanban-column-header">
              <span className="column-title">✅ Payment Approved</span>
              <span className="column-count">
                {filteredNotifications.filter((n) => n.type === "approved").length}
              </span>
            </div>
            <div className="kanban-column-cards">
              {filteredNotifications
                .filter((n) => n.type === "approved")
                .map((n) => (
                  <div key={n.id} className="kanban-card cleared">
                    <div className="kanban-card-top">
                      <span className="kanban-tag green">APPROVED</span>
                      <small>{formatNotifTime(n.timestamp)}</small>
                    </div>
                    <h4>{n.title}</h4>
                    <p>{n.subTitle || n.message}</p>
                    {n.totalAmount > 0 && (
                      <span className="kanban-val">Approved: ₹{n.totalAmount.toFixed(2)}</span>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
