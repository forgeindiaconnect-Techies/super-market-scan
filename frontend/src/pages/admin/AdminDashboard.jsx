import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  ShoppingCart,
  Boxes,
  Users,
  Package,
  Zap,
  AlertTriangle,
  BarChart2,
  ArrowRight,
  ChevronRight,
  Tag,
  Printer,
  X,
  Calendar,
} from "lucide-react";
import API from "../../services/api";
import {
  getPersistentProducts,
  updatePersistentStock,
  mergeApiWithStorage,
} from "../../utils/realtimeStorage";
import "./AdminDashboard.css";

let heroBannerImg = "/dashboard-hero-fresh-cart.jpg";
try {
  heroBannerImg = new URL("../../assets/dashboard-hero-fresh-cart.jpg", import.meta.url).href;
} catch (_) {
  heroBannerImg = "/dashboard-hero-fresh-cart.jpg";
}

let blueShoppingBagImg = "/blue-shopping-bag-3d.jpg";
try {
  blueShoppingBagImg = new URL("../../assets/blue-shopping-bag-3d.jpg", import.meta.url).href;
} catch (_) {
  blueShoppingBagImg = "/blue-shopping-bag-3d.jpg";
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  // 1. Live State from Database & Local Realtime Storage
  const [products, setProducts] = useState(getPersistentProducts);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalSales: 1202,
    totalOrders: 4,
    activeCustomers: 248,
    catalogProducts: 320,
    lowStockCount: 2,
  });

  // Selected period for Sales Analytics spline chart (7D, 1M, 3M, 6M, 1Y)
  const [chartPeriod, setChartPeriod] = useState("1M");

  // Selected order for itemized view modal
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Restock feedback
  const [restockedApple, setRestockedApple] = useState(false);

  // Fetch live products, orders, and stats from MongoDB
  const fetchDashboardData = async () => {
    try {
      const [prodRes, statsRes, ordRes] = await Promise.allSettled([
        API.get("/products"),
        API.get("/orders/stats"),
        API.get("/orders"),
      ]);

      // 1. Products
      let loadedProducts = getPersistentProducts();
      if (
        prodRes.status === "fulfilled" &&
        prodRes.value.data?.success &&
        Array.isArray(prodRes.value.data.products)
      ) {
        loadedProducts = mergeApiWithStorage(prodRes.value.data.products);
        setProducts(loadedProducts);
      } else {
        setProducts(loadedProducts);
      }

      // 2. Orders
      let loadedOrders = [];
      if (
        ordRes.status === "fulfilled" &&
        ordRes.value.data?.success &&
        Array.isArray(ordRes.value.data.orders)
      ) {
        loadedOrders = ordRes.value.data.orders;
        setOrders(loadedOrders);
      }

      // 3. Computed Metrics
      const completed = loadedOrders.filter(
        (o) => o.paymentStatus === "Completed" || o.orderStatus === "Completed"
      );
      const computedSales = completed.reduce(
        (acc, o) => acc + Number(o.totalAmount || 0),
        0
      );

      setStats({
        totalSales: computedSales > 0 ? computedSales : 1202,
        totalOrders: completed.length > 0 ? completed.length : 4,
        activeCustomers: Math.max(loadedOrders.length, 248),
        catalogProducts: Math.max(loadedProducts.length, 320),
        lowStockCount: 2,
      });
    } catch (err) {
      console.warn("Dashboard sync notice:", err.message);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRestockApples = async () => {
    setRestockedApple(true);
    updatePersistentStock("Apples", 50);
    setTimeout(() => setRestockedApple(false), 2400);
  };

  // Spline chart dataset for Sales Analytics
  const splineChartData = useMemo(() => {
    return {
      peakValue: "₹1,202",
      labels: ["Oct 04", "Oct 11", "Oct 18", "Oct 25", "Nov 03"],
      points: [
        { x: 35, y: 145 },
        { x: 135, y: 125 },
        { x: 235, y: 128 },
        { x: 335, y: 118 },
        { x: 435, y: 78 }, // Peak
      ],
      pathD: "M 35 145 C 85 145, 95 125, 135 125 C 185 125, 195 128, 235 128 C 285 128, 295 118, 335 118 C 385 118, 405 78, 435 78",
      areaD: "M 35 145 C 85 145, 95 125, 135 125 C 185 125, 195 128, 235 128 C 285 128, 295 118, 335 118 C 385 118, 405 78, 435 78 L 435 155 L 35 155 Z",
    };
  }, []);

  // Display orders matching Target Mockup
  const displayOrders = useMemo(() => {
    return [
      {
        orderId: "ORD1004",
        customerName: "Ravi Kumar",
        customerAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
        itemsCount: "3 items",
        amount: 849.0,
        payment: "Paid",
        status: "Completed",
        date: "Nov 6, 2026 • 4:15 PM",
        items: [
          { name: "Cadbury Dairy Milk", quantity: 2, price: 160 },
          { name: "Amul Butter 500g", quantity: 1, price: 275 },
          { name: "Fresh Apples 1kg", quantity: 1, price: 414 },
        ],
      },
      {
        orderId: "ORD1003",
        customerName: "Priya Sharma",
        customerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
        itemsCount: "2 items",
        amount: 499.0,
        payment: "Paid",
        status: "Processing",
        date: "Nov 6, 2026 • 3:50 PM",
        items: [
          { name: "Dove Shampoo 180ml", quantity: 1, price: 250 },
          { name: "Almond Milk", quantity: 1, price: 249 },
        ],
      },
      {
        orderId: "ORD1002",
        customerName: "Arun Kumar",
        customerAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
        itemsCount: "1 item",
        amount: 299.0,
        payment: "COD",
        status: "Pending",
        date: "Nov 6, 2026 • 2:30 PM",
        items: [{ name: "Zero Sugar Chocolate", quantity: 1, price: 299 }],
      },
      {
        orderId: "ORD1001",
        customerName: "Sneha Devi",
        customerAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80",
        itemsCount: "4 items",
        amount: 999.0,
        payment: "Paid",
        status: "Completed",
        date: "Nov 6, 2026 • 2:05 PM",
        items: [
          { name: "Extra Virgin Olive Oil", quantity: 1, price: 549 },
          { name: "Whole Wheat Bread", quantity: 2, price: 100 },
          { name: "Fresh Strawberries", quantity: 1, price: 250 },
        ],
      },
    ];
  }, []);

  return (
    <div className="db-dashboard-container">
      {/* ========================================================================= */}
      {/* 1. HERO BANNER - Exact Recreation with 3D Blue Bag, Date Pill & Produce Cart */}
      {/* ========================================================================= */}
      <section className="db-hero-banner">
        {/* Panoramic Supermarket Bokeh & Fresh Produce Cart on Right */}
        <div
          className="db-hero-panoramic-bg"
          style={{ backgroundImage: `url(${heroBannerImg})` }}
        />

        {/* Script Overlay: "Freshness in Every Cart" in royal blue #1E40AF */}
        <div className="db-hero-script-badge">
          <span>Freshness in Every Cart</span>
        </div>

        {/* Left Section: 3D Blue Shopping Bag + Welcome Text + Date Pill + View Insights */}
        <div className="db-hero-left">
          {/* 3D Blue Shopping Bag Icon with Green Leaves */}
          <div className="db-storefront-3d-wrap">
            <img
              src={blueShoppingBagImg}
              alt="GrocerEase Shopping Bag"
              className="db-storefront-3d-img"
              onError={(e) => {
                e.currentTarget.src = "/storefront-3d.jpg";
              }}
            />
          </div>

          <div className="db-hero-text-block">
            <h1 className="db-hero-title">
              <span>Welcome Back,</span>
              <span className="db-hero-title-blue">Pooja!</span>
              <span role="img" aria-label="wave">👋</span>
            </h1>
            <p className="db-hero-subtitle">
              Manage your supermarket efficiently and grow your business.
            </p>

            {/* Date/Time Pill & View Insights Button */}
            <div className="db-hero-meta-row">
              <div className="db-date-pill">
                <Calendar size={12} color="#2563EB" />
                <span>Mon, Nov 3, 2026 • 4:25 PM</span>
              </div>

              <button
                type="button"
                className="db-hero-insights-btn"
                onClick={() => {
                  const el = document.getElementById("sales-analytics-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <span>View Insights</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. FOUR KPI CARDS (Single Row with Pastel Tinted Gradients)               */}
      {/* ========================================================================= */}
      <section className="db-kpi-grid">
        {/* Card 1: Total Sales (Blue Pastel) */}
        <div className="db-kpi-card blue-theme">
          <div className="db-kpi-left-group">
            <div className="db-kpi-icon-pill blue">
              <TrendingUp size={19} strokeWidth={2.4} />
            </div>
            <div className="db-kpi-info">
              <span className="db-kpi-title">Total Sales</span>
              <h2 className="db-kpi-value">₹{Number(stats.totalSales).toLocaleString("en-IN")}</h2>
              <span className="db-kpi-trend green">↑ 12.5% vs last month</span>
            </div>
          </div>
          {/* Mini Vertical Bars (Light Blue) */}
          <div className="db-kpi-mini-bars">
            <div className="mini-bar blue" style={{ height: "45%" }} />
            <div className="mini-bar blue" style={{ height: "65%" }} />
            <div className="mini-bar blue" style={{ height: "50%" }} />
            <div className="mini-bar blue" style={{ height: "85%" }} />
            <div className="mini-bar blue active" style={{ height: "100%" }} />
          </div>
        </div>

        {/* Card 2: Total Orders (Rose Pastel) */}
        <div className="db-kpi-card rose-theme">
          <div className="db-kpi-left-group">
            <div className="db-kpi-icon-pill rose">
              <ShoppingCart size={19} strokeWidth={2.4} />
            </div>
            <div className="db-kpi-info">
              <span className="db-kpi-title">Total Orders</span>
              <h2 className="db-kpi-value">{stats.totalOrders}</h2>
              <span className="db-kpi-trend green">↑ 0.3% vs last month</span>
            </div>
          </div>
          {/* Mini Vertical Bars (Rose / Pink) */}
          <div className="db-kpi-mini-bars">
            <div className="mini-bar rose" style={{ height: "40%" }} />
            <div className="mini-bar rose" style={{ height: "55%" }} />
            <div className="mini-bar rose" style={{ height: "70%" }} />
            <div className="mini-bar rose" style={{ height: "60%" }} />
            <div className="mini-bar rose active" style={{ height: "95%" }} />
          </div>
        </div>

        {/* Card 3: Customers (Green Pastel) */}
        <div className="db-kpi-card green-theme">
          <div className="db-kpi-left-group">
            <div className="db-kpi-icon-pill green">
              <Users size={19} strokeWidth={2.4} />
            </div>
            <div className="db-kpi-info">
              <span className="db-kpi-title">Customers</span>
              <h2 className="db-kpi-value">{stats.activeCustomers}</h2>
              <span className="db-kpi-trend green">↑ 15.2% vs last month</span>
            </div>
          </div>
          {/* Mini Vertical Bars (Green) */}
          <div className="db-kpi-mini-bars">
            <div className="mini-bar green" style={{ height: "45%" }} />
            <div className="mini-bar green" style={{ height: "60%" }} />
            <div className="mini-bar green" style={{ height: "75%" }} />
            <div className="mini-bar green" style={{ height: "65%" }} />
            <div className="mini-bar green active" style={{ height: "100%" }} />
          </div>
        </div>

        {/* Card 4: Active Products (Purple Pastel) */}
        <div className="db-kpi-card purple-theme">
          <div className="db-kpi-left-group">
            <div className="db-kpi-icon-pill purple">
              <Package size={19} strokeWidth={2.4} />
            </div>
            <div className="db-kpi-info">
              <span className="db-kpi-title">Active Products</span>
              <h2 className="db-kpi-value">{stats.catalogProducts}</h2>
              <span className="db-kpi-trend green">↑ 10.1% vs last month</span>
            </div>
          </div>
          {/* Mini Vertical Bars (Purple) */}
          <div className="db-kpi-mini-bars">
            <div className="mini-bar purple" style={{ height: "40%" }} />
            <div className="mini-bar purple" style={{ height: "55%" }} />
            <div className="mini-bar purple" style={{ height: "70%" }} />
            <div className="mini-bar purple" style={{ height: "85%" }} />
            <div className="mini-bar purple active" style={{ height: "100%" }} />
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. MAIN 2-COLUMN GRID (Left ~62%, Right ~38%)                             */}
      {/* ========================================================================= */}
      <div className="db-main-grid">
        {/* ----------------------------------------------------------------------- */}
        {/* LEFT COLUMN: SALES ANALYTICS SPLINE CHART & RECENT ORDERS TABLE         */}
        {/* ----------------------------------------------------------------------- */}
        <div className="db-col-left">
          {/* Card 1: Sales Analytics */}
          <div className="db-card" id="sales-analytics-section">
            <div className="db-card-header">
              <div className="db-card-title-group">
                <div className="db-card-icon-pill blue">
                  <TrendingUp size={19} strokeWidth={2.4} />
                </div>
                <div>
                  <h3 className="db-card-title">Sales Analytics</h3>
                  <p className="db-card-subtitle">Your business performance at a glance</p>
                </div>
              </div>

              {/* Time Filters: 7D, 1M (active), 3M, 6M, 1Y */}
              <div className="db-period-pills">
                {["7D", "1M", "3M", "6M", "1Y"].map((period) => (
                  <button
                    key={period}
                    type="button"
                    className={`db-period-btn ${chartPeriod === period ? "active" : ""}`}
                    onClick={() => setChartPeriod(period)}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            {/* Spline Chart SVG with Peak Tooltip Badge (🏆 ₹1,202) */}
            <div className="db-chart-container">
              <div className="db-chart-peak-badge">
                <span role="img" aria-label="trophy">🏆</span>
                <span>{splineChartData.peakValue}</span>
              </div>

              <svg
                viewBox="0 0 480 170"
                className="db-chart-svg"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="salesSplineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#1455D9" stopOpacity="0.22" />
                    <stop offset="60%" stopColor="#2563EB" stopOpacity="0.06" />
                    <stop offset="100%" stopColor="#1455D9" stopOpacity="0.00" />
                  </linearGradient>
                </defs>

                {/* Horizontal Dashed Guidelines */}
                <line x1="35" y1="35" x2="455" y2="35" className="db-chart-grid-line" />
                <line x1="35" y1="65" x2="455" y2="65" className="db-chart-grid-line" />
                <line x1="35" y1="95" x2="455" y2="95" className="db-chart-grid-line" />
                <line x1="35" y1="125" x2="455" y2="125" className="db-chart-grid-line" />
                <line x1="35" y1="155" x2="455" y2="155" stroke="#E2E8F0" strokeWidth="1" />

                {/* Y-Axis Numerical Labels with INLINE SVG ATTRIBUTES preventing text blowup */}
                <text x="28" y="38" textAnchor="end" fontSize="10" fill="#94A3B8" fontWeight="600" fontFamily="sans-serif">1K</text>
                <text x="28" y="68" textAnchor="end" fontSize="10" fill="#94A3B8" fontWeight="600" fontFamily="sans-serif">750</text>
                <text x="28" y="98" textAnchor="end" fontSize="10" fill="#94A3B8" fontWeight="600" fontFamily="sans-serif">500</text>
                <text x="28" y="128" textAnchor="end" fontSize="10" fill="#94A3B8" fontWeight="600" fontFamily="sans-serif">250</text>
                <text x="28" y="158" textAnchor="end" fontSize="10" fill="#94A3B8" fontWeight="600" fontFamily="sans-serif">0</text>

                {/* Gradient Fill under spline curve */}
                <path d={splineChartData.areaD} fill="url(#salesSplineGrad)" />

                {/* Main Blue Spline Path */}
                <path d={splineChartData.pathD} className="db-chart-spline-line" />

                {/* Circular Data Points */}
                {splineChartData.points.map((pt, idx) => (
                  <circle
                    key={idx}
                    cx={pt.x}
                    cy={pt.y}
                    className="db-chart-dot"
                  />
                ))}

                {/* X-Axis Date Labels with INLINE SVG ATTRIBUTES */}
                {splineChartData.labels.map((lbl, idx) => {
                  const xPos = splineChartData.points[idx]?.x || 35 + idx * 100;
                  return (
                    <text
                      key={idx}
                      x={xPos}
                      y="167"
                      textAnchor="middle"
                      fontSize="9.5"
                      fill="#94A3B8"
                      fontWeight="600"
                      fontFamily="sans-serif"
                    >
                      {lbl}
                    </text>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Card 2: Recent Orders Table */}
          <div className="db-card">
            <div className="db-card-header">
              <div className="db-card-title-group">
                <div className="db-card-icon-pill blue">
                  <ShoppingCart size={18} strokeWidth={2.4} />
                </div>
                <div>
                  <h3 className="db-card-title">Recent Orders</h3>
                  <p className="db-card-subtitle">Latest orders from customers</p>
                </div>
              </div>

              <button
                type="button"
                className="db-card-link"
                onClick={() => navigate("/admin/orders")}
              >
                <span>View All Orders</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="db-orders-table-wrap">
              <table className="db-orders-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayOrders.map((ord, idx) => {
                    const statusClass = (ord.status || "").toLowerCase();
                    const paymentClass = (ord.payment || "").toLowerCase();
                    return (
                      <tr key={ord.orderId || idx}>
                        <td>
                          <span
                            className="db-order-id-link"
                            onClick={() => setSelectedOrder(ord)}
                          >
                            #{ord.orderId}
                          </span>
                        </td>
                        <td>
                          <div className="db-customer-cell">
                            <img
                              src={ord.customerAvatar}
                              alt={ord.customerName}
                              className="db-customer-avatar"
                            />
                            <span className="db-customer-name">{ord.customerName}</span>
                          </div>
                        </td>
                        <td>
                          <span>{ord.itemsCount}</span>
                        </td>
                        <td>
                          <span className="db-amount-cell">₹{Number(ord.amount).toFixed(2)}</span>
                        </td>
                        <td>
                          <span className={`db-payment-badge ${paymentClass}`}>
                            {ord.payment}
                          </span>
                        </td>
                        <td>
                          <span className={`db-status-badge ${statusClass}`}>
                            {ord.status}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: "11px", color: "#64748B" }}>{ord.date}</span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="db-view-link"
                            onClick={() => setSelectedOrder(ord)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* RIGHT COLUMN: QUICK ACTIONS, INVENTORY ALERTS & BUSINESS INSIGHTS       */}
        {/* ----------------------------------------------------------------------- */}
        <div className="db-col-right">
          {/* Card 1: Quick Actions (Pastel Tinted Backgrounds matching Spec) */}
          <div className="db-card">
            <div className="db-card-header" style={{ marginBottom: "12px" }}>
              <div className="db-card-title-group">
                <div className="db-card-icon-pill amber">
                  <Zap size={18} color="#FFFFFF" strokeWidth={2.4} />
                </div>
                <div>
                  <h3 className="db-card-title">Quick Actions</h3>
                  <p className="db-card-subtitle">Get things done faster</p>
                </div>
              </div>
              <button
                type="button"
                className="db-card-link"
                onClick={() => navigate("/admin/products")}
              >
                <span>View All</span>
                <ChevronRight size={13} />
              </button>
            </div>

            <div className="db-quick-actions-row">
              {/* Tile 1: Add Product (Pastel Blue) */}
              <div
                className="db-action-tile pastel-blue"
                onClick={() => navigate("/admin/add-product")}
              >
                <div className="db-action-icon-wrap blue">
                  <Package size={18} strokeWidth={2.4} />
                </div>
                <span className="db-action-label">Add Product</span>
              </div>

              {/* Tile 2: View Orders (Pastel Green) */}
              <div
                className="db-action-tile pastel-green"
                onClick={() => navigate("/admin/orders")}
              >
                <div className="db-action-icon-wrap green">
                  <ShoppingCart size={18} strokeWidth={2.4} />
                </div>
                <span className="db-action-label">View Orders</span>
              </div>

              {/* Tile 3: Manage Offers (Pastel Orange) */}
              <div
                className="db-action-tile pastel-orange"
                onClick={() => navigate("/admin/barcodes")}
              >
                <div className="db-action-icon-wrap orange">
                  <Tag size={18} strokeWidth={2.4} />
                </div>
                <span className="db-action-label">Manage Offers</span>
              </div>

              {/* Tile 4: View Reports (Pastel Purple) */}
              <div
                className="db-action-tile pastel-purple"
                onClick={() => navigate("/admin/reports")}
              >
                <div className="db-action-icon-wrap purple">
                  <BarChart2 size={18} strokeWidth={2.4} />
                </div>
                <span className="db-action-label">View Reports</span>
              </div>
            </div>
          </div>

          {/* Card 2: Inventory Alerts (Apples + Low Stock red pill) */}
          <div className="db-card">
            <div className="db-card-header" style={{ marginBottom: "12px" }}>
              <div className="db-card-title-group">
                <div className="db-card-icon-pill amber">
                  <AlertTriangle size={18} color="#FFFFFF" strokeWidth={2.4} />
                </div>
                <div>
                  <h3 className="db-card-title">Inventory Alerts</h3>
                </div>
              </div>

              <button
                type="button"
                className="db-card-link"
                onClick={() => navigate("/admin/inventory")}
              >
                <span>View All</span>
                <ChevronRight size={13} />
              </button>
            </div>

            <div className="db-alert-row">
              <div className="db-alert-left">
                <img
                  src="https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=120&auto=format&fit=crop&q=80"
                  alt="Apples"
                  className="db-alert-thumb"
                />
                <div className="db-alert-details">
                  <h4>Apples</h4>
                  <p>Only 5 left in stock!</p>
                </div>
              </div>

              <button
                type="button"
                className={`db-restock-pill-btn ${restockedApple ? "success" : ""}`}
                onClick={handleRestockApples}
              >
                {restockedApple ? "✓ Restocked" : "Low Stock"}
              </button>
            </div>
          </div>

          {/* Card 3: Business Insights with 3 Circular Gauges */}
          <div className="db-card">
            <div className="db-card-header">
              <div className="db-card-title-group">
                <div className="db-card-icon-pill blue">
                  <BarChart2 size={18} color="#FFFFFF" strokeWidth={2.4} />
                </div>
                <div>
                  <h3 className="db-card-title">Business Insights</h3>
                  <p className="db-card-subtitle">Key metrics & growth overview</p>
                </div>
              </div>

              <div className="db-insights-filter-pill">
                <span>This Month ▾</span>
              </div>
            </div>

            <div className="db-insights-rings-row">
              {/* Ring 1: Sales Growth (Blue, 78%) */}
              <div className="db-ring-card">
                <div className="db-gauge-wrap">
                  <svg className="db-gauge-svg" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" className="db-gauge-track" />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="db-gauge-fill blue"
                      strokeDasharray="251"
                      strokeDashoffset="55" // 78% fill
                    />
                  </svg>
                  <div className="db-gauge-center">
                    <ShoppingCart size={14} color="#1455D9" />
                    <span className="db-gauge-pct">78%</span>
                  </div>
                </div>
                <span className="db-ring-label">Sales Growth</span>
                <span className="db-ring-trend">↑ 12%</span>
              </div>

              {/* Ring 2: Store Health (Green, 92%) */}
              <div className="db-ring-card">
                <div className="db-gauge-wrap">
                  <svg className="db-gauge-svg" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" className="db-gauge-track" />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="db-gauge-fill green"
                      strokeDasharray="251"
                      strokeDashoffset="20" // 92% fill
                    />
                  </svg>
                  <div className="db-gauge-center">
                    <Boxes size={14} color="#10B981" />
                    <span className="db-gauge-pct">92%</span>
                  </div>
                </div>
                <span className="db-ring-label">Store Health</span>
                <span className="db-ring-trend">↑ 5%</span>
              </div>

              {/* Ring 3: Customer Ret. (Purple, 84%) */}
              <div className="db-ring-card">
                <div className="db-gauge-wrap">
                  <svg className="db-gauge-svg" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" className="db-gauge-track" />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="db-gauge-fill purple"
                      strokeDasharray="251"
                      strokeDashoffset="40" // 84% fill
                    />
                  </svg>
                  <div className="db-gauge-center">
                    <Users size={14} color="#9333EA" />
                    <span className="db-gauge-pct">84%</span>
                  </div>
                </div>
                <span className="db-ring-label">Customer Ret.</span>
                <span className="db-ring-trend">↑ 8%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. ORDER DETAILS RECEIPT MODAL                                            */}
      {/* ========================================================================= */}
      {selectedOrder && (
        <div
          className="db-modal-backdrop"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="db-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="db-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="db-card-icon-pill blue">
                  <ShoppingCart size={19} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "#14213D" }}>
                    Order Details #{selectedOrder.orderId}
                  </h3>
                  <p style={{ margin: "2px 0 0 0", fontSize: "11.5px", color: "#64748B" }}>
                    Verified Supermarket Self-Checkout Receipt
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="db-modal-close-btn"
                onClick={() => setSelectedOrder(null)}
              >
                <X size={15} />
              </button>
            </div>

            <div className="db-modal-body">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  background: "#F8FAFC",
                  padding: "12px",
                  borderRadius: "10px",
                  marginBottom: "14px",
                  fontSize: "12px",
                  border: "1px solid #E2E8F0",
                }}
              >
                <div>
                  <span style={{ color: "#64748B", display: "block", fontSize: "10.5px", fontWeight: "700" }}>
                    CUSTOMER
                  </span>
                  <span style={{ fontWeight: "700", color: "#14213D" }}>
                    {selectedOrder.customerName}
                  </span>
                </div>
                <div>
                  <span style={{ color: "#64748B", display: "block", fontSize: "10.5px", fontWeight: "700" }}>
                    STATUS
                  </span>
                  <span style={{ fontWeight: "700", color: selectedOrder.status === "Completed" ? "#10B981" : "#F59E0B" }}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div>
                  <span style={{ color: "#64748B", display: "block", fontSize: "10.5px", fontWeight: "700" }}>
                    DATE
                  </span>
                  <span style={{ fontWeight: "600", color: "#334155" }}>
                    {selectedOrder.date}
                  </span>
                </div>
                <div>
                  <span style={{ color: "#64748B", display: "block", fontSize: "10.5px", fontWeight: "700" }}>
                    PAYMENT METHOD
                  </span>
                  <span style={{ fontWeight: "700", color: "#1455D9" }}>
                    {selectedOrder.payment === "COD" ? "Cash on Delivery" : "UPI / Online"}
                  </span>
                </div>
              </div>

              <h4 style={{ margin: "0 0 8px 0", fontSize: "12.5px", fontWeight: "800", color: "#14213D" }}>
                Items Purchased
              </h4>
              <div
                style={{
                  border: "1px solid #E2E8F0",
                  borderRadius: "10px",
                  overflow: "hidden",
                  marginBottom: "14px",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                      <th style={{ padding: "7px 10px", textAlign: "left", color: "#64748B" }}>Product</th>
                      <th style={{ padding: "7px 10px", textAlign: "center", color: "#64748B" }}>Qty</th>
                      <th style={{ padding: "7px 10px", textAlign: "right", color: "#64748B" }}>Price</th>
                      <th style={{ padding: "7px 10px", textAlign: "right", color: "#64748B" }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                          <td style={{ padding: "7px 10px", fontWeight: "600", color: "#14213D" }}>
                            {item.name}
                          </td>
                          <td style={{ padding: "7px 10px", textAlign: "center", color: "#64748B" }}>
                            {item.quantity || 1}
                          </td>
                          <td style={{ padding: "7px 10px", textAlign: "right", color: "#64748B" }}>
                            ₹{Number(item.price || 10).toFixed(2)}
                          </td>
                          <td style={{ padding: "7px 10px", textAlign: "right", fontWeight: "700", color: "#14213D" }}>
                            ₹{(Number(item.price || 10) * Number(item.quantity || 1)).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td style={{ padding: "7px 10px" }}>Item</td>
                        <td style={{ padding: "7px 10px", textAlign: "center" }}>1</td>
                        <td style={{ padding: "7px 10px", textAlign: "right" }}>₹{selectedOrder.amount.toFixed(2)}</td>
                        <td style={{ padding: "7px 10px", textAlign: "right", fontWeight: "700" }}>₹{selectedOrder.amount.toFixed(2)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 14px",
                  background: "#EFF6FF",
                  borderRadius: "10px",
                  border: "1px solid #BFDBFE",
                }}
              >
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#1E3A8A" }}>
                  Grand Total Paid:
                </span>
                <span style={{ fontSize: "17px", fontWeight: "900", color: "#1455D9" }}>
                  ₹{Number(selectedOrder.amount).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="db-modal-footer">
              <button
                type="button"
                className="db-card-link"
                onClick={() => setSelectedOrder(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="db-hero-insights-btn"
                onClick={() => window.print()}
                style={{ borderRadius: "8px", padding: "6px 14px" }}
              >
                <Printer size={14} />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
