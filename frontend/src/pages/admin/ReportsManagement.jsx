import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  Download,
  Printer,
  Calendar,
  IndianRupee,
  ShoppingBag,
  CreditCard,
  Package,
  Layers,
  ArrowUpRight,
  RefreshCw,
  Boxes,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Tag,
  DollarSign,
  PieChart,
  Percent,
  Sparkles,
  FileSpreadsheet,
  ShoppingCart,
} from "lucide-react";
import API from "../../services/api";
import bannerCartImg from "../../assets/banner-cart.png";
import "./ProductManagement.css";

const DATE_PRESETS = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week (7 Days)" },
  { value: "month", label: "This Month (30 Days)" },
  { value: "year", label: "This Year" },
];

const REPORT_TABS = [
  { id: "sales", label: "Sales Reports", icon: TrendingUp },
  { id: "products", label: "Product Performance", icon: Package },
  { id: "inventory", label: "Inventory Health", icon: Boxes },
  { id: "orders", label: "Order Status Ledger", icon: ShoppingBag },
  { id: "customers", label: "Customer Insights", icon: Users },
];

export default function ReportsManagement() {
  const [activeTab, setActiveTab] = useState("sales");
  const [datePreset, setDatePreset] = useState("all");
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReportData = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);

      const response = await API.get("/orders/reports");

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Failed to load reports");
      }

      const reportData = response.data;

      setOrders(Array.isArray(reportData.orders) ? reportData.orders : []);
      setProducts(Array.isArray(reportData.products) ? reportData.products : []);
    } catch (err) {
      console.error("Reports API error:", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData(true);

    const timer = setInterval(() => {
      fetchReportData(false);
    }, 3500);

    const handleStorageUpdate = () => {
      fetchReportData(false);
    };
    window.addEventListener("grocerease_storage_updated", handleStorageUpdate);

    return () => {
      clearInterval(timer);
      window.removeEventListener("grocerease_storage_updated", handleStorageUpdate);
    };
  }, []);

  // Filter Orders based on selected Date Preset
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    return orders.filter((o) => {
      const reportDate =
        o.paymentStatus === "Completed"
          ? new Date(o.completedAt || o.createdAt)
          : new Date(o.createdAt);

      if (Number.isNaN(reportDate.getTime())) return false;

      if (datePreset === "today" && reportDate < startOfToday) return false;
      if (datePreset === "week" && reportDate < sevenDaysAgo) return false;
      if (datePreset === "month" && reportDate < thirtyDaysAgo) return false;
      if (datePreset === "year" && reportDate < startOfYear) return false;

      return true;
    });
  }, [orders, datePreset]);

  // Completed Orders (Only verified completed payments count as sales)
  const completedOrders = useMemo(() => {
    return filteredOrders.filter((o) => o.paymentStatus === "Completed");
  }, [filteredOrders]);

  const pendingOrders = useMemo(() => {
    return filteredOrders.filter((o) => o.paymentStatus === "Pending");
  }, [filteredOrders]);

  const approvedOrders = useMemo(() => {
    return filteredOrders.filter((o) => o.paymentStatus === "Approved");
  }, [filteredOrders]);

  const failedOrders = useMemo(() => {
    return filteredOrders.filter((o) => o.paymentStatus === "Failed");
  }, [filteredOrders]);

  // Top 5 Executive KPI Calculations (Spec Requirement #1)
  const totalVerifiedSales = useMemo(() => {
    return completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }, [completedOrders]);

  const totalOrdersCount = filteredOrders.length;

  const totalProductsSold = useMemo(() => {
    return completedOrders.reduce((sum, o) => {
      const itemsCount = (o.items || []).reduce((s, it) => s + Number(it.quantity || 1), 0);
      return sum + (o.totalItems || itemsCount || 1);
    }, 0);
  }, [completedOrders]);

  // Unique Customers count from filtered orders
  const totalCustomersCount = useMemo(() => {
    const set = new Set();
    filteredOrders.forEach((o) => {
      const id = o.customer?.phone || o.customer?.email || o.customer?.name;
      if (id) set.add(id.toLowerCase().trim());
    });
    return set.size;
  }, [filteredOrders]);

  // Low stock products count
  const lowStockProductsList = useMemo(() => {
    return products.filter((p) => {
      const stock = Number(p.stock || 0);
      const threshold = Number(p.lowStockThreshold || 5);
      return stock <= threshold;
    });
  }, [products]);

  const outOfStockProductsList = useMemo(() => {
    return products.filter((p) => Number(p.stock || 0) === 0);
  }, [products]);

  // 1. Sales Report Calculations (Payment Method-wise & Trends)
  const paymentMethodStats = useMemo(() => {
    const map = {
      UPI: { count: 0, amount: 0 },
      Card: { count: 0, amount: 0 },
      Cash: { count: 0, amount: 0 },
    };

    completedOrders.forEach((o) => {
      const m = o.paymentMethod === "Cash" ? "Cash" : o.paymentMethod === "Card" ? "Card" : "UPI";
      if (!map[m]) map[m] = { count: 0, amount: 0 };
      map[m].count += 1;
      map[m].amount += Number(o.totalAmount || 0);
    });

    return Object.entries(map).map(([method, data]) => ({
      method,
      count: data.count,
      amount: data.amount,
      percentage: totalVerifiedSales > 0 ? Math.round((data.amount / totalVerifiedSales) * 100) : 0,
    }));
  }, [completedOrders, totalVerifiedSales]);

  // Daily Sales Trends for Chart (last 7 recorded days)
  const salesTrendsData = useMemo(() => {
    const dayMap = {};
    const now = new Date();

    // Seed last 7 days so chart is never empty
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
      dayMap[key] = { label: key, amount: 0, ordersCount: 0 };
    }

    completedOrders.forEach((o) => {
      if (o.createdAt) {
        const d = new Date(o.createdAt);
        const key = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
        if (dayMap[key]) {
          dayMap[key].amount += Number(o.totalAmount || 0);
          dayMap[key].ordersCount += 1;
        }
      }
    });

    return Object.values(dayMap);
  }, [completedOrders]);

  const maxTrendAmount = useMemo(() => {
    const max = Math.max(...salesTrendsData.map((d) => d.amount), 1);
    return max;
  }, [salesTrendsData]);

  // 2. Product Performance Calculations (Best & Least Selling, Categories)
  const { productSalesList, categorySalesList } = useMemo(() => {
    const prodMap = {};
    const catMap = {};

    // Seed from catalog so even 0-sale products appear in least selling
    products.forEach((p) => {
      prodMap[p.name] = {
        name: p.name,
        brand: p.brand || "",
        category: p.category || "General",
        price: Number(p.price || 0),
        stock: Number(p.stock || 0),
        unitsSold: 0,
        revenue: 0,
      };
      const cat = p.category || "Other";
      if (!catMap[cat]) {
        catMap[cat] = { category: cat, itemsCount: 0, unitsSold: 0, revenue: 0 };
      }
      catMap[cat].itemsCount += 1;
    });

    completedOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const name = item.name || "Unknown Product";
        const qty = Number(item.quantity || 1);
        const rev = Number(item.subtotal || item.price * qty);

        if (!prodMap[name]) {
          prodMap[name] = {
            name,
            brand: item.brand || "",
            category: item.category || "General",
            price: Number(item.price || 0),
            stock: 0,
            unitsSold: 0,
            revenue: 0,
          };
        }
        prodMap[name].unitsSold += qty;
        prodMap[name].revenue += rev;

        const cat = item.category || prodMap[name].category || "Other";
        if (!catMap[cat]) {
          catMap[cat] = { category: cat, itemsCount: 1, unitsSold: 0, revenue: 0 };
        }
        catMap[cat].unitsSold += qty;
        catMap[cat].revenue += rev;
      });
    });

    const sortedProducts = Object.values(prodMap).sort((a, b) => b.unitsSold - a.unitsSold);
    const sortedCategories = Object.values(catMap).sort((a, b) => b.revenue - a.revenue);

    return { productSalesList: sortedProducts, categorySalesList: sortedCategories };
  }, [products, completedOrders]);

  const bestSellingProducts = useMemo(() => {
    return productSalesList.filter((p) => p.unitsSold > 0).slice(0, 8);
  }, [productSalesList]);

  const leastSellingProducts = useMemo(() => {
    return [...productSalesList].sort((a, b) => a.unitsSold - b.unitsSold).slice(0, 8);
  }, [productSalesList]);

  // 3. Customer Reports Calculations (Top Spenders)
  const customerRankings = useMemo(() => {
    const map = {};

    filteredOrders.forEach((o) => {
      const name = o.customer?.name || "Guest Shopper";
      const phone = o.customer?.phone || "N/A";
      const key = phone !== "N/A" ? phone : name;

      if (!map[key]) {
        map[key] = {
          name,
          phone,
          ordersCount: 0,
          completedOrdersCount: 0,
          totalSpent: 0,
          preferredPayment: o.paymentMethod || "UPI",
          latestVisit: new Date(o.createdAt || Date.now()),
        };
      }

      map[key].ordersCount += 1;
      if (o.paymentStatus === "Completed") {
        map[key].completedOrdersCount += 1;
        map[key].totalSpent += Number(o.totalAmount || 0);
      }
      if (new Date(o.createdAt) > map[key].latestVisit) {
        map[key].latestVisit = new Date(o.createdAt);
      }
    });

    return Object.values(map).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [filteredOrders]);

  // Inventory valuation
  const totalInventoryValuation = useMemo(() => {
    return products.reduce((sum, p) => sum + Number(p.stock || 0) * Number(p.price || 0), 0);
  }, [products]);

  const totalShelfUnits = useMemo(() => {
    return products.reduce((sum, p) => sum + Number(p.stock || 0), 0);
  }, [products]);

  // Excel / CSV Export
  const handleExportCSV = () => {
    let headers = "";
    let rows = [];
    const dateTag = datePreset.toUpperCase();

    if (activeTab === "sales") {
      headers = "Order Number,Date,Customer,Payment Method,Payment Status,Subtotal,Discount,Total Amount\n";
      rows = filteredOrders.map((o) =>
        `"${o.orderNumber}","${new Date(o.createdAt).toLocaleString("en-IN")}","${o.customer?.name || "Shopper"}","${o.paymentMethod}","${o.paymentStatus}",${o.subtotalAmount || o.totalAmount},${o.discountAmount || 0},${o.totalAmount}`
      );
    } else if (activeTab === "products") {
      headers = "Rank,Product Name,Category,Unit Price,Units Sold,Total Revenue,Shelf Stock\n";
      rows = productSalesList.map((p, idx) =>
        `${idx + 1},"${p.name}","${p.category}",${p.price},${p.unitsSold},${p.revenue},${p.stock}`
      );
    } else if (activeTab === "inventory") {
      headers = "Product Name,Category,Price,Current Stock,Threshold,Stock Health,Total Value\n";
      rows = products.map((p) => {
        const stock = Number(p.stock || 0);
        const thresh = Number(p.lowStockThreshold || 5);
        const health = stock === 0 ? "OUT OF STOCK" : stock <= thresh ? "LOW STOCK" : "OPTIMAL";
        return `"${p.name}","${p.category}",${p.price},${stock},${thresh},"${health}",${stock * Number(p.price || 0)}`;
      });
    } else if (activeTab === "orders") {
      headers = "Order ID,Date,Customer,Items Count,Total Amount,Payment Method,Payment Status,Exit Barcode\n";
      rows = filteredOrders.map((o) =>
        `"${o.orderNumber}","${new Date(o.createdAt).toLocaleString("en-IN")}","${o.customer?.name || "Shopper"}",${o.totalItems || 1},${o.totalAmount},"${o.paymentMethod}","${o.paymentStatus}","${o.exitBarcode}"`
      );
    } else {
      // customers
      headers = "Customer Name,Phone,Total Orders,Lifetime Completed Spend,Preferred Payment,Latest Visit\n";
      rows = customerRankings.map((c) =>
        `"${c.name}","${c.phone}",${c.ordersCount},${c.totalSpent},"${c.preferredPayment}","${c.latestVisit.toLocaleDateString("en-IN")}"`
      );
    }

    const csvContent = "data:text/csv;charset=utf-8," + headers + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `GrocerEase_Report_${activeTab.toUpperCase()}_${dateTag}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Official Print Report (PDF)
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="grocer-page-container">
      {/* ========================================================================= */}
      {/* 1. TOP HERO BANNER WITH SHOPPING CART & DYNAMIC CURVED RIBBON             */}
      {/* ========================================================================= */}
      <section className="pm-hero-section">
        <div className="pm-hero-left">
          <h1 className="pm-main-title">Reports & Analytics Intelligence</h1>
          <p className="pm-main-subtitle">
            Executive revenue metrics, product velocity, inventory health audits & shopper statistics
          </p>
          <div className="pm-title-underline" />

          {/* Action Pills */}
          <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
            <button
              type="button"
              className="action-pill-btn primary"
              onClick={handleExportCSV}
              style={{ padding: "8px 16px", fontSize: "12.5px" }}
            >
              <FileSpreadsheet size={14} />
              <span>Export {activeTab.toUpperCase()} Report (Excel/CSV)</span>
            </button>

            <button
              type="button"
              className="action-pill-btn refresh"
              onClick={handlePrintReport}
              style={{ padding: "8px 16px", fontSize: "12.5px" }}
            >
              <Printer size={14} />
              <span>Print Official PDF Report</span>
            </button>

            <button
              type="button"
              className="action-pill-btn refresh"
              onClick={() => fetchReportData(true)}
              disabled={loading}
              style={{ padding: "8px 16px", fontSize: "12.5px" }}
            >
              <RefreshCw size={14} className={loading ? "spin" : ""} />
              <span>{loading ? "Syncing..." : "Sync DB"}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Curved Ribbon & Fresh Groceries Shopping Cart */}
        <div className="pm-hero-art">
          <div className="pm-hero-store-bg" />

          <div className="pm-hero-ribbon-wrap">
            <svg className="pm-hero-ribbon-svg" viewBox="0 0 640 150" fill="none" preserveAspectRatio="none">
              <defs>
                <linearGradient id="goldRibbonGradReports" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0" />
                  <stop offset="15%" stopColor="#FDE047" />
                  <stop offset="50%" stopColor="#FBBF24" />
                  <stop offset="80%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#FBBF24" />
                </linearGradient>
                <linearGradient id="blueRibbonGradReports" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0" />
                  <stop offset="15%" stopColor="#1D4ED8" />
                  <stop offset="50%" stopColor="#2563EB" />
                  <stop offset="80%" stopColor="#1E40AF" />
                  <stop offset="100%" stopColor="#1E3A8A" />
                </linearGradient>
              </defs>
              <path
                d="M 0 115 C 120 75, 220 50, 340 68 C 450 82, 540 60, 640 45 L 640 68 C 540 82, 450 105, 340 92 C 220 75, 120 100, 0 138 Z"
                fill="url(#blueRibbonGradReports)"
                opacity="0.95"
              />
              <path
                d="M 0 108 C 120 68, 220 43, 340 61 C 450 75, 540 53, 640 38 L 640 46 C 540 61, 450 83, 340 69 C 220 51, 120 76, 0 116 Z"
                fill="url(#goldRibbonGradReports)"
              />
            </svg>
          </div>

          <img
            src={bannerCartImg}
            alt="Supermarket Shopping Cart with Fresh Groceries"
            className="pm-hero-cart-img"
          />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. FIVE HORIZONTAL EXECUTIVE KPI CARDS (SPEC REQUIREMENT #1)               */}
      {/* ========================================================================= */}
      <section className="rm-kpi-grid-5">
        {/* Card 1: Total Sales */}
        <div className="pm-kpi-card green-theme">
          <div className="pm-kpi-icon-pill green">
            <IndianRupee size={20} color="#059669" strokeWidth={2.4} />
          </div>
          <div className="pm-kpi-content">
            <h3 className="pm-kpi-number">₹{totalVerifiedSales.toLocaleString("en-IN")}</h3>
            <span className="pm-kpi-label">Total Verified Sales</span>
            <div className="pm-kpi-trend green">
              <span className="trend-arrow">✓</span>
              <span>Completed Only</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Orders */}
        <div className="pm-kpi-card blue-theme">
          <div className="pm-kpi-icon-pill blue">
            <ShoppingCart size={20} color="#2563EB" strokeWidth={2.4} />
          </div>
          <div className="pm-kpi-content">
            <h3 className="pm-kpi-number">{totalOrdersCount}</h3>
            <span className="pm-kpi-label">Total Orders Placed</span>
            <div className="pm-kpi-trend green">
              <span className="trend-arrow">↑</span>
              <span>{completedOrders.length} completed</span>
            </div>
          </div>
        </div>

        {/* Card 3: Products Sold */}
        <div className="pm-kpi-card purple-theme">
          <div className="pm-kpi-icon-pill purple">
            <Package size={20} color="#7C3AED" strokeWidth={2.4} />
          </div>
          <div className="pm-kpi-content">
            <h3 className="pm-kpi-number">{totalProductsSold}</h3>
            <span className="pm-kpi-label">Products Sold</span>
            <div className="pm-kpi-trend green">
              <span className="trend-arrow">✓</span>
              <span>Units checked out</span>
            </div>
          </div>
        </div>

        {/* Card 4: Total Customers */}
        <div className="pm-kpi-card yellow-theme">
          <div className="pm-kpi-icon-pill yellow">
            <Users size={20} color="#D97706" strokeWidth={2.4} />
          </div>
          <div className="pm-kpi-content">
            <h3 className="pm-kpi-number">{totalCustomersCount}</h3>
            <span className="pm-kpi-label">Total Customers</span>
            <div className="pm-kpi-trend green">
              <span className="trend-arrow">↑</span>
              <span>Unique Shoppers</span>
            </div>
          </div>
        </div>

        {/* Card 5: Low-Stock Products */}
        <div className="pm-kpi-card" style={{ borderLeft: "4px solid #EF4444" }}>
          <div className="pm-kpi-icon-pill" style={{ background: "#FEF2F2" }}>
            <AlertTriangle size={20} color="#DC2626" strokeWidth={2.4} />
          </div>
          <div className="pm-kpi-content">
            <h3 className="pm-kpi-number" style={{ color: lowStockProductsList.length > 0 ? "#DC2626" : "#0F172A" }}>
              {lowStockProductsList.length}
            </h3>
            <span className="pm-kpi-label">Low-Stock SKUs</span>
            <div className="pm-kpi-trend" style={{ color: "#DC2626" }}>
              <span className="trend-arrow">▲</span>
              <span>{outOfStockProductsList.length} out of stock</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. DATE RANGE PRESETS & REPORT CATEGORY TABS STRIP                         */}
      {/* ========================================================================= */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
        {/* 5 Report Category Tabs */}
        <div className="rm-tabs-strip" style={{ marginBottom: 0 }}>
          {REPORT_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`rm-tab-btn ${isActive ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Date Preset Buttons */}
        <div className="rm-date-filters">
          <Calendar size={16} color="#64748B" />
          {DATE_PRESETS.map((dp) => (
            <button
              key={dp.value}
              type="button"
              onClick={() => setDatePreset(dp.value)}
              className={`rm-date-filter-btn ${
                datePreset === dp.value ? "active" : ""
              }`}
            >
              {dp.label}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. VISUAL SALES OVERVIEW CHARTS & PERFORMANCE DISTRIBUTION                 */}
      {/* ========================================================================= */}
      <section className="rm-chart-grid-2">
        {/* Chart A: Daily Sales Trend Bar Chart */}
        <div className="rm-chart-card">
          <div className="rm-chart-header">
            <h3 className="rm-chart-title">
              <TrendingUp size={18} color="#2563EB" />
              <span>Verified Sales Trend & Volume ({datePreset.toUpperCase()})</span>
            </h3>
            <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 700 }}>
              Completed Checkouts Only
            </span>
          </div>

          <div className="rm-bar-group">
            {salesTrendsData.map((d, idx) => {
              const heightPct = Math.max(12, Math.round((d.amount / maxTrendAmount) * 100));
              return (
                <div key={idx} className="rm-bar-col">
                  {d.amount > 0 && (
                    <span className="rm-bar-val">₹{d.amount > 999 ? `${(d.amount / 1000).toFixed(1)}k` : d.amount}</span>
                  )}
                  <div
                    className="rm-bar-fill"
                    style={{ height: `${heightPct}%` }}
                    title={`${d.label}: ₹${d.amount} (${d.ordersCount} orders)`}
                  />
                  <span className="rm-bar-label">{d.label}</span>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "14px", fontSize: "12px", color: "#64748B" }}>
            <span>Total Trend Turnover: <strong>₹{totalVerifiedSales.toLocaleString("en-IN")}</strong></span>
            <span>AOV: <strong>₹{completedOrders.length > 0 ? Math.round(totalVerifiedSales / completedOrders.length) : 0}</strong></span>
          </div>
        </div>

        {/* Chart B: Category Performance & Payment Methods Share */}
        <div className="rm-chart-card">
          <div className="rm-chart-header">
            <h3 className="rm-chart-title">
              <PieChart size={18} color="#7C3AED" />
              <span>Department Sales & Payment Share</span>
            </h3>
          </div>

          {/* Category Progress Bars */}
          <div className="rm-progress-list">
            {categorySalesList.slice(0, 4).map((cat) => {
              const pct = totalVerifiedSales > 0 ? Math.round((cat.revenue / totalVerifiedSales) * 100) : 0;
              return (
                <div key={cat.category} className="rm-progress-item">
                  <div className="rm-progress-meta">
                    <span style={{ color: "#0F172A" }}>{cat.category}</span>
                    <span style={{ color: "#2563EB" }}>₹{cat.revenue.toLocaleString("en-IN")} ({pct}%)</span>
                  </div>
                  <div className="rm-progress-track">
                    <div
                      className="rm-progress-bar"
                      style={{
                        width: `${pct}%`,
                        background: "linear-gradient(90deg, #3B82F6 0%, #1D4ED8 100%)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Payment Method Distribution Strip */}
          <div style={{ marginTop: "18px", paddingTop: "14px", borderTop: "1px dashed #E2E8F0" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
              Settlement Methods (Verified Paid)
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              {paymentMethodStats.map((pm) => (
                <div
                  key={pm.method}
                  style={{
                    flex: 1,
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                    padding: "8px 10px",
                    textAlign: "center",
                  }}
                >
                  <span style={{ fontSize: "11px", color: "#64748B", display: "block" }}>{pm.method}</span>
                  <strong style={{ fontSize: "13px", color: "#0F172A" }}>{pm.percentage}%</strong>
                  <span style={{ fontSize: "10.5px", color: "#2563EB", display: "block" }}>₹{pm.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. REPORT CATEGORY DETAILS & DATA TABLES (SPEC REQUIREMENT #2)             */}
      {/* ========================================================================= */}

      {/* ------------------------------------------------------------------------- */}
      {/* TAB 1: SALES REPORTS                                                      */}
      {/* ------------------------------------------------------------------------- */}
      {activeTab === "sales" && (
        <div className="pm-catalog-card">
          <div className="pm-catalog-header">
            <div className="pm-catalog-title-group">
              <div className="pm-catalog-icon-box">
                <TrendingUp size={18} color="#FFFFFF" />
              </div>
              <h3 className="pm-catalog-heading">
                Sales Reports Ledger ({completedOrders.length} Completed Transactions)
              </h3>
            </div>
          </div>

          <div className="pm-table-wrapper">
            <table className="pm-products-table">
              <thead>
                <tr>
                  <th>ORDER NUMBER</th>
                  <th>TIMESTAMP</th>
                  <th>CUSTOMER</th>
                  <th>PAYMENT METHOD</th>
                  <th>GROSS SUBTOTAL</th>
                  <th>DISCOUNT</th>
                  <th>VERIFIED AMOUNT</th>
                  <th>SETTLEMENT STATUS</th>
                </tr>
              </thead>
              <tbody>
                {completedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "#64748B" }}>
                      No verified completed sales recorded in this period.
                    </td>
                  </tr>
                ) : (
                  completedOrders.map((o) => (
                    <tr key={o._id}>
                      <td>
                        <span style={{ fontFamily: "monospace", fontWeight: 800, color: "#1D4ED8", background: "#EFF6FF", padding: "3px 8px", borderRadius: "6px" }}>
                          {o.orderNumber}
                        </span>
                      </td>
                      <td>{new Date(o.createdAt).toLocaleString("en-IN")}</td>
                      <td><strong>{o.customer?.name || "Guest Shopper"}</strong></td>
                      <td><span className="om-method-tag upi">{o.paymentMethod}</span></td>
                      <td>₹{Number(o.subtotalAmount || o.totalAmount).toFixed(2)}</td>
                      <td style={{ color: "#059669" }}>-₹{Number(o.discountAmount || 0).toFixed(2)}</td>
                      <td><span className="pm-price-bold">₹{Number(o.totalAmount).toFixed(2)}</span></td>
                      <td><span className="om-status-pill completed">✓ Verified Completed</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* TAB 2: PRODUCT REPORTS                                                    */}
      {/* ------------------------------------------------------------------------- */}
      {activeTab === "products" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          {/* Best Selling Products */}
          <div className="pm-catalog-card">
            <div className="pm-catalog-header">
              <div className="pm-catalog-title-group">
                <div className="pm-catalog-icon-box" style={{ background: "#059669" }}>
                  <Package size={18} color="#FFFFFF" />
                </div>
                <h3 className="pm-catalog-heading">
                  Best-Selling Products (Ranked by Sales Volume & Revenue)
                </h3>
              </div>
            </div>

            <div className="pm-table-wrapper">
              <table className="pm-products-table">
                <thead>
                  <tr>
                    <th>RANK</th>
                    <th>PRODUCT NAME</th>
                    <th>CATEGORY</th>
                    <th>SELLING PRICE</th>
                    <th style={{ textAlign: "center" }}>UNITS SOLD</th>
                    <th>TOTAL REVENUE</th>
                    <th>CURRENT SHELF STOCK</th>
                  </tr>
                </thead>
                <tbody>
                  {bestSellingProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "#64748B" }}>
                        No product sales recorded yet in this date range.
                      </td>
                    </tr>
                  ) : (
                    bestSellingProducts.map((p, idx) => (
                      <tr key={p.name}>
                        <td>
                          <span style={{ fontWeight: 800, color: idx === 0 ? "#D97706" : "#2563EB" }}>
                            #{idx + 1}
                          </span>
                        </td>
                        <td><strong>{p.name}</strong> {p.brand && <span style={{ color: "#64748B", fontSize: "11px" }}>({p.brand})</span>}</td>
                        <td><span className="pm-category-text">{p.category}</span></td>
                        <td>₹{Number(p.price).toFixed(2)}</td>
                        <td style={{ textAlign: "center" }}>
                          <span style={{ background: "#EFF6FF", color: "#1D4ED8", padding: "3px 8px", borderRadius: "6px", fontWeight: 800 }}>
                            {p.unitsSold} units
                          </span>
                        </td>
                        <td><span className="pm-price-bold">₹{p.revenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></td>
                        <td><strong>{p.stock} units</strong></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Least Selling / Slow Moving Products */}
          <div className="pm-catalog-card">
            <div className="pm-catalog-header">
              <div className="pm-catalog-title-group">
                <div className="pm-catalog-icon-box" style={{ background: "#D97706" }}>
                  <Clock size={18} color="#FFFFFF" />
                </div>
                <h3 className="pm-catalog-heading">
                  Least-Selling & Slow-Moving SKUs (Stock Optimization)
                </h3>
              </div>
            </div>

            <div className="pm-table-wrapper">
              <table className="pm-products-table">
                <thead>
                  <tr>
                    <th>PRODUCT NAME</th>
                    <th>CATEGORY</th>
                    <th>SELLING PRICE</th>
                    <th style={{ textAlign: "center" }}>UNITS SOLD</th>
                    <th>REVENUE GENERATED</th>
                    <th>CURRENT SHELF STOCK</th>
                    <th>TIED ASSET VALUATION</th>
                  </tr>
                </thead>
                <tbody>
                  {leastSellingProducts.map((p) => (
                    <tr key={p.name}>
                      <td><strong>{p.name}</strong></td>
                      <td><span className="pm-category-text">{p.category}</span></td>
                      <td>₹{Number(p.price).toFixed(2)}</td>
                      <td style={{ textAlign: "center" }}>
                        <span style={{ color: p.unitsSold === 0 ? "#DC2626" : "#475569", fontWeight: 700 }}>
                          {p.unitsSold} units
                        </span>
                      </td>
                      <td>₹{p.revenue.toFixed(2)}</td>
                      <td>{p.stock} units</td>
                      <td><strong>₹{(p.stock * p.price).toFixed(2)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* TAB 3: INVENTORY REPORTS                                                  */}
      {/* ------------------------------------------------------------------------- */}
      {activeTab === "inventory" && (
        <div className="pm-catalog-card">
          <div className="pm-catalog-header">
            <div className="pm-catalog-title-group">
              <div className="pm-catalog-icon-box" style={{ background: "#2563EB" }}>
                <Boxes size={18} color="#FFFFFF" />
              </div>
              <h3 className="pm-catalog-heading">
                Supermarket Stock Health & Valuation Audit ({products.length} Registered Products)
              </h3>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <span className="inv-valuation-badge">
                Total Asset Valuation: ₹{totalInventoryValuation.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div className="pm-table-wrapper">
            <table className="pm-products-table">
              <thead>
                <tr>
                  <th>PRODUCT DETAILS</th>
                  <th>CATEGORY</th>
                  <th>CURRENT STOCK</th>
                  <th>MIN THRESHOLD</th>
                  <th>STOCK STATUS</th>
                  <th>UNIT PRICE</th>
                  <th>TOTAL VALUATION</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const stock = Number(p.stock || 0);
                  const threshold = Number(p.lowStockThreshold || 5);
                  const isOut = stock === 0;
                  const isLow = stock <= threshold && !isOut;

                  return (
                    <tr key={p._id || p.name}>
                      <td>
                        <strong>{p.name}</strong>
                        {p.brand && <span style={{ color: "#64748B", fontSize: "11px", display: "block" }}>{p.brand}</span>}
                      </td>
                      <td><span className="pm-category-text">{p.category}</span></td>
                      <td><strong>{stock} units</strong></td>
                      <td>{threshold} units</td>
                      <td>
                        {isOut ? (
                          <span className="om-status-pill failed">✕ Out of Stock</span>
                        ) : isLow ? (
                          <span className="om-status-pill pending">▲ Low Stock</span>
                        ) : (
                          <span className="om-status-pill completed">✓ In Stock</span>
                        )}
                      </td>
                      <td>₹{Number(p.price || 0).toFixed(2)}</td>
                      <td><span className="pm-price-bold">₹{(stock * Number(p.price || 0)).toFixed(2)}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* TAB 4: ORDER REPORTS                                                      */}
      {/* ------------------------------------------------------------------------- */}
      {activeTab === "orders" && (
        <div className="pm-catalog-card">
          <div className="pm-catalog-header">
            <div className="pm-catalog-title-group">
              <div className="pm-catalog-icon-box" style={{ background: "#7C3AED" }}>
                <ShoppingBag size={18} color="#FFFFFF" />
              </div>
              <h3 className="pm-catalog-heading">
                Order Status Audit ({filteredOrders.length} Orders in Period)
              </h3>
            </div>
          </div>

          {/* Quick Order Status Strips */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", padding: "16px 20px 0" }}>
            <div className="rm-stat-box">
              <span className="title">Completed</span>
              <span className="num" style={{ color: "#16A34A" }}>{completedOrders.length}</span>
            </div>
            <div className="rm-stat-box">
              <span className="title">Pending Cash/Auth</span>
              <span className="num" style={{ color: "#D97706" }}>{pendingOrders.length}</span>
            </div>
            <div className="rm-stat-box">
              <span className="title">Approved Orders</span>
              <span className="num" style={{ color: "#4F46E5" }}>{approvedOrders.length}</span>
            </div>
            <div className="rm-stat-box">
              <span className="title">Cancelled/Failed</span>
              <span className="num" style={{ color: "#DC2626" }}>{failedOrders.length}</span>
            </div>
          </div>

          <div className="pm-table-wrapper" style={{ marginTop: "12px" }}>
            <table className="pm-products-table">
              <thead>
                <tr>
                  <th>ORDER ID</th>
                  <th>DATE & TIME</th>
                  <th>CUSTOMER</th>
                  <th>ITEMS</th>
                  <th>AMOUNT</th>
                  <th>PAYMENT METHOD</th>
                  <th>STATUS</th>
                  <th>GATE EXIT BARCODE</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => (
                  <tr key={o._id}>
                    <td>
                      <span style={{ fontFamily: "monospace", fontWeight: 800, color: "#1D4ED8" }}>
                        {o.orderNumber}
                      </span>
                    </td>
                    <td>{new Date(o.createdAt).toLocaleString("en-IN")}</td>
                    <td><strong>{o.customer?.name || "Guest Shopper"}</strong></td>
                    <td>{o.totalItems || 1} items</td>
                    <td><span className="pm-price-bold">₹{Number(o.totalAmount).toFixed(2)}</span></td>
                    <td><span className="om-method-tag upi">{o.paymentMethod}</span></td>
                    <td>
                      <span
                        className={`om-status-pill ${
                          o.paymentStatus === "Completed"
                            ? "completed"
                            : o.paymentStatus === "Approved"
                            ? "approved"
                            : "pending"
                        }`}
                      >
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td><span style={{ fontFamily: "monospace", fontSize: "11px" }}>{o.exitBarcode}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* TAB 5: CUSTOMER REPORTS                                                   */}
      {/* ------------------------------------------------------------------------- */}
      {activeTab === "customers" && (
        <div className="pm-catalog-card">
          <div className="pm-catalog-header">
            <div className="pm-catalog-title-group">
              <div className="pm-catalog-icon-box" style={{ background: "#2563EB" }}>
                <Users size={18} color="#FFFFFF" />
              </div>
              <h3 className="pm-catalog-heading">
                Customer Purchase Intelligence & Spender Rankings
              </h3>
            </div>
          </div>

          <div className="pm-table-wrapper">
            <table className="pm-products-table">
              <thead>
                <tr>
                  <th>CUSTOMER NAME</th>
                  <th>MOBILE NUMBER</th>
                  <th style={{ textAlign: "center" }}>TOTAL ORDERS</th>
                  <th>LIFETIME VERIFIED SPEND</th>
                  <th>AVERAGE ORDER VALUE</th>
                  <th>PREFERRED PAYMENT</th>
                  <th>LATEST VISIT</th>
                </tr>
              </thead>
              <tbody>
                {customerRankings.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "#64748B" }}>
                      No customer transactions found for this period.
                    </td>
                  </tr>
                ) : (
                  customerRankings.map((c) => {
                    const aov = c.completedOrdersCount > 0 ? Math.round(c.totalSpent / c.completedOrdersCount) : 0;
                    return (
                      <tr key={c.phone + c.name}>
                        <td><strong>{c.name}</strong></td>
                        <td>{c.phone}</td>
                        <td style={{ textAlign: "center" }}>
                          <span style={{ background: "#F1F5F9", padding: "3px 8px", borderRadius: "6px", fontWeight: 800 }}>
                            {c.ordersCount}
                          </span>
                        </td>
                        <td><span className="pm-price-bold">₹{c.totalSpent.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></td>
                        <td>₹{aov}</td>
                        <td><span className="om-method-tag card">{c.preferredPayment}</span></td>
                        <td>{c.latestVisit.toLocaleDateString("en-IN")}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
