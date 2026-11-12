import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  TrendingUp,
  BarChart3,
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
  Printer,
  Copy,
  Check,
  X,
  Search,
  WifiOff,
  AlertCircle,
  TrendingDown,
  ArrowDownRight,
  ChevronRight,
  Filter,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { io } from "socket.io-client";
import API from "../../services/api";
import ErpPageBanner from "../../components/ErpPageBanner";
import {
  mergeApiWithStorage,
  getPersistentProducts,
  updatePersistentStock,
} from "../../utils/realtimeStorage";
import {
  exportStyledExcelReport,
  printExecutiveReport,
} from "../../utils/reportsExportGenerator";
import "./ReportsManagement.css";

const DATE_PRESETS = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
];

const WEEKDAYS_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// Robust Date Helpers for precise local calendar boundary calculations
const formatDateToISO = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTodayStr = () => formatDateToISO(new Date());

const getDaysAgoStr = (days) => {
  const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return formatDateToISO(d);
};

const parseLocalDate = (dateStr, isEnd = false) => {
  if (!dateStr) return null;
  const parts = String(dateStr).split("-").map(Number);
  if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
    const [year, month, day] = parts;
    if (isEnd) {
      return new Date(year, month - 1, day, 23, 59, 59, 999);
    }
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  if (isEnd) d.setHours(23, 59, 59, 999);
  else d.setHours(0, 0, 0, 0);
  return d;
};

export default function ReportsManagement() {
  // Navigation tabs: "sales" | "payments" | "inventory" | "customers"
  const [activeTab, setActiveTab] = useState("sales");
  const [datePreset, setDatePreset] = useState("all");
  const [customStartDate, setCustomStartDate] = useState(() => getDaysAgoStr(7));
  const [customEndDate, setCustomEndDate] = useState(() => getTodayStr());
  const [appliedCustomDates, setAppliedCustomDates] = useState({
    start: getDaysAgoStr(7),
    end: getTodayStr(),
    active: false,
  });

  const startDateInputRef = useRef(null);
  const endDateInputRef = useRef(null);

  // Payment ledger specific filters
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("ALL"); // ALL | Successful | Pending | Failed | Network Error
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("ALL");
  const [paymentSearch, setPaymentSearch] = useState("");

  // Low stock inventory filter
  const [stockLevelFilter, setStockLevelFilter] = useState("ALL_LOW"); // ALL_LOW | OUT_OF_STOCK | LOW_STOCK | ALL_PRODUCTS
  const [stockSearch, setStockSearch] = useState("");

  // Raw data from DB and Socket
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState(getPersistentProducts);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [copiedId, setCopiedId] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (text) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const handleCopy = (text) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(""), 2000);
    showToast("Copied to clipboard");
  };

  // Fetch report data from API
  const fetchReportData = async (showSpin = false) => {
    if (showSpin) setRefreshing(true);
    try {
      const [reportsRes, ordersRes, productsRes] = await Promise.allSettled([
        API.get("/orders/reports"),
        API.get("/orders"),
        API.get("/products"),
      ]);

      let loadedOrders = [];
      if (
        reportsRes.status === "fulfilled" &&
        reportsRes.value.data?.success &&
        Array.isArray(reportsRes.value.data.orders)
      ) {
        loadedOrders = reportsRes.value.data.orders;
      } else if (
        ordersRes.status === "fulfilled" &&
        ordersRes.value.data?.success &&
        Array.isArray(ordersRes.value.data.orders)
      ) {
        loadedOrders = ordersRes.value.data.orders;
      }

      let loadedProducts = getPersistentProducts();
      if (
        productsRes.status === "fulfilled" &&
        productsRes.value.data?.success &&
        Array.isArray(productsRes.value.data.products)
      ) {
        loadedProducts = mergeApiWithStorage(productsRes.value.data.products);
      }

      setOrders(loadedOrders);
      setProducts(loadedProducts);
    } catch (err) {
      console.warn("Reports API load note:", err.message);
      setProducts(getPersistentProducts());
    } finally {
      setLoading(false);
      if (showSpin) setRefreshing(false);
    }
  };

  // Real-time Socket.IO & Auto-Polling
  useEffect(() => {
    fetchReportData(false);

    const socket = io("http://localhost:5001");

    socket.on("connect", () => setSocketConnected(true));
    socket.on("disconnect", () => setSocketConnected(false));

    socket.on("new-order", (data) => {
      if (data?.order) {
        setOrders((prev) => {
          if (prev.some((o) => o._id === data.order._id)) return prev;
          return [data.order, ...prev];
        });
        showToast(`⚡ Real-time Order Added: #${data.order.orderNumber}`);
      }
    });

    const pollTimer = setInterval(() => {
      fetchReportData(false);
    }, 4000);

    const handleStorageUpdate = () => {
      fetchReportData(false);
    };
    window.addEventListener("grocerease_storage_updated", handleStorageUpdate);

    return () => {
      socket.disconnect();
      clearInterval(pollTimer);
      window.removeEventListener("grocerease_storage_updated", handleStorageUpdate);
    };
  }, []);

  // Filter Orders based on selected Date Preset or Custom Date Range
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);

    const sBoundary = datePreset === "custom" && customStartDate ? parseLocalDate(customStartDate, false) : null;
    const eBoundary = datePreset === "custom" && customEndDate ? parseLocalDate(customEndDate, true) : null;

    return orders.filter((o) => {
      const orderDate = new Date(
        o.paymentStatus === "Completed"
          ? o.completedAt || o.createdAt
          : o.createdAt || o.completedAt || Date.now()
      );

      if (Number.isNaN(orderDate.getTime())) return false;

      if (datePreset === "today" && orderDate < startOfToday) return false;
      if (datePreset === "week" && orderDate < sevenDaysAgo) return false;
      if (datePreset === "month" && orderDate < thirtyDaysAgo) return false;
      if (datePreset === "year" && orderDate < startOfYear) return false;

      if (datePreset === "custom") {
        if (sBoundary && orderDate < sBoundary) return false;
        if (eBoundary && orderDate > eBoundary) return false;
      }

      return true;
    });
  }, [orders, datePreset, customStartDate, customEndDate]);

  // Orders categorized by payment status
  const successfulOrders = useMemo(() => {
    return filteredOrders.filter(
      (o) => o.paymentStatus === "Completed" || o.paymentStatus === "Approved"
    );
  }, [filteredOrders]);

  const pendingOrders = useMemo(() => {
    return filteredOrders.filter((o) => o.paymentStatus === "Pending");
  }, [filteredOrders]);

  const failedOrders = useMemo(() => {
    return filteredOrders.filter((o) => o.paymentStatus === "Failed");
  }, [filteredOrders]);

  const networkErrorOrders = useMemo(() => {
    return filteredOrders.filter((o) => o.paymentStatus === "Network Error");
  }, [filteredOrders]);

  // Total Verified Revenue (Only successful payments count!)
  const totalVerifiedRevenue = useMemo(() => {
    return successfulOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  }, [successfulOrders]);

  // Total Failed / Interrupted Amount (Exact lost revenue tracked!)
  const totalFailedAmount = useMemo(() => {
    return failedOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  }, [failedOrders]);

  const totalNetworkErrorAmount = useMemo(() => {
    return networkErrorOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  }, [networkErrorOrders]);

  // Unique Customers count who successfully completed payments
  const successfulCustomersCount = useMemo(() => {
    const set = new Set();
    successfulOrders.forEach((o) => {
      const id = o.customer?.phone || o.customer?.email || o.customer?.name;
      if (id) set.add(id.toLowerCase().trim());
    });
    return set.size;
  }, [successfulOrders]);

  // Low stock inventory breakdown
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

  const totalInventoryValuation = useMemo(() => {
    return products.reduce(
      (sum, p) => sum + Number(p.stock || 0) * Number(p.price || 0),
      0
    );
  }, [products]);

  // =========================================================================
  // FEATURE 3: WEEKLY SALES ANALYTICS (Monday to Sunday with ₹ on Y-Axis)
  // =========================================================================
  const weekdaySalesData = useMemo(() => {
    const dayBuckets = {
      Monday: { day: "Monday", sales: 0, ordersCount: 0, dateLabel: "" },
      Tuesday: { day: "Tuesday", sales: 0, ordersCount: 0, dateLabel: "" },
      Wednesday: { day: "Wednesday", sales: 0, ordersCount: 0, dateLabel: "" },
      Thursday: { day: "Thursday", sales: 0, ordersCount: 0, dateLabel: "" },
      Friday: { day: "Friday", sales: 0, ordersCount: 0, dateLabel: "" },
      Saturday: { day: "Saturday", sales: 0, ordersCount: 0, dateLabel: "" },
      Sunday: { day: "Sunday", sales: 0, ordersCount: 0, dateLabel: "" },
    };

    successfulOrders.forEach((o) => {
      const d = new Date(o.completedAt || o.createdAt);
      if (!Number.isNaN(d.getTime())) {
        const dayIdx = d.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
        const weekdayName =
          dayIdx === 0
            ? "Sunday"
            : dayIdx === 1
            ? "Monday"
            : dayIdx === 2
            ? "Tuesday"
            : dayIdx === 3
            ? "Wednesday"
            : dayIdx === 4
            ? "Thursday"
            : dayIdx === 5
            ? "Friday"
            : "Saturday";

        dayBuckets[weekdayName].sales += Number(o.totalAmount || 0);
        dayBuckets[weekdayName].ordersCount += 1;
        if (!dayBuckets[weekdayName].dateLabel) {
          dayBuckets[weekdayName].dateLabel = d.toLocaleDateString("en-IN", {
            month: "short",
            day: "numeric",
          });
        }
      }
    });

    return WEEKDAYS_ORDER.map((name) => dayBuckets[name]);
  }, [successfulOrders]);

  // Max sales among weekdays for relative scaling
  const maxWeekdaySales = useMemo(() => {
    return Math.max(...weekdaySalesData.map((d) => d.sales), 1);
  }, [weekdaySalesData]);

  // Average daily sales
  const avgDailySales = useMemo(() => {
    const total = weekdaySalesData.reduce((sum, d) => sum + d.sales, 0);
    return Math.round(total / 7);
  }, [weekdaySalesData]);

  // Generate 5 Monetary ₹ Y-Axis Labels
  const yAxisMilestones = useMemo(() => {
    const max = maxWeekdaySales;
    const roundedMax = Math.ceil(max / 1000) * 1000 || 5000;
    return [
      `₹${roundedMax.toLocaleString("en-IN")}`,
      `₹${Math.round((roundedMax * 0.75)).toLocaleString("en-IN")}`,
      `₹${Math.round((roundedMax * 0.5)).toLocaleString("en-IN")}`,
      `₹${Math.round((roundedMax * 0.25)).toLocaleString("en-IN")}`,
      "₹0",
    ];
  }, [maxWeekdaySales]);

  // =========================================================================
  // FEATURE 4: LOW AND HIGH PERFORMANCE CHARTS (Calculated from Actual Sales)
  // =========================================================================
  const { highPerformanceDays, lowPerformanceDays, peakDay, lowestDay } = useMemo(() => {
    const sorted = [...weekdaySalesData].sort((a, b) => b.sales - a.sales);
    const peak = sorted[0] || { day: "N/A", sales: 0, ordersCount: 0 };
    const lowest = sorted[sorted.length - 1] || { day: "N/A", sales: 0, ordersCount: 0 };

    // Days performing above average
    const high = weekdaySalesData.filter((d) => d.sales >= avgDailySales && d.sales > 0);
    // Days performing below average or with lowest dips
    const low = weekdaySalesData.filter((d) => d.sales < avgDailySales);

    return {
      highPerformanceDays: high.length > 0 ? high : [peak],
      lowPerformanceDays: low.length > 0 ? low : [lowest],
      peakDay: peak,
      lowestDay: lowest,
    };
  }, [weekdaySalesData, avgDailySales]);

  // =========================================================================
  // FEATURE 5: PAYMENT METHOD ANALYTICS (UPI, Card, Cash, Other)
  // =========================================================================
  const paymentMethodAnalytics = useMemo(() => {
    const map = {
      UPI: { method: "UPI", count: 0, amount: 0, customerSet: new Set() },
      Card: { method: "Card", count: 0, amount: 0, customerSet: new Set() },
      Cash: { method: "Cash", count: 0, amount: 0, customerSet: new Set() },
      Other: { method: "Other", count: 0, amount: 0, customerSet: new Set() },
    };

    successfulOrders.forEach((o) => {
      const rawM = (o.paymentMethod || "UPI").toUpperCase();
      const m =
        rawM === "UPI"
          ? "UPI"
          : rawM === "CARD"
          ? "Card"
          : rawM === "CASH"
          ? "Cash"
          : "Other";

      const amt = Number(o.totalAmount || 0);
      map[m].count += 1;
      map[m].amount += amt;

      const custKey = o.customer?.phone || o.customer?.name || "Shopper";
      map[m].customerSet.add(custKey.toLowerCase().trim());
    });

    const totalRev = totalVerifiedRevenue || 1;

    return [
      {
        ...map.UPI,
        customersCount: map.UPI.customerSet.size,
        percentage: Math.round((map.UPI.amount / totalRev) * 100),
      },
      {
        ...map.Card,
        customersCount: map.Card.customerSet.size,
        percentage: Math.round((map.Card.amount / totalRev) * 100),
      },
      {
        ...map.Cash,
        customersCount: map.Cash.customerSet.size,
        percentage: Math.round((map.Cash.amount / totalRev) * 100),
      },
      {
        ...map.Other,
        customersCount: map.Other.customerSet.size,
        percentage: Math.round((map.Other.amount / totalRev) * 100),
      },
    ];
  }, [successfulOrders, totalVerifiedRevenue]);

  // =========================================================================
  // FEATURE 1: CUSTOMER PAYMENT & NETWORK ERROR LEDGER FILTERING
  // =========================================================================
  const filteredPaymentLedger = useMemo(() => {
    return filteredOrders.filter((o) => {
      // 1. Status Filter
      if (paymentStatusFilter === "Successful") {
        if (o.paymentStatus !== "Completed" && o.paymentStatus !== "Approved") return false;
      } else if (paymentStatusFilter === "Pending") {
        if (o.paymentStatus !== "Pending") return false;
      } else if (paymentStatusFilter === "Failed") {
        if (o.paymentStatus !== "Failed") return false;
      } else if (paymentStatusFilter === "Network Error") {
        if (o.paymentStatus !== "Network Error") return false;
      }

      // 2. Payment Method Filter
      if (paymentMethodFilter !== "ALL") {
        if ((o.paymentMethod || "").toUpperCase() !== paymentMethodFilter.toUpperCase()) {
          return false;
        }
      }

      // 3. Search Keyword
      if (paymentSearch.trim()) {
        const q = paymentSearch.toLowerCase().trim();
        const matchName = o.customer?.name?.toLowerCase().includes(q);
        const matchPhone = o.customer?.phone?.toLowerCase().includes(q);
        const matchOrder = o.orderNumber?.toLowerCase().includes(q);
        const matchAmt = String(o.totalAmount || "").includes(q);
        const matchReason = o.failureReason?.toLowerCase().includes(q);

        if (!matchName && !matchPhone && !matchOrder && !matchAmt && !matchReason) {
          return false;
        }
      }

      return true;
    });
  }, [filteredOrders, paymentStatusFilter, paymentMethodFilter, paymentSearch]);

  // =========================================================================
  // FEATURE 2: LOW STOCK & REORDER REPORT TABLE FILTERING
  // =========================================================================
  const filteredStockReport = useMemo(() => {
    return products.filter((p) => {
      const stock = Number(p.stock || 0);
      const threshold = Number(p.lowStockThreshold || 5);

      if (stockLevelFilter === "ALL_LOW" && stock > threshold) return false;
      if (stockLevelFilter === "OUT_OF_STOCK" && stock > 0) return false;
      if (stockLevelFilter === "LOW_STOCK" && (stock === 0 || stock > threshold)) return false;

      if (stockSearch.trim()) {
        const q = stockSearch.toLowerCase().trim();
        const matchName = p.name?.toLowerCase().includes(q);
        const matchCat = p.category?.toLowerCase().includes(q);
        const matchBar = p.barcode?.toLowerCase().includes(q);

        if (!matchName && !matchCat && !matchBar) return false;
      }

      return true;
    });
  }, [products, stockLevelFilter, stockSearch]);

  // Quick Restock Handler directly from Report
  const handleQuickRestock = (product, addCount = 10) => {
    const newStock = Number(product.stock || 0) + addCount;
    updatePersistentStock(product._id || product.barcode, newStock);
    showToast(`✓ Restocked +${addCount} units for "${product.name}"`);
    fetchReportData(false);
  };

  // Handle preset chip change with auto-initialized dates
  const handlePresetChange = (presetValue) => {
    setDatePreset(presetValue);
    if (presetValue === "custom") {
      const start = customStartDate || getDaysAgoStr(7);
      const end = customEndDate || getTodayStr();
      setCustomStartDate(start);
      setCustomEndDate(end);
      setAppliedCustomDates({
        start,
        end,
        active: true,
      });
      showToast("Custom range active: pick dates or click Apply");
    } else {
      setAppliedCustomDates((prev) => ({ ...prev, active: false }));
      const label = DATE_PRESETS.find((p) => p.value === presetValue)?.label || presetValue;
      showToast(`Showing reports for: ${label}`);
    }
  };

  // Open native calendar picker safely
  const triggerPicker = (ref) => {
    if (!ref?.current) return;
    try {
      if (typeof ref.current.showPicker === "function") {
        ref.current.showPicker();
      } else {
        ref.current.focus();
      }
    } catch (_) {
      ref.current.focus();
    }
  };

  // Explicit Apply custom date filter
  const handleApplyCustomRange = () => {
    if (!customStartDate && !customEndDate) {
      showToast("Please choose at least a Start Date or End Date.");
      return;
    }
    if (customStartDate && customEndDate && customStartDate > customEndDate) {
      showToast("⚠️ Start Date cannot be after End Date.");
      return;
    }
    setAppliedCustomDates({
      start: customStartDate,
      end: customEndDate,
      active: true,
    });
    showToast(`✓ Filter applied! ${filteredOrders.length} orders found.`);
  };

  // Reset custom dates
  const handleResetDateFilter = () => {
    setDatePreset("all");
    setCustomStartDate(getDaysAgoStr(7));
    setCustomEndDate(getTodayStr());
    setAppliedCustomDates({
      start: getDaysAgoStr(7),
      end: getTodayStr(),
      active: false,
    });
    showToast("✓ Date filter reset to All Time.");
  };

  // Quick preset shortcuts inside Custom Range
  const setQuickRange = (type) => {
    const today = getTodayStr();
    if (type === "today") {
      setCustomStartDate(today);
      setCustomEndDate(today);
      setAppliedCustomDates({ start: today, end: today, active: true });
      showToast("Range set to Today");
    } else if (type === "yesterday") {
      const yest = getDaysAgoStr(1);
      setCustomStartDate(yest);
      setCustomEndDate(yest);
      setAppliedCustomDates({ start: yest, end: yest, active: true });
      showToast("Range set to Yesterday");
    } else if (type === "7days") {
      const seven = getDaysAgoStr(7);
      setCustomStartDate(seven);
      setCustomEndDate(today);
      setAppliedCustomDates({ start: seven, end: today, active: true });
      showToast("Range set to Last 7 Days");
    } else if (type === "30days") {
      const thirty = getDaysAgoStr(30);
      setCustomStartDate(thirty);
      setCustomEndDate(today);
      setAppliedCustomDates({ start: thirty, end: today, active: true });
      showToast("Range set to Last 30 Days");
    }
  };

  // Real-Time Styled Excel Workbook Export (.xls) with Colored Header & Genuine Transaction Data
  const handleExportExcel = () => {
    const exportOrders = filteredOrders.length > 0 ? filteredOrders : orders;
    const exportProducts = filteredStockReport.length > 0 ? filteredStockReport : products;

    exportStyledExcelReport({
      orders: exportOrders,
      products: exportProducts,
      activeTab,
      datePreset,
      customStartDate,
      customEndDate,
    });
    showToast(`✓ Excel report downloaded with styled colored headers & ${exportOrders.length} real transactions!`);
  };

  // Official Audit Printable Report (PDF & Print Preview)
  const handlePrintAuditReport = () => {
    const printOrders = filteredOrders.length > 0 ? filteredOrders : orders;
    const printProducts = filteredStockReport.length > 0 ? filteredStockReport : products;

    printExecutiveReport({
      orders: printOrders,
      products: printProducts,
      activeTab,
      datePreset,
      customStartDate,
      customEndDate,
    });
    showToast("✓ Opening official printable audit report...");
  };

  return (
    <div className="reports-page-container">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="notif-toast-pill success">
          <Sparkles size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Page Banner */}
      <ErpPageBanner
        title="Supermarket Reports & Business Analytics"
        subtitle="Real-time financial reconciliation, customer payment verification, inventory reorder analytics & weekday revenue trends"
        badges={[
          "Real-Time Database Sync",
          "Automated Failure Tracking",
          "Weekday Monetary Visuals",
          "Inventory Restock Forecaster",
        ]}
        icon={<BarChart3 size={24} color="#FFFFFF" strokeWidth={2.4} />}
      />

      {/* 2. Top Controls & Date Filter Ribbon */}
      <div className="rm-controls-bar">
        <div className="rm-controls-left">
          <div className="rm-live-badge">
            <span className="rm-pulse-dot" />
            <span>{socketConnected ? "Live Database Sync" : "Auto-Polling Sync (4s)"}</span>
          </div>

          {/* Date Range Presets */}
          <div className="rm-date-presets">
            {DATE_PRESETS.map((dp) => (
              <button
                key={dp.value}
                type="button"
                className={`rm-date-chip ${datePreset === dp.value ? "active" : ""}`}
                onClick={() => handlePresetChange(dp.value)}
              >
                {dp.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rm-controls-right">
          <button
            type="button"
            className="rm-btn primary"
            onClick={handleExportExcel}
            title="Download formatted Excel workbook with colored headers & genuine records"
            style={{
              background: "#1D4ED8",
              color: "#FFFFFF",
              fontWeight: 800,
              boxShadow: "0 2px 8px rgba(29, 78, 216, 0.25)",
            }}
          >
            <FileSpreadsheet size={15} />
            <span>Export Excel (.xls)</span>
          </button>

          <button
            type="button"
            className="rm-btn secondary"
            onClick={handlePrintAuditReport}
            title="Print or Save official executive audit report as PDF"
            style={{
              fontWeight: 800,
            }}
          >
            <Printer size={15} />
            <span>Print Audit Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* 3. Executive 6-KPI Metric Grid */}
      <div className="rm-kpi-grid-6">
        {/* KPI 1: Total Revenue */}
        <div className="rm-kpi-tile">
          <div className="rm-kpi-top">
            <span className="rm-kpi-label">Total Revenue</span>
            <div className="rm-kpi-icon-pill green">
              <IndianRupee size={16} />
            </div>
          </div>
          <div>
            <h3 className="rm-kpi-value">₹{totalVerifiedRevenue.toLocaleString("en-IN")}</h3>
            <span className="rm-kpi-sub green">Verified Completed Sales</span>
          </div>
        </div>

        {/* KPI 2: Successful Payments */}
        <div className="rm-kpi-tile">
          <div className="rm-kpi-top">
            <span className="rm-kpi-label">Successful Payments</span>
            <div className="rm-kpi-icon-pill blue">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div>
            <h3 className="rm-kpi-value">{successfulOrders.length}</h3>
            <span className="rm-kpi-sub">
              {successfulCustomersCount} unique customers
            </span>
          </div>
        </div>

        {/* KPI 3: Pending Payments */}
        <div className="rm-kpi-tile">
          <div className="rm-kpi-top">
            <span className="rm-kpi-label">Pending Verification</span>
            <div className="rm-kpi-icon-pill amber">
              <Clock size={16} />
            </div>
          </div>
          <div>
            <h3 className="rm-kpi-value">{pendingOrders.length}</h3>
            <span className="rm-kpi-sub amber">Awaiting cashier action</span>
          </div>
        </div>

        {/* KPI 4: Failed Payments */}
        <div className="rm-kpi-tile">
          <div className="rm-kpi-top">
            <span className="rm-kpi-label">Failed Payments</span>
            <div className="rm-kpi-icon-pill red">
              <AlertCircle size={16} />
            </div>
          </div>
          <div>
            <h3 className="rm-kpi-value">{failedOrders.length}</h3>
            <span className="rm-kpi-sub red">
              ₹{totalFailedAmount.toLocaleString("en-IN")} uncollected
            </span>
          </div>
        </div>

        {/* KPI 5: Network Error Transactions */}
        <div className="rm-kpi-tile">
          <div className="rm-kpi-top">
            <span className="rm-kpi-label">Network Interrupted</span>
            <div className="rm-kpi-icon-pill crimson">
              <WifiOff size={16} />
            </div>
          </div>
          <div>
            <h3 className="rm-kpi-value">{networkErrorOrders.length}</h3>
            <span className="rm-kpi-sub red">
              ₹{totalNetworkErrorAmount.toLocaleString("en-IN")} lost/interrupted
            </span>
          </div>
        </div>

        {/* KPI 6: Low Stock Products */}
        <div className="rm-kpi-tile">
          <div className="rm-kpi-top">
            <span className="rm-kpi-label">Low Stock Alerts</span>
            <div className="rm-kpi-icon-pill purple">
              <Boxes size={16} />
            </div>
          </div>
          <div>
            <h3 className="rm-kpi-value">{lowStockProductsList.length}</h3>
            <span className="rm-kpi-sub">
              {outOfStockProductsList.length} completely out
            </span>
          </div>
        </div>
      </div>

      {/* 4. Primary Module Navigation Tabs */}
      <div className="rm-nav-tabs-bar">
        <button
          type="button"
          className={`rm-nav-tab ${activeTab === "sales" ? "active" : ""}`}
          onClick={() => setActiveTab("sales")}
        >
          <TrendingUp size={15} />
          <span>Weekly Sales & Performance</span>
        </button>

        <button
          type="button"
          className={`rm-nav-tab ${activeTab === "payments" ? "active" : ""}`}
          onClick={() => setActiveTab("payments")}
        >
          <CreditCard size={15} />
          <span>Customer Payment Reports & Failures</span>
        </button>

        <button
          type="button"
          className={`rm-nav-tab ${activeTab === "inventory" ? "active" : ""}`}
          onClick={() => setActiveTab("inventory")}
        >
          <Boxes size={15} />
          <span>Low Stock & Reorder Reports</span>
        </button>

        <button
          type="button"
          className={`rm-nav-tab ${activeTab === "customers" ? "active" : ""}`}
          onClick={() => setActiveTab("customers")}
        >
          <Users size={15} />
          <span>Customer Spend Insights</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: WEEKLY SALES ANALYTICS & HIGH/LOW PERFORMANCE CHARTS
          ========================================================================= */}
      {activeTab === "sales" && (
        <div className="rm-charts-container">
          {/* A. Weekly Sales Graph (Monday to Sunday with ₹ on Y-Axis) */}
          <div className="rm-weekly-chart-card">
            <div className="rm-card-header">
              <div className="rm-card-title-wrap">
                <TrendingUp size={18} color="#1455D9" />
                <div>
                  <h3>Weekly Sales Revenue Analytics (Monday – Sunday)</h3>
                  <p>Displaying exact verified monetary amounts (₹) collected each weekday</p>
                </div>
              </div>
              <span className="rm-chart-meta-pill">
                Daily Benchmark Avg: ₹{avgDailySales.toLocaleString("en-IN")}
              </span>
            </div>

            {/* Weekday Visual Graph Area */}
            <div className="rm-weekday-graph-wrapper">
              {/* Y-Axis Monetary Labels */}
              <div className="rm-yaxis-labels">
                {yAxisMilestones.map((label, idx) => (
                  <span key={idx}>{label}</span>
                ))}
              </div>

              {/* 7 Columns for Monday to Sunday */}
              <div className="rm-bars-track-area">
                {weekdaySalesData.map((d) => {
                  const heightPct =
                    d.sales > 0
                      ? Math.min(100, Math.max(12, Math.round((d.sales / maxWeekdaySales) * 100)))
                      : 0;
                  const isPeak = d.sales === peakDay.sales && d.sales > 0;
                  const isLow = d.sales === lowestDay.sales && d.sales > 0;

                  return (
                    <div
                      key={d.day}
                      className="rm-weekday-col"
                      title={`${d.day}: ₹${d.sales.toLocaleString("en-IN")} (${d.ordersCount} orders)`}
                    >
                      <span className={`rm-col-amount-label ${d.sales === 0 ? "empty" : ""}`}>
                        {d.sales > 0 ? `₹${d.sales.toLocaleString("en-IN")}` : "₹0"}
                      </span>

                      <div
                        className={`rm-col-bar ${
                          isPeak ? "peak" : isLow ? "low" : d.sales === 0 ? "empty" : ""
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />

                      <span className="rm-col-day-name">{d.day.slice(0, 3)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rm-chart-footer-stats">
              <span>
                Peak Weekday: <strong>{peakDay.day}</strong> (₹{peakDay.sales.toLocaleString("en-IN")})
              </span>
              <span>
                Lowest Weekday: <strong>{lowestDay.day}</strong> (₹{lowestDay.sales.toLocaleString("en-IN")})
              </span>
              <span>
                Total Orders Across Week: <strong>{successfulOrders.length}</strong>
              </span>
            </div>
          </div>

          {/* B. Low and High Performance Comparative Charts */}
          <div className="rm-perf-split-grid">
            {/* Chart 1: High-Performance Days */}
            <div className="rm-perf-card high">
              <div className="rm-perf-header">
                <div>
                  <span className="rm-perf-badge high">
                    <TrendingUp size={13} /> High-Performance Sales Periods
                  </span>
                  <h4 className="rm-perf-main-val">₹{peakDay.sales.toLocaleString("en-IN")}</h4>
                  <small style={{ color: "#059669" }}>Peak Day: {peakDay.day}</small>
                </div>
              </div>

              <div className="rm-perf-days-list">
                {highPerformanceDays.map((d) => (
                  <div key={d.day} className="rm-perf-day-row">
                    <span>{d.day}</span>
                    <strong style={{ color: "#059669" }}>
                      ₹{d.sales.toLocaleString("en-IN")} ({d.ordersCount} orders)
                    </strong>
                  </div>
                ))}
              </div>

              <div className="rm-perf-advice high">
                <strong>Peak Demand Insight:</strong> Sales volume surges on {peakDay.day}. Ensure shelf restocking is completed by Friday evening to capture weekend footfall.
              </div>
            </div>

            {/* Chart 2: Low-Performance Days */}
            <div className="rm-perf-card low">
              <div className="rm-perf-header">
                <div>
                  <span className="rm-perf-badge low">
                    <TrendingDown size={13} /> Low-Performance Sales Periods
                  </span>
                  <h4 className="rm-perf-main-val">₹{lowestDay.sales.toLocaleString("en-IN")}</h4>
                  <small style={{ color: "#b45309" }}>Lowest Day: {lowestDay.day}</small>
                </div>
              </div>

              <div className="rm-perf-days-list">
                {lowPerformanceDays.map((d) => (
                  <div key={d.day} className="rm-perf-day-row">
                    <span>{d.day}</span>
                    <strong style={{ color: "#d97706" }}>
                      ₹{d.sales.toLocaleString("en-IN")} ({d.ordersCount} orders)
                    </strong>
                  </div>
                ))}
              </div>

              <div className="rm-perf-advice low">
                <strong>Revenue Lift Strategy:</strong> {lowestDay.day} experiences dip in basket sizes. Introduce promotional offers, bundle discounts, or mobile app push notifications.
              </div>
            </div>
          </div>

          {/* C. Payment Method Analytics (UPI, Card, Cash, Other) */}
          <div className="rm-payment-analytics-card">
            <div className="rm-card-header">
              <div className="rm-card-title-wrap">
                <CreditCard size={18} color="#7C3AED" />
                <div>
                  <h3>Payment Method Analytics & Revenue Breakdown</h3>
                  <p>Customer counts, successful transaction totals, and payment channel share</p>
                </div>
              </div>
            </div>

            <div className="rm-pm-cards-grid">
              {paymentMethodAnalytics.map((pm) => (
                <div key={pm.method} className={`rm-pm-box ${pm.method.toLowerCase()}`}>
                  <div className="rm-pm-head">
                    <span className="rm-pm-title">{pm.method} Payments</span>
                    <span className="rm-pm-pct-tag">{pm.percentage}%</span>
                  </div>
                  <span className="rm-pm-amt">₹{pm.amount.toLocaleString("en-IN")}</span>
                  <div className="rm-pm-meta">
                    <span>{pm.count} Transactions</span>
                    <span>{pm.customersCount} Customers</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Segmented Distribution Bar */}
            <div className="rm-pm-segmented-bar">
              {paymentMethodAnalytics.map((pm) => (
                <div
                  key={pm.method}
                  className={`rm-segment ${pm.method.toLowerCase()}`}
                  style={{ width: `${pm.percentage}%` }}
                  title={`${pm.method}: ₹${pm.amount} (${pm.percentage}%)`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: CUSTOMER PAYMENT REPORTS & NETWORK ERROR TRACKER
          ========================================================================= */}
      {activeTab === "payments" && (
        <div className="rm-table-section-card">
          <div className="rm-table-toolbar">
            {/* Filter Buttons */}
            <div className="rm-table-filters">
              <button
                type="button"
                className={`rm-filter-btn ${paymentStatusFilter === "ALL" ? "active" : ""}`}
                onClick={() => setPaymentStatusFilter("ALL")}
              >
                All Payments ({filteredOrders.length})
              </button>

              <button
                type="button"
                className={`rm-filter-btn ${paymentStatusFilter === "Successful" ? "active" : ""}`}
                onClick={() => setPaymentStatusFilter("Successful")}
              >
                <CheckCircle2 size={13} />
                Successful ({successfulOrders.length})
              </button>

              <button
                type="button"
                className={`rm-filter-btn warning ${paymentStatusFilter === "Pending" ? "active" : ""}`}
                onClick={() => setPaymentStatusFilter("Pending")}
              >
                <Clock size={13} />
                Pending ({pendingOrders.length})
              </button>

              <button
                type="button"
                className={`rm-filter-btn alert ${paymentStatusFilter === "Failed" ? "active" : ""}`}
                onClick={() => setPaymentStatusFilter("Failed")}
              >
                <AlertCircle size={13} />
                Failed ({failedOrders.length})
              </button>

              <button
                type="button"
                className={`rm-filter-btn alert ${paymentStatusFilter === "Network Error" ? "active" : ""}`}
                onClick={() => setPaymentStatusFilter("Network Error")}
              >
                <WifiOff size={13} />
                Network Errors ({networkErrorOrders.length})
              </button>
            </div>

            {/* Search Box */}
            <div className="rm-search-box">
              <Search size={14} color="#64748B" />
              <input
                type="text"
                placeholder="Search customer, phone, order ID, amount..."
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Payment Ledger Table */}
          <div className="rm-table-responsive">
            <table className="rm-data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer Name & Phone</th>
                  <th>Payment Method</th>
                  <th>Payment Status</th>
                  <th>Transaction Amount</th>
                  <th>Transaction Date & Time</th>
                  <th>Failure Reason / Resolution Note</th>
                </tr>
              </thead>
              <tbody>
                {filteredPaymentLedger.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "32px", color: "#64748B" }}>
                      No transaction records match the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredPaymentLedger.map((ord) => {
                    const isSuccess =
                      ord.paymentStatus === "Completed" || ord.paymentStatus === "Approved";
                    const isPending = ord.paymentStatus === "Pending";
                    const isFailed = ord.paymentStatus === "Failed";
                    const isNetwork = ord.paymentStatus === "Network Error";

                    return (
                      <tr key={ord._id || ord.orderNumber}>
                        <td>
                          <strong>{ord.orderNumber}</strong>
                          <button
                            type="button"
                            className="rm-copy-inline-btn"
                            onClick={() => handleCopy(ord.orderNumber)}
                            title="Copy Order ID"
                          >
                            <Copy size={11} />
                            <span>{copiedId === ord.orderNumber ? "Copied" : "Copy"}</span>
                          </button>
                        </td>

                        <td>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <strong style={{ color: "#0F172A" }}>
                              {ord.customer?.name || "Mobile Shopper"}
                            </strong>
                            <small style={{ color: "#64748B" }}>
                              {ord.customer?.phone || "No phone provided"}
                            </small>
                          </div>
                        </td>

                        <td>
                          <span
                            className={`rm-payment-pill ${(
                              ord.paymentMethod || "UPI"
                            ).toLowerCase()}`}
                          >
                            {ord.paymentMethod || "UPI"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`rm-status-badge ${
                              isSuccess
                                ? "successful"
                                : isPending
                                ? "pending"
                                : isNetwork
                                ? "network-error"
                                : "failed"
                            }`}
                          >
                            {isSuccess && <CheckCircle2 size={12} />}
                            {isPending && <Clock size={12} />}
                            {isFailed && <AlertCircle size={12} />}
                            {isNetwork && <WifiOff size={12} />}
                            {ord.paymentStatus}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`rm-amount-tag ${
                              isSuccess ? "green" : isPending ? "amber" : "red"
                            }`}
                          >
                            ₹{Number(ord.totalAmount || 0).toFixed(2)}
                            {(isFailed || isNetwork) && (
                              <small style={{ display: "block", fontSize: "10px", fontWeight: "normal" }}>
                                (Interrupted)
                              </small>
                            )}
                          </span>
                        </td>

                        <td>
                          <small>
                            {ord.createdAt
                              ? new Date(ord.createdAt).toLocaleString("en-IN", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })
                              : "Recently placed"}
                          </small>
                        </td>

                        <td>
                          {isNetwork ? (
                            <span style={{ color: "#BE123C", fontWeight: 600 }}>
                              ⚠️ Network timeout during gateway callback. Transaction interrupted.
                            </span>
                          ) : isFailed ? (
                            <span style={{ color: "#DC2626", fontWeight: 600 }}>
                              {ord.failureReason || "Payment declined by customer bank."}
                            </span>
                          ) : isSuccess ? (
                            <span style={{ color: "#059669" }}>
                              ✓ Payment verified. Exit turnstile code generated.
                            </span>
                          ) : (
                            <span style={{ color: "#D97706" }}>
                              Awaiting cashier / POS payment confirmation.
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: LOW STOCK & REORDER INVENTORY REPORT
          ========================================================================= */}
      {activeTab === "inventory" && (
        <div className="rm-table-section-card">
          <div className="rm-table-toolbar">
            <div className="rm-table-filters">
              <button
                type="button"
                className={`rm-filter-btn ${stockLevelFilter === "ALL_LOW" ? "active" : ""}`}
                onClick={() => setStockLevelFilter("ALL_LOW")}
              >
                All Low Stock ({lowStockProductsList.length})
              </button>

              <button
                type="button"
                className={`rm-filter-btn alert ${stockLevelFilter === "OUT_OF_STOCK" ? "active" : ""}`}
                onClick={() => setStockLevelFilter("OUT_OF_STOCK")}
              >
                Out of Stock ({outOfStockProductsList.length})
              </button>

              <button
                type="button"
                className={`rm-filter-btn ${stockLevelFilter === "ALL_PRODUCTS" ? "active" : ""}`}
                onClick={() => setStockLevelFilter("ALL_PRODUCTS")}
              >
                Entire Catalog ({products.length})
              </button>
            </div>

            <div className="rm-search-box">
              <Search size={14} color="#64748B" />
              <input
                type="text"
                placeholder="Search product, category, barcode..."
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="rm-table-responsive">
            <table className="rm-data-table">
              <thead>
                <tr>
                  <th>Product Name & Barcode</th>
                  <th>Category</th>
                  <th>Available Shelf Stock</th>
                  <th>Min Threshold</th>
                  <th>Required Reorder Qty</th>
                  <th>Inventory Status</th>
                  <th>Selling Price / Unit</th>
                  <th>Est. Reorder Cost</th>
                  <th style={{ textAlign: "right" }}>Instant Restock</th>
                </tr>
              </thead>
              <tbody>
                {filteredStockReport.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center", padding: "32px", color: "#64748B" }}>
                      No inventory items match the current stock filter.
                    </td>
                  </tr>
                ) : (
                  filteredStockReport.map((prod) => {
                    const stock = Number(prod.stock || 0);
                    const threshold = Number(prod.lowStockThreshold || 5);
                    const isOutOfStock = stock === 0;
                    const isLow = stock <= threshold;

                    // Required reorder formula: Bring to 2x threshold with a minimum of 10 units
                    const requiredReorder = Math.max(10, threshold * 2 - stock);
                    const costPrice = Number(prod.costPrice || prod.price * 0.8 || 0);
                    const estCost = requiredReorder * costPrice;

                    return (
                      <tr key={prod._id || prod.barcode}>
                        <td>
                          <strong>{prod.name}</strong>
                          <small style={{ display: "block", color: "#64748B" }}>
                            Barcode: {prod.barcode || "N/A"}
                          </small>
                        </td>

                        <td>
                          <span className="rm-payment-pill">{prod.category || "General"}</span>
                        </td>

                        <td>
                          <strong style={{ color: isOutOfStock ? "#DC2626" : isLow ? "#D97706" : "#059669" }}>
                            {stock} Units
                          </strong>
                        </td>

                        <td>{threshold} Units</td>

                        <td>
                          <span className="rm-reorder-tag">+{requiredReorder} Units</span>
                        </td>

                        <td>
                          <span
                            className={`rm-status-badge ${
                              isOutOfStock ? "failed" : isLow ? "pending" : "completed"
                            }`}
                          >
                            {isOutOfStock ? "Out of Stock" : isLow ? "Low Stock" : "Optimal"}
                          </span>
                        </td>

                        <td>₹{Number(prod.price || 0).toFixed(2)}</td>

                        <td>
                          <strong>₹{estCost.toFixed(2)}</strong>
                        </td>

                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="rm-mini-restock-btn"
                            onClick={() => handleQuickRestock(prod, 10)}
                            title="Directly add 10 units to database"
                          >
                            <Boxes size={12} />
                            <span>+10 Restock</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: CUSTOMER SPEND RANKINGS
          ========================================================================= */}
      {activeTab === "customers" && (
        <div className="rm-table-section-card">
          <div className="rm-table-responsive">
            <table className="rm-data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Customer Name</th>
                  <th>Phone Number</th>
                  <th>Total Orders Placed</th>
                  <th>Completed Orders</th>
                  <th>Lifetime Spend (₹)</th>
                  <th>Average Ticket Value</th>
                  <th>Latest Purchase Date</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
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
                        completedCount: 0,
                        totalSpent: 0,
                        latestDate: new Date(o.createdAt || Date.now()),
                      };
                    }
                    map[key].ordersCount += 1;
                    if (o.paymentStatus === "Completed" || o.paymentStatus === "Approved") {
                      map[key].completedCount += 1;
                      map[key].totalSpent += Number(o.totalAmount || 0);
                    }
                    if (new Date(o.createdAt) > map[key].latestDate) {
                      map[key].latestDate = new Date(o.createdAt);
                    }
                  });

                  const sorted = Object.values(map).sort((a, b) => b.totalSpent - a.totalSpent);

                  if (sorted.length === 0) {
                    return (
                      <tr>
                        <td colSpan="8" style={{ textAlign: "center", padding: "32px", color: "#64748B" }}>
                          No customer transactions recorded yet.
                        </td>
                      </tr>
                    );
                  }

                  return sorted.map((cust, idx) => (
                    <tr key={cust.phone + idx}>
                      <td>#{idx + 1}</td>
                      <td>
                        <strong>{cust.name}</strong>
                      </td>
                      <td>{cust.phone}</td>
                      <td>{cust.ordersCount}</td>
                      <td>
                        <strong style={{ color: "#059669" }}>{cust.completedCount}</strong>
                      </td>
                      <td>
                        <strong style={{ color: "#1455D9", fontSize: "13px" }}>
                          ₹{cust.totalSpent.toLocaleString("en-IN")}
                        </strong>
                      </td>
                      <td>
                        ₹
                        {cust.completedCount > 0
                          ? Math.round(cust.totalSpent / cust.completedCount).toLocaleString("en-IN")
                          : 0}
                      </td>
                      <td>{cust.latestDate.toLocaleDateString("en-IN")}</td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
