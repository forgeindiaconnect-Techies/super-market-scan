import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2,
  PlusCircle,
  Search,
  Filter,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Lock,
  UserCheck,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Copy,
  Check,
  X,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import API from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "./SuperAdmin.css";

export default function SupermarketsManagement() {
  const navigate = useNavigate();
  const { supermarkets, currentSupermarket, switchSupermarket, loadSupermarkets } = useAuth();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [copiedKey, setCopiedKey] = useState("");

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedStoreForReset, setSelectedStoreForReset] = useState(null);
  const [newPasswordValue, setNewPasswordValue] = useState("StoreAdmin@123");
  const [showPasswordMap, setShowPasswordMap] = useState({});

  // New Supermarket Form State
  const [formValues, setFormValues] = useState({
    name: "",
    code: "",
    tagline: "Smart Supermarket & Instant Gate Clearance",
    city: "Bangalore",
    address: "MG Road, Indiranagar",
    phone: "+91 98765 43210",
    email: "",
    adminName: "",
    adminUsername: "",
    adminPassword: "StoreAdmin@123",
    plan: "Enterprise",
  });
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-generate unique store code from name
  const handleNameChange = (e) => {
    const val = e.target.value;
    const nextCode = val ? "STR-" + val.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase() + Math.floor(10 + Math.random() * 90) : "";
    const nextUsername = val ? val.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10) : "";
    setFormValues((prev) => ({
      ...prev,
      name: val,
      code: prev.code || nextCode,
      adminUsername: prev.adminUsername || nextUsername,
      adminName: prev.adminName || `${val} Manager`,
      email: prev.email || `${nextUsername || "store"}@grocerease.store`,
    }));
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(""), 2000);
    showToast(`Copied: "${text}" to clipboard!`);
  };

  const togglePasswordVisibility = (id) => {
    setShowPasswordMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Launch store as Super Admin
  const handleLaunchStore = (store) => {
    switchSupermarket(store);
    showToast(`Switched active context to "${store.name}".`);
    navigate("/admin");
  };

  // Handle Add Supermarket
  const handleCreateSupermarket = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formValues.name.trim() || !formValues.code.trim() || !formValues.adminUsername.trim() || !formValues.adminPassword.trim()) {
      setFormError("Supermarket name, code, admin username, and password are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await API.post("/super-admin/supermarkets", formValues);
      if (res.data?.success) {
        showToast(`✓ Supermarket "${formValues.name}" created successfully with admin username "${formValues.adminUsername}"!`);
        setIsAddModalOpen(false);
        setFormValues({
          name: "",
          code: "",
          tagline: "Smart Supermarket & Instant Gate Clearance",
          city: "Bangalore",
          address: "MG Road, Indiranagar",
          phone: "+91 98765 43210",
          email: "",
          adminName: "",
          adminUsername: "",
          adminPassword: "StoreAdmin@123",
          plan: "Enterprise",
        });
        await loadSupermarkets();
      } else {
        setFormError(res.data?.message || "Failed to create supermarket.");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to create supermarket.";
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Toggle Status (Active / Suspended)
  const handleToggleStatus = async (store) => {
    const nextStatus = store.status === "Active" ? "Suspended" : "Active";
    try {
      const res = await API.put(`/super-admin/supermarkets/${store._id}`, { status: nextStatus });
      if (res.data?.success) {
        showToast(`Supermarket "${store.name}" is now ${nextStatus}.`);
        await loadSupermarkets();
      }
    } catch (err) {
      showToast(`Error updating status: ${err.message}`);
    }
  };

  // Handle Reset Password Submit
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStoreForReset) return;

    try {
      const res = await API.post(`/super-admin/supermarkets/${selectedStoreForReset._id}/reset-password`, {
        newPassword: newPasswordValue,
      });
      if (res.data?.success) {
        showToast(`✓ Password reset for "${selectedStoreForReset.name}". New password: ${newPasswordValue}`);
        setIsResetModalOpen(false);
        await loadSupermarkets();
      }
    } catch (err) {
      showToast(`Failed to reset password: ${err.message}`);
    }
  };

  // Filtered Supermarkets
  const filteredStores = supermarkets.filter((s) => {
    const matchSearch =
      (s.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.code || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.city || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.adminUsername || "").toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === "all" || String(s.status).toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  return (
    <div className="sa-page-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background: "#0f172a",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: "12px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            zIndex: 2000,
            fontSize: "14px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <CheckCircle2 size={16} color="#4ade80" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header */}
      <div className="sa-page-header">
        <div className="sa-page-header-content">
          <h1>Supermarkets & Separate Tenant Credentials</h1>
          <p>
            Create independent supermarkets with isolated databases and assign custom Admin login credentials for each store.
          </p>
        </div>

        <div className="sa-page-header-actions">
          <button
            type="button"
            className="sa-btn-secondary"
            onClick={loadSupermarkets}
            title="Reload from backend"
          >
            <RefreshCw size={15} />
            <span>Sync Stores</span>
          </button>

          <button
            type="button"
            className="sa-btn-primary"
            onClick={() => {
              setFormError("");
              setIsAddModalOpen(true);
            }}
          >
            <PlusCircle size={16} />
            <span>Add New Supermarket</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Strip */}
      <div className="sa-section-card">
        <div className="sa-filter-bar">
          <div className="sa-search-input-wrap">
            <Search size={17} className="sa-search-icon" />
            <input
              type="text"
              className="sa-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by store name, branch code, city or admin username..."
            />
          </div>

          <div className="sa-filter-controls">
            <select
              className="sa-select-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses ({supermarkets.length})</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
            </select>
          </div>
        </div>

        {/* 3. Supermarkets Grid */}
        <div className="sa-stores-grid">
          {filteredStores.length === 0 ? (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem 1rem", color: "#64748b" }}>
              <Building2 size={40} color="#cbd5e1" style={{ margin: "0 auto 12px" }} />
              <h3 style={{ margin: 0, color: "#0f172a" }}>No supermarkets match your search.</h3>
              <p style={{ margin: "4px 0 16px 0", fontSize: "13px" }}>Try adjusting your filters or add a new supermarket.</p>
              <button
                type="button"
                className="sa-btn-primary"
                onClick={() => setIsAddModalOpen(true)}
              >
                <PlusCircle size={15} />
                <span>Add Supermarket</span>
              </button>
            </div>
          ) : (
            filteredStores.map((store) => {
              const isCurrent = currentSupermarket?.code === store.code || currentSupermarket?._id === store._id;
              const isSuspended = store.status === "Suspended";
              const showPass = showPasswordMap[store._id || store.code];

              return (
                <div key={store._id || store.code} className="sa-store-card">
                  {/* Card Header */}
                  <div>
                    <div className="sa-store-card-header">
                      <div className="sa-store-brand">
                        <div className="sa-store-avatar">
                          {store.name ? store.name[0].toUpperCase() : "S"}
                        </div>
                        <div className="sa-store-title-wrap">
                          <h3>{store.name}</h3>
                          <div className="sa-store-meta-tags">
                            <span className="sa-code-pill">{store.code}</span>
                            <span className="sa-city-tag">&bull; {store.city || "Bangalore"}</span>
                          </div>
                        </div>
                      </div>

                      <span className={`sa-badge ${String(store.status || "active").toLowerCase()}`}>
                        {store.status || "Active"}
                      </span>
                    </div>

                    <p style={{ margin: "0.75rem 0 0 0", fontSize: "12px", color: "#64748b", fontStyle: "italic" }}>
                      "{store.tagline || "Autonomous Smart Retail & High-Speed Clearance"}"
                    </p>
                  </div>

                  {/* Operational Metrics Strip */}
                  <div className="sa-store-stats-strip">
                    <div className="sa-stat-col">
                      <strong>&#8377;{Number(store.totalSales || (store.code === "STR-001" ? 19250 : 9200)).toLocaleString("en-IN")}</strong>
                      <span>Total Sales</span>
                    </div>
                    <div className="sa-stat-col">
                      <strong>{store.totalOrders || (store.code === "STR-001" ? 42 : 22)}</strong>
                      <span>Orders</span>
                    </div>
                    <div className="sa-stat-col">
                      <strong>{store.totalProducts || (store.code === "STR-001" ? 20 : 18)}</strong>
                      <span>SKUs</span>
                    </div>
                  </div>

                  {/* Store Admin Login Credentials Box (Requested by user) */}
                  <div className="sa-credentials-pill-box">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#1d4ed8", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Lock size={12} />
                        STORE ADMIN LOGIN CREDENTIALS
                      </span>
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(store._id || store.code)}
                        style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: "2px" }}
                        title="Toggle password view"
                      >
                        {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>

                    <div className="sa-cred-row">
                      <span className="sa-cred-label">Username:</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span className="sa-cred-val">{store.adminUsername || "store_admin"}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(store.adminUsername || "store_admin", `u-${store.code}`)}
                          style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: "2px" }}
                          title="Copy username"
                        >
                          {copiedKey === `u-${store.code}` ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>

                    <div className="sa-cred-row">
                      <span className="sa-cred-label">Password:</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span className="sa-cred-val">
                          {showPass ? (store.adminPassword || "StoreAdmin@123") : "••••••••••••"}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(store.adminPassword || "StoreAdmin@123", `p-${store.code}`)}
                          style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: "2px" }}
                          title="Copy password"
                        >
                          {copiedKey === `p-${store.code}` ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>

                    <div className="sa-cred-row" style={{ paddingTop: "2px", borderTop: "1px dashed #cbd5e1" }}>
                      <span className="sa-cred-label">Admin Name:</span>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "#334155" }}>
                        {store.adminName || "Store Manager"}
                      </span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="sa-store-card-actions">
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        className="sa-btn-secondary"
                        style={{ padding: "5px 10px", fontSize: "12px" }}
                        onClick={() => {
                          setSelectedStoreForReset(store);
                          setNewPasswordValue("StoreAdmin@123");
                          setIsResetModalOpen(true);
                        }}
                        title="Reset Store Admin Password"
                      >
                        <KeyRound size={13} />
                        <span>Reset Pass</span>
                      </button>

                      <button
                        type="button"
                        className="sa-btn-secondary"
                        style={{
                          padding: "5px 10px",
                          fontSize: "12px",
                          color: isSuspended ? "#059669" : "#dc2626",
                          borderColor: isSuspended ? "#a7f3d0" : "#fecaca",
                        }}
                        onClick={() => handleToggleStatus(store)}
                        title={isSuspended ? "Activate Store" : "Suspend Store"}
                      >
                        <span>{isSuspended ? "Activate" : "Suspend"}</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      className="sa-btn-primary"
                      style={{ padding: "6px 14px", fontSize: "12px" }}
                      onClick={() => handleLaunchStore(store)}
                    >
                      <span>Enter Store Admin</span>
                      <ExternalLink size={12} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ADD NEW SUPERMARKET MODAL (WITH SEPARATE ADMIN CREDENTIALS)               */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="sa-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="sa-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="sa-modal-header">
              <div>
                <h3>Add New Supermarket Tenant</h3>
                <p>Register a new supermarket branch with its own separate Admin login credentials.</p>
              </div>
              <button
                type="button"
                className="sa-modal-close-btn"
                onClick={() => setIsAddModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSupermarket}>
              <div className="sa-modal-body">
                {formError && (
                  <div
                    style={{
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      color: "#991b1b",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    {formError}
                  </div>
                )}

                {/* Section 1: Supermarket Info */}
                <div className="sa-form-group">
                  <label className="sa-form-label">
                    Supermarket Name <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="sa-form-input"
                    value={formValues.name}
                    onChange={handleNameChange}
                    placeholder="e.g. Royal Mart Supermarket"
                  />
                </div>

                <div className="sa-form-grid-2">
                  <div className="sa-form-group">
                    <label className="sa-form-label">
                      Unique Branch Code <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="sa-form-input code"
                      value={formValues.code}
                      onChange={(e) => setFormValues({ ...formValues, code: e.target.value.toUpperCase() })}
                      placeholder="e.g. STR-003"
                    />
                  </div>

                  <div className="sa-form-group">
                    <label className="sa-form-label">Subscription Plan</label>
                    <select
                      className="sa-select-input"
                      style={{ width: "100%" }}
                      value={formValues.plan}
                      onChange={(e) => setFormValues({ ...formValues, plan: e.target.value })}
                    >
                      <option value="Enterprise">Enterprise (Full POS + Turnstile)</option>
                      <option value="Professional">Professional (POS & Barcodes)</option>
                      <option value="Starter">Starter (Basic Inventory)</option>
                    </select>
                  </div>
                </div>

                <div className="sa-form-grid-2">
                  <div className="sa-form-group">
                    <label className="sa-form-label">City / Location</label>
                    <input
                      type="text"
                      className="sa-form-input"
                      value={formValues.city}
                      onChange={(e) => setFormValues({ ...formValues, city: e.target.value })}
                      placeholder="e.g. Bangalore"
                    />
                  </div>

                  <div className="sa-form-group">
                    <label className="sa-form-label">Store Contact Phone</label>
                    <input
                      type="text"
                      className="sa-form-input"
                      value={formValues.phone}
                      onChange={(e) => setFormValues({ ...formValues, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

                {/* Section 2: Separate Admin Login Credentials Box */}
                <div className="sa-credential-highlight-card">
                  <div className="sa-credential-highlight-title">
                    <KeyRound size={16} />
                    <span>STORE ADMIN LOGIN CREDENTIALS (ISOLATED ACCESS)</span>
                  </div>
                  <p style={{ margin: 0, fontSize: "12px", color: "#1e40af" }}>
                    The Store Admin will use these credentials to log in. They will ONLY have access to this supermarket's inventory, barcodes, and orders.
                  </p>

                  <div className="sa-form-grid-2">
                    <div className="sa-form-group">
                      <label className="sa-form-label">
                        Admin Login Username <span className="req">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        className="sa-form-input"
                        value={formValues.adminUsername}
                        onChange={(e) => setFormValues({ ...formValues, adminUsername: e.target.value.toLowerCase().trim() })}
                        placeholder="e.g. royalmart"
                      />
                    </div>

                    <div className="sa-form-group">
                      <label className="sa-form-label">
                        Admin Login Password <span className="req">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        className="sa-form-input"
                        value={formValues.adminPassword}
                        onChange={(e) => setFormValues({ ...formValues, adminPassword: e.target.value })}
                        placeholder="e.g. StoreAdmin@123"
                      />
                    </div>
                  </div>

                  <div className="sa-form-group">
                    <label className="sa-form-label">Store Admin Name / Manager</label>
                    <input
                      type="text"
                      className="sa-form-input"
                      value={formValues.adminName}
                      onChange={(e) => setFormValues({ ...formValues, adminName: e.target.value })}
                      placeholder="e.g. Vikram Malhotra (Store Manager)"
                    />
                  </div>
                </div>
              </div>

              <div className="sa-modal-footer">
                <button
                  type="button"
                  className="sa-btn-secondary"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sa-btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating Supermarket..." : "Create Supermarket & Credentials"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RESET PASSWORD MODAL                                                      */}
      {/* ========================================================================= */}
      {isResetModalOpen && selectedStoreForReset && (
        <div className="sa-modal-overlay" onClick={() => setIsResetModalOpen(false)}>
          <div className="sa-modal-card" style={{ maxWidth: "460px" }} onClick={(e) => e.stopPropagation()}>
            <div className="sa-modal-header">
              <div>
                <h3>Reset Store Admin Password</h3>
                <p>For "{selectedStoreForReset.name}" ({selectedStoreForReset.code})</p>
              </div>
              <button
                type="button"
                className="sa-modal-close-btn"
                onClick={() => setIsResetModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit}>
              <div className="sa-modal-body">
                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>Admin Username:</span>
                  <strong style={{ display: "block", fontSize: "14px", color: "#0f172a", marginTop: "2px" }}>
                    {selectedStoreForReset.adminUsername}
                  </strong>
                </div>

                <div className="sa-form-group">
                  <label className="sa-form-label">
                    New Password <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="sa-form-input"
                    value={newPasswordValue}
                    onChange={(e) => setNewPasswordValue(e.target.value)}
                    placeholder="Enter new strong password"
                  />
                </div>
              </div>

              <div className="sa-modal-footer">
                <button
                  type="button"
                  className="sa-btn-secondary"
                  onClick={() => setIsResetModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="sa-btn-primary">
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

