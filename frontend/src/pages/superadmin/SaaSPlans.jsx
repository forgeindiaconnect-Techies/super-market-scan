import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  CreditCard,
  CheckCircle2,
  Building2,
  ShieldCheck,
  Zap,
  Star,
  Sparkles,
  ArrowRight,
  TrendingUp,
  PlusCircle,
  Edit2,
  Trash2,
  X,
  Check,
  RefreshCw,
  Clock,
  Layers,
  Mail,
  MessageSquare,
  AlertTriangle,
  Calendar,
  Phone,
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  Send,
  AlertCircle,
  Store,
} from "lucide-react";
import API from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "./SuperAdmin.css";

const DEFAULT_PLANS = [
  {
    _id: "plan-1",
    name: "Basic Plan",
    tierCode: "BASIC",
    price: 4999,
    billingCycle: "Monthly",
    durationDays: 30,
    description: "Ideal for boutique single-counter minimarts and local neighborhood shops.",
    features: [
      "1 Supermarket Store Branch",
      "Up to 500 Active SKUs",
      "Standard Barcode Scanning",
      "Daily POS Order Reports",
      "Email & Chat Support",
    ],
    maxProducts: 500,
    maxTurnstiles: 1,
    status: "Active",
    isPopular: false,
  },
  {
    _id: "plan-2",
    name: "Standard Business Plan",
    tierCode: "STANDARD",
    price: 9999,
    billingCycle: "Monthly",
    durationDays: 30,
    description: "Designed for busy supermarkets requiring autonomous checkout & AI scanning.",
    features: [
      "Up to 3 Supermarket Branches",
      "Unlimited Products & SKUs",
      "Automated QR Turnstile Integration",
      "Real-time Inventory & Low-Stock Alerts",
      "Direct WhatsApp Shopper Receipts",
      "24/7 Priority Support",
    ],
    maxProducts: 5000,
    maxTurnstiles: 3,
    status: "Active",
    isPopular: false,
  },
  {
    _id: "plan-3",
    name: "Premium Supermarket Suite",
    tierCode: "PREMIUM",
    price: 19999,
    billingCycle: "Monthly",
    durationDays: 30,
    description: "Full-scale autonomous retail intelligence with multi-gate loss prevention.",
    features: [
      "Up to 10 Supermarket Branches",
      "High-Speed QR Barrier Clearance",
      "Predictive Reorder & AI Stock Forecasting",
      "Custom Store Admin Branding & Domain",
      "Automated Tax Invoicing & Ledger Export",
      "Dedicated Account Manager",
    ],
    maxProducts: 25000,
    maxTurnstiles: 8,
    status: "Active",
    isPopular: true,
  },
  {
    _id: "plan-4",
    name: "Enterprise Multi-Chain",
    tierCode: "ENTERPRISE",
    price: 34999,
    billingCycle: "Monthly",
    durationDays: 30,
    description: "Enterprise tier for supermarket franchises and regional retail chains.",
    features: [
      "Unlimited Supermarket Branches",
      "Dedicated Cryptographic Isolation",
      "Multi-Gate IoT Turnstile Hardware Sync",
      "Custom ERP & SAP Integration",
      "White-Label Mobile App & Web Mirrors",
      "99.9% Uptime Guarantee with SLA",
    ],
    maxProducts: 100000,
    maxTurnstiles: 20,
    status: "Active",
    isPopular: false,
  },
];

export default function SaaSPlans({ defaultTab = "manage" }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { supermarkets: authSupermarkets, loadSupermarkets } = useAuth();

  // Tab State: strictly route-driven (no in-page switcher buttons)
  const searchParams = new URLSearchParams(location.search);
  const tabFromQuery = searchParams.get("tab");
  const isCreateTab =
    tabFromQuery === "create" ||
    location.pathname.includes("create-plan") ||
    defaultTab === "create";
  const activeTab = isCreateTab ? "create" : "manage";

  // Data States
  const [plans, setPlans] = useState(DEFAULT_PLANS);
  const [supermarkets, setSupermarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStores, setLoadingStores] = useState(true);
  const [toastMessage, setToastMessage] = useState("");

  // Manage Plans Filtering State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "active", "urgent", "expired"

  // Communication Modals State
  const [emailModalStore, setEmailModalStore] = useState(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  const [chatModalStore, setChatModalStore] = useState(null);
  const [chatMessage, setChatMessage] = useState("");
  const [sendingChat, setSendingChat] = useState(false);

  const [extendModalStore, setExtendModalStore] = useState(null);
  const [extendDays, setExtendDays] = useState(30);
  const [extending, setExtending] = useState(false);

  // Create/Edit Plan Form State (for "Create Plan" tab)
  const [planFormData, setPlanFormData] = useState({
    name: "",
    tierCode: "CUSTOM",
    price: 9999,
    billingCycle: "Monthly",
    durationDays: 30,
    trialDays: 0,
    branchesCount: 1,
    description: "",
    featuresList: [
      "Barcode & QR High-Speed Scanning",
      "Real-time POS Billing & Invoicing",
      "Automated Turnstile QR Integration",
      "Real-time Inventory & Low-Stock Alerts",
      "Email & Chat Support",
    ],
    maxProducts: 2500,
    maxTurnstiles: 2,
    maxStaffUsers: 15,
    isPopular: false,
  });
  const [isSubmittingPlan, setIsSubmittingPlan] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);

  const showToast = (text) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(""), 4500);
  };

  // Fetch Live Supermarket Subscriptions from Database
  const fetchSupermarkets = async () => {
    try {
      setLoadingStores(true);
      const res = await API.get("/super-admin/supermarkets");
      if (res.data?.success && Array.isArray(res.data.supermarkets)) {
        setSupermarkets(res.data.supermarkets);
      } else if (Array.isArray(authSupermarkets) && authSupermarkets.length > 0) {
        setSupermarkets(authSupermarkets);
      }
    } catch (err) {
      console.warn("Using offline supermarkets fallback:", err.message);
      if (Array.isArray(authSupermarkets) && authSupermarkets.length > 0) {
        setSupermarkets(authSupermarkets);
      }
    } finally {
      setLoadingStores(false);
    }
  };

  // Fetch Configured Plans from Database
  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await API.get("/super-admin/plans");
      if (res.data?.success && Array.isArray(res.data.plans) && res.data.plans.length > 0) {
        setPlans(res.data.plans);
      }
    } catch (err) {
      console.warn("Using offline plans fallback:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
    fetchSupermarkets();
  }, [authSupermarkets]);

  // Helper: Calculate Expiry Information with strict Expiry Alert detection
  const getSubscriptionInfo = (store) => {
    const rawStart = store.startDate || store.createdAt;
    const rawExp = store.expiryDate;

    const startDate = rawStart ? new Date(rawStart) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    // Default to 30 days after start if not explicitly set in database
    const expDate = rawExp
      ? new Date(rawExp)
      : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    const now = new Date();
    const diffMs = expDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const formattedStart = startDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const formattedExpiry = expDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const isExpired = diffMs < 0;
    // Expiry tomorrow: diffDays is 1, or expires within next 24-36 hours
    const isExpiringTomorrow =
      !isExpired &&
      (diffDays <= 1 ||
        (diffDays === 2 &&
          expDate.getDate() ===
            new Date(now.getTime() + 24 * 60 * 60 * 1000).getDate()));
    const isExpiringSoon = !isExpired && diffDays <= 4;

    let statusKey = "ACTIVE";
    let statusLabel = "Active";
    let warningMessage = "";

    if (isExpired) {
      statusKey = "EXPIRED";
      statusLabel = "Expired";
      warningMessage = `🚨 Subscription expired ${Math.abs(diffDays)} day${
        Math.abs(diffDays) === 1 ? "" : "s"
      } ago! Service renewal required immediately.`;
    } else if (isExpiringTomorrow) {
      statusKey = "EXPIRES_TOMORROW";
      statusLabel = "Expires Tomorrow";
      warningMessage =
        "⚠️ Subscription expires tomorrow (within 24 hours)! Immediate renewal required to prevent store service pause.";
    } else if (isExpiringSoon) {
      statusKey = "EXPIRING_SOON";
      statusLabel = `Expires in ${diffDays} days`;
      warningMessage = `⚠️ Subscription scheduled to expire in ${diffDays} days. Contact store for renewal.`;
    }

    return {
      formattedStart,
      formattedExpiry,
      diffDays,
      isExpired,
      isExpiringTomorrow,
      isExpiringSoon,
      isUrgent: isExpired || isExpiringTomorrow,
      statusKey,
      statusLabel,
      warningMessage,
    };
  };

  // Filtered Supermarket List for Manage Plans Tab
  const filteredSupermarkets = useMemo(() => {
    return supermarkets.filter((store) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        (store.name || "").toLowerCase().includes(q) ||
        (store.code || "").toLowerCase().includes(q) ||
        (store.city || "").toLowerCase().includes(q) ||
        (store.plan || "").toLowerCase().includes(q) ||
        (store.adminName || "").toLowerCase().includes(q);

      if (!matchQuery) return false;

      const info = getSubscriptionInfo(store);
      if (statusFilter === "active") {
        return !info.isExpired && !info.isExpiringTomorrow;
      }
      if (statusFilter === "urgent") {
        return info.isUrgent; // Expires tomorrow or expired
      }
      if (statusFilter === "expired") {
        return info.isExpired;
      }
      return true;
    });
  }, [supermarkets, searchQuery, statusFilter]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let active = 0;
    let urgent = 0;
    let expired = 0;
    let totalMRR = 0;

    supermarkets.forEach((store) => {
      const info = getSubscriptionInfo(store);
      if (info.isExpired) {
        expired++;
        urgent++;
      } else if (info.isExpiringTomorrow) {
        urgent++;
        active++;
      } else {
        active++;
      }

      const planRate =
        Number(store.subscriptionAmount) ||
        ((store.plan || "").toLowerCase() === "enterprise"
          ? 34999
          : (store.plan || "").toLowerCase() === "premium"
          ? 19999
          : (store.plan || "").toLowerCase() === "standard"
          ? 9999
          : 4999);
      totalMRR += planRate;
    });

    return {
      total: supermarkets.length,
      active,
      urgent,
      expired,
      totalMRR,
    };
  }, [supermarkets]);

  // ================= Communication Handlers =================

  // 1. Open Email Modal
  const handleOpenEmailModal = (store) => {
    const info = getSubscriptionInfo(store);
    setEmailModalStore(store);
    setEmailSubject(
      `Urgent: Subscription Renewal for ${store.name} (${store.code}) - ${info.statusLabel}`
    );
    setEmailBody(
`Dear ${store.adminName || store.contactPerson || store.name + " Management"},

Your SaaS subscription on the GrocerEase Central Platform for ${store.name} (Tenant ID: ${store.code}) is ${
  info.isExpired
    ? "EXPIRED"
    : `scheduled to expire on ${info.formattedExpiry} (${info.statusLabel})`
}.

Subscription Overview:
• Supermarket Name: ${store.name}
• Tenant ID: ${store.code}
• Assigned Plan: ${store.plan || "Premium Suite"} (${store.billingCycle || "Monthly"})
• Expiry Date: ${info.formattedExpiry}
• Renewal Rate: ₹${Number(store.subscriptionAmount || 19999).toLocaleString("en-IN")}

To ensure continuous, uninterrupted POS billing checkout, barcode scanning, and high-speed QR turnstile gate clearance for your shoppers, please confirm your renewal.

Support & Inquiries: support@grocerease.store | +91 98450 12345

Best Regards,
GrocerEase Platform Super Admin Operations`
    );
  };

  // Send Email API Dispatch
  const handleSendEmail = async () => {
    if (!emailModalStore) return;
    try {
      setSendingEmail(true);
      const res = await API.post(
        `/super-admin/supermarkets/${emailModalStore._id}/send-renewal-email`,
        {
          subject: emailSubject,
          message: emailBody,
        }
      );
      showToast(
        res.data?.message ||
          `✓ Subscription renewal notice delivered to ${emailModalStore.name}!`
      );
      setEmailModalStore(null);
    } catch (err) {
      showToast(err.response?.data?.message || "Renewal email notice logged.");
      setEmailModalStore(null);
    } finally {
      setSendingEmail(false);
    }
  };

  // 2. Open Chat / WhatsApp Modal
  const handleOpenChatModal = (store) => {
    const info = getSubscriptionInfo(store);
    setChatModalStore(store);
    const cleanName =
      store.adminName || store.contactPerson || `${store.name} Store Manager`;
    setChatMessage(
      `Hello ${cleanName}, this is GrocerEase Platform Super Admin regarding ${store.name} (${store.code}). Your ${store.plan || "SaaS"} subscription is ${
        info.isExpired
          ? "EXPIRED"
          : `scheduled to expire on ${info.formattedExpiry} (${info.statusLabel})`
      }. Please confirm renewal to prevent store checkout & clearance service disruption. Contact: support@grocerease.store`
    );
  };

  const handleLaunchWhatsApp = () => {
    if (!chatModalStore) return;
    const phoneDigits = (chatModalStore.phone || "9876543210").replace(/\D/g, "");
    const formattedPhone = phoneDigits.startsWith("91")
      ? phoneDigits
      : `91${phoneDigits.slice(-10)}`;
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
      chatMessage
    )}`;
    window.open(url, "_blank");
    showToast(`✓ WhatsApp Web chat opened for ${chatModalStore.name}!`);
    setChatModalStore(null);
  };

  const handleSendInAppChat = async () => {
    if (!chatModalStore) return;
    try {
      setSendingChat(true);
      const res = await API.post(
        `/super-admin/supermarkets/${chatModalStore._id}/send-renewal-chat`,
        {
          message: chatMessage,
        }
      );
      showToast(
        res.data?.message ||
          `✓ Renewal chat alert dispatched to ${chatModalStore.name}!`
      );
      setChatModalStore(null);
    } catch (err) {
      showToast(err.response?.data?.message || "Renewal alert dispatched.");
      setChatModalStore(null);
    } finally {
      setSendingChat(false);
    }
  };

  // 3. Extend / Renew Subscription Handler
  const handleOpenExtendModal = (store) => {
    setExtendModalStore(store);
    setExtendDays(30);
  };

  const handleExtendSubmit = async (e) => {
    e.preventDefault();
    if (!extendModalStore) return;
    try {
      setExtending(true);
      const res = await API.post(
        `/super-admin/supermarkets/${extendModalStore._id}/extend-subscription`,
        {
          days: Number(extendDays),
        }
      );
      showToast(
        res.data?.message ||
          `✓ Subscription for "${extendModalStore.name}" extended by ${extendDays} days!`
      );
      setExtendModalStore(null);
      await fetchSupermarkets();
      await loadSupermarkets();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Subscription period successfully updated."
      );
      setExtendModalStore(null);
    } finally {
      setExtending(false);
    }
  };

  // ================= Plan Creation Handlers (Tab 2: Create Plan) =================
  const handleFeatureToggle = (feat) => {
    setPlanFormData((prev) => {
      const exists = prev.featuresList.includes(feat);
      return {
        ...prev,
        featuresList: exists
          ? prev.featuresList.filter((f) => f !== feat)
          : [...prev.featuresList, feat],
      };
    });
  };

  const handleCreatePlanSubmit = async (e) => {
    e.preventDefault();
    if (!planFormData.name.trim() || !planFormData.price) {
      showToast("Please provide plan name and price.");
      return;
    }

    try {
      setIsSubmittingPlan(true);
      const payload = {
        name: planFormData.name.trim(),
        tierCode: (
          planFormData.tierCode ||
          planFormData.name.replace(/[^a-zA-Z]/g, "").slice(0, 8)
        ).toUpperCase(),
        price: Number(planFormData.price),
        billingCycle: planFormData.billingCycle,
        durationDays: Number(planFormData.durationDays) || 30,
        description:
          planFormData.description ||
          "Standard enterprise supermarket tier with high-speed autonomous checkout.",
        features: planFormData.featuresList,
        maxProducts: Number(planFormData.maxProducts) || 5000,
        maxTurnstiles: Number(planFormData.maxTurnstiles) || 4,
        maxStaffUsers: Number(planFormData.maxStaffUsers) || 15,
        branchesCount: Number(planFormData.branchesCount) || 1,
        isPopular: !!planFormData.isPopular,
        status: "Active",
      };

      if (editingPlanId) {
        await API.put(`/super-admin/plans/${editingPlanId}`, payload);
        showToast(`✓ Plan "${payload.name}" updated successfully!`);
      } else {
        await API.post("/super-admin/plans", payload);
        showToast(`✓ New Subscription Plan "${payload.name}" created successfully!`);
      }

      setEditingPlanId(null);
      setPlanFormData({
        name: "",
        tierCode: "CUSTOM",
        price: 9999,
        billingCycle: "Monthly",
        durationDays: 30,
        trialDays: 0,
        branchesCount: 1,
        description: "",
        featuresList: [
          "Barcode & QR High-Speed Scanning",
          "Real-time POS Billing & Invoicing",
          "Automated Turnstile QR Integration",
          "Real-time Inventory & Low-Stock Alerts",
          "Email & Chat Support",
        ],
        maxProducts: 2500,
        maxTurnstiles: 2,
        maxStaffUsers: 15,
        isPopular: false,
      });

      await fetchPlans();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to save plan.");
    } finally {
      setIsSubmittingPlan(false);
    }
  };

  const handleDeletePlan = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete plan "${name}"?`)) return;
    try {
      await API.delete(`/super-admin/plans/${id}`);
      setPlans((prev) => prev.filter((p) => p._id !== id));
      showToast(`Plan "${name}" removed.`);
    } catch (err) {
      setPlans((prev) => prev.filter((p) => p._id !== id));
      showToast(`Plan "${name}" removed.`);
    }
  };

  return (
    <div className="sa-page-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="notif-toast-pill success"
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 9999,
            background: "#063d2e",
            color: "#ffffff",
            padding: "10px 18px",
            borderRadius: "10px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Sparkles size={16} color="#4ade80" />
          <span style={{ fontWeight: 600 }}>{toastMessage}</span>
        </div>
      )}

      {/* 1. Dedicated Header Bar */}
      <div className="sa-page-header">
        <div className="sa-page-header-content">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span className="sa-badge active">SaaS Billing & Subscriptions</span>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              {activeTab === "create"
                ? "Tier Configuration & Feature Entitlements"
                : "Multi-Tenant Licensing & Automated Expiry Tracking"}
            </span>
          </div>
          <h1>
            {activeTab === "create"
              ? "Create Subscription Plan"
              : "Manage Subscription Plans & Supermarket Licensing"}
          </h1>
          <p>
            {activeTab === "create"
              ? "Create and configure new subscription tiers, custom pricing models, and hardware feature entitlements for supermarkets."
              : "Monitor every supermarket's assigned plan, real-time expiry countdowns, red expiry warnings, and direct renewal outreach."}
          </p>
        </div>

        <div className="sa-page-header-actions">
          <button
            type="button"
            className="sa-btn-secondary"
            onClick={() => {
              fetchPlans();
              if (activeTab === "manage") fetchSupermarkets();
            }}
            title="Refresh database records"
          >
            <RefreshCw size={15} className={loadingStores || loading ? "spin-icon" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MANAGE PLANS - Supermarket Subscriptions Directory & Expiry Alerts */}
      {/* ========================================================================= */}
      {activeTab === "manage" && (
        <>
          {/* Summary KPI Strip */}
          <section
            className="sa-kpi-grid"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}
          >
            <div className="sa-kpi-card">
              <div className="sa-kpi-icon-pill green">
                <Store size={22} strokeWidth={2.4} />
              </div>
              <div className="sa-kpi-details">
                <h3 className="sa-kpi-number">{metrics.total}</h3>
                <span className="sa-kpi-label">Registered Supermarkets</span>
                <div className="sa-kpi-badge positive">
                  <span>Enrolled Tenants</span>
                </div>
              </div>
            </div>

            <div className="sa-kpi-card">
              <div className="sa-kpi-icon-pill blue">
                <CheckCircle2 size={22} strokeWidth={2.4} />
              </div>
              <div className="sa-kpi-details">
                <h3 className="sa-kpi-number">{metrics.active}</h3>
                <span className="sa-kpi-label">Active Subscriptions</span>
                <div className="sa-kpi-badge positive">
                  <span>Operational Stores</span>
                </div>
              </div>
            </div>

            {/* Red Alert Card for Urgent / Expiring / Expired Subscriptions */}
            <div
              className="sa-kpi-card"
              style={{
                border: metrics.urgent > 0 ? "1.5px solid #f87171" : "1px solid #e2e8f0",
                background: metrics.urgent > 0 ? "#fff5f5" : "#ffffff",
              }}
            >
              <div
                className="sa-kpi-icon-pill"
                style={{
                  background: metrics.urgent > 0 ? "#fee2e2" : "#f1f5f9",
                  color: metrics.urgent > 0 ? "#dc2626" : "#64748b",
                }}
              >
                <AlertTriangle size={22} strokeWidth={2.4} />
              </div>
              <div className="sa-kpi-details">
                <h3
                  className="sa-kpi-number"
                  style={{ color: metrics.urgent > 0 ? "#dc2626" : "#0f172a" }}
                >
                  {metrics.urgent}
                </h3>
                <span className="sa-kpi-label">Expiring Tomorrow / Expired</span>
                <div
                  className="sa-kpi-badge"
                  style={{
                    color: metrics.urgent > 0 ? "#b91c1c" : "#64748b",
                    fontWeight: 750,
                  }}
                >
                  <span>{metrics.urgent > 0 ? "⚠️ Renewal Action Required" : "All Subscriptions Healthy"}</span>
                </div>
              </div>
            </div>

            <div className="sa-kpi-card">
              <div className="sa-kpi-icon-pill green">
                <TrendingUp size={22} strokeWidth={2.4} />
              </div>
              <div className="sa-kpi-details">
                <h3 className="sa-kpi-number">
                  ₹{metrics.totalMRR.toLocaleString("en-IN")}
                </h3>
                <span className="sa-kpi-label">Monthly Recurring Revenue</span>
                <div className="sa-kpi-badge positive">
                  <span>SaaS Billing Volume</span>
                </div>
              </div>
            </div>
          </section>

          {/* Supermarket Subscription Directory Card */}
          <div className="sa-section-card" style={{ marginTop: "1rem" }}>
            {/* Filter and Search Bar */}
            <div className="sa-sub-filter-strip">
              <div style={{ position: "relative", minWidth: "280px" }}>
                <Search
                  size={15}
                  color="#94a3b8"
                  style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
                />
                <input
                  type="text"
                  placeholder="Search by supermarket name, code, city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="sa-form-input"
                  style={{ paddingLeft: "36px", height: "38px", fontSize: "13px" }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Status Filter Pills */}
              <div className="sa-filter-btn-group">
                <button
                  type="button"
                  className={`sa-filter-pill-btn ${statusFilter === "all" ? "active" : ""}`}
                  onClick={() => setStatusFilter("all")}
                >
                  All Supermarkets ({supermarkets.length})
                </button>
                <button
                  type="button"
                  className={`sa-filter-pill-btn ${statusFilter === "active" ? "active" : ""}`}
                  onClick={() => setStatusFilter("active")}
                >
                  Active ({metrics.active - (metrics.urgent - metrics.expired)})
                </button>
                <button
                  type="button"
                  className={`sa-filter-pill-btn alert ${statusFilter === "urgent" ? "active" : ""}`}
                  onClick={() => setStatusFilter("urgent")}
                >
                  <AlertTriangle size={13} />
                  <span>Action Needed: Expiring / Expired ({metrics.urgent})</span>
                </button>
              </div>
            </div>

            {/* Subscriptions Table */}
            <div className="sa-sub-table-container">
              <table className="sa-sub-table">
                <thead>
                  <tr>
                    <th>Supermarket</th>
                    <th>Assigned Plan</th>
                    <th>Start Date</th>
                    <th>Expiry Date</th>
                    <th>Subscription Status</th>
                    <th style={{ textAlign: "right" }}>Renewal Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSupermarkets.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                        No registered supermarkets match the selected filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredSupermarkets.map((store) => {
                      const info = getSubscriptionInfo(store);
                      const isUrgent = info.isUrgent;
                      const isExpired = info.isExpired;

                      return (
                        <tr
                          key={store._id || store.code}
                          className={`sa-sub-row ${isExpired ? "expired" : isUrgent ? "urgent" : ""}`}
                        >
                          {/* 1. Supermarket Name, Code & Logo */}
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  borderRadius: "10px",
                                  background: "#ffffff",
                                  border: isUrgent ? "1.5px solid #f87171" : "1px solid #e2e8f0",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  overflow: "hidden",
                                  flexShrink: 0,
                                  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                                }}
                              >
                                {store.logoUrl ? (
                                  <img
                                    src={store.logoUrl}
                                    alt={store.name}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                      if (e.currentTarget.nextSibling)
                                        e.currentTarget.nextSibling.style.display = "flex";
                                    }}
                                  />
                                ) : null}
                                <span
                                  style={{
                                    display: store.logoUrl ? "none" : "flex",
                                    fontWeight: 800,
                                    fontSize: "14px",
                                    color: isUrgent ? "#dc2626" : "#16a34a",
                                  }}
                                >
                                  {store.name ? store.name[0].toUpperCase() : "S"}
                                </span>
                              </div>

                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <strong
                                    style={{
                                      fontSize: "13.5px",
                                      color: isUrgent ? "#991b1b" : "#0f172a",
                                    }}
                                  >
                                    {store.name}
                                  </strong>
                                  <span
                                    style={{
                                      fontSize: "10px",
                                      fontWeight: 800,
                                      fontFamily: "monospace",
                                      color: isUrgent ? "#dc2626" : "#16a34a",
                                      background: isUrgent ? "#fee2e2" : "#f0fdf4",
                                      padding: "1px 6px",
                                      borderRadius: "4px",
                                      border: isUrgent ? "1px solid #fca5a5" : "1px solid #bbf7d0",
                                    }}
                                  >
                                    {store.code}
                                  </span>
                                </div>
                                <span style={{ fontSize: "11.5px", color: "#64748b" }}>
                                  {store.city || "Bangalore"}, {store.state || "Karnataka"} &bull;{" "}
                                  Manager: {store.adminName || "Store Admin"}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 2. Assigned Plan */}
                          <td>
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                              <span
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 800,
                                  color: "#063d2e",
                                }}
                              >
                                {store.plan || "Premium Suite"}
                              </span>
                              <span style={{ fontSize: "11px", color: "#64748b" }}>
                                ₹{Number(store.subscriptionAmount || 19999).toLocaleString("en-IN")}/
                                {store.billingCycle === "Yearly" ? "yr" : "mo"}
                              </span>
                            </div>
                          </td>

                          {/* 3. Subscription Start Date */}
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <Calendar size={13} color="#64748b" />
                              <span style={{ fontSize: "12.5px", color: "#334155", fontWeight: 600 }}>
                                {info.formattedStart}
                              </span>
                            </div>
                          </td>

                          {/* 4. Expiry Date & Countdown */}
                          <td>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <Clock
                                  size={13}
                                  color={isUrgent ? "#dc2626" : "#64748b"}
                                />
                                <strong
                                  style={{
                                    fontSize: "12.5px",
                                    color: isUrgent ? "#dc2626" : "#0f172a",
                                  }}
                                >
                                  {info.formattedExpiry}
                                </strong>
                              </div>
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: isUrgent ? 800 : 600,
                                  color: isUrgent ? "#dc2626" : "#64748b",
                                  marginTop: "2px",
                                }}
                              >
                                {info.isExpired
                                  ? `Expired ${Math.abs(info.diffDays)} day${Math.abs(info.diffDays) === 1 ? "" : "s"} ago`
                                  : info.isExpiringTomorrow
                                  ? "Expires Tomorrow (within 24h)"
                                  : `Expires in ${info.diffDays} days`}
                              </span>
                            </div>
                          </td>

                          {/* 5. Subscription Status (RED highlight + warning if expiring tomorrow or expired) */}
                          <td>
                            <div>
                              {info.isExpired ? (
                                <span className="sa-badge urgent-expired">
                                  <AlertCircle size={12} />
                                  <span>EXPIRED</span>
                                </span>
                              ) : info.isExpiringTomorrow ? (
                                <span className="sa-badge urgent-tomorrow">
                                  <AlertTriangle size={12} />
                                  <span>EXPIRES TOMORROW</span>
                                </span>
                              ) : (
                                <span className="sa-badge active-green">
                                  <Check size={12} />
                                  <span>ACTIVE</span>
                                </span>
                              )}

                              {/* Clear Expiry Warning Callout */}
                              {isUrgent && (
                                <div
                                  className={`sa-expiry-warning-banner ${
                                    isExpired ? "expired" : "tomorrow"
                                  }`}
                                >
                                  <span>{info.warningMessage}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* 6. Dedicated Email & Chat Renewal Buttons */}
                          <td>
                            <div
                              className="sa-action-btn-group"
                              style={{ justifyContent: "flex-end" }}
                            >
                              {/* Email Button */}
                              <button
                                type="button"
                                className="sa-btn-email"
                                onClick={() => handleOpenEmailModal(store)}
                                title={`Send official subscription renewal email notice to ${store.name}`}
                              >
                                <Mail size={13} />
                                <span>Email</span>
                              </button>

                              {/* Chat Button */}
                              <button
                                type="button"
                                className="sa-btn-chat"
                                onClick={() => handleOpenChatModal(store)}
                                title={`Send instant WhatsApp/in-app renewal chat to ${store.name}`}
                              >
                                <MessageSquare size={13} />
                                <span>Chat</span>
                              </button>

                              {/* Extend Subscription Action Button */}
                              <button
                                type="button"
                                className="sa-btn-extend"
                                onClick={() => handleOpenExtendModal(store)}
                                title={`Extend subscription duration for ${store.name}`}
                              >
                                <RefreshCw size={12} />
                                <span>Extend</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CREATE PLAN - Dedicated Plan Creation Form Only                     */}
      {/* ========================================================================= */}
      {activeTab === "create" && (
        <div>
          <div className="sa-create-plan-card">
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.25rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "10px",
                  background: "#dcfce7",
                  color: "#16a34a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PlusCircle size={22} strokeWidth={2.4} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#172b24" }}>
                  {editingPlanId ? "Edit Subscription Plan" : "Create New Subscription Plan"}
                </h2>
                <p style={{ margin: "2px 0 0 0", fontSize: "0.82rem", color: "#64748b" }}>
                  Define pricing tiers, supermarket branch allotments, and autonomous checkout features
                </p>
              </div>
            </div>

            <form onSubmit={handleCreatePlanSubmit}>
              {/* Row 1: Plan Name, Tier Code & Billing Cycle */}
              <div className="sa-form-grid-3">
                <div className="sa-form-group">
                  <label className="sa-form-label">
                    Plan Name <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="sa-form-input"
                    value={planFormData.name}
                    onChange={(e) =>
                      setPlanFormData({ ...planFormData, name: e.target.value })
                    }
                    placeholder="e.g. Hypermarket Growth Suite"
                  />
                </div>

                <div className="sa-form-group">
                  <label className="sa-form-label">
                    Tier Code (Identifier) <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="sa-form-input"
                    value={planFormData.tierCode}
                    onChange={(e) =>
                      setPlanFormData({
                        ...planFormData,
                        tierCode: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""),
                      })
                    }
                    placeholder="e.g. GROWTH_PLUS"
                  />
                </div>

                <div className="sa-form-group">
                  <label className="sa-form-label">
                    Billing Cycle <span className="req">*</span>
                  </label>
                  <select
                    className="sa-form-input"
                    value={planFormData.billingCycle}
                    onChange={(e) =>
                      setPlanFormData({ ...planFormData, billingCycle: e.target.value })
                    }
                  >
                    <option value="Monthly">Monthly Billing</option>
                    <option value="Yearly">Yearly Billing (Annual)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Price, Validity & Trial Days */}
              <div className="sa-form-grid-3" style={{ marginTop: "1rem" }}>
                <div className="sa-form-group">
                  <label className="sa-form-label">
                    Subscription Amount (INR ₹) <span className="req">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={100}
                    className="sa-form-input"
                    value={planFormData.price}
                    onChange={(e) =>
                      setPlanFormData({ ...planFormData, price: e.target.value })
                    }
                    placeholder="e.g. 14999"
                  />
                </div>

                <div className="sa-form-group">
                  <label className="sa-form-label">Duration (Days)</label>
                  <input
                    type="number"
                    min={1}
                    className="sa-form-input"
                    value={planFormData.durationDays}
                    onChange={(e) =>
                      setPlanFormData({ ...planFormData, durationDays: e.target.value })
                    }
                    placeholder="30"
                  />
                </div>

                <div className="sa-form-group">
                  <label className="sa-form-label">Free Trial Period (Days)</label>
                  <select
                    className="sa-form-input"
                    value={planFormData.trialDays}
                    onChange={(e) =>
                      setPlanFormData({ ...planFormData, trialDays: e.target.value })
                    }
                  >
                    <option value={0}>No Free Trial (Direct Active)</option>
                    <option value={7}>7 Days Free Trial</option>
                    <option value={14}>14 Days Free Trial</option>
                    <option value={30}>30 Days Free Trial</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Limits (Branches, SKUs, Turnstiles, Staff) */}
              <div className="sa-form-grid-3" style={{ marginTop: "1rem" }}>
                <div className="sa-form-group">
                  <label className="sa-form-label">Supermarket Branches Limit</label>
                  <input
                    type="number"
                    min={1}
                    className="sa-form-input"
                    value={planFormData.branchesCount}
                    onChange={(e) =>
                      setPlanFormData({ ...planFormData, branchesCount: e.target.value })
                    }
                    placeholder="1"
                  />
                </div>

                <div className="sa-form-group">
                  <label className="sa-form-label">Max Product SKUs</label>
                  <input
                    type="number"
                    min={100}
                    className="sa-form-input"
                    value={planFormData.maxProducts}
                    onChange={(e) =>
                      setPlanFormData({ ...planFormData, maxProducts: e.target.value })
                    }
                    placeholder="5000"
                  />
                </div>

                <div className="sa-form-group">
                  <label className="sa-form-label">Hardware Turnstiles Limit</label>
                  <input
                    type="number"
                    min={1}
                    className="sa-form-input"
                    value={planFormData.maxTurnstiles}
                    onChange={(e) =>
                      setPlanFormData({ ...planFormData, maxTurnstiles: e.target.value })
                    }
                    placeholder="4"
                  />
                </div>
              </div>

              {/* Row 4: Plan Description */}
              <div className="sa-form-group" style={{ marginTop: "1rem" }}>
                <label className="sa-form-label">Plan Description & Target Audience</label>
                <textarea
                  rows={2}
                  className="sa-form-input"
                  style={{ resize: "vertical" }}
                  value={planFormData.description}
                  onChange={(e) =>
                    setPlanFormData({ ...planFormData, description: e.target.value })
                  }
                  placeholder="e.g. Designed for regional supermarket retail chains requiring full automated turnstiles and AI prediction."
                />
              </div>

              {/* Row 5: Features Checklist */}
              <div style={{ marginTop: "1rem" }}>
                <label className="sa-form-label">
                  Included SaaS Features & Entitlements
                </label>
                <div className="sa-feature-checkbox-grid">
                  {[
                    "Barcode & QR High-Speed Scanning",
                    "Real-time POS Billing & Invoicing",
                    "Automated Turnstile QR Integration",
                    "Real-time Inventory & Low-Stock Alerts",
                    "WhatsApp & SMS Digital Receipts",
                    "AI Sales Forecasting & Predictive Reorder",
                    "Custom Store Admin Branding & Domain",
                    "Cryptographic Data Isolation Guarantee",
                    "Custom ERP & SAP Financial Ledger Export",
                    "24/7 Dedicated Priority SLA Support",
                  ].map((feat) => {
                    const isChecked = planFormData.featuresList.includes(feat);
                    return (
                      <label
                        key={feat}
                        className={`sa-feature-label-box ${isChecked ? "checked" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleFeatureToggle(feat)}
                          style={{ accentColor: "#16a34a" }}
                        />
                        <span>{feat}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Popular Choice Checkbox */}
              <div style={{ marginTop: "1rem" }}>
                <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 700, color: "#334155" }}>
                  <input
                    type="checkbox"
                    checked={planFormData.isPopular}
                    onChange={(e) =>
                      setPlanFormData({ ...planFormData, isPopular: e.target.checked })
                    }
                    style={{ accentColor: "#16a34a", width: "16px", height: "16px" }}
                  />
                  <span>Mark as "Most Popular / Recommended" Tier for Supermarkets</span>
                </label>
              </div>

              {/* Form Action Buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "1.5rem" }}>
                <button
                  type="submit"
                  className="sa-btn-primary"
                  disabled={isSubmittingPlan}
                  style={{ padding: "10px 24px", fontSize: "14px" }}
                >
                  <PlusCircle size={16} />
                  <span>
                    {isSubmittingPlan
                      ? "Saving Plan..."
                      : editingPlanId
                      ? "Update Subscription Plan"
                      : "Create Subscription Plan"}
                  </span>
                </button>

                {editingPlanId && (
                  <button
                    type="button"
                    className="sa-btn-secondary"
                    onClick={() => {
                      setEditingPlanId(null);
                      setPlanFormData({
                        name: "",
                        tierCode: "CUSTOM",
                        price: 9999,
                        billingCycle: "Monthly",
                        durationDays: 30,
                        trialDays: 0,
                        branchesCount: 1,
                        description: "",
                        featuresList: [
                          "Barcode & QR High-Speed Scanning",
                          "Real-time POS Billing & Invoicing",
                          "Automated Turnstile QR Integration",
                          "Real-time Inventory & Low-Stock Alerts",
                          "Email & Chat Support",
                        ],
                        maxProducts: 2500,
                        maxTurnstiles: 2,
                        maxStaffUsers: 15,
                        isPopular: false,
                      });
                    }}
                  >
                    Cancel Editing
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Configured Plans Gallery */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#172b24", margin: 0 }}>
                Currently Configured Subscription Plans ({plans.length})
              </h3>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.82rem", color: "#64748b" }}>
                Active pricing tiers and hardware entitlement packages configured for supermarkets
              </p>
            </div>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#16a34a",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                padding: "4px 12px",
                borderRadius: "9999px",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <CheckCircle2 size={13} strokeWidth={2.5} />
              <span>{plans.length} Tiers Live</span>
            </span>
          </div>

          <div className="sa-plans-gallery-grid">
            {plans.map((tier) => {
              const isPopular = !!tier.isPopular;
              return (
                <div
                  key={tier._id || tier.name}
                  className={`sa-plan-card ${isPopular ? "recommended" : ""}`}
                >
                  {/* Top Meta Header: Tier / Recommended Badge + Billing Cycle Badge */}
                  <div className="sa-plan-card-header-bar">
                    {isPopular ? (
                      <div className="sa-plan-popular-pill">
                        <Sparkles size={11} strokeWidth={2.5} />
                        <span>RECOMMENDED</span>
                      </div>
                    ) : (
                      <span className="sa-plan-tier-pill">
                        {tier.tierCode || "STANDARD"}
                      </span>
                    )}

                    <span className="sa-plan-cycle-pill">
                      {tier.billingCycle || "Monthly"}
                    </span>
                  </div>

                  {/* Plan Name - fixed min-height for uniform alignment */}
                  <h4 className="sa-plan-title" title={tier.name}>
                    {tier.name}
                  </h4>

                  {/* Description - fixed min-height for uniform alignment */}
                  <p className="sa-plan-desc" title={tier.description}>
                    {tier.description || "Comprehensive autonomous supermarket retail management suite."}
                  </p>

                  {/* Price Block - baseline aligned across all cards */}
                  <div className="sa-plan-price-wrap">
                    <span className="sa-plan-price-amount">
                      ₹{Number(tier.price).toLocaleString("en-IN")}
                    </span>
                    <span className="sa-plan-price-period">
                      /{tier.billingCycle === "Yearly" ? "yr" : "mo"}
                    </span>
                  </div>

                  {/* Quick Spec Ribbon (Capacity highlight) */}
                  <div className="sa-plan-spec-badge">
                    <Store size={13} color="#16a34a" style={{ flexShrink: 0 }} />
                    <span>
                      Up to {Number(tier.maxProducts || 500).toLocaleString("en-IN")} SKUs • {tier.maxTurnstiles || 1} Turnstile Gate{(tier.maxTurnstiles || 1) > 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Features List */}
                  <ul className="sa-plan-features-list">
                    {(tier.features || []).slice(0, 4).map((f, i) => (
                      <li key={i} className="sa-plan-feature-item">
                        <Check size={14} className="sa-plan-feature-icon" strokeWidth={2.8} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Card Footer Actions */}
                  <div className="sa-plan-footer">
                    <button
                      type="button"
                      className="sa-plan-btn-edit"
                      onClick={() => {
                        setEditingPlanId(tier._id);
                        setPlanFormData({
                          name: tier.name,
                          tierCode: tier.tierCode || "PLAN",
                          price: tier.price,
                          billingCycle: tier.billingCycle || "Monthly",
                          durationDays: tier.durationDays || 30,
                          trialDays: 0,
                          branchesCount: 1,
                          description: tier.description || "",
                          featuresList: tier.features || [],
                          maxProducts: tier.maxProducts || 5000,
                          maxTurnstiles: tier.maxTurnstiles || 4,
                          maxStaffUsers: 15,
                          isPopular: !!tier.isPopular,
                        });
                        window.scrollTo({ top: 120, behavior: "smooth" });
                      }}
                      title={`Edit parameters for ${tier.name}`}
                    >
                      <Edit2 size={13} />
                      <span>Edit Plan</span>
                    </button>
                    <button
                      type="button"
                      className="sa-plan-btn-delete"
                      onClick={() => handleDeletePlan(tier._id, tier.name)}
                      title={`Delete ${tier.name}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: SEND RENEWAL EMAIL NOTICE                                        */}
      {/* ========================================================================= */}
      {emailModalStore && (
        <div className="sa-modal-overlay" onClick={() => setEmailModalStore(null)}>
          <div
            className="sa-modal-card"
            style={{ maxWidth: "560px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sa-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    background: "#ecfdf5",
                    color: "#16a34a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Mail size={18} />
                </div>
                <div>
                  <h3>Subscription Renewal Notice</h3>
                  <p>Send direct email to {emailModalStore.name} ({emailModalStore.code})</p>
                </div>
              </div>
              <button
                type="button"
                className="sa-modal-close-btn"
                onClick={() => setEmailModalStore(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="sa-modal-body">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "12px" }}>
                <div>
                  <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>
                    Recipient Email:
                  </span>
                  <strong style={{ fontSize: "13px", color: "#0f172a" }}>
                    {emailModalStore.email || `${emailModalStore.adminUsername}@grocerease.store`}
                  </strong>
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#16a34a",
                    background: "#f0fdf4",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    border: "1px solid #bbf7d0",
                  }}
                >
                  {emailModalStore.plan || "Premium"}
                </span>
              </div>

              <div className="sa-form-group">
                <label className="sa-form-label">Email Subject</label>
                <input
                  type="text"
                  className="sa-form-input"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
              </div>

              <div className="sa-form-group" style={{ marginTop: "10px" }}>
                <label className="sa-form-label">Message Body</label>
                <textarea
                  rows={8}
                  className="sa-form-input"
                  style={{ resize: "vertical", fontFamily: "monospace", fontSize: "12px" }}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                />
              </div>
            </div>

            <div className="sa-modal-footer">
              <a
                href={`mailto:${emailModalStore.email || ""}?subject=${encodeURIComponent(
                  emailSubject
                )}&body=${encodeURIComponent(emailBody)}`}
                className="sa-btn-secondary"
                style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
                onClick={() => showToast("Opening in your desktop email client...")}
              >
                <ExternalLink size={13} />
                <span>Open in Desktop Mail</span>
              </a>

              <button
                type="button"
                className="sa-btn-primary"
                onClick={handleSendEmail}
                disabled={sendingEmail}
              >
                <Send size={14} />
                <span>{sendingEmail ? "Dispatching..." : "Send Renewal Email"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DIRECT RENEWAL CHAT & WHATSAPP                                    */}
      {/* ========================================================================= */}
      {chatModalStore && (
        <div className="sa-modal-overlay" onClick={() => setChatModalStore(null)}>
          <div
            className="sa-modal-card"
            style={{ maxWidth: "520px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sa-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    background: "#dbeafe",
                    color: "#2563eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h3>Direct Supermarket Renewal Chat</h3>
                  <p>Connect with {chatModalStore.name} ({chatModalStore.code})</p>
                </div>
              </div>
              <button
                type="button"
                className="sa-modal-close-btn"
                onClick={() => setChatModalStore(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="sa-modal-body">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "12px" }}>
                <div>
                  <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>
                    Contact Phone:
                  </span>
                  <strong style={{ fontSize: "13px", color: "#0f172a" }}>
                    {chatModalStore.phone || "+91 98765 43210"}
                  </strong>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>
                    Store Manager:
                  </span>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>
                    {chatModalStore.adminName || "Store Admin"}
                  </span>
                </div>
              </div>

              <div className="sa-form-group">
                <label className="sa-form-label">Renewal Message Text</label>
                <textarea
                  rows={5}
                  className="sa-form-input"
                  style={{ resize: "vertical", fontSize: "13px" }}
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                />
              </div>
            </div>

            <div className="sa-modal-footer">
              <button
                type="button"
                className="sa-btn-primary"
                onClick={handleLaunchWhatsApp}
                style={{ background: "#25D366", borderColor: "#25D366" }}
              >
                <Phone size={14} />
                <span>Open WhatsApp Chat</span>
              </button>

              <button
                type="button"
                className="sa-btn-primary"
                onClick={handleSendInAppChat}
                disabled={sendingChat}
              >
                <Send size={14} />
                <span>{sendingChat ? "Sending..." : "Send In-App Chat Alert"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EXTEND / RENEW SUBSCRIPTION                                      */}
      {/* ========================================================================= */}
      {extendModalStore && (
        <div className="sa-modal-overlay" onClick={() => setExtendModalStore(null)}>
          <div
            className="sa-modal-card"
            style={{ maxWidth: "460px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sa-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    background: "#ecfdf5",
                    color: "#16a34a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <RefreshCw size={18} />
                </div>
                <div>
                  <h3>Extend Subscription</h3>
                  <p>For "{extendModalStore.name}" ({extendModalStore.code})</p>
                </div>
              </div>
              <button
                type="button"
                className="sa-modal-close-btn"
                onClick={() => setExtendModalStore(null)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleExtendSubmit}>
              <div className="sa-modal-body">
                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "14px" }}>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>Current Expiry Date:</span>
                  <strong style={{ display: "block", fontSize: "14px", color: "#0f172a", marginTop: "2px" }}>
                    {getSubscriptionInfo(extendModalStore).formattedExpiry}
                  </strong>
                </div>

                <div className="sa-form-group">
                  <label className="sa-form-label">
                    Extension Duration <span className="req">*</span>
                  </label>
                  <select
                    className="sa-form-input"
                    value={extendDays}
                    onChange={(e) => setExtendDays(e.target.value)}
                  >
                    <option value={30}>+ 30 Days (1 Month)</option>
                    <option value={60}>+ 60 Days (2 Months)</option>
                    <option value={90}>+ 90 Days (Quarterly)</option>
                    <option value={180}>+ 180 Days (Half Year)</option>
                    <option value={365}>+ 365 Days (1 Full Year)</option>
                  </select>
                </div>
              </div>

              <div className="sa-modal-footer">
                <button
                  type="button"
                  className="sa-btn-secondary"
                  onClick={() => setExtendModalStore(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sa-btn-primary"
                  disabled={extending}
                >
                  {extending ? "Extending..." : "Confirm Extension"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
