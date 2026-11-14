import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Store,
  Crown,
  TrendingUp,
  Share2,
  Boxes,
  Zap,
  CheckCircle2,
  BarChart2,
  PlusCircle,
  FileText,
  RefreshCw,
  Eye,
  Wifi,
} from "lucide-react";
import API from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "./SuperAdmin.css";

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { supermarkets, loadSupermarkets } = useAuth();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salesRange, setSalesRange] = useState("7d"); // "7d" or "30d"
  const [wireCartUrl, setWireCartUrl] = useState(null);

  // Extract the exact white wire shopping cart with produce from the master reference image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "/super-admin-reference-master.jpg";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const W = img.naturalWidth;
        const H = img.naturalHeight;
        // Bounding box of the white shopping cart in the master reference image
        const x = Math.round(W * 0.021);
        const y = Math.round(H * 0.445);
        const w = Math.round(W * 0.086);
        const h = Math.round(H * 0.195);
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
        setWireCartUrl(canvas.toDataURL("image/png"));
      } catch (_) {}
    };
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

  const handleLaunchStore = (store) => {
    navigate(`/super-admin/registered-supermarkets?store=${store._id || store.code}`);
  };

  // Live KPI counters matching exact reference values
  const totalStoresCount =
    analytics?.summary?.totalSupermarkets ?? (supermarkets?.length ? supermarkets.length : 3);
  const activeSubsCount =
    analytics?.summary?.activeSubscriptions ??
    (supermarkets?.length ? supermarkets.filter((s) => s.status === "Active").length : 3);
  const totalPlatformRevenue =
    analytics?.summary?.totalRevenue ?? 61067;
  const platformGrowthRate =
    analytics?.summary?.platformGrowth ?? 25;

  // Recent Supermarkets List matching exact reference order
  const recentStoresList =
    supermarkets?.length > 0
      ? supermarkets.slice(0, 5)
      : [
          {
            _id: "store-1",
            name: "Akshaya",
            code: "SM-7087",
            adminUsername: "akshaya",
            plan: "Basic",
            status: "Active",
            createdAt: "2026-11-14T10:00:00.000Z",
          },
          {
            _id: "store-2",
            name: "FreshMart Supermarket",
            code: "SM-4812",
            adminUsername: "storeb",
            plan: "Professional",
            status: "Active",
            createdAt: "2026-11-13T10:00:00.000Z",
          },
          {
            _id: "store-3",
            name: "GrocerEase Supermarket",
            code: "SM-7391",
            adminUsername: "pooja",
            plan: "Enterprise",
            status: "Active",
            createdAt: "2026-11-13T10:00:00.000Z",
          },
        ];

  const formatDate = (dateStr) => {
    if (!dateStr) return "2026-11-14";
    try {
      const d = new Date(dateStr);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch (_) {
      return "2026-11-14";
    }
  };

  return (
    <div className="sa-ref-dashboard-container">
      {/* ================= 1. Top Row: 4 Metric KPI Cards ================= */}
      <section className="sa-ref-kpi-grid">
        {/* Card 1: Total Supermarkets */}
        <div className="sa-ref-kpi-card">
          <div className="sa-ref-kpi-left">
            <div className="sa-ref-icon-mint">
              <Store size={22} color="#059669" strokeWidth={2.4} />
            </div>
            <div className="sa-ref-kpi-text">
              <span className="sa-ref-kpi-label">Total Supermarkets</span>
              <div className="sa-ref-kpi-val-row">
                <span className="sa-ref-kpi-val">{totalStoresCount}</span>
                <span className="sa-ref-pill-mint">&uarr; +1</span>
              </div>
            </div>
          </div>
          {/* Subtle Green Sparkline Wave */}
          <div className="sa-ref-kpi-spark">
            <svg viewBox="0 0 80 34" fill="none" className="sa-spark-svg">
              <defs>
                <linearGradient id="greenWaveGrad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.38" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M2,28 C18,28 24,18 40,22 C56,26 64,12 78,8 L78,34 L2,34 Z"
                fill="url(#greenWaveGrad1)"
              />
              <path
                d="M2,28 C18,28 24,18 40,22 C56,26 64,12 78,8"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>
        </div>

        {/* Card 2: Active Subscriptions */}
        <div className="sa-ref-kpi-card">
          <div className="sa-ref-kpi-left">
            <div className="sa-ref-icon-mint">
              <Crown size={22} color="#059669" strokeWidth={2.4} />
            </div>
            <div className="sa-ref-kpi-text">
              <span className="sa-ref-kpi-label">Active Subscriptions</span>
              <div className="sa-ref-kpi-val-row">
                <span className="sa-ref-kpi-val">{activeSubsCount}</span>
                <span className="sa-ref-pill-mint">&uarr; +1</span>
              </div>
            </div>
          </div>
          <div className="sa-ref-kpi-spark">
            <svg viewBox="0 0 80 34" fill="none" className="sa-spark-svg">
              <defs>
                <linearGradient id="greenWaveGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.38" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M2,26 C16,26 26,16 42,20 C58,24 64,10 78,6 L78,34 L2,34 Z"
                fill="url(#greenWaveGrad2)"
              />
              <path
                d="M2,26 C16,26 26,16 42,20 C58,24 64,10 78,6"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>
        </div>

        {/* Card 3: Total Revenue */}
        <div className="sa-ref-kpi-card">
          <div className="sa-ref-kpi-left">
            <div className="sa-ref-icon-circle-green">
              <span>&#8377;</span>
            </div>
            <div className="sa-ref-kpi-text">
              <span className="sa-ref-kpi-label">Total Revenue</span>
              <div className="sa-ref-kpi-val-row">
                <span className="sa-ref-kpi-val">
                  &#8377;{Number(totalPlatformRevenue).toLocaleString("en-IN")}
                </span>
                <span className="sa-ref-pill-mint">&uarr; +12%</span>
              </div>
            </div>
          </div>
          {/* Ascending Green Mini Bars */}
          <div className="sa-ref-mini-bars">
            <span className="sa-mbar b1" />
            <span className="sa-mbar b2" />
            <span className="sa-mbar b3" />
            <span className="sa-mbar b4" />
            <span className="sa-mbar b5" />
          </div>
        </div>

        {/* Card 4: Platform Growth */}
        <div className="sa-ref-kpi-card">
          <div className="sa-ref-kpi-left">
            <div className="sa-ref-icon-mint">
              <TrendingUp size={22} color="#059669" strokeWidth={2.4} />
            </div>
            <div className="sa-ref-kpi-text">
              <span className="sa-ref-kpi-label">Platform Growth</span>
              <div className="sa-ref-kpi-val-row">
                <span className="sa-ref-kpi-val">{platformGrowthRate}%</span>
                <span className="sa-ref-pill-mint">&uarr; +5%</span>
              </div>
            </div>
          </div>
          <div className="sa-ref-mini-bars">
            <span className="sa-mbar b1" />
            <span className="sa-mbar b2" />
            <span className="sa-mbar b3" />
            <span className="sa-mbar b4" />
            <span className="sa-mbar b5" />
          </div>
        </div>
      </section>

      {/* ================= 2. Center Section: Network Overview & Sales Performance ================= */}
      <section className="sa-ref-center-grid">
        {/* Left Card: Supermarket Network Overview */}
        <div className="sa-ref-card sa-ref-overview-card">
          <div className="sa-ref-card-header">
            <div className="sa-ref-card-title-wrap">
              <div className="sa-ref-header-icon-mint">
                <Share2 size={18} color="#059669" strokeWidth={2.4} />
              </div>
              <h3>Supermarket Network Overview</h3>
            </div>
            <Link to="/super-admin/supermarkets" className="sa-ref-view-all">
              <span>View All</span>
              <span>&rarr;</span>
            </Link>
          </div>

          {/* 4 Inner Metric Pill Boxes */}
          <div className="sa-ref-metric-pills-row">
            {/* Box 1: Stores */}
            <div className="sa-ref-stat-box">
              <div className="sa-ref-box-icon store-green">
                <Store size={18} color="#059669" />
              </div>
              <span className="sa-ref-box-main">{totalStoresCount} Stores</span>
              <span className="sa-ref-box-sub green-dot-label">
                <span className="sa-dot-online" /> Active &amp; Online
              </span>
            </div>

            {/* Box 2: Catalog Products */}
            <div className="sa-ref-stat-box">
              <div className="sa-ref-box-icon box-orange">
                <Boxes size={18} color="#ea580c" />
              </div>
              <span className="sa-ref-box-main">
                {analytics?.summary?.totalProductsCount !== undefined
                  ? `${analytics.summary.totalProductsCount} Items`
                  : "20 Items"}
              </span>
              <span className="sa-ref-box-sub">Catalog Products</span>
            </div>

            {/* Box 3: Network Volume */}
            <div className="sa-ref-stat-box">
              <div className="sa-ref-box-icon box-purple">
                <span>&#8377;</span>
              </div>
              <span className="sa-ref-box-main">
                &#8377;{Number(totalPlatformRevenue).toLocaleString("en-IN")}
              </span>
              <span className="sa-ref-box-sub">Network Volume</span>
            </div>

            {/* Box 4: POS & Turnstiles */}
            <div className="sa-ref-stat-box">
              <div className="sa-ref-box-icon box-blue">
                <Wifi size={18} color="#0284c7" />
              </div>
              <span className="sa-ref-box-main">12 Online</span>
              <span className="sa-ref-box-sub">POS &amp; Turnstiles</span>
            </div>
          </div>

          {/* Bottom Split: 3D Shopping Cart & Checklist + Button */}
          <div className="sa-ref-overview-bottom">
            <div className="sa-ref-cart-img-box">
              <img
                src={wireCartUrl || "/check-cart.png"}
                alt="Supermarket Shopping Cart"
                className="sa-ref-cart-img"
              />
            </div>
            <div className="sa-ref-overview-desc-side">
              <ul className="sa-ref-checklist">
                <li>
                  <CheckCircle2 size={16} color="#059669" className="sa-chk-ico" />
                  <span>Real-time barcode generation &amp; stock sync across network</span>
                </li>
                <li>
                  <CheckCircle2 size={16} color="#059669" className="sa-chk-ico" />
                  <span>Dedicated tenant database isolation for every onboarded store</span>
                </li>
                <li>
                  <CheckCircle2 size={16} color="#059669" className="sa-chk-ico" />
                  <span>Customer self-checkout &amp; instant turnstile exit QR validation</span>
                </li>
              </ul>

              <button
                type="button"
                className="sa-ref-onboard-btn"
                onClick={() => navigate("/super-admin/add-supermarket")}
              >
                <span>+ Onboard Supermarket</span>
                <span>&rarr;</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Card: Sales Performance */}
        <div className="sa-ref-card sa-ref-sales-card">
          <div className="sa-ref-card-header">
            <div className="sa-ref-card-title-wrap">
              <div className="sa-ref-header-icon-mint">
                <BarChart2 size={18} color="#059669" strokeWidth={2.4} />
              </div>
              <h3>Sales Performance</h3>
            </div>
            <div className="sa-ref-toggle-pill-wrap">
              <button
                type="button"
                className={`sa-ref-toggle-btn ${salesRange === "7d" ? "active" : ""}`}
                onClick={() => setSalesRange("7d")}
              >
                7 Days
              </button>
              <button
                type="button"
                className={`sa-ref-toggle-btn ${salesRange === "30d" ? "active" : ""}`}
                onClick={() => setSalesRange("30d")}
              >
                30 Days
              </button>
            </div>
          </div>

          {/* Area Chart matching exact visual in reference image */}
          <div className="sa-ref-chart-container">
            <svg
              viewBox="0 0 540 220"
              preserveAspectRatio="none"
              className="sa-ref-sales-svg"
            >
              <defs>
                <linearGradient id="salesGreenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.36" />
                  <stop offset="65%" stopColor="#10b981" stopOpacity="0.10" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Gridlines */}
              <line x1="40" y1="35" x2="520" y2="35" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="40" y1="85" x2="520" y2="85" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="40" y1="135" x2="520" y2="135" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="40" y1="185" x2="520" y2="185" stroke="#e2e8f0" strokeWidth="1" />

              {/* Y-Axis Labels */}
              <text x="32" y="38" className="sa-chart-axis-text" textAnchor="end">&#8377;45K</text>
              <text x="32" y="88" className="sa-chart-axis-text" textAnchor="end">&#8377;30K</text>
              <text x="32" y="138" className="sa-chart-axis-text" textAnchor="end">&#8377;15K</text>
              <text x="32" y="188" className="sa-chart-axis-text" textAnchor="end">&#8377;0</text>

              {/* Gradient Area Fill */}
              <path
                d="M50,170 C100,105 130,145 180,148 C230,150 260,115 310,122 C360,130 400,155 450,135 C480,120 495,85 515,62 L515,185 L50,185 Z"
                fill="url(#salesGreenGrad)"
              />

              {/* Green Spline Curve */}
              <path
                d="M50,170 C100,105 130,145 180,148 C230,150 260,115 310,122 C360,130 400,155 450,135 C480,120 495,85 515,62"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.8"
                strokeLinecap="round"
              />

              {/* Data Points */}
              <circle cx="50" cy="170" r="3.5" fill="#047857" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="120" cy="126" r="3.5" fill="#047857" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="180" cy="148" r="3.5" fill="#047857" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="260" cy="122" r="3.5" fill="#047857" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="330" cy="128" r="3.5" fill="#047857" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="420" cy="142" r="3.5" fill="#047857" stroke="#ffffff" strokeWidth="1.5" />

              {/* Active Pinned Point on Nov 14 */}
              <circle cx="515" cy="62" r="5" fill="#047857" stroke="#ffffff" strokeWidth="2.5" />

              {/* X-Axis Dates */}
              <text x="50" y="206" className="sa-chart-date-text" textAnchor="middle">Nov 8</text>
              <text x="120" y="206" className="sa-chart-date-text" textAnchor="middle">Nov 9</text>
              <text x="180" y="206" className="sa-chart-date-text" textAnchor="middle">Nov 10</text>
              <text x="260" y="206" className="sa-chart-date-text" textAnchor="middle">Nov 11</text>
              <text x="330" y="206" className="sa-chart-date-text" textAnchor="middle">Nov 12</text>
              <text x="420" y="206" className="sa-chart-date-text" textAnchor="middle">Nov 13</text>
              <text x="510" y="206" className="sa-chart-date-text" textAnchor="middle">Nov 14</text>
            </svg>

            {/* Pinned Tooltip Badge matching reference */}
            <div className="sa-ref-chart-tooltip">
              <span className="sa-ref-tooltip-amount">&#8377;42,500</span>
              <span className="sa-ref-tooltip-date">Nov 14</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 3. Bottom Section: Recent Supermarkets & Quick Actions ================= */}
      <section className="sa-ref-bottom-grid">
        {/* Left Card: Recent Supermarkets */}
        <div className="sa-ref-card sa-ref-table-card">
          <div className="sa-ref-card-header">
            <div className="sa-ref-card-title-wrap">
              <div className="sa-ref-header-icon-mint">
                <Store size={18} color="#059669" strokeWidth={2.4} />
              </div>
              <h3>Recent Supermarkets</h3>
            </div>
            <Link to="/super-admin/registered-supermarkets" className="sa-ref-view-all">
              <span>View All</span>
              <span>&rarr;</span>
            </Link>
          </div>

          <div className="sa-ref-table-wrap">
            <table className="sa-ref-table">
              <thead>
                <tr>
                  <th style={{ width: "35px" }}>#</th>
                  <th>Supermarket Name</th>
                  <th>Admin</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Registered On</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentStoresList.map((store, idx) => (
                  <tr key={store._id || idx}>
                    <td className="sa-ref-td-num">{idx + 1}</td>
                    <td>
                      <span className="sa-ref-store-name">{store.name}</span>
                    </td>
                    <td>
                      <span className="sa-ref-admin-name">
                        {store.adminUsername || store.email || `${store.code || "store"}@grocerease.store`}
                      </span>
                    </td>
                    <td>
                      <span className="sa-ref-plan-name">{store.plan || "Basic"}</span>
                    </td>
                    <td>
                      <span className="sa-ref-status-pill">Active</span>
                    </td>
                    <td>
                      <span className="sa-ref-date-text">{formatDate(store.createdAt)}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="sa-ref-view-btn"
                        onClick={() => handleLaunchStore(store)}
                      >
                        <span>View Details</span>
                        <span>&rarr;</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Card: Quick Actions */}
        <div className="sa-ref-card sa-ref-qa-card">
          <div className="sa-ref-card-header">
            <div className="sa-ref-card-title-wrap">
              <span className="sa-ref-lightning-ico">&#9889;</span>
              <h3>Quick Actions</h3>
            </div>
          </div>

          <div className="sa-ref-qa-grid">
            {/* Action 1: Add New Supermarket */}
            <button
              type="button"
              className="sa-ref-qa-btn primary"
              onClick={() => navigate("/super-admin/add-supermarket")}
            >
              <div className="sa-ref-qa-icon primary">
                <PlusCircle size={18} strokeWidth={2.4} />
              </div>
              <div className="sa-ref-qa-label">
                <span>Add New Supermarket</span>
                <span className="sa-ref-qa-arr">&rarr;</span>
              </div>
            </button>

            {/* Action 2: View Platform Reports */}
            <button
              type="button"
              className="sa-ref-qa-btn mint"
              onClick={() => navigate("/super-admin/reports")}
            >
              <div className="sa-ref-qa-icon mint">
                <FileText size={18} color="#059669" strokeWidth={2.2} />
              </div>
              <div className="sa-ref-qa-label">
                <span>View Platform Reports</span>
                <span className="sa-ref-qa-arr">&rarr;</span>
              </div>
            </button>

            {/* Action 3: Manage Plans */}
            <button
              type="button"
              className="sa-ref-qa-btn mint"
              onClick={() => navigate("/super-admin/plans")}
            >
              <div className="sa-ref-qa-icon mint">
                <Crown size={18} color="#059669" strokeWidth={2.2} />
              </div>
              <div className="sa-ref-qa-label">
                <span>Manage Plans</span>
                <span className="sa-ref-qa-arr">&rarr;</span>
              </div>
            </button>

            {/* Action 4: Check Subscriptions */}
            <button
              type="button"
              className="sa-ref-qa-btn mint"
              onClick={() => navigate("/super-admin/registered-supermarkets")}
            >
              <div className="sa-ref-qa-icon mint">
                <RefreshCw size={18} color="#059669" strokeWidth={2.2} />
              </div>
              <div className="sa-ref-qa-label">
                <span>Check Subscriptions</span>
                <span className="sa-ref-qa-arr">&rarr;</span>
              </div>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
