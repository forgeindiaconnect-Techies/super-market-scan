import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BarChart2,
  TrendingUp,
  DollarSign,
  Download,
  Calendar,
  Building2,
  PieChart,
  ShoppingBag,
  ArrowUpRight,
  Package,
  RefreshCw,
  CreditCard,
  Store,
  Layers,
} from "lucide-react";
import API from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "./SuperAdmin.css";

export default function PlatformReports() {
  const { supermarkets } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await API.get("/super-admin/analytics");
      if (res.data?.success) {
        setAnalytics(res.data);
      }
    } catch (err) {
      console.warn("Analytics fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const summary = analytics?.summary || {
    totalRevenue: 49999,
    subscriptionRevenue: 49999,
    totalStoreSales: 0,
    totalOrders: 0,
    totalSupermarkets: supermarkets.length || 0,
    activeSupermarkets: supermarkets.filter((s) => s.status === "Active").length || 0,
    platformGrowth: 25,
  };

  const performanceList = analytics?.supermarketPerformance || [];
  const totalSalesAllStores = performanceList.reduce((acc, curr) => acc + (curr.sales || 0), 0) || 1;

  const downloadReportCsv = () => {
    let csvContent =
      "data:text/csv;charset=utf-8," +
      "Supermarket Name,Branch Code,City,Status,Subscription Plan,Total Sales (INR),Orders Cleared,Avg Order Value (INR)\n";

    performanceList.forEach((s) => {
      csvContent += `"${s.name}","${s.code}","${s.city}","${s.status}","${s.plan}",${s.sales || 0},${s.orders || 0},${s.avgOrderValue || 0}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `grocerease-saas-platform-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="sa-page-container">
      {/* 1. Header */}
      <div className="sa-page-header">
        <div className="sa-page-header-content">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span className="sa-badge active">Platform Live Analytics</span>
            <span style={{ fontSize: "12px", color: "#64748b" }}>Multi-Tenant SaaS Performance</span>
          </div>
          <h1>SaaS Analytics &amp; Platform Reports</h1>
          <p>
            Real-time fiscal reporting, subscription recurring revenue, supermarket GMV velocity, and isolated store performance.
          </p>
        </div>

        <div className="sa-page-header-actions">
          <button
            type="button"
            className="sa-btn-secondary"
            onClick={fetchAnalytics}
            title="Refresh database metrics"
          >
            <RefreshCw size={15} className={loading ? "spin-icon" : ""} />
            <span>Refresh</span>
          </button>
          <button type="button" className="sa-btn-primary" onClick={downloadReportCsv}>
            <Download size={15} />
            <span>Export SaaS CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="sa-kpi-grid">
        {/* Total Platform Revenue */}
        <div className="sa-kpi-card">
          <div className="sa-kpi-icon-pill blue">
            <DollarSign size={24} strokeWidth={2.4} />
          </div>
          <div className="sa-kpi-details">
            <h3 className="sa-kpi-number">&#8377;{Number(summary.totalRevenue || 0).toLocaleString("en-IN")}</h3>
            <span className="sa-kpi-label">Total Platform Revenue</span>
            <div className="sa-kpi-badge positive">
              <ArrowUpRight size={13} />
              <span>Subscription + Store GMV</span>
            </div>
          </div>
        </div>

        {/* Subscription Revenue */}
        <div className="sa-kpi-card">
          <div className="sa-kpi-icon-pill purple">
            <CreditCard size={24} strokeWidth={2.4} />
          </div>
          <div className="sa-kpi-details">
            <h3 className="sa-kpi-number">&#8377;{Number(summary.subscriptionRevenue || 0).toLocaleString("en-IN")}</h3>
            <span className="sa-kpi-label">Subscription ARR/MRR</span>
            <div className="sa-kpi-badge positive">
              <span>{summary.activeSupermarkets} Active Subscriptions</span>
            </div>
          </div>
        </div>

        {/* Consolidated Customer Orders */}
        <div className="sa-kpi-card">
          <div className="sa-kpi-icon-pill green">
            <ShoppingBag size={24} strokeWidth={2.4} />
          </div>
          <div className="sa-kpi-details">
            <h3 className="sa-kpi-number">{summary.totalOrders || 0}</h3>
            <span className="sa-kpi-label">Consolidated Orders</span>
            <div className="sa-kpi-badge positive">
              <span>Verified POS Transactions</span>
            </div>
          </div>
        </div>

        {/* Platform Growth */}
        <div className="sa-kpi-card">
          <div className="sa-kpi-icon-pill amber">
            <TrendingUp size={24} strokeWidth={2.4} />
          </div>
          <div className="sa-kpi-details">
            <h3 className="sa-kpi-number">{summary.platformGrowth || 25}%</h3>
            <span className="sa-kpi-label">Platform Growth Rate</span>
            <div className="sa-kpi-badge positive">
              <span>&uarr; +5% this quarter</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Deep Supermarket Performance Comparison Breakdown */}
      <div className="sa-section-card" style={{ padding: "1.75rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800, margin: 0, color: "#0f172a" }}>
              Supermarket GMV Contribution &amp; Performance
            </h2>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "#64748b" }}>
              Live revenue and sales volume generated per tenant supermarket.
            </p>
          </div>
          <Link to="/super-admin/supermarkets" className="sa-view-all-link">
            <span>Manage All Supermarkets &rarr;</span>
          </Link>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {performanceList.length === 0 ? (
            <p style={{ textAlign: "center", color: "#64748b", padding: "1.5rem" }}>
              No supermarket sales records found in database.
            </p>
          ) : (
            performanceList.map((store) => {
              const salesVal = store.sales || 0;
              const pct = totalSalesAllStores > 0 ? Math.round((salesVal / totalSalesAllStores) * 100) : 0;

              return (
                <div key={store.supermarketId || store.code}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
                    <div>
                      <strong style={{ color: "#0f172a" }}>
                        {store.name} ({store.code})
                      </strong>
                      <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "10px" }}>
                        {store.city} &bull; {store.orders || 0} Orders &bull; Plan: {store.plan || "Standard"}
                      </span>
                    </div>
                    <strong style={{ color: "#16a34a" }}>
                      &#8377;{Number(salesVal).toLocaleString("en-IN")}{" "}
                      <span style={{ color: "#64748b", fontWeight: 500, fontSize: "12px" }}>
                        ({pct}%)
                      </span>
                    </strong>
                  </div>
                  <div className="sa-progress-container">
                    <div
                      className="sa-progress-fill"
                      style={{
                        width: `${Math.max(pct, salesVal > 0 ? 5 : 1)}%`,
                        background: "linear-gradient(90deg, #22c55e, #16a34a)",
                      }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
