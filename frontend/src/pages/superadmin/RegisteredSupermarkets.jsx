import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2,
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  CreditCard,
  ExternalLink,
  PlusCircle,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Download,
  Eye,
  KeyRound,
  Store,
} from "lucide-react";
import API from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "./SuperAdmin.css";

export default function RegisteredSupermarkets() {
  const navigate = useNavigate();
  const { supermarkets, switchSupermarket, loadSupermarkets } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");

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
    loadSupermarkets();
  }, []);

  const totalStores = supermarkets.length;
  const activeStores = supermarkets.filter((s) => s.status === "Active").length;
  const inactiveStores = supermarkets.filter(
    (s) => s.status === "Suspended" || s.status === "Inactive"
  ).length;
  const pendingStores = supermarkets.filter(
    (s) => s.status === "Pending" || s.status === "Trial"
  ).length;
  const expiredStores = supermarkets.filter((s) => s.status === "Expired").length;

  const filteredStores = supermarkets.filter((store) => {
    const matchesSearch =
      (store.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (store.code || "").toLowerCase().includes(search.toLowerCase()) ||
      (store.city || "").toLowerCase().includes(search.toLowerCase()) ||
      (store.adminUsername || "").toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && store.status === "Active") ||
      (statusFilter === "inactive" &&
        (store.status === "Suspended" || store.status === "Inactive")) ||
      (statusFilter === "pending" &&
        (store.status === "Pending" || store.status === "Trial"));

    const matchesPlan =
      planFilter === "all" ||
      (store.plan || "").toLowerCase() === planFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesPlan;
  });

  const handleLaunchStore = (store) => {
    switchSupermarket(store);
    navigate("/admin");
  };

  return (
    <div className="sa-page-container">
      {/* 1. Header */}
      <div className="sa-page-header">
        <div className="sa-page-header-content">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span className="sa-badge active">Supermarket Directory</span>
            <span style={{ fontSize: "12px", color: "#64748b" }}>Multi-Tenant Master Registry</span>
          </div>
          <h1>Registered Supermarkets & Licensing Status</h1>
          <p>
            Complete directory of all registered supermarket chains, branch codes, active subscription statuses, and isolated tenant accounts.
          </p>
        </div>

        <div className="sa-page-header-actions">
          <button
            type="button"
            className="sa-btn-secondary"
            onClick={() => {
              loadSupermarkets();
              fetchAnalytics();
            }}
          >
            <RefreshCw size={15} className={loading ? "spin-icon" : ""} />
            <span>Sync</span>
          </button>

          <Link to="/super-admin/supermarkets" className="sa-btn-primary">
            <PlusCircle size={16} />
            <span>Add Supermarket</span>
          </Link>
        </div>
      </div>

      {/* 2. Registration Status KPI Ribbon (5 Tiles) */}
      <section className="sa-kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        {/* Total Registered */}
        <div className="sa-kpi-card">
          <div className="sa-kpi-icon-pill green">
            <Building2 size={22} strokeWidth={2.4} />
          </div>
          <div className="sa-kpi-details">
            <h3 className="sa-kpi-number">{totalStores}</h3>
            <span className="sa-kpi-label">Total Registered</span>
            <div className="sa-kpi-badge positive">
              <span>All Supermarkets</span>
            </div>
          </div>
        </div>

        {/* Active Supermarkets */}
        <div className="sa-kpi-card">
          <div className="sa-kpi-icon-pill green">
            <CheckCircle2 size={22} strokeWidth={2.4} />
          </div>
          <div className="sa-kpi-details">
            <h3 className="sa-kpi-number">{activeStores}</h3>
            <span className="sa-kpi-label">Active Supermarkets</span>
            <div className="sa-kpi-badge positive">
              <span>Online & Operational</span>
            </div>
          </div>
        </div>

        {/* Inactive / Suspended */}
        <div className="sa-kpi-card">
          <div className="sa-kpi-icon-pill red">
            <AlertCircle size={22} strokeWidth={2.4} />
          </div>
          <div className="sa-kpi-details">
            <h3 className="sa-kpi-number">{inactiveStores}</h3>
            <span className="sa-kpi-label">Inactive Supermarkets</span>
            <div className="sa-kpi-badge neutral">
              <span>Suspended Stores</span>
            </div>
          </div>
        </div>

        {/* Pending Registrations */}
        <div className="sa-kpi-card">
          <div className="sa-kpi-icon-pill amber">
            <Clock size={22} strokeWidth={2.4} />
          </div>
          <div className="sa-kpi-details">
            <h3 className="sa-kpi-number">{pendingStores}</h3>
            <span className="sa-kpi-label">Pending / Trial</span>
            <div className="sa-kpi-badge warning">
              <span>Verification</span>
            </div>
          </div>
        </div>

        {/* Expired Subscriptions */}
        <div className="sa-kpi-card">
          <div className="sa-kpi-icon-pill purple">
            <CreditCard size={22} strokeWidth={2.4} />
          </div>
          <div className="sa-kpi-details">
            <h3 className="sa-kpi-number">{expiredStores}</h3>
            <span className="sa-kpi-label">Expired Subscriptions</span>
            <div className="sa-kpi-badge neutral">
              <span>Renewal Awaiting</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Filter Bar & Search */}
      <div className="sa-table-card">
        <div className="sa-table-header" style={{ flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Building2 size={18} color="#16a34a" />
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>
              Supermarket Registration Registry ({filteredStores.length})
            </h3>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {/* Search Input */}
            <div className="sa-search-wrap">
              <Search size={15} />
              <input
                type="text"
                placeholder="Search store name, code, city, username..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="sa-filter-select"
            >
              <option value="all">All Statuses ({totalStores})</option>
              <option value="active">Active Only ({activeStores})</option>
              <option value="inactive">Inactive / Suspended ({inactiveStores})</option>
              <option value="pending">Pending / Trial ({pendingStores})</option>
            </select>

            {/* Plan Filter */}
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="sa-filter-select"
            >
              <option value="all">All Subscription Plans</option>
              <option value="basic">Basic Plan</option>
              <option value="standard">Standard Plan</option>
              <option value="business">Business Plan</option>
              <option value="premium">Premium Plan</option>
              <option value="enterprise">Enterprise Plan</option>
            </select>
          </div>
        </div>

        {/* 4. Table */}
        <div className="sa-table-responsive">
          <table className="sa-data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Supermarket Details</th>
                <th>Branch Code</th>
                <th>Location</th>
                <th>Admin Username</th>
                <th>Assigned Plan</th>
                <th>Status</th>
                <th>Registered Date</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStores.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                    No registered supermarkets match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredStores.map((store, idx) => (
                  <tr key={store._id || store.code}>
                    <td><strong>{idx + 1}</strong></td>

                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "9px",
                            background: "#ECFDF5",
                            color: "#059669",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            border: "1px solid #A7F3D0",
                          }}
                        >
                          {store.name ? store.name.charAt(0).toUpperCase() : "S"}
                        </div>
                        <div>
                          <strong style={{ color: "#0F172A", display: "block", fontSize: "13px" }}>
                            {store.name}
                          </strong>
                          <small style={{ color: "#64748B" }}>
                            {store.email || `${store.adminUsername}@store.com`}
                          </small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="sa-code-badge">{store.code}</span>
                    </td>

                    <td>
                      <span style={{ fontSize: "12px", color: "#334155" }}>
                        {store.city || "Bangalore"}, {store.state || "Karnataka"}
                      </span>
                    </td>

                    <td>
                      <span style={{ fontWeight: 700, color: "#166534", fontFamily: "monospace" }}>
                        {store.adminUsername}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`sa-plan-badge ${
                          (store.plan || "premium").toLowerCase() === "enterprise"
                            ? "enterprise"
                            : (store.plan || "premium").toLowerCase() === "premium"
                            ? "premium"
                            : (store.plan || "basic").toLowerCase() === "basic"
                            ? "basic"
                            : "standard"
                        }`}
                      >
                        {store.plan || "Standard"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`sa-status-badge ${
                          store.status === "Active"
                            ? "active"
                            : store.status === "Suspended"
                            ? "suspended"
                            : "trial"
                        }`}
                      >
                        {store.status === "Active" && <CheckCircle2 size={12} />}
                        {store.status !== "Active" && <AlertCircle size={12} />}
                        {store.status || "Active"}
                      </span>
                    </td>

                    <td>
                      <span style={{ fontSize: "12px", color: "#64748B" }}>
                        {store.createdAt
                          ? new Date(store.createdAt).toLocaleDateString("en-IN", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "2025-11-10"}
                      </span>
                    </td>

                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          type="button"
                          className="sa-action-btn primary"
                          onClick={() => handleLaunchStore(store)}
                          title="Enter Store Admin Dashboard"
                        >
                          <ExternalLink size={13} />
                          <span>Enter Admin</span>
                        </button>

                        <button
                          type="button"
                          className="sa-action-btn secondary"
                          onClick={() => navigate("/super-admin/supermarkets")}
                          title="Manage Credentials & Settings"
                        >
                          <KeyRound size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

