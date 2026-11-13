import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Store,
  Crown,
  CreditCard,
  TrendingUp,
  BarChart3,
  Plus,
  Users,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Check,
  CheckCircle2,
  Zap,
  MoreHorizontal,
  ArrowRight,
  ExternalLink,
  KeyRound,
  RefreshCw,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import API from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import modernSupermarketBanner from "C:/Users/Forgeindiaconnect/.gemini/antigravity/brain/ea64ddf2-7b46-4b95-b6c4-9ce99c9e82b3/supermarket_card_banner_1794572842698.jpg";
import "./SuperAdmin.css";

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { supermarkets, currentSupermarket, switchSupermarket, loadSupermarkets } = useAuth();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // Quick Add Supermarket Form State (explicitly blank)
  const [supermarketName, setSupermarketName] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("Premium");
  const [showPassword, setShowPassword] = useState(false);

  // Active Ribbon Tab State
  const [activeTab, setActiveTab] = useState("add");

  // Ensure fields are completely empty on mount & block browser autofill
  useEffect(() => {
    setSupermarketName("");
    setAdminUsername("");
    setAdminPassword("");
    const timer = setTimeout(() => {
      setSupermarketName("");
      setAdminUsername("");
      setAdminPassword("");
    }, 120);
    return () => clearTimeout(timer);
  }, []);

  // Fetch Central Platform Analytics & Registered Supermarkets
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await API.get("/super-admin/analytics");
      if (res.data?.success) {
        setAnalytics(res.data);
      }
    } catch (err) {
      console.warn("Analytics fetch notice:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    if (loadSupermarkets) loadSupermarkets();
  }, []);

  // Handle Quick Supermarket Creation
  const handleCreateSupermarket = async (e) => {
    e.preventDefault();
    setFeedback({ type: "", message: "" });

    if (!supermarketName.trim()) {
      setFeedback({ type: "error", message: "Please enter a supermarket name." });
      return;
    }
    if (!adminUsername.trim()) {
      setFeedback({ type: "error", message: "Please enter an admin username." });
      return;
    }
    if (!adminPassword.trim() || adminPassword.length < 6) {
      setFeedback({ type: "error", message: "Password must be at least 6 characters long." });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: supermarketName.trim(),
        adminUsername: adminUsername.trim().toLowerCase(),
        adminPassword: adminPassword,
        adminName: `${supermarketName.trim()} Admin`,
        plan: selectedPlan || "Premium",
        status: "Active",
      };

      const res = await API.post("/super-admin/supermarkets", payload);

      if (res.data?.success) {
        setFeedback({
          type: "success",
          message: `Supermarket "${res.data.supermarket?.name || supermarketName}" registered successfully! Admin login: ${payload.adminUsername}`,
        });
        // Reset form
        setSupermarketName("");
        setAdminUsername("");
        setAdminPassword("");
        setSelectedPlan("Premium");

        // Refresh stores & platform counters
        if (loadSupermarkets) await loadSupermarkets();
        await fetchAnalytics();
      } else {
        setFeedback({
          type: "error",
          message: res.data?.message || "Failed to create supermarket.",
        });
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.response?.data?.message || "Network error while registering supermarket.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLaunchStore = (store) => {
    if (switchSupermarket) {
      switchSupermarket(store);
      navigate("/admin");
    }
  };

  // Compute live KPI counters with resilient fallbacks
  const totalStoresCount =
    analytics?.summary?.totalSupermarkets ?? (supermarkets?.length ? supermarkets.length : 2);
  const activeSubsCount =
    analytics?.summary?.activeSubscriptions ??
    (supermarkets?.length ? supermarkets.filter((s) => s.status === "Active").length : 2);
  const totalPlatformRevenue =
    analytics?.summary?.totalRevenue ?? 35628;
  const platformGrowthRate =
    analytics?.summary?.platformGrowth ?? 25;

  // Recent Supermarkets List (from API analytics or seeded stores)
  const recentStoresList =
    analytics?.recentSupermarkets?.length > 0
      ? analytics.recentSupermarkets
      : supermarkets?.length > 0
      ? supermarkets.slice(0, 5)
      : [
          {
            _id: "store-1",
            name: "FreshMart Supermarket",
            adminUsername: "john@freshmart.com",
            plan: "Premium",
            status: "Active",
            createdAt: "2025-11-10T10:00:00.000Z",
          },
          {
            _id: "store-2",
            name: "Sri Balaji Supermarket",
            adminUsername: "admin@balaji.com",
            plan: "Business",
            status: "Active",
            createdAt: "2025-11-09T10:00:00.000Z",
          },
          {
            _id: "store-3",
            name: "Galaxy Supermarket",
            adminUsername: "galaxy@store.com",
            plan: "Basic",
            status: "Active",
            createdAt: "2025-11-08T10:00:00.000Z",
          },
        ];

  const formatDate = (dateStr) => {
    if (!dateStr) return "2025-11-10";
    try {
      const d = new Date(dateStr);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch (_) {
      return "2025-11-10";
    }
  };

  return (
    <div className="sa-dashboard-container">
      {/* ================= 1. Top 4 Highly Vibrant & Highlighted KPI Cards ================= */}
      <section className="sa-kpi-row">
        {/* Card 1: Total Supermarkets */}
        <div className="sa-kpi-card-v2 green-highlight">
          <div className="sa-kpi-v2-main">
            <div className="sa-kpi-v2-icon green">
              <Store size={24} strokeWidth={2.4} />
            </div>
            <div className="sa-kpi-v2-info">
              <span className="sa-kpi-v2-label">Total Supermarkets</span>
              <div className="sa-kpi-v2-val-row">
                <span className="sa-kpi-v2-value">{totalStoresCount}</span>
                <span className="sa-kpi-v2-pill green">&uarr; +1</span>
              </div>
            </div>
          </div>
          {/* Glowing Green Wave Sparkline */}
          <div className="sa-kpi-sparkline green">
            <svg viewBox="0 0 100 42" preserveAspectRatio="none" className="sa-sparkline-svg">
              <defs>
                <linearGradient id="greenSparkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M0,34 Q25,28 50,18 T100,6 L100,42 L0,42 Z"
                fill="url(#greenSparkGrad)"
              />
              <path
                d="M0,34 Q25,28 50,18 T100,6"
                fill="none"
                stroke="#10b981"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 2: Active Subscriptions */}
        <div className="sa-kpi-card-v2 purple-highlight">
          <div className="sa-kpi-v2-main">
            <div className="sa-kpi-v2-icon purple">
              <Crown size={24} strokeWidth={2.4} />
            </div>
            <div className="sa-kpi-v2-info">
              <span className="sa-kpi-v2-label">Active Subscriptions</span>
              <div className="sa-kpi-v2-val-row">
                <span className="sa-kpi-v2-value">{activeSubsCount}</span>
                <span className="sa-kpi-v2-pill green">&uarr; +1</span>
              </div>
            </div>
          </div>
          {/* Glowing Purple Wave Sparkline */}
          <div className="sa-kpi-sparkline purple">
            <svg viewBox="0 0 100 42" preserveAspectRatio="none" className="sa-sparkline-svg">
              <defs>
                <linearGradient id="purpleSparkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M0,32 Q20,36 45,20 T80,12 T100,6 L100,42 L0,42 Z"
                fill="url(#purpleSparkGrad)"
              />
              <path
                d="M0,32 Q20,36 45,20 T80,12 T100,6"
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 3: Total Revenue */}
        <div className="sa-kpi-card-v2 blue-highlight">
          <div className="sa-kpi-v2-main">
            <div className="sa-kpi-v2-icon blue">
              <CreditCard size={24} strokeWidth={2.4} />
            </div>
            <div className="sa-kpi-v2-info">
              <span className="sa-kpi-v2-label">Total Revenue</span>
              <div className="sa-kpi-v2-val-row">
                <span className="sa-kpi-v2-value">
                  &#8377;{Number(totalPlatformRevenue).toLocaleString("en-IN")}
                </span>
                <span className="sa-kpi-v2-pill green">&uarr; +12%</span>
              </div>
            </div>
          </div>
          {/* Glowing Blue Wave Sparkline */}
          <div className="sa-kpi-sparkline blue">
            <svg viewBox="0 0 100 42" preserveAspectRatio="none" className="sa-sparkline-svg">
              <defs>
                <linearGradient id="blueSparkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M0,36 Q22,18 45,28 T78,10 T100,6 L100,42 L0,42 Z"
                fill="url(#blueSparkGrad)"
              />
              <path
                d="M0,36 Q22,18 45,28 T78,10 T100,6"
                fill="none"
                stroke="#0284c7"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 4: Platform Growth */}
        <div className="sa-kpi-card-v2 orange-highlight">
          <div className="sa-kpi-v2-main">
            <div className="sa-kpi-v2-icon orange">
              <BarChart3 size={24} strokeWidth={2.4} />
            </div>
            <div className="sa-kpi-v2-info">
              <span className="sa-kpi-v2-label">Platform Growth</span>
              <div className="sa-kpi-v2-val-row">
                <span className="sa-kpi-v2-value">{platformGrowthRate}%</span>
                <span className="sa-kpi-v2-pill green">&uarr; +5%</span>
              </div>
            </div>
          </div>
          {/* Saturated Orange 5-Bar Sparkline */}
          <div className="sa-kpi-sparkline orange">
            <div className="sa-mini-bars">
              <div className="sa-bar b1" />
              <div className="sa-bar b2" />
              <div className="sa-bar b3" />
              <div className="sa-bar b4" />
              <div className="sa-bar b5" />
            </div>
          </div>
        </div>
      </section>

      {/* ================= 2. Horizontal Secondary Tabs Ribbon ================= */}
      <section className="sa-ribbon-bar">
        <button
          type="button"
          className="sa-ribbon-btn primary"
          onClick={() => navigate("/super-admin/add-supermarket")}
        >
          <Plus size={16} strokeWidth={2.8} />
          <span>Add Supermarket</span>
        </button>

        <button
          type="button"
          className="sa-ribbon-btn"
          onClick={() => navigate("/super-admin/supermarkets")}
        >
          <Store size={15} className="ribbon-icon-green" />
          <span>Manage Supermarkets</span>
        </button>

        <button
          type="button"
          className="sa-ribbon-btn"
          onClick={() => navigate("/super-admin/plans")}
        >
          <Crown size={15} className="ribbon-icon-purple" />
          <span>Subscription Plans</span>
        </button>

        <button
          type="button"
          className="sa-ribbon-btn"
          onClick={() => navigate("/super-admin/registered-supermarkets")}
        >
          <Users size={15} className="ribbon-icon-blue" />
          <span>Registered Supermarkets</span>
        </button>

        <button
          type="button"
          className="sa-ribbon-btn"
          onClick={() => navigate("/super-admin/analytics")}
        >
          <BarChart3 size={15} className="ribbon-icon-orange" />
          <span>Analytics</span>
        </button>
      </section>

      {/* ================= 3. Center Main Split Section ================= */}
      <section className="sa-center-split-section">
        {/* Left Card: 3D Supermarket Storefront Banner + Add New Supermarket Form */}
        <div className="sa-split-form-card" id="sa-add-store-form">
          {/* Left Column: 8K Photorealistic 3D Storefront Image Visual */}
          <div className="sa-form-visual-side">
            <div className="sa-visual-img-container">
              <img
                src={modernSupermarketBanner}
                alt="3D Supermarket Storefront with Cart"
                className="sa-visual-cover-img"
                onError={(e) => {
                  e.target.src = "/supermarket-storefront-banner.jpg";
                }}
              />
              <div className="sa-visual-overlay-gradient" />
              <div className="sa-visual-badge-pill">
                <Sparkles size={14} className="sa-badge-sparkle" />
                <span>Smart Multi-Tenant Cloud</span>
              </div>
            </div>
          </div>

          {/* Right Column: Add New Supermarket Form */}
          <div className="sa-form-input-side">
            <div className="sa-form-header">
              <h2 className="sa-form-title">Add New Supermarket</h2>
              <p className="sa-form-subtitle">
                Register a new supermarket and assign admin credentials
              </p>
            </div>

            {feedback.message && (
              <div className={`sa-form-alert ${feedback.type}`}>
                {feedback.type === "success" ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            <form
              onSubmit={handleCreateSupermarket}
              className="sa-registration-form"
              autoComplete="off"
            >
              {/* Dummy hidden inputs to absorb browser autofill */}
              <input
                type="text"
                name="fake_username_trap"
                style={{ position: "absolute", opacity: 0, height: 0, width: 0, pointerEvents: "none" }}
                tabIndex={-1}
                autoComplete="username"
              />
              <input
                type="password"
                name="fake_password_trap"
                style={{ position: "absolute", opacity: 0, height: 0, width: 0, pointerEvents: "none" }}
                tabIndex={-1}
                autoComplete="current-password"
              />

              {/* Field 1: Supermarket Name */}
              <div className="sa-form-group-v2">
                <label className="sa-field-label">
                  Supermarket Name <span className="req-star">*</span>
                </label>
                <div className="sa-input-icon-box">
                  <Store size={16} className="sa-box-icon" />
                  <input
                    type="text"
                    name="supermarket_display_name"
                    className="sa-text-input"
                    placeholder="Enter supermarket name"
                    value={supermarketName}
                    onChange={(e) => setSupermarketName(e.target.value)}
                    autoComplete="new-supermarket-name"
                    required
                  />
                </div>
              </div>

              {/* Field 2: Admin Username */}
              <div className="sa-form-group-v2">
                <label className="sa-field-label">
                  Admin Username <span className="req-star">*</span>
                </label>
                <div className="sa-input-icon-box">
                  <Users size={16} className="sa-box-icon" />
                  <input
                    type="text"
                    name="supermarket_admin_new_user"
                    className="sa-text-input"
                    placeholder="Enter admin username"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    autoComplete="new-admin-user"
                    required
                  />
                </div>
              </div>

              {/* Field 3: Password */}
              <div className="sa-form-group-v2">
                <label className="sa-field-label">
                  Password <span className="req-star">*</span>
                </label>
                <div className="sa-input-icon-box">
                  <Lock size={16} className="sa-box-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="supermarket_admin_new_secret"
                    className="sa-text-input"
                    placeholder="Enter password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="sa-password-eye-btn"
                    onClick={() => setShowPassword((prev) => !prev)}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Field 4: Subscription Plan */}
              <div className="sa-form-group-v2">
                <label className="sa-field-label">Subscription Plan</label>
                <div className="sa-input-icon-box">
                  <Crown size={16} className="sa-box-icon" />
                  <select
                    className="sa-select-input"
                    value={selectedPlan}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                  >
                    <option value="Basic">Basic Plan (&#8377;4,999/mo)</option>
                    <option value="Standard">Standard Plan (&#8377;9,999/mo)</option>
                    <option value="Business">Business Plan (&#8377;12,499/mo)</option>
                    <option value="Premium">Premium Plan (&#8377;19,999/mo)</option>
                    <option value="Enterprise">Enterprise Plan (&#8377;24,999/mo)</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="sa-submit-pill-btn"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <RefreshCw size={16} className="spin-icon" />
                    <span>Registering Supermarket...</span>
                  </>
                ) : (
                  <>
                    <Plus size={16} strokeWidth={2.8} />
                    <span>Add Supermarket</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Card: Multi-Tenant SaaS Platform Feature Highlights */}
        <div className="sa-saas-platform-card">
          <div className="sa-platform-card-header">
            <div className="sa-platform-shield-icon">
              <ShieldCheck size={20} strokeWidth={2.4} />
            </div>
            <h3 className="sa-platform-card-title">Multi-Tenant SaaS Platform</h3>
          </div>

          {/* Checklist */}
          <div className="sa-checklist-list">
            <div className="sa-check-item">
              <div className="sa-check-circle">
                <Check size={12} strokeWidth={3} />
              </div>
              <span>Manage Multiple Supermarkets</span>
            </div>

            <div className="sa-check-item">
              <div className="sa-check-circle">
                <Check size={12} strokeWidth={3} />
              </div>
              <span>Set Subscription Plans</span>
            </div>

            <div className="sa-check-item">
              <div className="sa-check-circle">
                <Check size={12} strokeWidth={3} />
              </div>
              <span>Track Registrations &amp; Revenue</span>
            </div>

            <div className="sa-check-item">
              <div className="sa-check-circle">
                <Check size={12} strokeWidth={3} />
              </div>
              <span>Ensure Data Isolation</span>
            </div>
          </div>

          {/* 3D Storefront Illustration & Security Badge */}
          <div className="sa-platform-badge-box">
            <div className="sa-store-badge-graphic">
              <img
                src="/storefront-3d.jpg"
                alt="Secure Store Architecture"
                className="sa-store-badge-img"
              />
              <div className="sa-shield-green-pill">
                <ShieldCheck size={14} />
              </div>
            </div>
            <div className="sa-badge-labels">
              <span className="sa-badge-tagline">
                Secure &bull; Scalable &bull; Reliable
              </span>
              <p className="sa-badge-desc">
                Your Complete Supermarket Management Solution
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 4. Bottom Section: Recent Supermarkets & Quick Actions ================= */}
      <section className="sa-bottom-row-section">
        {/* Left 70%: Recent Supermarkets Table Card */}
        <div className="sa-recent-stores-card">
          <div className="sa-recent-header">
            <div className="sa-recent-title-group">
              <Store size={18} color="#0f172a" />
              <h3>Recent Supermarkets</h3>
            </div>
            <Link to="/super-admin/registered-supermarkets" className="sa-view-all-link">
              <span>View All</span>
              <span>&rarr;</span>
            </Link>
          </div>

          <div className="sa-recent-table-wrap">
            <table className="sa-clean-table">
              <thead>
                <tr>
                  <th style={{ width: "40px" }}>#</th>
                  <th>Supermarket Name</th>
                  <th>Admin</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Registered On</th>
                  <th style={{ textAlign: "center", width: "70px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentStoresList.map((store, idx) => {
                  const planName = store.plan || "Premium";
                  const planClass =
                    planName.toLowerCase() === "premium"
                      ? "premium"
                      : planName.toLowerCase() === "business" || planName.toLowerCase() === "standard"
                      ? "business"
                      : planName.toLowerCase() === "enterprise"
                      ? "enterprise"
                      : "basic";

                  return (
                    <tr key={store._id || idx}>
                      <td style={{ color: "#64748b", fontWeight: 600 }}>{idx + 1}</td>
                      <td>
                        <span className="sa-store-name-text">{store.name}</span>
                      </td>
                      <td>
                        <span className="sa-store-admin-email">
                          {store.adminUsername || store.email || `${store.code || "store"}@grocerease.store`}
                        </span>
                      </td>
                      <td>
                        <span className={`sa-plan-pill ${planClass}`}>{planName}</span>
                      </td>
                      <td>
                        <span className="sa-status-pill active">
                          <span className="sa-green-dot" />
                          <span>{store.status || "Active"}</span>
                        </span>
                      </td>
                      <td>
                        <span className="sa-date-cell">{formatDate(store.createdAt)}</span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          className="sa-action-dots-btn"
                          title={`Manage ${store.name}`}
                          onClick={() => handleLaunchStore(store)}
                        >
                          <MoreHorizontal size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 30%: Quick Actions Card */}
        <div className="sa-quick-actions-card">
          <div className="sa-qa-header">
            <Zap size={18} color="#0f172a" fill="#0f172a" />
            <h3>Quick Actions</h3>
          </div>

          <div className="sa-qa-list">
            {/* Action 1: View Platform Reports */}
            <div
              className="sa-qa-item"
              onClick={() => navigate("/super-admin/analytics")}
            >
              <div className="sa-qa-icon green">
                <TrendingUp size={18} strokeWidth={2.4} />
              </div>
              <div className="sa-qa-text">
                <span className="sa-qa-label">View Platform Reports</span>
              </div>
            </div>

            {/* Action 2: Manage Plans */}
            <div
              className="sa-qa-item"
              onClick={() => navigate("/super-admin/plans")}
            >
              <div className="sa-qa-icon gold">
                <Crown size={18} strokeWidth={2.4} />
              </div>
              <div className="sa-qa-text">
                <span className="sa-qa-label">Manage Plans</span>
              </div>
            </div>

            {/* Action 3: Check Subscriptions */}
            <div
              className="sa-qa-item"
              onClick={() => navigate("/super-admin/registered-supermarkets")}
            >
              <div className="sa-qa-icon green-alt">
                <CreditCard size={18} strokeWidth={2.4} />
              </div>
              <div className="sa-qa-text">
                <span className="sa-qa-label">Check Subscriptions</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
