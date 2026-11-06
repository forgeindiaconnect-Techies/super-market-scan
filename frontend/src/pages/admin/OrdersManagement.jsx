import React, { useEffect, useState, useMemo } from "react";
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
import bannerCartImg from "../../assets/banner-cart.png";
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
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState("ALL");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("All Payment Methods");
  const [dateFilter, setDateFilter] = useState("all");
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
  }, [orders, activeTab, paymentMethodFilter, dateFilter, search]);

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

  // Export Filtered Orders to CSV
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      alert("No orders available to export for the selected filter.");
      return;
    }

    const headers = [
      "Order Number",
      "Date & Time",
      "Customer Name",
      "Customer Phone",
      "Items Count",
      "Subtotal (INR)",
      "Discount (INR)",
      "Final Amount (INR)",
      "Payment Method",
      "Payment Status",
      "Exit Barcode",
    ];

    const rows = filteredOrders.map((o) => [
      `"${o.orderNumber || ""}"`,
      `"${new Date(o.createdAt || Date.now()).toLocaleString("en-IN")}"`,
      `"${o.customer?.name || "Guest Shopper"}"`,
      `"${o.customer?.phone || ""}"`,
      o.totalItems || o.items?.length || 0,
      Number(o.subtotalAmount || o.totalAmount || 0).toFixed(2),
      Number(o.discountAmount || 0).toFixed(2),
      Number(o.totalAmount || 0).toFixed(2),
      `"${o.paymentMethod || "UPI"}"`,
      `"${o.paymentStatus || "Pending"}"`,
      `"${o.exitBarcode || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `supermarket_orders_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Official Tax Invoice / Receipt Printing
  const handlePrintTaxInvoice = (order) => {
    const printWindow = window.open("", "_blank", "width=850,height=900");
    if (!printWindow) {
      alert("Please allow pop-ups to print the official tax invoice.");
      return;
    }

    const itemsRows = (order.items || [])
      .map(
        (it) => `
        <tr>
          <td style="padding: 6px 0; border-bottom: 1px dashed #e2e8f0;">${it.name} ${it.brand ? `(${it.brand})` : ""}</td>
          <td style="padding: 6px 0; border-bottom: 1px dashed #e2e8f0; text-align: center;">&#8377;${Number(it.price).toFixed(2)}</td>
          <td style="padding: 6px 0; border-bottom: 1px dashed #e2e8f0; text-align: center;">${it.quantity}</td>
          <td style="padding: 6px 0; border-bottom: 1px dashed #e2e8f0; text-align: right; font-weight: bold;">&#8377;${Number(it.subtotal).toFixed(2)}</td>
        </tr>
      `
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Tax Invoice - ${order.orderNumber}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; padding: 20px; color: #0F172A; }
            .receipt-wrap { max-width: 500px; margin: 0 auto; border: 1px solid #CBD5E1; border-radius: 12px; padding: 24px; }
            .store-header { text-align: center; border-bottom: 2px solid #2563EB; padding-bottom: 12px; margin-bottom: 16px; }
            .store-name { font-size: 20px; font-weight: 900; color: #2563EB; letter-spacing: 1px; }
            .store-sub { font-size: 11px; color: #64748B; margin-top: 3px; }
            .invoice-meta { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px; }
            .items-table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12.5px; }
            .items-table th { border-bottom: 1.5px solid #0F172A; padding: 8px 0; text-align: left; font-size: 11px; text-transform: uppercase; }
            .total-section { border-top: 2px dashed #94A3B8; border-bottom: 2px dashed #94A3B8; padding: 12px 0; margin: 16px 0; }
            .total-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px; }
            .grand-total { font-size: 18px; font-weight: 900; color: #0F172A; display: flex; justify-content: space-between; padding-top: 6px; }
            .barcode-box { text-align: center; background: #F8FAFC; border: 1.5px dashed #CBD5E1; border-radius: 8px; padding: 12px; margin-top: 16px; }
            .footer-note { text-align: center; font-size: 11px; color: #64748B; margin-top: 14px; }
          </style>
        </head>
        <body>
          <div class="receipt-wrap">
            <div class="store-header">
              <div class="store-name">SMART SUPERMARKET</div>
              <div class="store-sub">GrocerEase Smart Self-Checkout & Autonomous Retail System</div>
              <div class="store-sub">GSTIN: 29AABCU9603R1ZM &bull; Cash Register #01</div>
            </div>

            <div class="invoice-meta">
              <span><strong>Invoice / Order:</strong> ${order.orderNumber}</span>
              <span><strong>Date:</strong> ${new Date(order.createdAt || Date.now()).toLocaleDateString("en-IN")}</span>
            </div>
            <div class="invoice-meta">
              <span><strong>Customer:</strong> ${order.customer?.name || "Guest Shopper"}</span>
              <span><strong>Payment:</strong> ${order.paymentMethod} (${order.paymentStatus})</span>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th>Item Details</th>
                  <th style="text-align: center;">Price</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
              </tbody>
            </table>

            <div class="total-section">
              <div class="total-row">
                <span>Gross Subtotal:</span>
                <span>&#8377;${Number(order.subtotalAmount || order.totalAmount).toFixed(2)}</span>
              </div>
              <div class="total-row" style="color: #059669;">
                <span>Discounts Applied:</span>
                <span>-&#8377;${Number(order.discountAmount || 0).toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>CGST / SGST (Included):</span>
                <span>&#8377;0.00</span>
              </div>
              <div class="grand-total">
                <span>NET FINAL AMOUNT:</span>
                <span>&#8377;${Number(order.totalAmount).toFixed(2)}</span>
              </div>
            </div>

            <div class="barcode-box">
              <div style="font-size: 10px; font-weight: 800; color: #2563EB; letter-spacing: 1px; margin-bottom: 4px;">EXIT TURNSTILE GATE BARCODE</div>
              <div style="font-family: monospace; font-size: 16px; font-weight: bold; letter-spacing: 2px;">${order.exitBarcode}</div>
              <div style="font-size: 10px; color: #64748B; margin-top: 4px;">Scan at exit reader to verify verified purchase.</div>
            </div>

            <div class="footer-note">
              Thank you for shopping with GrocerEase! Have a wonderful day.
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="grocer-page-container">
      {/* ========================================================================= */}
      {/* 1. TOP HERO BANNER WITH SHOPPING CART & DYNAMIC CURVED RIBBON             */}
      {/* ========================================================================= */}
      <section className="pm-hero-section">
        <div className="pm-hero-left">
          <h1 className="pm-main-title">Orders & Sales Management</h1>
          <p className="pm-main-subtitle">
            Live customer self-checkouts, multi-method payment verification & verified revenue ledger
          </p>
          <div className="pm-title-underline" />

          {/* Quick Action Pills */}
          <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
            <button
              type="button"
              className="action-pill-btn primary"
              onClick={handleExportCSV}
              style={{ padding: "8px 16px", fontSize: "12.5px" }}
            >
              <Download size={14} />
              <span>Export Orders CSV ({filteredOrders.length})</span>
            </button>

            <button
              type="button"
              className="action-pill-btn refresh"
              onClick={() => setShowTopProductsModal(true)}
              style={{ padding: "8px 16px", fontSize: "12.5px" }}
            >
              <BarChart2 size={14} />
              <span>Top Selling Products ({topSellingProducts.length})</span>
            </button>

            <button
              type="button"
              className="action-pill-btn refresh"
              onClick={() => fetchOrders(true)}
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
                <linearGradient id="goldRibbonGradOrders" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0" />
                  <stop offset="15%" stopColor="#FDE047" />
                  <stop offset="50%" stopColor="#FBBF24" />
                  <stop offset="80%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#FBBF24" />
                </linearGradient>
                <linearGradient id="blueRibbonGradOrders" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0" />
                  <stop offset="15%" stopColor="#1D4ED8" />
                  <stop offset="50%" stopColor="#2563EB" />
                  <stop offset="80%" stopColor="#1E40AF" />
                  <stop offset="100%" stopColor="#1E3A8A" />
                </linearGradient>
              </defs>
              <path
                d="M 0 115 C 120 75, 220 50, 340 68 C 450 82, 540 60, 640 45 L 640 68 C 540 82, 450 105, 340 92 C 220 75, 120 100, 0 138 Z"
                fill="url(#blueRibbonGradOrders)"
                opacity="0.95"
              />
              <path
                d="M 0 108 C 120 68, 220 43, 340 61 C 450 75, 540 53, 640 38 L 640 46 C 540 61, 450 83, 340 69 C 220 51, 120 76, 0 116 Z"
                fill="url(#goldRibbonGradOrders)"
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
      <section className="om-sales-banner">
        <div className="om-sales-header">
          <div className="om-sales-title">
            <TrendingUp size={19} color="#2563EB" />
            <span>Executive Revenue Ledger (Verified Completed Sales)</span>
            <span className="om-sales-tag">● Live Database Calculation</span>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ fontSize: "11.5px", color: "#64748B", fontWeight: 600 }}>Period View:</span>
            <div className="pm-select-pill-wrap" style={{ background: "#F8FAFC", borderColor: "#E2E8F0" }}>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                style={{
                  background: "transparent",
                  color: "#0F172A",
                  border: "none",
                  padding: "5px 28px 5px 12px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                {DATE_PERIODS.map((dp) => (
                  <option key={dp.value} value={dp.value} style={{ background: "#FFFFFF", color: "#0F172A" }}>
                    {dp.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 6 Metric Boxes */}
        <div className="om-sales-metrics-grid">
          <div className="om-metric-box">
            <span className="label">Today's Sales</span>
            <span className="value">₹{salesIntelligence.todaySales.toLocaleString("en-IN")}</span>
            <span className="sub">{salesIntelligence.todayOrdersCount} completed orders today</span>
          </div>

          <div className="om-metric-box">
            <span className="label">This Week</span>
            <span className="value">₹{salesIntelligence.weekSales.toLocaleString("en-IN")}</span>
            <span className="sub">{salesIntelligence.weekOrdersCount} orders (last 7 days)</span>
          </div>

          <div className="om-metric-box">
            <span className="label">This Month</span>
            <span className="value">₹{salesIntelligence.monthSales.toLocaleString("en-IN")}</span>
            <span className="sub">{salesIntelligence.monthOrdersCount} orders (last 30 days)</span>
          </div>

          <div className="om-metric-box">
            <span className="label">Average Order Value</span>
            <span className="value">₹{Math.round(salesIntelligence.aov).toLocaleString("en-IN")}</span>
            <span className="sub">Per verified customer cart</span>
          </div>

          <div className="om-metric-box">
            <span className="label">Discounts Saved</span>
            <span className="value" style={{ color: "#059669" }}>
              -₹{salesIntelligence.totalDiscounts.toLocaleString("en-IN")}
            </span>
            <span className="sub">Promotional savings granted</span>
          </div>

          <div className="om-metric-box">
            <span className="label">Net Realized Revenue</span>
            <span className="value" style={{ color: "#2563EB" }}>
              ₹{salesIntelligence.netSales.toLocaleString("en-IN")}
            </span>
            <span className="sub">Net of all customer promotions</span>
          </div>
        </div>
      </section>

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
              onChange={(e) => setDateFilter(e.target.value)}
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

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>
              Showing {filteredOrders.length} of {orders.length}
            </span>
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
                                fontFamily: "monospace",
                                fontSize: "12.5px",
                                fontWeight: 800,
                                color: "#1D4ED8",
                                background: "#EFF6FF",
                                padding: "3px 8px",
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
                              <Phone size={11} /> {ord.customer.phone}
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
                              fontFamily: "monospace",
                              fontSize: "12px",
                              fontWeight: 700,
                              color: "#0F172A",
                              letterSpacing: "0.5px",
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
                <h3>SMART SUPERMARKET &bull; GROCEREASE</h3>
                <p>Autonomous Retail Management & Self-Checkout System</p>
                <p>Register #01 &bull; GSTIN: 29AABCU9603R1ZM</p>
              </div>

              {/* Order Meta */}
              <div className="om-receipt-row">
                <span>Order Number:</span>
                <strong>{selectedOrder.orderNumber}</strong>
              </div>
              <div className="om-receipt-row">
                <span>Date & Time:</span>
                <span>
                  {new Date(selectedOrder.createdAt || Date.now()).toLocaleDateString("en-IN")},{" "}
                  {new Date(selectedOrder.createdAt || Date.now()).toLocaleTimeString("en-IN")}
                </span>
              </div>
              <div className="om-receipt-row">
                <span>Customer Name:</span>
                <strong>{selectedOrder.customer?.name || "Guest Shopper"}</strong>
              </div>
              {selectedOrder.customer?.phone && (
                <div className="om-receipt-row">
                  <span>Phone Number:</span>
                  <span>{selectedOrder.customer.phone}</span>
                </div>
              )}
              <div className="om-receipt-row">
                <span>Payment Method:</span>
                <strong>{selectedOrder.paymentMethod}</strong>
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
                    <th>ITEM</th>
                    <th style={{ textAlign: "center" }}>PRICE</th>
                    <th style={{ textAlign: "center" }}>QTY</th>
                    <th style={{ textAlign: "right" }}>AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedOrder.items || []).map((it, idx) => (
                    <tr key={idx}>
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
                        ₹{Number(it.subtotal).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Box */}
              <div className="om-receipt-total-box">
                <div className="om-receipt-row">
                  <span>Gross Subtotal:</span>
                  <span>₹{Number(selectedOrder.subtotalAmount || selectedOrder.totalAmount).toFixed(2)}</span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="om-receipt-row" style={{ color: "#059669" }}>
                    <span>Discounts Applied:</span>
                    <span>-₹{Number(selectedOrder.discountAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className="om-receipt-row">
                  <span>Taxes (CGST/SGST Included):</span>
                  <span>₹0.00</span>
                </div>
                <div className="om-receipt-grand-total">
                  <span>FINAL NET AMOUNT:</span>
                  <span style={{ color: "#2563EB" }}>
                    ₹{Number(selectedOrder.totalAmount).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Exit Turnstile Gate Pass Barcode */}
              <div className="om-barcode-box">
                <span
                  style={{
                    fontSize: "10.5px",
                    fontWeight: 800,
                    letterSpacing: "1px",
                    color: selectedOrder.paymentStatus === "Completed" ? "#2563EB" : "#D97706",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  {selectedOrder.paymentStatus === "Completed"
                    ? "EXIT TURNSTILE GATE PASS BARCODE"
                    : "TURNSTILE CASH PASS (PAY CASH AT EXIT)"}
                </span>

                <div style={{ maxWidth: "260px", margin: "0 auto" }}>
                  <BarcodeSVG barcode={selectedOrder.exitBarcode} width={1.6} height={48} />
                </div>

                <small style={{ color: "#64748B", fontSize: "11px", marginTop: "4px", display: "block" }}>
                  {selectedOrder.paymentStatus === "Completed"
                    ? "Present this barcode to the turnstile scanner to open the exit gate."
                    : "Present this barcode to staff at the exit counter to pay cash."}
                </small>
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
