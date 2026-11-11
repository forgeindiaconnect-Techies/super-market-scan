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
import ErpPageBanner from "../../components/ErpPageBanner";
import { mergeApiWithStorage, getPersistentProducts } from "../../utils/realtimeStorage";
import bannerCartImg from "../../assets/banner-cart.png";
import "./ProductManagement.css";

const DATE_PRESETS = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
];

const REPORT_TABS = [
  { id: "sales", label: "Sales Reports", icon: TrendingUp },
  { id: "products", label: "Product Performance", icon: Package },
  { id: "inventory", label: "Inventory Health", icon: Boxes },
  { id: "orders", label: "Orders Ledger", icon: ShoppingBag },
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
      const apiOrders = Array.isArray(reportData.orders) ? reportData.orders : [];
      const apiProducts = Array.isArray(reportData.products) ? reportData.products : [];

      // Merge backend products with local persistent storage for real-time consistency
      const mergedProducts = mergeApiWithStorage(apiProducts);

      setOrders(apiOrders);
      setProducts(mergedProducts);
    } catch (err) {
      console.error("Reports API error:", err);
      setProducts(getPersistentProducts());
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData(true);

    const timer = setInterval(() => {
      fetchReportData(false);
    }, 3000);

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

  // Daily / Periodic Sales Trends for Real-time Chart
  const salesTrendsData = useMemo(() => {
    const dayMap = {};
    const now = new Date();

    if (datePreset === "today") {
      // 2-hour intervals for Today's live sales
      const hours = [8, 10, 12, 14, 16, 18, 20, 22];
      hours.forEach((h) => {
        const label = `${h > 12 ? h - 12 : h} ${h >= 12 ? "PM" : "AM"}`;
        dayMap[label] = { label, amount: 0, ordersCount: 0 };
      });

      completedOrders.forEach((o) => {
        const d = new Date(o.completedAt || o.createdAt);
        if (!Number.isNaN(d.getTime())) {
          const h = d.getHours();
          const bucket = hours.reduce((prev, curr) => (h >= curr ? curr : prev), hours[0]);
          const label = `${bucket > 12 ? bucket - 12 : bucket} ${bucket >= 12 ? "PM" : "AM"}`;
          if (dayMap[label]) {
            dayMap[label].amount += Number(o.totalAmount || 0);
            dayMap[label].ordersCount += 1;
          }
        }
      });
      return Object.values(dayMap);
    }

    if (datePreset === "week") {
      // Exact last 7 days calendar timeline
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const key = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
        dayMap[key] = { label: key, amount: 0, ordersCount: 0, time: d.getTime() };
      }

      completedOrders.forEach((o) => {
        const d = new Date(o.completedAt || o.createdAt);
        if (!Number.isNaN(d.getTime())) {
          const key = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
          if (dayMap[key]) {
            dayMap[key].amount += Number(o.totalAmount || 0);
            dayMap[key].ordersCount += 1;
          }
        }
      });
      return Object.values(dayMap);
    }

    // "all", "month", "year":
    // 1. Initialize recent 7 days baseline
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
      dayMap[key] = { label: key, amount: 0, ordersCount: 0, time: d.getTime() };
    }

    // 2. Incorporate all completed orders so NO real revenue is lost
    completedOrders.forEach((o) => {
      const d = new Date(o.completedAt || o.createdAt);
      if (!Number.isNaN(d.getTime())) {
        const key = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
        if (!dayMap[key]) {
          dayMap[key] = {
            label: key,
            amount: 0,
            ordersCount: 0,
            time: new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(),
          };
        }
        dayMap[key].amount += Number(o.totalAmount || 0);
        dayMap[key].ordersCount += 1;
      }
    });

    const sorted = Object.values(dayMap).sort((a, b) => a.time - b.time);
    return sorted.slice(-8);
  }, [completedOrders, datePreset]);

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

  // Active departments with revenue only
  const activeCategorySales = useMemo(() => {
    return (categorySalesList || []).filter((cat) => cat.revenue > 0);
  }, [categorySalesList]);

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
      {/* 1. TOP HERO BANNER - EXACT MATCH TO REGISTER NEW PRODUCT                  */}
      {/* ========================================================================= */}
      <ErpPageBanner
        title="Reports & Analytics"
        subtitle="Real-time supermarket sales trends, inventory turnover & customer insights"
        badges={["Live Sales Tracking", "Revenue Analytics", "Export CSV & Print"]}
        icon={<BarChart3 size={22} color="#ffffff" strokeWidth={2.4} />}
      />

      {/* ========================================================================= */}
      {/* 2. FIVE HORIZONTAL EXECUTIVE KPI CARDS                                    */}
      {/* ========================================================================= */}
      <section className="rm-kpi-grid-5">
        {/* Card 1: Total Sales */}
        <div className="pm-kpi-card green-theme">
          <div className="pm-kpi-icon-pill green">
            <IndianRupee size={20} color="#059669" strokeWidth={2.4} />
          </div>
          <div className="pm-kpi-content">
            <h3 className="pm-kpi-number">₹{totalVerifiedSales.toLocaleString("en-IN")}</h3>
            <span className="pm-kpi-label">Total Sales</span>
            <div className="pm-kpi-trend green">
              <span>{completedOrders.length} completed</span>
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
            <span className="pm-kpi-label">Total Orders</span>
            <div className="pm-kpi-trend green">
              <span>All order records</span>
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
            <span className="pm-kpi-label">Items Sold</span>
            <div className="pm-kpi-trend green">
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
            <span className="pm-kpi-label">Customers</span>
            <div className="pm-kpi-trend green">
              <span>Unique shoppers</span>
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
            <span className="pm-kpi-label">Low Stock Items</span>
            <div className="pm-kpi-trend" style={{ color: "#DC2626" }}>
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

        {/* Date Preset Buttons & Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
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

          <button
            type="button"
            className="pm-action-btn primary"
            onClick={handleExportCSV}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "6px 12px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 700,
              background: "#1D4ED8",
              color: "#FFFFFF",
              border: "none",
              cursor: "pointer",
            }}
          >
            <FileSpreadsheet size={13} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            className="pm-action-btn"
            onClick={handlePrintReport}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "6px 12px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 700,
              background: "#F1F5F9",
              color: "#1E293B",
              border: "1px solid #CBD5E1",
              cursor: "pointer",
            }}
          >
            <Printer size={13} />
            <span>Print</span>
          </button>

          <button
            type="button"
            className="pm-action-btn"
            onClick={() => fetchReportData(true)}
            disabled={loading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "6px 12px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 700,
              background: "#F1F5F9",
              color: "#1E293B",
              border: "1px solid #CBD5E1",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={13} className={loading ? "spin" : ""} />
            <span>{loading ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. VISUAL SALES OVERVIEW CHARTS & PERFORMANCE DISTRIBUTION                 */}
      {/* ========================================================================= */}
      <section className="rm-chart-grid-2">
        {/* Chart A: Sales Trend Bar Chart */}
        <div className="rm-chart-card">
          <div className="rm-chart-header">
            <h3 className="rm-chart-title">
              <TrendingUp size={18} color="#2563EB" />
              <span>Sales Trend & Volume</span>
            </h3>
            <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 700 }}>
              Completed Revenue
            </span>
          </div>

          <div className="rm-bar-group">
            {salesTrendsData.map((d, idx) => {
              const heightPct =
                d.amount > 0
                  ? Math.max(10, Math.round((d.amount / maxTrendAmount) * 100))
                  : 0;
              return (
                <div key={idx} className="rm-bar-col">
                  {d.amount > 0 ? (
                    <span className="rm-bar-val">
                      ₹{d.amount > 999 ? `${(d.amount / 1000).toFixed(1)}k` : d.amount}
                    </span>
                  ) : (
                    <span className="rm-bar-val-empty">-</span>
                  )}
                  <div
                    className={`rm-bar-fill ${d.amount === 0 ? "empty" : ""}`}
                    style={{ height: `${heightPct}%` }}
                    title={`${d.label}: ₹${d.amount} (${d.ordersCount} orders)`}
                  />
                  <span className="rm-bar-label">{d.label}</span>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "14px", fontSize: "12px", color: "#64748B" }}>
            <span>Total Sales: <strong>₹{totalVerifiedSales.toLocaleString("en-IN")}</strong></span>
            <span>Average Order: <strong>₹{completedOrders.length > 0 ? Math.round(totalVerifiedSales / completedOrders.length).toLocaleString("en-IN") : 0}</strong></span>
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
            {activeCategorySales.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "#64748B", fontSize: "13px" }}>
                No department sales in this period.
              </div>
            ) : (
              activeCategorySales.slice(0, 5).map((cat) => {
                const pct = totalVerifiedSales > 0 ? Math.round((cat.revenue / totalVerifiedSales) * 100) : 0;
                return (
                  <div key={cat.category} className="rm-progress-item">
                    <div className="rm-progress-meta">
                      <span style={{ color: "#0F172A", fontWeight: 600 }}>{cat.category}</span>
                      <span style={{ color: "#2563EB", fontWeight: 700 }}>₹{cat.revenue.toLocaleString("en-IN")} ({pct}%)</span>
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
              })
            )}
          </div>

          {/* Payment Method Distribution Strip */}
          <div style={{ marginTop: "18px", paddingTop: "14px", borderTop: "1px dashed #E2E8F0" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
              Payment Methods
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
                  <span style={{ fontSize: "10.5px", color: "#2563EB", display: "block" }}>₹{pm.amount.toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. REPORT CATEGORY DETAILS & DATA TABLES                                  */}
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
                Sales Reports ({completedOrders.length} Completed Orders)
              </h3>
            </div>
          </div>

          <div className="pm-table-wrapper">
            <table className="pm-products-table">
              <thead>
                <tr>
                  <th>ORDER ID</th>
                  <th>DATE & TIME</th>
                  <th>CUSTOMER</th>
                  <th>PAYMENT METHOD</th>
                  <th>SUBTOTAL</th>
                  <th>DISCOUNT</th>
                  <th>TOTAL AMOUNT</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {completedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "#64748B" }}>
                      No completed orders recorded in this period.
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
                      <td><strong>{o.customer?.name || "Shopper"}</strong></td>
                      <td><span className="om-method-tag upi">{o.paymentMethod}</span></td>
                      <td>₹{Number(o.subtotalAmount || o.totalAmount).toFixed(2)}</td>
                      <td style={{ color: "#059669" }}>-₹{Number(o.discountAmount || 0).toFixed(2)}</td>
                      <td><span className="pm-price-bold">₹{Number(o.totalAmount).toFixed(2)}</span></td>
                      <td><span className="om-status-pill completed">Completed</span></td>
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
                  Best-Selling Products
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
                    <th>PRICE</th>
                    <th style={{ textAlign: "center" }}>UNITS SOLD</th>
                    <th>TOTAL REVENUE</th>
                    <th>CURRENT STOCK</th>
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
                            {p.unitsSold}
                          </span>
                        </td>
                        <td><span className="pm-price-bold">₹{p.revenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></td>
                        <td><strong>{p.stock}</strong></td>
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
                  Slow-Moving Stock
                </h3>
              </div>
            </div>

            <div className="pm-table-wrapper">
              <table className="pm-products-table">
                <thead>
                  <tr>
                    <th>PRODUCT NAME</th>
                    <th>CATEGORY</th>
                    <th>PRICE</th>
                    <th style={{ textAlign: "center" }}>UNITS SOLD</th>
                    <th>REVENUE</th>
                    <th>CURRENT STOCK</th>
                    <th>STOCK VALUE</th>
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
                          {p.unitsSold}
                        </span>
                      </td>
                      <td>₹{p.revenue.toFixed(2)}</td>
                      <td>{p.stock}</td>
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
                Inventory Health & Valuation ({products.length} Products)
              </h3>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <span className="inv-valuation-badge">
                Total Inventory Value: ₹{totalInventoryValuation.toLocaleString("en-IN")}
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
                  <th>TOTAL VALUE</th>
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
                      <td><strong>{stock}</strong></td>
                      <td>{threshold}</td>
                      <td>
                        {isOut ? (
                          <span className="om-status-pill failed">Out of Stock</span>
                        ) : isLow ? (
                          <span className="om-status-pill pending">Low Stock</span>
                        ) : (
                          <span className="om-status-pill completed">In Stock</span>
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
                Order Status History ({filteredOrders.length} Orders)
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
              <span className="title">Pending</span>
              <span className="num" style={{ color: "#D97706" }}>{pendingOrders.length}</span>
            </div>
            <div className="rm-stat-box">
              <span className="title">Approved</span>
              <span className="num" style={{ color: "#4F46E5" }}>{approvedOrders.length}</span>
            </div>
            <div className="rm-stat-box">
              <span className="title">Failed</span>
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
                  <th>EXIT BARCODE</th>
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
                    <td><strong>{o.customer?.name || "Shopper"}</strong></td>
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
                Customer Insights & Rankings
              </h3>
            </div>
          </div>

          <div className="pm-table-wrapper">
            <table className="pm-products-table">
              <thead>
                <tr>
                  <th>CUSTOMER NAME</th>
                  <th>MOBILE</th>
                  <th style={{ textAlign: "center" }}>ORDERS</th>
                  <th>TOTAL SPENT</th>
                  <th>AVG ORDER</th>
                  <th>PAYMENT METHOD</th>
                  <th>LAST VISIT</th>
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
