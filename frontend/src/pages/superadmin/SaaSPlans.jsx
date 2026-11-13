import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
    name: "Standard Plan",
    tierCode: "STANDARD",
    price: 9999,
    billingCycle: "Monthly",
    durationDays: 30,
    description: "Designed for high-traffic supermarkets requiring autonomous checkout & AI scanning.",
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
    name: "Premium Supermarket Plan",
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

export default function SaaSPlans() {
  const { supermarkets } = useAuth();
  const [plans, setPlans] = useState(DEFAULT_PLANS);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    tierCode: "CUSTOM",
    price: 9999,
    billingCycle: "Monthly",
    durationDays: 30,
    description: "",
    featuresStr: "",
    maxProducts: 1000,
    maxTurnstiles: 2,
    isPopular: false,
  });

  const showToast = (text) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(""), 4000);
  };

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
  }, []);

  const handleOpenCreateModal = () => {
    setEditingPlan(null);
    setFormData({
      name: "",
      tierCode: "CUSTOM",
      price: 9999,
      billingCycle: "Monthly",
      durationDays: 30,
      description: "",
      featuresStr: "1 Store Branch\nBarcode Scanning\nDaily Reports\nEmail Support",
      maxProducts: 1000,
      maxTurnstiles: 2,
      isPopular: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      tierCode: plan.tierCode || "PLAN",
      price: plan.price || 4999,
      billingCycle: plan.billingCycle || "Monthly",
      durationDays: plan.durationDays || 30,
      description: plan.description || "",
      featuresStr: (plan.features || []).join("\n"),
      maxProducts: plan.maxProducts || 1000,
      maxTurnstiles: plan.maxTurnstiles || 2,
      isPopular: !!plan.isPopular,
    });
    setIsModalOpen(true);
  };

  const handleSubmitPlan = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) {
      showToast("Please provide plan name and price.");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      tierCode: formData.tierCode.toUpperCase(),
      price: Number(formData.price),
      billingCycle: formData.billingCycle,
      durationDays: Number(formData.durationDays) || 30,
      description: formData.description,
      features: formData.featuresStr
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean),
      maxProducts: Number(formData.maxProducts) || 1000,
      maxTurnstiles: Number(formData.maxTurnstiles) || 2,
      isPopular: formData.isPopular,
    };

    try {
      if (editingPlan && editingPlan._id && !editingPlan._id.startsWith("plan-")) {
        const res = await API.put(`/super-admin/plans/${editingPlan._id}`, payload);
        if (res.data?.success) {
          showToast(`✓ Plan "${formData.name}" updated successfully!`);
        }
      } else {
        const res = await API.post("/super-admin/plans", payload);
        if (res.data?.success) {
          showToast(`✓ Plan "${formData.name}" created successfully!`);
        }
      }
      setIsModalOpen(false);
      fetchPlans();
    } catch (err) {
      // Local fallback
      setPlans((prev) => {
        if (editingPlan) {
          return prev.map((p) =>
            p._id === editingPlan._id ? { ...p, ...payload } : p
          );
        }
        return [...prev, { _id: `plan-${Date.now()}`, ...payload }];
      });
      setIsModalOpen(false);
      showToast(`✓ Plan "${formData.name}" saved!`);
    }
  };

  const handleDeletePlan = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      if (!id.startsWith("plan-")) {
        await API.delete(`/super-admin/plans/${id}`);
      }
      setPlans((prev) => prev.filter((p) => p._id !== id));
      showToast(`Plan "${name}" removed.`);
    } catch (err) {
      setPlans((prev) => prev.filter((p) => p._id !== id));
      showToast(`Plan "${name}" removed.`);
    }
  };

  // Calculate subscribers per plan
  const getSubscribersCount = (planName, tierCode) => {
    return supermarkets.filter((s) => {
      const p = (s.plan || "").toLowerCase();
      const n = (planName || "").toLowerCase();
      const c = (tierCode || "").toLowerCase();
      return p.includes(n) || p.includes(c) || n.includes(p);
    }).length;
  };

  return (
    <div className="sa-page-container">
      {/* Toast */}
      {toastMessage && (
        <div className="notif-toast-pill success" style={{ position: "fixed", top: "20px", right: "20px", zIndex: 9999 }}>
          <Sparkles size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header */}
      <div className="sa-page-header">
        <div className="sa-page-header-content">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span className="sa-badge active">SaaS Billing & Subscriptions</span>
            <span style={{ fontSize: "12px", color: "#64748b" }}>Multi-Tier Plans & Pricing</span>
          </div>
          <h1>Subscription Plans & Supermarket Licensing</h1>
          <p>
            Create, configure and manage Basic, Standard, Premium and Enterprise plans with automated renewal tracking and feature entitlements.
          </p>
        </div>

        <div className="sa-page-header-actions">
          <button
            type="button"
            className="sa-btn-secondary"
            onClick={fetchPlans}
          >
            <RefreshCw size={15} className={loading ? "spin-icon" : ""} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="sa-btn-primary"
            onClick={handleOpenCreateModal}
          >
            <PlusCircle size={16} />
            <span>Create New Plan</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary Ribbon */}
      <section className="sa-kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <div className="sa-kpi-card">
          <div className="sa-kpi-icon-pill green">
            <CreditCard size={22} strokeWidth={2.4} />
          </div>
          <div className="sa-kpi-details">
            <h3 className="sa-kpi-number">{plans.length}</h3>
            <span className="sa-kpi-label">Configured Plans</span>
            <div className="sa-kpi-badge positive">
              <span>Active SaaS Tiers</span>
            </div>
          </div>
        </div>

        <div className="sa-kpi-card">
          <div className="sa-kpi-icon-pill purple">
            <Building2 size={22} strokeWidth={2.4} />
          </div>
          <div className="sa-kpi-details">
            <h3 className="sa-kpi-number">{supermarkets.length}</h3>
            <span className="sa-kpi-label">Active Subscribers</span>
            <div className="sa-kpi-badge positive">
              <span>Supermarket Stores</span>
            </div>
          </div>
        </div>

        <div className="sa-kpi-card">
          <div className="sa-kpi-icon-pill blue">
            <TrendingUp size={22} strokeWidth={2.4} />
          </div>
          <div className="sa-kpi-details">
            <h3 className="sa-kpi-number">
              ₹
              {supermarkets
                .reduce((sum, s) => {
                  const rate =
                    (s.plan || "").toLowerCase() === "enterprise"
                      ? 34999
                      : (s.plan || "").toLowerCase() === "premium"
                      ? 19999
                      : (s.plan || "").toLowerCase() === "standard"
                      ? 9999
                      : 4999;
                  return sum + rate;
                }, 0)
                .toLocaleString("en-IN")}
            </h3>
            <span className="sa-kpi-label">Monthly Recurring Revenue (MRR)</span>
            <div className="sa-kpi-badge positive">
              <span>Real-Time Subscriptions</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Plan Tier Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
        {plans.map((tier) => {
          const subsCount = getSubscribersCount(tier.name, tier.tierCode);
          return (
            <div
              key={tier._id || tier.name}
              className="sa-section-card"
              style={{
                padding: "1.75rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                border: tier.isPopular ? "2px solid #16a34a" : "1px solid #e2e8f0",
                boxShadow: tier.isPopular
                  ? "0 10px 30px rgba(22, 163, 74, 0.12)"
                  : "0 2px 8px rgba(15, 23, 42, 0.04)",
                position: "relative",
                background: "#ffffff",
                borderRadius: "16px",
              }}
            >
              {tier.isPopular && (
                <div
                  style={{
                    position: "absolute",
                    top: "-12px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#16a34a",
                    color: "#ffffff",
                    fontSize: "11px",
                    fontWeight: 800,
                    padding: "3px 14px",
                    borderRadius: "9999px",
                    letterSpacing: "0.5px",
                    boxShadow: "0 2px 8px rgba(22, 163, 74, 0.3)",
                  }}
                >
                  POPULAR CHOICE
                </div>
              )}

              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                    {tier.name}
                  </h3>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      background: "#ECFDF5",
                      color: "#059669",
                      padding: "2px 8px",
                      borderRadius: "6px",
                    }}
                  >
                    {tier.billingCycle || "Monthly"}
                  </span>
                </div>

                <p style={{ fontSize: "12.5px", color: "#64748b", minHeight: "36px", margin: "4px 0 16px 0" }}>
                  {tier.description}
                </p>

                <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "16px" }}>
                  <span style={{ fontSize: "28px", fontWeight: 900, color: "#0f172a" }}>
                    ₹{Number(tier.price).toLocaleString("en-IN")}
                  </span>
                  <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>
                    /{tier.billingCycle === "Annual" ? "year" : "month"}
                  </span>
                </div>

                <div
                  style={{
                    padding: "8px 12px",
                    background: "#F8FAFC",
                    borderRadius: "8px",
                    border: "1px solid #E2E8F0",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>
                    Subscribed Stores:
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 800,
                      color: "#166534",
                      background: "#DCFCE7",
                      padding: "2px 8px",
                      borderRadius: "6px",
                    }}
                  >
                    {subsCount} Supermarket{subsCount !== 1 ? "s" : ""}
                  </span>
                </div>

                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px 0", display: "flex", flexDirection: "column", gap: "10px" }}>
                  {(tier.features || []).map((feat, idx) => (
                    <li
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "8px",
                        fontSize: "12.5px",
                        color: "#334155",
                        fontWeight: 500,
                      }}
                    >
                      <CheckCircle2 size={15} color="#16a34a" style={{ flexShrink: 0, marginTop: "2px" }} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ display: "flex", gap: "8px", borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
                <button
                  type="button"
                  className="sa-btn-secondary"
                  style={{ flex: 1, padding: "8px 12px", fontSize: "12px", justifyContent: "center" }}
                  onClick={() => handleOpenEditModal(tier)}
                >
                  <Edit2 size={13} />
                  <span>Edit Plan</span>
                </button>

                <button
                  type="button"
                  className="sa-action-btn secondary"
                  style={{ padding: "8px 10px", color: "#dc2626" }}
                  onClick={() => handleDeletePlan(tier._id, tier.name)}
                  title="Delete Plan"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Plan Edit / Create Modal */}
      {isModalOpen && (
        <div className="sa-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="sa-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px" }}>
            <div className="sa-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="sa-kpi-icon-pill green" style={{ width: "36px", height: "36px" }}>
                  <CreditCard size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>
                    {editingPlan ? "Edit Subscription Plan" : "Create New Subscription Plan"}
                  </h3>
                  <small style={{ color: "#64748b" }}>
                    Configure pricing, billing cycle, duration, and feature limits
                  </small>
                </div>
              </div>
              <button type="button" className="sa-modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitPlan} style={{ padding: "20px" }}>
              <div className="sa-form-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                <div>
                  <label className="sa-label">Plan Name *</label>
                  <input
                    type="text"
                    required
                    className="sa-input"
                    placeholder="e.g. Premium Supermarket"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="sa-label">Tier Code</label>
                  <input
                    type="text"
                    className="sa-input"
                    placeholder="e.g. PREMIUM"
                    value={formData.tierCode}
                    onChange={(e) => setFormData({ ...formData, tierCode: e.target.value })}
                  />
                </div>

                <div>
                  <label className="sa-label">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    className="sa-input"
                    placeholder="19999"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>

                <div>
                  <label className="sa-label">Billing Cycle</label>
                  <select
                    className="sa-input"
                    value={formData.billingCycle}
                    onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>

                <div>
                  <label className="sa-label">Max Active SKUs</label>
                  <input
                    type="number"
                    className="sa-input"
                    value={formData.maxProducts}
                    onChange={(e) => setFormData({ ...formData, maxProducts: e.target.value })}
                  />
                </div>

                <div>
                  <label className="sa-label">Max IoT Turnstiles</label>
                  <input
                    type="number"
                    className="sa-input"
                    value={formData.maxTurnstiles}
                    onChange={(e) => setFormData({ ...formData, maxTurnstiles: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label className="sa-label">Plan Description</label>
                <input
                  type="text"
                  className="sa-input"
                  placeholder="Short summary of this plan"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label className="sa-label">Included Features (1 per line)</label>
                <textarea
                  className="sa-input"
                  rows="4"
                  placeholder="1 Supermarket Store Branch&#10;Up to 500 SKUs&#10;Barcode Scanning"
                  value={formData.featuresStr}
                  onChange={(e) => setFormData({ ...formData, featuresStr: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                <input
                  type="checkbox"
                  id="isPop"
                  checked={formData.isPopular}
                  onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                />
                <label htmlFor="isPop" style={{ fontSize: "13px", fontWeight: 600, color: "#334155", cursor: "pointer" }}>
                  Mark as "Most Popular" / Recommended Tier
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  className="sa-btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sa-btn-primary"
                >
                  <Check size={16} />
                  <span>{editingPlan ? "Save Changes" : "Create Plan"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
