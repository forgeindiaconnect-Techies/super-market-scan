import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Building2,
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  CreditCard,
  PlusCircle,
  RefreshCw,
  ShieldCheck,
  Calendar,
  Layers,
  TrendingUp,
  Download,
  Eye,
  Store,
  ArrowLeft,
  ShoppingBag,
  ShoppingCart,
  Package,
  DollarSign,
  BarChart3,
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
  Hash,
  UserCheck,
  ChevronRight,
  FileText,
  Boxes,
  ArrowUpRight,
  Trophy,
  Check,
} from "lucide-react";
import API from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "./SuperAdmin.css";

export default function RegisteredSupermarkets() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { supermarkets: authSupermarkets, loadSupermarkets } = useAuth();

  // List View States
  const [loadingList, setLoadingList] = useState(false);
  const [liveStores, setLiveStores] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");

  // Selected Store Drill-Down States
  const storeParam = searchParams.get("store");
  const [selectedStoreId, setSelectedStoreId] = useState(storeParam || null);
  const [detailData, setDetailData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState(null);

  // Detail View Filters & Tabs
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [productStockFilter, setProductStockFilter] = useState("all"); // "all" | "in-stock" | "low-stock" | "out-of-stock"
  const [analyticsView, setAnalyticsView] = useState("daily"); // "daily" | "monthly"
  const [analyticsProductTab, setAnalyticsProductTab] = useState("top-selling"); // "top-selling" | "low-stock"

  // Fetch master supermarkets directly from database
  const fetchLiveSupermarkets = useCallback(async () => {
    try {
      setLoadingList(true);
      const res = await API.get("/super-admin/supermarkets");
      if (res.data?.success && Array.isArray(res.data.supermarkets)) {
        setLiveStores(res.data.supermarkets);
      }
    } catch (err) {
      console.warn("Live supermarkets fetch notice:", err.message);
    } finally {
      setLoadingList(false);
    }
  }, []);

  // Synchronize URL query parameter with selectedStoreId
  useEffect(() => {
    if (storeParam && storeParam !== selectedStoreId) {
      setSelectedStoreId(storeParam);
    }
  }, [storeParam]);

  // Fetch individual supermarket details strictly isolated
  const fetchSupermarketDetails = useCallback(async (storeId) => {
    if (!storeId) return;
    try {
      setLoadingDetail(true);
      setDetailError(null);
      const res = await API.get(`/super-admin/supermarkets/${storeId}/details`);
      if (res.data?.success) {
        setDetailData(res.data);
      } else {
        setDetailError(res.data?.message || "Failed to load supermarket details.");
      }
    } catch (err) {
      console.error("Supermarket detail fetch error:", err);
      setDetailError(
        err.response?.data?.message ||
          err.message ||
          "Failed to retrieve supermarket tracking details."
      );
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  // When selectedStoreId changes, fetch details
  useEffect(() => {
    if (selectedStoreId) {
      fetchSupermarketDetails(selectedStoreId);
    } else {
      setDetailData(null);
      setDetailError(null);
    }
  }, [selectedStoreId, fetchSupermarketDetails]);

  // Initial load
  useEffect(() => {
    fetchLiveSupermarkets();
    if (loadSupermarkets) loadSupermarkets();
  }, [fetchLiveSupermarkets, loadSupermarkets]);

  // Effective Supermarkets array prioritizing live DB records
  const effectiveStores = liveStores.length > 0 ? liveStores : authSupermarkets;

  // Handlers for switching views
  const handleSelectStore = (store) => {
    const storeId = store._id || store.code;
    setSelectedStoreId(storeId);
    setSearchParams({ store: storeId });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToList = () => {
    setSelectedStoreId(null);
    setDetailData(null);
    setDetailError(null);
    setSearchParams({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Filtered supermarkets for list view
  const totalStores = effectiveStores.length;
  const activeStores = effectiveStores.filter((s) => s.status === "Active").length;
  const inactiveStores = effectiveStores.filter(
    (s) => s.status === "Suspended" || s.status === "Inactive"
  ).length;
  const pendingStores = effectiveStores.filter(
    (s) => s.status === "Pending" || s.status === "Trial"
  ).length;
  const expiredStores = effectiveStores.filter((s) => s.status === "Expired").length;

  const filteredStores = effectiveStores.filter((store) => {
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

  // Filtered products inside selected supermarket detailed view
  const rawProducts = detailData?.productTracking?.products || [];
  const productCategories = Array.from(
    new Set(rawProducts.map((p) => p.category).filter(Boolean))
  );

  const inStockCount = rawProducts.filter((p) => p.stockStatus === "In Stock").length;
  const lowStockCount = rawProducts.filter((p) => p.stockStatus === "Low Stock").length;
  const outOfStockCount = rawProducts.filter((p) => p.stockStatus === "Out of Stock").length;

  const filteredProducts = rawProducts.filter((prod) => {
    const matchesSearch =
      (prod.name || "").toLowerCase().includes(productSearch.toLowerCase()) ||
      (prod.barcode || "").toLowerCase().includes(productSearch.toLowerCase()) ||
      (prod.brand || "").toLowerCase().includes(productSearch.toLowerCase());
    const matchesCat =
      productCategoryFilter === "all" || prod.category === productCategoryFilter;
    const matchesStock =
      productStockFilter === "all" ||
      (productStockFilter === "in-stock" && prod.stockStatus === "In Stock") ||
      (productStockFilter === "low-stock" && prod.stockStatus === "Low Stock") ||
      (productStockFilter === "out-of-stock" && prod.stockStatus === "Out of Stock");
    return matchesSearch && matchesCat && matchesStock;
  });

  // CSV Export helper for this supermarket
  const handleExportCSV = () => {
    const store = detailData?.supermarket;
    if (!store || !rawProducts.length) return;
    const headers = [
      "Product Name",
      "Category",
      "Brand",
      "Barcode",
      "Unit Price (INR)",
      "Sold Quantity",
      "Available Stock",
      "Remaining Stock",
      "Stock Status",
      "Total Revenue (INR)",
    ];
    const rows = rawProducts.map((p) => [
      `"${(p.name || "").replace(/"/g, '""')}"`,
      `"${(p.category || "").replace(/"/g, '""')}"`,
      `"${(p.brand || "").replace(/"/g, '""')}"`,
      `"${p.barcode || ""}"`,
      p.price || 0,
      p.soldQuantity || 0,
      p.availableStock || 0,
      p.remainingStock || 0,
      `"${p.stockStatus || "In Stock"}"`,
      p.totalRevenue || 0,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `${store.code}_${store.name.replace(/[^a-zA-Z0-9]/g, "_")}_inventory_report.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* =========================================================================
     VIEW A: DETAILED DRILL-DOWN DASHBOARD FOR SINGLE SUPERMARKET
     ========================================================================= */
  if (selectedStoreId) {
    const store = detailData?.supermarket;
    const tracking = detailData?.productTracking;
    const sales = detailData?.salesAndOrders;
    const analytics = detailData?.performanceAnalytics;
    const recentOrders = detailData?.recentOrders || [];

    // 7 Days fallback dataset for line chart
    const dailyData =
      analytics?.dailySalesReports && analytics.dailySalesReports.length > 0
        ? analytics.dailySalesReports
        : Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return {
              label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
              sales: 0,
              orders: 0,
            };
          });

    const maxSales = Math.max(...dailyData.map((d) => d.sales || 0), 3);

    return (
      <div className="sa-page-container">
        {/* Top Navigation Bar: Back Button */}
        <div className="sa-detail-back-bar">
          <button
            type="button"
            className="sa-back-btn"
            onClick={handleBackToList}
            title="Return to full registered supermarkets list"
          >
            <ArrowLeft size={16} />
            <span>Back to Registered Supermarkets</span>
          </button>
        </div>

        {/* Loading / Error States */}
        {loadingDetail && !detailData ? (
          <div className="sa-section-card" style={{ padding: "60px 20px", textAlign: "center" }}>
            <RefreshCw size={36} className="spin-icon" style={{ color: "#16a34a", margin: "0 auto 16px auto" }} />
            <h3 style={{ margin: "0 0 8px 0", color: "#172b24" }}>Loading Supermarket Tracking Dashboard...</h3>
            <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
              Retrieving live catalog, sales, inventory and customer records from database.
            </p>
          </div>
        ) : detailError ? (
          <div className="sa-section-card" style={{ padding: "40px 20px", textAlign: "center", border: "1px solid #fecaca" }}>
            <AlertTriangle size={36} style={{ color: "#dc2626", margin: "0 auto 16px auto" }} />
            <h3 style={{ margin: "0 0 8px 0", color: "#991b1b" }}>Failed to Load Supermarket Details</h3>
            <p style={{ margin: "0 0 16px 0", color: "#64748b", fontSize: "14px" }}>{detailError}</p>
            <button type="button" className="sa-btn-primary" onClick={() => fetchSupermarketDetails(selectedStoreId)}>
              Try Again
            </button>
          </div>
        ) : store ? (
          <>
            {/* 1. Supermarket Profile Banner Card with Storefront Visual */}
            <div className="sa-store-hero-banner-card">
              {/* Left Profile Details */}
              <div className="sa-hero-profile-side">
                <div className="sa-hero-avatar-box">
                  {store.logoUrl ? (
                    <img
                      src={store.logoUrl}
                      alt={store.name}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        if (e.currentTarget.nextSibling) {
                          e.currentTarget.nextSibling.style.display = "flex";
                        }
                      }}
                    />
                  ) : null}
                  <div
                    className="sa-hero-avatar-fallback"
                    style={{ display: store.logoUrl ? "none" : "flex" }}
                  >
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M3 3H5L6.68 14.39C6.77 15.03 7.32 15.5 7.96 15.5H18.04C18.68 15.5 19.23 15.03 19.32 14.39L20.5 6.5H6"
                        stroke="#16a34a"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle cx="9" cy="19.5" r="1.5" fill="#16a34a" />
                      <circle cx="17" cy="19.5" r="1.5" fill="#16a34a" />
                      <path
                        d="M16 2.5C14 2 12.5 3.5 12 5.5C14 6 16.5 4.5 16 2.5Z"
                        fill="#22c55e"
                      />
                    </svg>
                  </div>
                </div>

                <div className="sa-hero-info-col">
                  <div className="sa-hero-title-row">
                    <h1 className="sa-hero-store-name">
                      {store.name} ({store.code})
                    </h1>
                    <CheckCircle2 size={20} className="sa-verified-check-icon" />
                  </div>

                  <p className="sa-hero-store-tagline">
                    {store.tagline || "Smart Supermarket & Instant Gate Clearance"}
                  </p>

                  <div className="sa-hero-meta-pills">
                    <span className="sa-hero-plan-pill">
                      ★ {store.plan || "Basic"} Plan
                    </span>
                    <span className="sa-hero-status-pill">
                      <span className="sa-green-dot-pulse" />
                      {store.status || "Active"}
                    </span>
                    <span className="sa-hero-meta-item">
                      <MapPin size={13} color="#16a34a" />
                      <span>Location: {store.city || "Bangalore"}, {store.state || "Karnataka"}</span>
                    </span>
                    <span className="sa-hero-meta-item">
                      <Calendar size={13} color="#16a34a" />
                      <span>
                        Registered:{" "}
                        {store.createdAt
                          ? new Date(store.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "14 Nov 2026"}
                      </span>
                    </span>
                    <span className="sa-hero-meta-item isolation">
                      <ShieldCheck size={14} color="#16a34a" />
                      <span>Tenant Isolation: <strong>Active &amp; Verified</strong></span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Visual Side: Storefront Photo + Action Buttons */}
              <div className="sa-hero-banner-visual-side">
                <img
                  src="/supermarket-storefront-banner.png"
                  alt="Supermarket Storefront"
                  className="sa-hero-storefront-img"
                />
                <div className="sa-hero-storefront-mask" />

                <div className="sa-hero-banner-buttons">
                  <button
                    type="button"
                    className="sa-btn-hero-export"
                    onClick={handleExportCSV}
                    title={`Export ${store.name} inventory data as CSV`}
                  >
                    <Download size={14} />
                    <span>Export CSV</span>
                  </button>

                  <button
                    type="button"
                    className="sa-btn-hero-refresh"
                    onClick={() => fetchSupermarketDetails(selectedStoreId)}
                    disabled={loadingDetail}
                    title="Refresh live supermarket metrics"
                  >
                    <RefreshCw size={14} className={loadingDetail ? "spin-icon" : ""} />
                    <span>Refresh Store Data</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. 6 KPI Cards Ribbon */}
            <section className="sa-detail-kpi-grid">
              {/* 1. Total Sales Revenue */}
              <div className="sa-kpi-card">
                <div className="sa-kpi-icon-pill green">
                  <span style={{ fontSize: "18px", fontWeight: 900 }}>₹</span>
                </div>
                <div className="sa-kpi-details">
                  <h3 className="sa-kpi-number">
                    ₹{(sales?.totalSalesAmount || 0).toLocaleString("en-IN")}
                  </h3>
                  <span className="sa-kpi-label">Total Sales Revenue</span>
                  <div className="sa-kpi-badge positive" style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
                    <TrendingUp size={11} />
                    <span>Live POS Checkouts</span>
                  </div>
                </div>
              </div>

              {/* 2. Live POS Checkouts */}
              <div className="sa-kpi-card">
                <div className="sa-kpi-icon-pill blue">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <line x1="6" y1="8" x2="10" y2="8"/>
                    <line x1="14" y1="8" x2="18" y2="8"/>
                    <line x1="6" y1="12" x2="18" y2="12"/>
                    <line x1="6" y1="16" x2="12" y2="16"/>
                  </svg>
                </div>
                <div className="sa-kpi-details">
                  <h3 className="sa-kpi-number">
                    {sales?.completedOrdersCount || 0}
                  </h3>
                  <span className="sa-kpi-label">Live POS Checkouts</span>
                </div>
              </div>

              {/* 3. Total Orders */}
              <div className="sa-kpi-card">
                <div className="sa-kpi-icon-pill purple">
                  <ShoppingCart size={20} strokeWidth={2.4} />
                </div>
                <div className="sa-kpi-details">
                  <h3 className="sa-kpi-number">{sales?.totalOrders || 0}</h3>
                  <span className="sa-kpi-label">Total Orders</span>
                  <div className="sa-kpi-badge positive">
                    <span>{sales?.completedOrdersCount || 0} Completed</span>
                  </div>
                </div>
              </div>

              {/* 4. Shopper Customers */}
              <div className="sa-kpi-card">
                <div className="sa-kpi-icon-pill orange">
                  <Users size={20} strokeWidth={2.4} />
                </div>
                <div className="sa-kpi-details">
                  <h3 className="sa-kpi-number">{sales?.totalCustomers || 0}</h3>
                  <span className="sa-kpi-label">Shopper Customers</span>
                  <div className="sa-kpi-badge neutral">
                    <span>Unique Shoppers</span>
                  </div>
                </div>
              </div>

              {/* 5. Products in Catalog */}
              <div className="sa-kpi-card">
                <div className="sa-kpi-icon-pill teal">
                  <Boxes size={20} strokeWidth={2.4} />
                </div>
                <div className="sa-kpi-details">
                  <h3 className="sa-kpi-number">{tracking?.totalProducts || 0}</h3>
                  <span className="sa-kpi-label">Products in Catalog</span>
                  <div className="sa-kpi-badge warning">
                    <span>Active SKUs</span>
                  </div>
                </div>
              </div>

              {/* 6. In Stock */}
              <div className="sa-kpi-card">
                <div className="sa-kpi-icon-pill violet">
                  <Package size={20} strokeWidth={2.4} />
                </div>
                <div className="sa-kpi-details">
                  <h3 className="sa-kpi-number">{tracking?.totalAvailableStock || 0}</h3>
                  <span className="sa-kpi-label">In Stock</span>
                  <div className="sa-kpi-badge positive">
                    <span>Units Purchased</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. Split Row 1: Owner Coordinates & Sales Performance Breakdown */}
            <div className="sa-detail-split-row-1">
              {/* Left: Supermarket Registration & Owner Coordinates */}
              <div className="sa-info-card sa-owner-details-card">
                <div className="sa-info-card-header">
                  <h3>
                    <Users size={18} color="#16a34a" />
                    <span>Supermarket Registration &amp; Owner Coordinates</span>
                  </h3>
                  <span className="sa-badge-verified-profile">
                    Verified Profile <Check size={11} strokeWidth={3} />
                  </span>
                </div>

                <div className="sa-owner-coords-list">
                  <div className="sa-owner-coord-item">
                    <div className="sa-coord-label">
                      <Building2 size={13} />
                      <span>Supermarket Legal Name</span>
                    </div>
                    <div className="sa-coord-val">{store.name}</div>
                  </div>

                  <div className="sa-owner-coord-item">
                    <div className="sa-coord-label">
                      <Hash size={13} />
                      <span>Unique Supermarket ID</span>
                    </div>
                    <div className="sa-coord-val code-highlight">{store.code}</div>
                  </div>

                  <div className="sa-owner-coord-item">
                    <div className="sa-coord-label">
                      <UserCheck size={13} />
                      <span>Proprietor / Owner</span>
                    </div>
                    <div className="sa-coord-val">{store.ownerName || store.adminName || "Proprietor"}</div>
                  </div>

                  <div className="sa-owner-coord-item">
                    <div className="sa-coord-label">
                      <Users size={13} />
                      <span>Store Manager / Contact</span>
                    </div>
                    <div className="sa-coord-val">{store.contactPerson || store.ownerName || store.adminName || "Store Manager"}</div>
                  </div>

                  <div className="sa-owner-coord-item">
                    <div className="sa-coord-label">
                      <Mail size={13} />
                      <span>Official Email</span>
                    </div>
                    <div className="sa-coord-val">{store.email || `${store.adminUsername}@gmail.com`}</div>
                  </div>

                  <div className="sa-owner-coord-item">
                    <div className="sa-coord-label">
                      <Phone size={13} />
                      <span>Contact Number</span>
                    </div>
                    <div className="sa-coord-val">{store.phone || "+91 6789098765"}</div>
                  </div>

                  <div className="sa-owner-coord-item">
                    <div className="sa-coord-label">
                      <MapPin size={13} />
                      <span>Store Address</span>
                    </div>
                    <div className="sa-coord-val">
                      {store.address || "Begur"}, {store.city || "Bangalore"}, {store.state || "Karnataka"} - {store.pincode || "560001"}
                    </div>
                  </div>

                  <div className="sa-owner-coord-item">
                    <div className="sa-coord-label">
                      <FileText size={13} />
                      <span>GSTIN Number</span>
                    </div>
                    <div className="sa-coord-val">
                      <span className="sa-gstin-pill">{store.gstNumber || "Unregistered"}</span>
                    </div>
                  </div>
                </div>

                {/* Subscription Dates Green Banner at bottom */}
                <div className="sa-subscription-dates-box">
                  <div className="sa-sub-dates-icon">
                    <Calendar size={18} color="#16a34a" />
                  </div>
                  <div className="sa-sub-dates-texts">
                    <strong>Subscription Dates</strong>
                    <span>
                      Start: {store.startDate ? new Date(store.startDate).toLocaleDateString("en-GB") : "14/11/2026"} &nbsp;|&nbsp; Exp: {store.expiryDate ? new Date(store.expiryDate).toLocaleDateString("en-GB") : "14/12/2026"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Sales Performance Breakdown */}
              <div className="sa-info-card sa-sales-breakdown-card">
                <div className="sa-info-card-header">
                  <h3>
                    <BarChart3 size={18} color="#16a34a" />
                    <span>Sales Performance Breakdown</span>
                  </h3>

                  <div className="sa-chart-view-pills">
                    <button
                      type="button"
                      className={`sa-chart-view-btn ${analyticsView === "daily" ? "active" : ""}`}
                      onClick={() => setAnalyticsView("daily")}
                    >
                      Daily (7 Days)
                    </button>
                    <button
                      type="button"
                      className={`sa-chart-view-btn ${analyticsView === "monthly" ? "active" : ""}`}
                      onClick={() => setAnalyticsView("monthly")}
                    >
                      Monthly
                    </button>
                  </div>
                </div>

                {/* Legend */}
                <div className="sa-chart-legend">
                  <span className="sa-legend-item">
                    <span className="sa-legend-dot green" />
                    <span>Sales (₹)</span>
                  </span>
                  <span className="sa-legend-item">
                    <span className="sa-legend-dot cyan" />
                    <span>Orders</span>
                  </span>
                </div>

                {/* Interactive SVG Chart for Daily 7 Days View */}
                {analyticsView === "daily" ? (
                  <div className="sa-line-chart-container">
                    <div className="sa-svg-chart-wrap">
                      <svg viewBox="0 0 560 160" className="sa-line-chart-svg" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="salesAreaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#16a34a" stopOpacity="0.18" />
                            <stop offset="100%" stopColor="#16a34a" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Y-Axis Grid Lines & Labels */}
                        {[3, 2, 1, 0].map((val, idx) => {
                          const yPos = 20 + idx * 36;
                          return (
                            <g key={val}>
                              <line
                                x1="30"
                                y1={yPos}
                                x2="540"
                                y2={yPos}
                                stroke="#f1f5f9"
                                strokeDasharray="3 3"
                                strokeWidth="1"
                              />
                              <text x="12" y={yPos + 4} fill="#94a3b8" fontSize="10" fontWeight="600">
                                ₹{val}
                              </text>
                            </g>
                          );
                        })}

                        {/* Area Fill for Sales */}
                        {(() => {
                          const points = dailyData.map((d, i) => {
                            const x = 50 + i * ((520 - 50) / 6);
                            const y = 128 - ((d.sales || 0) / maxSales) * 100;
                            return `${x},${y}`;
                          });
                          const firstX = 50;
                          const lastX = 520;
                          return (
                            <polygon
                              points={`${firstX},128 ${points.join(" ")} ${lastX},128`}
                              fill="url(#salesAreaGradient)"
                            />
                          );
                        })()}

                        {/* Green Sales Line */}
                        {(() => {
                          const points = dailyData.map((d, i) => {
                            const x = 50 + i * ((520 - 50) / 6);
                            const y = 128 - ((d.sales || 0) / maxSales) * 100;
                            return `${x},${y}`;
                          });
                          return (
                            <polyline
                              fill="none"
                              stroke="#16a34a"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              points={points.join(" ")}
                            />
                          );
                        })()}

                        {/* Cyan Orders Line */}
                        {(() => {
                          const maxOrders = Math.max(...dailyData.map((d) => d.orders || 0), 3);
                          const points = dailyData.map((d, i) => {
                            const x = 50 + i * ((520 - 50) / 6);
                            const y = 128 - ((d.orders || 0) / maxOrders) * 60;
                            return `${x},${y}`;
                          });
                          return (
                            <polyline
                              fill="none"
                              stroke="#06b6d4"
                              strokeWidth="2"
                              strokeDasharray="4 4"
                              strokeLinecap="round"
                              points={points.join(" ")}
                            />
                          );
                        })()}

                        {/* Dots on Sales Line */}
                        {dailyData.map((d, i) => {
                          const x = 50 + i * ((520 - 50) / 6);
                          const y = 128 - ((d.sales || 0) / maxSales) * 100;
                          return (
                            <g key={i}>
                              <circle
                                cx={x}
                                cy={y}
                                r="4.5"
                                fill="#ffffff"
                                stroke="#16a34a"
                                strokeWidth="2.5"
                              />
                            </g>
                          );
                        })}
                      </svg>

                      {/* X-Axis Day Labels matching Image 1 */}
                      <div className="sa-chart-x-labels">
                        {dailyData.map((d, i) => (
                          <span key={i} className="sa-x-label-text">
                            {d.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="sa-chart-bars-list" style={{ padding: "16px 8px" }}>
                    {(analytics?.monthlySalesReports || []).length === 0 ? (
                      <div style={{ textAlign: "center", padding: "40px 10px", color: "#64748b", fontSize: "13px" }}>
                        No monthly billing history recorded yet for this supermarket.
                      </div>
                    ) : (
                      (analytics?.monthlySalesReports || []).map((m) => {
                        const maxMonthly = Math.max(
                          ...analytics.monthlySalesReports.map((item) => item.sales || 0),
                          100
                        );
                        const pct = Math.min(100, Math.round(((m.sales || 0) / maxMonthly) * 100));
                        return (
                          <div key={m.month} className="sa-chart-bar-row">
                            <div className="sa-chart-bar-labels">
                              <span style={{ color: "#334155", fontWeight: 700 }}>{m.month}</span>
                              <span style={{ color: "#166534", fontWeight: 800 }}>
                                ₹{(m.sales || 0).toLocaleString("en-IN")}{" "}
                                <small style={{ color: "#64748b", fontWeight: 500 }}>
                                  ({m.orders || 0} orders, {m.units || 0} items)
                                </small>
                              </span>
                            </div>
                            <div className="sa-chart-bar-track">
                              <div className="sa-chart-bar-fill" style={{ width: `${Math.max(pct, 2)}%` }} />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 4. Split Row 2: Top-Selling Products & Supermarket Product Tracking */}
            <div className="sa-detail-split-row-2">
              {/* Left: Top-Selling Products */}
              <div className="sa-info-card sa-top-products-card">
                <div className="sa-info-card-header">
                  <h3>
                    <Trophy size={18} color="#eab308" />
                    <span>Top-Selling Products</span>
                  </h3>

                  <div className="sa-chart-view-pills">
                    <button
                      type="button"
                      className={`sa-chart-view-btn ${analyticsProductTab === "top-selling" ? "active" : ""}`}
                      onClick={() => setAnalyticsProductTab("top-selling")}
                    >
                      Top Selling
                    </button>
                    <button
                      type="button"
                      className={`sa-chart-view-btn ${analyticsProductTab === "low-stock" ? "active" : ""}`}
                      onClick={() => setAnalyticsProductTab("low-stock")}
                    >
                      Low Stock ({lowStockCount})
                    </button>
                  </div>
                </div>

                {analyticsProductTab === "top-selling" ? (
                  (analytics?.topSellingProducts || []).length === 0 ? (
                    <div className="sa-empty-state-box">
                      <div className="sa-empty-cart-art">
                        <svg width="68" height="68" viewBox="0 0 72 72" fill="none">
                          <rect width="72" height="72" rx="36" fill="#f0fdf4" />
                          <circle cx="28" cy="50" r="3.5" fill="#16a34a" />
                          <circle cx="48" cy="50" r="3.5" fill="#16a34a" />
                          <path
                            d="M18 20h6l4.5 22h24l4-16H27"
                            stroke="#94a3b8"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path d="M38 14c-4 0-6 3-6 7 3 1 7-1 7-7z" fill="#4ade80" />
                          <path d="M44 18c-3 0-5 2-5 5 2 .8 5-.8 5-5z" fill="#16a34a" />
                        </svg>
                      </div>
                      <p className="sa-empty-msg-title">No product sales recorded yet for this store.</p>
                      <p className="sa-empty-msg-sub">Real-time sales will display here once checkout orders occur.</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {(analytics?.topSellingProducts || []).map((prod, idx) => (
                        <div key={prod._id || idx} className="sa-top-product-item">
                          <div className="sa-top-product-info">
                            <div className="sa-top-product-rank">#{idx + 1}</div>
                            <div style={{ minWidth: 0 }}>
                              <strong style={{ display: "block", fontSize: "13px", color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {prod.name}
                              </strong>
                              <small style={{ color: "#64748b" }}>
                                {prod.category} • ₹{prod.price}
                              </small>
                            </div>
                          </div>

                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <span style={{ display: "block", fontWeight: 800, color: "#166534", fontSize: "13px" }}>
                              {prod.soldQuantity} sold
                            </span>
                            <small style={{ color: "#64748b" }}>
                              ₹{(prod.totalRevenue || 0).toLocaleString("en-IN")}
                            </small>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {(analytics?.lowStockProducts || []).length === 0 ? (
                      <div style={{ textAlign: "center", padding: "36px 12px", color: "#059669", fontSize: "13px", fontWeight: 600 }}>
                        ✓ All products have healthy inventory levels above their reorder thresholds.
                      </div>
                    ) : (
                      (analytics?.lowStockProducts || []).map((prod) => (
                        <div
                          key={prod._id || prod.barcode}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 12px",
                            background: prod.remainingStock === 0 ? "#fef2f2" : "#fffbeb",
                            border: `1px solid ${prod.remainingStock === 0 ? "#fecaca" : "#fef08a"}`,
                            borderRadius: "10px",
                            gap: "10px",
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <strong style={{ display: "block", fontSize: "13px", color: prod.remainingStock === 0 ? "#991b1b" : "#92400e" }}>
                              {prod.name}
                            </strong>
                            <small style={{ color: "#64748b" }}>
                              Barcode: {prod.barcode || "N/A"} • Reorder Threshold: {prod.lowStockThreshold || 10}
                            </small>
                          </div>

                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "3px 8px",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: 800,
                                background: prod.remainingStock === 0 ? "#dc2626" : "#d97706",
                                color: "#ffffff",
                              }}
                            >
                              {prod.remainingStock === 0 ? "OUT OF STOCK" : `${prod.remainingStock} UNITS LEFT`}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Right: Supermarket Product & Inventory Tracking */}
              <div className="sa-table-card sa-product-tracking-card">
                <div className="sa-table-header" style={{ padding: "14px 18px", borderBottom: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Package size={18} color="#16a34a" />
                    <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 800 }}>
                      Supermarket Product &amp; Inventory Tracking ({filteredProducts.length})
                    </h3>
                  </div>

                  <select
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    className="sa-filter-select"
                    style={{ fontSize: "12px", padding: "6px 26px 6px 10px" }}
                  >
                    <option value="all">All Categories ({rawProducts.length})</option>
                    {productCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subtoolbar with Search & Stock Filter Pills */}
                <div className="sa-subtoolbar-strip">
                  <div className="sa-search-wrap" style={{ flex: "1 1 240px", minWidth: "220px" }}>
                    <Search size={14} />
                    <input
                      type="text"
                      placeholder="Search product name, barcode, brand..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                  </div>

                  <div className="sa-stock-pills-row">
                    <button
                      type="button"
                      className={`sa-stock-pill-btn ${productStockFilter === "all" ? "active" : ""}`}
                      onClick={() => setProductStockFilter("all")}
                    >
                      All SKUs ({rawProducts.length})
                    </button>
                    <button
                      type="button"
                      className={`sa-stock-pill-btn ${productStockFilter === "in-stock" ? "active" : ""}`}
                      onClick={() => setProductStockFilter("in-stock")}
                    >
                      In Stock ({inStockCount})
                    </button>
                    <button
                      type="button"
                      className={`sa-stock-pill-btn ${productStockFilter === "low-stock" ? "active" : ""}`}
                      onClick={() => setProductStockFilter("low-stock")}
                    >
                      Low Stock ({lowStockCount})
                    </button>
                    <button
                      type="button"
                      className={`sa-stock-pill-btn ${productStockFilter === "out-of-stock" ? "active" : ""}`}
                      onClick={() => setProductStockFilter("out-of-stock")}
                    >
                      Out of Stock ({outOfStockCount})
                    </button>
                  </div>
                </div>

                {/* Products Table matching Image 1 */}
                <div className="sa-table-responsive">
                  <table className="sa-data-table">
                    <thead>
                      <tr>
                        <th style={{ width: "35px" }}>#</th>
                        <th>Product Name</th>
                        <th>Category</th>
                        <th>Barcode</th>
                        <th>Unit Price</th>
                        <th>Sold Quantity</th>
                        <th>Available Stock</th>
                        <th>Remaining Stock</th>
                        <th>Stock Status</th>
                        <th style={{ textAlign: "right" }}>Total Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan="10" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                            No products found in this supermarket's catalog matching your query.
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((p, idx) => (
                          <tr key={p._id || idx}>
                            <td style={{ color: "#64748b", fontWeight: 600 }}>{idx + 1}</td>

                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                {p.imageUrl && p.imageUrl.trim() ? (
                                  <img
                                    src={p.imageUrl.trim()}
                                    alt={p.name}
                                    referrerPolicy="no-referrer"
                                    style={{
                                      width: "32px",
                                      height: "32px",
                                      borderRadius: "6px",
                                      objectFit: "cover",
                                      border: "1px solid #e2e8f0",
                                      flexShrink: 0,
                                    }}
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                    }}
                                  />
                                ) : null}
                                <div>
                                  <strong style={{ color: "#0F172A", display: "block", fontSize: "13px" }}>
                                    {p.name}
                                  </strong>
                                  {p.brand && (
                                    <small style={{ color: "#64748B" }}>{p.brand}</small>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td>
                              <span style={{ fontSize: "12px", color: "#334155" }}>
                                {p.category}
                              </span>
                            </td>

                            <td>
                              <span className="sa-code-badge" style={{ fontFamily: "monospace" }}>
                                {p.barcode || "N/A"}
                              </span>
                            </td>

                            <td>
                              <strong style={{ color: "#1e293b" }}>₹{p.price}</strong>
                            </td>

                            <td>
                              <strong style={{ color: "#166534" }}>{p.soldQuantity || 0}</strong>
                            </td>

                            <td>
                              <span style={{ fontWeight: 600, color: "#334155" }}>
                                {p.availableStock} units
                              </span>
                            </td>

                            <td>
                              <span style={{ fontWeight: 700, color: p.remainingStock <= p.lowStockThreshold ? "#c2410c" : "#15803d" }}>
                                {p.remainingStock} units
                              </span>
                            </td>

                            <td>
                              <span
                                className={`sa-stock-status-tag ${
                                  p.stockStatus === "In Stock"
                                    ? "in-stock"
                                    : p.stockStatus === "Low Stock"
                                    ? "low-stock"
                                    : "out-of-stock"
                                }`}
                              >
                                {p.stockStatus}
                              </span>
                            </td>

                            <td style={{ textAlign: "right" }}>
                              <strong style={{ color: "#166534" }}>
                                ₹{(p.totalRevenue || 0).toLocaleString("en-IN")}
                              </strong>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 5. Bottom Card: Recent Orders & Shopper Transactions */}
            <div className="sa-table-card sa-recent-orders-card">
              <div className="sa-table-header" style={{ padding: "14px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <ShoppingBag size={18} color="#16a34a" />
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 800 }}>
                    Recent Orders &amp; Shopper Transactions ({recentOrders.length})
                  </h3>
                </div>

                <span className="sa-isolated-badge">
                  <span className="sa-green-dot-pulse" />
                  <span>Strictly Isolated to {store.name} ({store.code})</span>
                </span>
              </div>

              <div className="sa-table-responsive">
                <table className="sa-data-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Customer Details</th>
                      <th>Items Count</th>
                      <th>Total Amount</th>
                      <th>Payment Method</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Date &amp; Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ padding: "36px", textAlign: "center" }}>
                          <div className="sa-empty-receipt-box">
                            <div className="sa-empty-receipt-art">
                              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                <rect x="10" y="6" width="28" height="36" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2"/>
                                <line x1="16" y1="14" x2="32" y2="14" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
                                <line x1="16" y1="20" x2="28" y2="20" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
                                <line x1="16" y1="26" x2="24" y2="26" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
                                <circle cx="34" cy="34" r="8" fill="#16a34a"/>
                                <path d="M31 34l2 2 4-4" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                            <p className="sa-empty-msg-title" style={{ marginTop: "12px" }}>
                              No orders recorded yet for this supermarket.
                            </p>
                            <p className="sa-empty-msg-sub">Checkout receipts will appear here automatically.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      recentOrders.map((ord) => (
                        <tr key={ord._id || ord.orderNumber}>
                          <td>
                            <strong style={{ fontFamily: "monospace", color: "#166534" }}>
                              {ord.orderNumber}
                            </strong>
                          </td>

                          <td>
                            <div>
                              <strong style={{ display: "block", fontSize: "13px", color: "#0f172a" }}>
                                {ord.customerName}
                              </strong>
                              {ord.customerPhone && (
                                <small style={{ color: "#64748b" }}>{ord.customerPhone}</small>
                              )}
                            </div>
                          </td>

                          <td>
                            <span>{ord.totalItems} items</span>
                          </td>

                          <td>
                            <strong style={{ color: "#1e293b" }}>
                              ₹{(ord.totalAmount || 0).toLocaleString("en-IN")}
                            </strong>
                          </td>

                          <td>
                            <span className="sa-code-badge" style={{ fontSize: "11px" }}>
                              {ord.paymentMethod}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`sa-status-badge ${
                                ord.paymentStatus === "Completed" || ord.paymentStatus === "Approved"
                                  ? "active"
                                  : "trial"
                              }`}
                            >
                              {ord.paymentStatus}
                            </span>
                          </td>

                          <td style={{ textAlign: "right" }}>
                            <span style={{ fontSize: "12px", color: "#64748b" }}>
                              {ord.createdAt
                                ? new Date(ord.createdAt).toLocaleString("en-IN", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "N/A"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}
      </div>
    );
  }

  /* =========================================================================
     VIEW B: MASTER REGISTERED SUPERMARKETS LIST & DIRECTORY
     ========================================================================= */
  return (
    <div className="sa-page-container">
      {/* 1. Header */}
      <div className="sa-page-header">
        <div className="sa-page-header-content">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span className="sa-badge active">Supermarket Directory</span>
            <span style={{ fontSize: "12px", color: "#64748b" }}>Multi-Tenant Master Registry</span>
          </div>
          <h1>Registered Supermarkets</h1>
          <p>
            Central directory to monitor, track, and manage all registered supermarket chains with strict tenant-based isolation.
          </p>
        </div>

        <div className="sa-page-header-actions">
          <button
            type="button"
            className="sa-btn-secondary"
            onClick={() => {
              setLoadingList(true);
              loadSupermarkets();
              setTimeout(() => setLoadingList(false), 500);
            }}
          >
            <RefreshCw size={15} className={loadingList ? "spin-icon" : ""} />
            <span>Sync</span>
          </button>

          <Link to="/super-admin/add-supermarket" className="sa-btn-primary">
            <PlusCircle size={16} />
            <span>Add Supermarket</span>
          </Link>
        </div>
      </div>

      {/* 2. Registration Status KPI Ribbon (4 Balanced Tiles) */}
      <section className="sa-kpi-grid">
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
      </section>

      {/* 3. Filter Bar & Search */}
      <div className="sa-table-card">
        <div className="sa-table-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", padding: "14px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Building2 size={18} color="#16a34a" />
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>
              Supermarket Registration Registry ({filteredStores.length})
            </h3>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", flex: "1 1 360px", justifyContent: "flex-end" }}>
            {/* Search Input */}
            <div className="sa-search-wrap" style={{ flex: "1 1 260px", minWidth: "240px", maxWidth: "420px" }}>
              <Search size={15} />
              <input
                type="text"
                placeholder="Search by store name, branch code, city, admin username..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: "100%" }}
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
          </div>
        </div>

        {/* 4. Table with dedicated View Details Action (NO REDIRECTS) */}
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
                <th style={{ textAlign: "right" }}>Action</th>
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
                      <div
                        style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
                        onClick={() => handleSelectStore(store)}
                        title={`Click to view tracking details for ${store.name}`}
                      >
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
                            overflow: "hidden",
                            flexShrink: 0,
                          }}
                        >
                          {store.logoUrl ? (
                            <img
                              src={store.logoUrl}
                              alt={store.name}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <span style={{ display: store.logoUrl ? "none" : "flex" }}>
                            {store.name ? store.name.charAt(0).toUpperCase() : "S"}
                          </span>
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
                          : "N/A"}
                      </span>
                    </td>

                    <td style={{ textAlign: "right" }}>
                      {/* Prominent View Details Button (No redirect to store admin) */}
                      <button
                        type="button"
                        className="sa-btn-view-details"
                        onClick={() => handleSelectStore(store)}
                        title={`View detailed performance, products, and sales for ${store.name}`}
                      >
                        <Eye size={14} />
                        <span>View Details</span>
                      </button>
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
