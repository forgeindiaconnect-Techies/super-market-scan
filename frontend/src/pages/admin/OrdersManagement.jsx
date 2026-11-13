import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ShoppingCart,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  CreditCard,
  QrCode,
  Calendar,
  X,
  Printer,
  Clock,
  Check,
  AlertTriangle,
  TrendingUp,
  IndianRupee,
  ShieldCheck,
  FileText,
  Download,
  Tag,
  Filter,
  Boxes,
  PackageCheck,
  Copy,
  Sparkles,
  BarChart2,
  DollarSign,
  User,
  Phone,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import API from "../../services/api";
import BarcodeSVG from "../../components/BarcodeSVG";
import ErpPageBanner from "../../components/ErpPageBanner";
import bannerCartImg from "../../assets/banner-cart.png";
import { printSupermarketReceipt } from "../../utils/receiptGenerator";
import { exportStyledExcelReport } from "../../utils/reportsExportGenerator";
import "./ProductManagement.css";

const PAYMENT_METHODS = [
  "All Payment Methods",
  "UPI",
  "Card",
  "Cash",
];

const DATE_PERIODS = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week (7 Days)" },
  { value: "month", label: "This Month (30 Days)" },
];

export default function OrdersManagement() {
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(() => searchParams.get("search") || "");

  useEffect(() => {
    const q = searchParams.get("search");
    if (q !== null) {
      setSearch(q);
    }
  }, [searchParams]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState("ALL");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("All Payment Methods");
  const [dateFilter, setDateFilter] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [showTopProductsModal, setShowTopProductsModal] = useState(false);

  // Async action tracking
  const [approvingId, setApprovingId] = useState(null);
  const [completingId, setCompletingId] = useState(null);
  const [actionMessage, setActionMessage] = useState("");
  const [copiedId, setCopiedId] = useState("");

  const fetchOrders = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await API.get("/orders");
      if (res.data?.success && Array.isArray(res.data.orders)) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      console.warn("Fetch orders fallback:", err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(true);

    // Auto-poll orders every 3.5 seconds so admin sees live customer checkouts & payments immediately
    const timer = setInterval(() => {
      fetchOrders(false);
    }, 3500);

    const handleStorageUpdate = () => {
      fetchOrders(false);
    };
    window.addEventListener("grocerease_storage_updated", handleStorageUpdate);

    return () => {
      clearInterval(timer);
      window.removeEventListener("grocerease_storage_updated", handleStorageUpdate);
    };
  }, []);

  // 1. Super Admin approves customer payment
  const handleApprovePayment = async (orderId, orderNumber) => {
    try {
      setApprovingId(orderId);
      setActionMessage("");
      const res = await API.post(`/orders/${orderId}/approve`);
      if (res.data?.success) {
        setActionMessage(`✓ Order #${orderNumber} payment approved! Customer app updated to "Payment Approved".`);
        window.dispatchEvent(new Event("grocerease_storage_updated"));
        await fetchOrders(false);
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder((prev) => ({ ...prev, paymentStatus: "Approved" }));
        }
        setTimeout(() => setActionMessage(""), 5000);
      }
    } catch (err) {
      console.error("Approve payment error:", err);
      alert(err.response?.data?.message || "Failed to approve payment.");
    } finally {
      setApprovingId(null);
    }
  };

  // 2. Super Admin / Cashier confirms & completes payment (deducts stock)
  const handleCompletePayment = async (orderId, orderNumber) => {
    try {
      setCompletingId(orderId);
      setActionMessage("");
      const res = await API.post(`/orders/${orderId}/complete`);
      if (res.data?.success) {
        setActionMessage(`✓ Order #${orderNumber} marked as Completed & stock verified! Customer app updated to "Payment Completed".`);
        window.dispatchEvent(new Event("grocerease_storage_updated"));
        await fetchOrders(false);
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder((prev) => ({ ...prev, paymentStatus: "Completed" }));
        }
        setTimeout(() => setActionMessage(""), 5000);
      }
    } catch (err) {
      console.error("Complete payment error:", err);
      alert(err.response?.data?.message || "Failed to complete payment.");
    } finally {
      setCompletingId(null);
    }
  };

  // 3. Confirm Cash Received at exit turnstile
  const handleConfirmCash = async (orderId, orderNumber) => {
    try {
      setCompletingId(orderId);
      setActionMessage("");
      const res = await API.post(`/orders/${orderId}/confirm-cash`);
      if (res.data?.success) {
        setActionMessage(`✓ Cash verified for Order #${orderNumber}! Transaction completed & inventory updated.`);
        window.dispatchEvent(new Event("grocerease_storage_updated"));
        await fetchOrders(false);
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder((prev) => ({ ...prev, paymentStatus: "Completed" }));
        }
        setTimeout(() => setActionMessage(""), 5000);
      }
    } catch (err) {
      console.error("Confirm cash error:", err);
      alert(err.response?.data?.message || "Failed to confirm cash payment.");
    } finally {
      setCompletingId(null);
    }
  };

  // 4. Simulate a Live Customer Pre-Booking order (for instant testing & verification)
  const handleSimulateCustomerOrder = async () => {
    try {
      setActionMessage("⚡ Simulating real customer self-checkout from mobile app...");
      const prodRes = await API.get("/products");
      const prods = (prodRes.data?.products || []).filter((p) => p.stock > 0);
      const chosenProd = prods[0] || {
        _id: "600000000000000000000001",
        name: "Chocolate",
        price: 352,
      };

      const customerNames = ["Rahul Sharma", "Sneha Reddy", "Vikram Patel", "Divya Nair"];
      const randomName = customerNames[Math.floor(Math.random() * customerNames.length)];
      const randomPhone = `+91 ${Math.floor(7000000000 + Math.random() * 2999999999)}`;

      // 1. Log cart activity (triggers live cart item notification)
      await API.post("/orders/cart-activity", {
        customerName: randomName,
        productName: chosenProd.name,
        productId: chosenProd._id,
        quantity: 1,
        price: chosenProd.price,
        action: "added",
      }).catch(() => {});

      // 2. Checkout pre-booking order
      const checkoutRes = await API.post("/orders/checkout", {
        items: [
          {
            _id: chosenProd._id,
            name: chosenProd.name,
            price: chosenProd.price,
            quantity: 1,
          },
        ],
        paymentMethod: "UPI",
        customer: {
          name: randomName,
          phone: randomPhone,
          email: `${randomName.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
          address: "Bangalore",
        },
      });

      if (checkoutRes.data?.success) {
        setActionMessage(`✓ Real-time customer pre-booking created for ${randomName}! Notification bell updated.`);
        window.dispatchEvent(new Event("grocerease_storage_updated"));
        await fetchOrders(false);
        setActiveTab("PENDING");
        setTimeout(() => setActionMessage(""), 5000);
      }
    } catch (err) {
      console.error("Simulation error:", err);
      setActionMessage("Notice: " + (err.response?.data?.message || err.message));
      setTimeout(() => setActionMessage(""), 5000);
    }
  };

  // Copy order ID helper
  const handleCopyId = (text) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(""), 2000);
  };

  // Filtered Orders Calculation
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return orders.filter((o) => {
      // 1. Status Tab filter
      if (activeTab === "PENDING" && o.paymentStatus !== "Pending") return false;
      if (activeTab === "APPROVED" && o.paymentStatus !== "Approved") return false;
      if (activeTab === "COMPLETED" && o.paymentStatus !== "Completed") return false;
      if (activeTab === "FAILED" && o.paymentStatus !== "Failed") return false;

      // 2. Payment Method filter
      if (paymentMethodFilter !== "All Payment Methods" && o.paymentMethod !== paymentMethodFilter) {
        return false;
      }

      // 3. Date range filter
      if (dateFilter !== "all" && o.createdAt) {
        const orderDate = new Date(o.createdAt);
        if (dateFilter === "today" && orderDate < startOfToday) return false;
        if (dateFilter === "week" && orderDate < sevenDaysAgo) return false;
        if (dateFilter === "month" && orderDate < thirtyDaysAgo) return false;
        if (dateFilter === "custom") {
          if (customStartDate) {
            const [sY, sM, sD] = customStartDate.split("-").map(Number);
            const sDate = new Date(sY, sM - 1, sD, 0, 0, 0, 0);
            if (orderDate < sDate) return false;
          }
          if (customEndDate) {
            const [eY, eM, eD] = customEndDate.split("-").map(Number);
            const eDate = new Date(eY, eM - 1, eD, 23, 59, 59, 999);
            if (orderDate > eDate) return false;
          }
        }
      }

      // 4. Search query
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchNumber = o.orderNumber?.toLowerCase().includes(q);
        const matchCustomer = o.customer?.name?.toLowerCase().includes(q);
        const matchPhone = o.customer?.phone?.toLowerCase().includes(q);
        const matchExit = o.exitBarcode?.toLowerCase().includes(q);
        const matchItem = o.items?.some((it) => it.name?.toLowerCase().includes(q));

        if (!matchNumber && !matchCustomer && !matchPhone && !matchExit && !matchItem) {
          return false;
        }
      }

      return true;
    });
  }, [orders, activeTab, paymentMethodFilter, dateFilter, customStartDate, customEndDate, search]);

  // Executive KPI Metrics
  const totalOrdersCount = orders.length;

  const completedOrders = useMemo(() => {
    return orders.filter((o) => o.paymentStatus === "Completed");
  }, [orders]);

  const pendingOrders = useMemo(() => {
    return orders.filter((o) => o.paymentStatus === "Pending");
  }, [orders]);

  const approvedOrders = useMemo(() => {
    return orders.filter((o) => o.paymentStatus === "Approved");
  }, [orders]);

  const failedOrders = useMemo(() => {
    return orders.filter((o) => o.paymentStatus === "Failed");
  }, [orders]);

  const pendingCashOrders = useMemo(() => {
    return orders.filter((o) => o.paymentStatus === "Pending" && o.paymentMethod === "Cash");
  }, [orders]);

  // Total Verified Sales (Completed orders ONLY)
  const totalVerifiedSales = useMemo(() => {
    return completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }, [completedOrders]);

  const pendingCashAmount = useMemo(() => {
    return pendingCashOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }, [pendingCashOrders]);

  // Sales Intelligence breakdown (Today, Week, Month, AOV, Discounts, Net)
  const salesIntelligence = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let todaySales = 0;
    let todayOrdersCount = 0;
    let weekSales = 0;
    let weekOrdersCount = 0;
    let monthSales = 0;
    let monthOrdersCount = 0;

    let totalDiscounts = 0;
    let grossSubtotal = 0;

    completedOrders.forEach((o) => {
      const amt = Number(o.totalAmount || 0);
      const disc = Number(o.discountAmount || 0);
      const sub = Number(o.subtotalAmount || amt + disc);

      totalDiscounts += disc;
      grossSubtotal += sub;

      if (o.createdAt) {
        const d = new Date(o.createdAt);
        if (d >= startOfToday) {
          todaySales += amt;
          todayOrdersCount += 1;
        }
        if (d >= sevenDaysAgo) {
          weekSales += amt;
          weekOrdersCount += 1;
        }
        if (d >= thirtyDaysAgo) {
          monthSales += amt;
          monthOrdersCount += 1;
        }
      }
    });

    const aov = completedOrders.length > 0 ? totalVerifiedSales / completedOrders.length : 0;
    const netSales = Math.max(0, grossSubtotal - totalDiscounts);

    return {
      todaySales,
      todayOrdersCount,
      weekSales,
      weekOrdersCount,
      monthSales,
      monthOrdersCount,
      totalDiscounts,
      netSales,
      aov,
    };
  }, [completedOrders, totalVerifiedSales]);

  // Top Selling Products aggregated from completed orders line items
  const topSellingProducts = useMemo(() => {
    const map = {};

    completedOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const key = item.name || "Unknown Item";
        if (!map[key]) {
          map[key] = {
            name: key,
            brand: item.brand || "",
            category: item.category || "General",
            imageUrl: item.imageUrl || "",
            unitsSold: 0,
            revenue: 0,
          };
        }
        map[key].unitsSold += Number(item.quantity || 1);
        map[key].revenue += Number(item.subtotal || item.price * (item.quantity || 1));
      });
    });

    return Object.values(map).sort((a, b) => b.unitsSold - a.unitsSold);
  }, [completedOrders]);

  // Export Filtered Orders to Styled Excel (.xls) with Colored Headers
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      alert("No orders available to export for the selected filter.");
      return;
    }

    exportStyledExcelReport({
      orders: filteredOrders,
      activeTab: "sales",
      datePreset: dateFilter,
      customStartDate,
      customEndDate,
    });
    setActionMessage(`✓ Exported ${filteredOrders.length} orders into formatted Excel with colored headers!`);
    setTimeout(() => setActionMessage(""), 4000);
  };

  // Official Tax Invoice / Receipt Printing (Identical to Customer Mobile Receipt)
  const handlePrintTaxInvoice = (order) => {
    printSupermarketReceipt(order);
  };

  return (
    <div className="grocer-page-container">
      {/* ========================================================================= */}
      {/* 1. TOP HERO BANNER - EXACT MATCH TO REGISTER NEW PRODUCT                  */}
      {/* ========================================================================= */}
      <ErpPageBanner
        title="Orders & Sales Management"
        subtitle="Live customer self-checkouts, multi-method payment verification & verified revenue ledger"
        badges={["Live Cart Monitoring", "UPI & Cash Verification", "Instant Tax Invoices"]}
        icon={<ShoppingCart size={22} color="#ffffff" strokeWidth={2.4} />}
      />

      {/* Toast Feedback Notification */}
      {actionMessage && (
        <div
          style={{
            background: "#DCFCE7",
            border: "1px solid #86EFAC",
            color: "#166534",
            padding: "12px 18px",
            borderRadius: "14px",
            fontSize: "13.5px",
            fontWeight: "700",
            marginBottom: "18px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 4px 12px rgba(22, 101, 52, 0.08)",
          }}
        >
          <CheckCircle2 size={18} />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. FIVE HORIZONTAL EXECUTIVE KPI CARDS                                    */}
      {/* ========================================================================= */}
      <section className="om-kpi-grid-5">
        {/* Card 1: Total Orders */}
        <div className="pm-kpi-card blue-theme">
          <div className="pm-kpi-icon-pill blue">
            <ShoppingCart size={20} color="#2563EB" strokeWidth={2.4} />
          </div>
          <div className="pm-kpi-content">
            <h3 className="pm-kpi-number">{totalOrdersCount}</h3>
            <span className="pm-kpi-label">Total Customer Orders</span>
            <div className="pm-kpi-trend green">
              <span className="trend-arrow">↑</span>
              <span>
                {totalOrdersCount > 0
                  ? `${Math.round((completedOrders.length / totalOrdersCount) * 100)}% verified`
                  : "0%"}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Verified Sales */}
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

        {/* Card 3: Completed Orders */}
        <div className="pm-kpi-card green-theme">
          <div className="pm-kpi-icon-pill green">
            <PackageCheck size={20} color="#059669" strokeWidth={2.4} />
          </div>
          <div className="pm-kpi-content">
            <h3 className="pm-kpi-number">{completedOrders.length}</h3>
            <span className="pm-kpi-label">Completed Orders</span>
            <div className="pm-kpi-trend green">
              <span className="trend-arrow">✓</span>
              <span>Stock Deducted</span>
            </div>
          </div>
        </div>

        {/* Card 4: Pending Cash at Exit */}
        <div className="pm-kpi-card yellow-theme">
          <div className="pm-kpi-icon-pill yellow">
            <Clock size={20} color="#D97706" strokeWidth={2.4} />
          </div>
          <div className="pm-kpi-content">
            <h3 className="pm-kpi-number">{pendingOrders.length}</h3>
            <span className="pm-kpi-label">Pending Approval</span>
            <div className="pm-kpi-trend" style={{ color: pendingOrders.length > 0 ? "#D97706" : "#64748B" }}>
              <span className="trend-arrow">⏳</span>
              <span>₹{pendingCashAmount.toLocaleString("en-IN")} Cash at Exit</span>
            </div>
          </div>
        </div>

        {/* Card 5: Approved / In Progress */}
        <div className="pm-kpi-card purple-theme">
          <div className="pm-kpi-icon-pill purple">
            <ShieldCheck size={20} color="#7C3AED" strokeWidth={2.4} />
          </div>
          <div className="pm-kpi-content">
            <h3 className="pm-kpi-number">{approvedOrders.length}</h3>
            <span className="pm-kpi-label">Approved Orders</span>
            <div className="pm-kpi-trend green">
              <span className="trend-arrow">✓</span>
              <span>Ready for Exit Gate</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. EXECUTIVE SALES INTELLIGENCE & REVENUE LEDGER BANNER                   */}
      

      {/* ========================================================================= */}
      {/* 4. STATUS TABS STRIP                                                      */}
      {/* ========================================================================= */}
      <div style={{ marginBottom: "16px" }}>
        <div className="om-tabs-strip">
          <button
            type="button"
            className={`om-tab-btn ${activeTab === "ALL" ? "active" : ""}`}
            onClick={() => setActiveTab("ALL")}
          >
            <span>All Orders</span>
            <span style={{ opacity: 0.85, fontSize: "11px" }}>({orders.length})</span>
          </button>

          <button
            type="button"
            className={`om-tab-btn warning ${activeTab === "PENDING" ? "active" : ""}`}
            onClick={() => setActiveTab("PENDING")}
            style={pendingOrders.length > 0 && activeTab !== "PENDING" ? { borderColor: "#F59E0B", color: "#D97706" } : {}}
          >
            <span>⏳ Pending Approval</span>
            <span style={{ opacity: 0.85, fontSize: "11px" }}>({pendingOrders.length})</span>
          </button>

          <button
            type="button"
            className={`om-tab-btn indigo ${activeTab === "APPROVED" ? "active" : ""}`}
            onClick={() => setActiveTab("APPROVED")}
            style={approvedOrders.length > 0 && activeTab !== "APPROVED" ? { borderColor: "#818CF8", color: "#4F46E5" } : {}}
          >
            <span>🛡️ Approved</span>
            <span style={{ opacity: 0.85, fontSize: "11px" }}>({approvedOrders.length})</span>
          </button>

          <button
            type="button"
            className={`om-tab-btn ${activeTab === "COMPLETED" ? "active" : ""}`}
            onClick={() => setActiveTab("COMPLETED")}
          >
            <span>✓ Completed</span>
            <span style={{ opacity: 0.85, fontSize: "11px" }}>({completedOrders.length})</span>
          </button>

          {failedOrders.length > 0 && (
            <button
              type="button"
              className={`om-tab-btn ${activeTab === "FAILED" ? "active" : ""}`}
              onClick={() => setActiveTab("FAILED")}
            >
              <span>✕ Failed / Cancelled ({failedOrders.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. SEARCH & FILTER TOOLBAR                                                */}
      {/* ========================================================================= */}
      <section className="pm-toolbar-row">
        <div className="pm-toolbar-search">
          <Search size={18} className="pm-search-ico" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Order ID (ORD-...), customer name, phone, item name, or exit barcode..."
          />
        </div>

        <div className="pm-toolbar-filters">
          {/* Payment Method Filter */}
          <div className="pm-select-pill-wrap">
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="pm-select-pill"
            >
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm} value={pm}>
                  {pm}
                </option>
              ))}
            </select>
          </div>

          {/* Date Period Filter */}
          <div className="pm-select-pill-wrap">
            <select
              value={dateFilter}
              onChange={(e) => {
                const val = e.target.value;
                setDateFilter(val);
                if (val === "custom" && !customStartDate && !customEndDate) {
                  const now = new Date();
                  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                  const format = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                  setCustomStartDate(format(sevenDaysAgo));
                  setCustomEndDate(format(now));
                }
              }}
              className="pm-select-pill"
            >
              {DATE_PERIODS.map((dp) => (
                <option key={dp.value} value={dp.value}>
                  {dp.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. ORDERS LEDGER TABLE                                                    */}
      {/* ========================================================================= */}
      <div className="pm-catalog-card">
        <div className="pm-catalog-header">
          <div className="pm-catalog-title-group">
            <div className="pm-catalog-icon-box">
              <ShoppingCart size={18} color="#FFFFFF" />
            </div>
            <h3 className="pm-catalog-heading">
              Orders Ledger ({filteredOrders.length} Records)
              {activeTab === "PENDING" && " — Awaiting Cash or Staff Verification"}
            </h3>
          </div>

          <div className="om-ledger-actions" style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600, marginRight: "6px" }}>
              Showing {filteredOrders.length} of {orders.length}
            </span>

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
              <Download size={13} />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              className="pm-action-btn"
              onClick={() => setShowTopProductsModal(true)}
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
              <BarChart2 size={13} />
              <span>Top Selling</span>
            </button>

            <button
              type="button"
              className="pm-action-btn"
              onClick={handleSimulateCustomerOrder}
              disabled={loading}
              title="Place a real-time customer pre-booking to test live notifications and payment approval"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 700,
                background: "#EFF6FF",
                color: "#1D4ED8",
                border: "1px solid #BFDBFE",
                cursor: "pointer",
              }}
            >
              <Sparkles size={13} color="#2563EB" />
              <span>⚡ Place Live Customer Order</span>
            </button>

            <button
              type="button"
              className="pm-action-btn"
              onClick={() => fetchOrders(true)}
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
              <span>{loading ? "Syncing..." : "Sync Orders"}</span>
            </button>
          </div>
        </div>

        <div className="pm-table-wrapper">
          {filteredOrders.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 20px",
                color: "#64748B",
              }}
            >
              <ShoppingCart size={36} color="#CBD5E1" style={{ margin: "0 auto 12px" }} />
              <p style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 700, color: "#0F172A" }}>
                No customer orders match the current filter.
              </p>
              <span style={{ fontSize: "13px" }}>
                Orders placed via the Customer Mobile App will appear here instantly.
              </span>
            </div>
          ) : (
            <table className="pm-products-table">
              <thead>
                <tr>
                  <th style={{ width: "16%", whiteSpace: "nowrap" }}>ORDER ID & TIME</th>
                  <th style={{ width: "12%", whiteSpace: "nowrap" }}>CUSTOMER</th>
                  <th style={{ width: "16%" }}>PURCHASED PRODUCTS</th>
                  <th style={{ width: "10%", whiteSpace: "nowrap" }}>PAYMENT</th>
                  <th style={{ width: "10%", whiteSpace: "nowrap" }}>TOTAL</th>
                  <th style={{ width: "11%", whiteSpace: "nowrap" }}>STATUS</th>
                  <th style={{ width: "12%", whiteSpace: "nowrap" }}>EXIT BARCODE</th>
                  <th style={{ width: "13%", textAlign: "center", whiteSpace: "nowrap" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((ord) => {
                  const isPending = ord.paymentStatus === "Pending";
                  const isApproved = ord.paymentStatus === "Approved";
                  const isCompleted = ord.paymentStatus === "Completed";
                  const isCash = ord.paymentMethod === "Cash";

                  const orderDate = new Date(ord.createdAt || Date.now());
                  const formattedDate = orderDate.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  const formattedTime = orderDate.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <tr key={ord._id}>
                      {/* Order Number & Timestamp */}
                      <td style={{ whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span
                              style={{
                                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                                fontSize: "13px",
                                fontWeight: 800,
                                letterSpacing: "0.2px",
                                color: "#1D4ED8",
                                background: "#EFF6FF",
                                padding: "4px 9px",
                                borderRadius: "6px",
                                border: "1px solid #DBEAFE",
                                whiteSpace: "nowrap",
                                display: "inline-block",
                              }}
                            >
                              {ord.orderNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyId(ord.orderNumber)}
                              title="Copy Order ID"
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: copiedId === ord.orderNumber ? "#16A34A" : "#94A3B8",
                                padding: "2px",
                                display: "inline-flex",
                              }}
                            >
                              {copiedId === ord.orderNumber ? <Check size={13} /> : <Copy size={13} />}
                            </button>
                          </div>
                          <span style={{ fontSize: "11px", color: "#64748B", whiteSpace: "nowrap" }}>
                            {formattedDate} &bull; {formattedTime}
                          </span>
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <strong style={{ fontSize: "13px", color: "#0F172A", whiteSpace: "nowrap" }}>
                            {ord.customer?.name || "Guest Shopper"}
                          </strong>
                          {ord.customer?.phone && (
                            <span style={{ fontSize: "11px", color: "#64748B", display: "flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}>
                              <Phone size={11} /> +91 {ord.customer.phone}
                            </span>
                          )}
                          {ord.customer?.address && (
                            <span style={{ fontSize: "10.5px", color: "#94A3B8", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={ord.customer.address}>
                              📍 {ord.customer.address}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Purchased Products */}
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          <span
                            style={{
                              fontSize: "11.5px",
                              fontWeight: 800,
                              background: "#F1F5F9",
                              color: "#334155",
                              padding: "2px 7px",
                              borderRadius: "6px",
                              width: "fit-content",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {ord.totalItems || ord.items?.reduce((s, i) => s + i.quantity, 0) || 1} items
                          </span>
                          <span
                            style={{
                              fontSize: "12px",
                              color: "#475569",
                              maxWidth: "200px",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "block",
                            }}
                            title={(ord.items || []).map((i) => `${i.name} (x${i.quantity})`).join(", ")}
                          >
                            {(ord.items || []).map((i) => `${i.name} (x${i.quantity})`).join(", ") || "Purchased Goods"}
                          </span>
                        </div>
                      </td>

                      {/* Payment Method */}
                      <td style={{ whiteSpace: "nowrap" }}>
                        <span
                          className={`om-method-tag ${
                            ord.paymentMethod?.toLowerCase().includes("upi")
                              ? "upi"
                              : ord.paymentMethod?.toLowerCase().includes("card")
                              ? "card"
                              : "cash"
                          }`}
                        >
                          {ord.paymentMethod === "Cash" ? "Cash at Exit" : ord.paymentMethod || "UPI"}
                        </span>
                      </td>

                      {/* Amount Details */}
                      <td style={{ whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                          <span className="pm-price-bold" style={{ fontSize: "14.5px" }}>
                            ₹{Number(ord.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                          {ord.discountAmount > 0 && (
                            <span style={{ fontSize: "10.5px", color: "#059669", fontWeight: 700 }}>
                              Saved ₹{Number(ord.discountAmount).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Dedicated Payment Status Column */}
                      <td style={{ whiteSpace: "nowrap" }}>
                        {isPending ? (
                          <span className="om-status-pill pending">⏳ Pending</span>
                        ) : isApproved ? (
                          <span className="om-status-pill approved">🛡️ Approved</span>
                        ) : isCompleted ? (
                          <span className="om-status-pill completed">✓ Completed</span>
                        ) : (
                          <span className="om-status-pill failed">✕ Failed</span>
                        )}
                      </td>

                      {/* Exit Barcode */}
                      <td style={{ whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span
                            style={{
                              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                              fontSize: "12.5px",
                              fontWeight: 700,
                              color: "#0F172A",
                              letterSpacing: "0.4px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {ord.exitBarcode}
                          </span>
                          <span style={{ fontSize: "10px", color: isCompleted ? "#059669" : "#D97706", fontWeight: 700, whiteSpace: "nowrap" }}>
                            {isCompleted ? "● Gate Pass Active" : "● Requires Payment"}
                          </span>
                        </div>
                      </td>

                      {/* Unified Actions Column */}
                      <td style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          {/* Workflow buttons */}
                          {isPending && (
                            <>
                              <button
                                type="button"
                                className="om-action-btn approve"
                                onClick={() => handleApprovePayment(ord._id, ord.orderNumber)}
                                disabled={approvingId === ord._id}
                                title="Approve payment request"
                              >
                                {approvingId === ord._id ? "..." : (
                                  <>
                                    <Check size={12} /> <span>Approve</span>
                                  </>
                                )}
                              </button>
                              {isCash && (
                                <button
                                  type="button"
                                  className="om-action-btn complete"
                                  onClick={() => handleConfirmCash(ord._id, ord.orderNumber)}
                                  disabled={completingId === ord._id}
                                  title="Confirm cash received"
                                >
                                  {completingId === ord._id ? "..." : <span>Cash</span>}
                                </button>
                              )}
                            </>
                          )}

                          {isApproved && (
                            <button
                              type="button"
                              className="om-action-btn complete"
                              onClick={() => handleCompletePayment(ord._id, ord.orderNumber)}
                              disabled={completingId === ord._id}
                              title="Mark payment completed & verify"
                            >
                              {completingId === ord._id ? "..." : (
                                <>
                                  <CheckCircle2 size={12} /> <span>Complete</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* View & Print Action Circles matching ProductManagement */}
                          <button
                            type="button"
                            className="pm-action-circle blue"
                            onClick={() => setSelectedOrder(ord)}
                            title="View Full Tax Receipt Details"
                            style={{ width: "30px", height: "30px" }}
                          >
                            <Eye size={14} color="#2563EB" />
                          </button>

                          <button
                            type="button"
                            className="pm-action-circle blue"
                            onClick={() => handlePrintTaxInvoice(ord)}
                            title="Print Tax Invoice / Cash Memo"
                            style={{ width: "30px", height: "30px" }}
                          >
                            <Printer size={14} color="#2563EB" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. DIGITAL TAX RECEIPT & EXIT VERIFICATION MODAL                           */}
      {/* ========================================================================= */}
      {selectedOrder && (
        <div className="pm-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div
            className="pm-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "520px", padding: "20px 24px" }}
          >
            <div className="pm-modal-header" style={{ marginBottom: "12px" }}>
              <div>
                <h3 className="pm-modal-title">Customer Tax Invoice / Cash Memo</h3>
                <span style={{ fontSize: "11px", color: "#64748B" }}>
                  Verified Autonomous Self-Checkout Record
                </span>
              </div>
              <button
                type="button"
                className="pm-modal-close"
                onClick={() => setSelectedOrder(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="om-receipt-container">
              {/* Store Header */}
              <div className="om-receipt-header">
                <h3>🛒 GROCEREASE SUPERMARKET</h3>
                <p>Smart Autonomous Retail & Self-Checkout System</p>
                <p>Register #01 &bull; GSTIN: 29AABCU9603R1ZM</p>
              </div>

              {/* Order Meta */}
              <div className="om-receipt-row">
                <span>Customer Name:</span>
                <strong>{selectedOrder.customer?.name || "Guest Shopper"}</strong>
              </div>
              {selectedOrder.customer?.phone && (
                <div className="om-receipt-row">
                  <span>Mobile Number:</span>
                  <span>+91 {String(selectedOrder.customer.phone).replace(/\D/g, "")}</span>
                </div>
              )}
              {selectedOrder.customer?.address && (
                <div className="om-receipt-row">
                  <span>Delivery Address:</span>
                  <span style={{ maxWidth: "260px", textAlign: "right" }}>{selectedOrder.customer.address}</span>
                </div>
              )}
              <div className="om-receipt-row">
                <span>Invoice Number:</span>
                <strong>{selectedOrder.orderNumber}</strong>
              </div>
              <div className="om-receipt-row">
                <span>Transaction ID:</span>
                <strong>
                  {selectedOrder.paymentId || selectedOrder.transactionId || `TXN-${(selectedOrder.orderNumber || "").replace(/^ORD-/, "")}`}
                </strong>
              </div>
              <div className="om-receipt-row">
                <span>Date & Time:</span>
                <span>
                  {new Date(selectedOrder.createdAt || Date.now()).toLocaleDateString("en-IN")},{" "}
                  {new Date(selectedOrder.createdAt || Date.now()).toLocaleTimeString("en-IN")}
                </span>
              </div>
              <div className="om-receipt-row">
                <span>Terminal:</span>
                <span>Register #01 (Self-Checkout)</span>
              </div>
              <div className="om-receipt-row">
                <span>Payment Method:</span>
                <strong>{selectedOrder.paymentMethod === "Cash" ? "Cash at Exit" : selectedOrder.paymentMethod}</strong>
              </div>
              <div className="om-receipt-row">
                <span>Payment Status:</span>
                <span
                  style={{
                    color:
                      selectedOrder.paymentStatus === "Completed"
                        ? "#16A34A"
                        : selectedOrder.paymentStatus === "Approved"
                        ? "#4F46E5"
                        : "#D97706",
                    fontWeight: 800,
                  }}
                >
                  {selectedOrder.paymentStatus}
                </span>
              </div>

              {/* Line Items Table */}
              <table className="om-receipt-table">
                <thead>
                  <tr>
                    <th style={{ width: "24px", textAlign: "center" }}>#</th>
                    <th>ITEM DESCRIPTION</th>
                    <th style={{ textAlign: "center" }}>RATE</th>
                    <th style={{ textAlign: "center" }}>QTY</th>
                    <th style={{ textAlign: "right" }}>AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedOrder.items || []).map((it, idx) => (
                    <tr key={idx}>
                      <td style={{ textAlign: "center", color: "#64748B", fontSize: "11px" }}>{idx + 1}</td>
                      <td>
                        <strong>{it.name}</strong>
                        {it.brand && (
                          <span style={{ fontSize: "11px", color: "#64748B", display: "block" }}>
                            {it.brand}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>₹{Number(it.price).toFixed(2)}</td>
                      <td style={{ textAlign: "center" }}>{it.quantity}</td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>
                        ₹{Number(it.subtotal || it.price * it.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Box */}
              <div className="om-receipt-total-box">
                <div className="om-receipt-row">
                  <span>Total Items Count:</span>
                  <span>{(selectedOrder.items || []).length} items ({(selectedOrder.items || []).reduce((s, i) => s + (i.quantity || 1), 0)} units)</span>
                </div>
                <div className="om-receipt-row">
                  <span>Gross Subtotal:</span>
                  <span>₹{Number(selectedOrder.subtotalAmount || selectedOrder.totalAmount).toFixed(2)}</span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="om-receipt-row" style={{ color: "#059669", fontWeight: 700 }}>
                    <span>Supermarket Promotional Savings:</span>
                    <span>-₹{Number(selectedOrder.discountAmount).toFixed(2)}</span>
                  </div>
                )}
                {(() => {
                  const total = Number(selectedOrder.totalAmount || 0);
                  const taxable = total / 1.05;
                  const gst = total - taxable;
                  const cgst = (gst / 2).toFixed(2);
                  const sgst = (gst / 2).toFixed(2);
                  return (
                    <div className="om-receipt-row" style={{ fontSize: "11px", color: "#64748B" }}>
                      <span>Taxes (CGST 2.5% + SGST 2.5% Included):</span>
                      <span>₹{cgst} + ₹{sgst}</span>
                    </div>
                  );
                })()}
                <div className="om-receipt-grand-total">
                  <span>NET AMOUNT PAID:</span>
                  <span style={{ color: "#15803D" }}>
                    ₹{Number(selectedOrder.totalAmount).toFixed(2)}
                  </span>
                </div>
              </div>

              {selectedOrder.discountAmount > 0 && (
                <div
                  style={{
                    background: "#ECFDF5",
                    border: "1px dashed #10B981",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    textAlign: "center",
                    color: "#047857",
                    fontWeight: 800,
                    fontSize: "12px",
                    margin: "12px 0 6px",
                  }}
                >
                  ★ YOU SAVED ₹{Number(selectedOrder.discountAmount).toFixed(2)} ON THIS ORDER ★
                </div>
              )}

              {/* Legal Terms & Footer (NO BARCODES) */}
              <div
                style={{
                  textAlign: "center",
                  borderTop: "1px dashed #CBD5E1",
                  paddingTop: "12px",
                  marginTop: "12px",
                  fontSize: "11px",
                  color: "#64748B",
                  lineHeight: 1.5,
                }}
              >
                Goods once sold can be returned within 7 days with original tax invoice.<br />
                Paperless Autonomous Self-Checkout System &bull; Computer Generated Tax Invoice<br />
                <strong>*** THANK YOU FOR SHOPPING AT GROCEREASE! PLEASE VISIT AGAIN ***</strong>
              </div>

              {/* Action Buttons in Modal */}
              <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="action-pill-btn primary"
                  style={{ flex: 1, justifyContent: "center", padding: "10px" }}
                  onClick={() => handlePrintTaxInvoice(selectedOrder)}
                >
                  <Printer size={15} />
                  <span>Print Tax Invoice</span>
                </button>

                {selectedOrder.paymentStatus === "Pending" && (
                  <>
                    <button
                      type="button"
                      className="action-pill-btn"
                      style={{
                        flex: 1,
                        justifyContent: "center",
                        padding: "10px",
                        background: "#4F46E5",
                        borderColor: "#4F46E5",
                        color: "#FFFFFF",
                      }}
                      onClick={() => handleApprovePayment(selectedOrder._id, selectedOrder.orderNumber)}
                      disabled={approvingId === selectedOrder._id}
                    >
                      <Check size={15} />
                      <span>{approvingId === selectedOrder._id ? "Approving..." : "Approve Payment"}</span>
                    </button>

                    <button
                      type="button"
                      className="action-pill-btn"
                      style={{
                        flex: 1,
                        justifyContent: "center",
                        padding: "10px",
                        background: "#10B981",
                        borderColor: "#10B981",
                        color: "#FFFFFF",
                      }}
                      onClick={() => {
                        if (selectedOrder.paymentMethod === "Cash") {
                          handleConfirmCash(selectedOrder._id, selectedOrder.orderNumber);
                        } else {
                          handleCompletePayment(selectedOrder._id, selectedOrder.orderNumber);
                        }
                      }}
                      disabled={completingId === selectedOrder._id}
                    >
                      <CheckCircle2 size={15} />
                      <span>{completingId === selectedOrder._id ? "Processing..." : "Confirm & Complete"}</span>
                    </button>
                  </>
                )}

                {selectedOrder.paymentStatus === "Approved" && (
                  <button
                    type="button"
                    className="action-pill-btn"
                    style={{
                      flex: 1,
                      justifyContent: "center",
                      padding: "10px",
                      background: "#10B981",
                      borderColor: "#10B981",
                      color: "#FFFFFF",
                    }}
                    onClick={() => handleCompletePayment(selectedOrder._id, selectedOrder.orderNumber)}
                    disabled={completingId === selectedOrder._id}
                  >
                    <CheckCircle2 size={15} />
                    <span>{completingId === selectedOrder._id ? "Processing..." : "Confirm & Complete"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. TOP-SELLING PRODUCTS INTELLIGENCE MODAL                                */}
      {/* ========================================================================= */}
      {showTopProductsModal && (
        <div className="pm-modal-overlay" onClick={() => setShowTopProductsModal(false)}>
          <div
            className="pm-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "600px", padding: "20px 24px" }}
          >
            <div className="pm-modal-header" style={{ marginBottom: "16px" }}>
              <div>
                <h3 className="pm-modal-title">Top Selling Products Intelligence</h3>
                <span style={{ fontSize: "12px", color: "#64748B" }}>
                  Aggregated from all verified completed customer orders
                </span>
              </div>
              <button
                type="button"
                className="pm-modal-close"
                onClick={() => setShowTopProductsModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            {topSellingProducts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 20px", color: "#64748B" }}>
                No completed order line items found yet. Once customer orders are completed, sales rankings will appear here.
              </div>
            ) : (
              <div style={{ maxHeight: "360px", overflowY: "auto" }}>
                <table className="pm-products-table">
                  <thead>
                    <tr>
                      <th>PRODUCT</th>
                      <th>CATEGORY</th>
                      <th style={{ textAlign: "center" }}>UNITS SOLD</th>
                      <th style={{ textAlign: "right" }}>REVENUE (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSellingProducts.map((p, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong>{p.name}</strong>
                          {p.brand && (
                            <span style={{ fontSize: "11px", color: "#64748B", display: "block" }}>
                              {p.brand}
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="pm-category-text">{p.category}</span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span
                            style={{
                              background: "#EFF6FF",
                              color: "#1D4ED8",
                              padding: "3px 8px",
                              borderRadius: "6px",
                              fontWeight: 800,
                              fontSize: "12px",
                            }}
                          >
                            {p.unitsSold} units
                          </span>
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 800, color: "#0F172A" }}>
                          ₹{p.revenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ marginTop: "16px", textAlign: "right" }}>
              <button
                type="button"
                className="action-pill-btn refresh"
                onClick={() => setShowTopProductsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
