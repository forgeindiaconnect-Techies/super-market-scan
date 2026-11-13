import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Users,
  Search,
  Filter,
  ShoppingBag,
  IndianRupee,
  Star,
  CheckCircle2,
  Calendar,
  Phone,
  Mail,
  X,
  CreditCard,
  QrCode,
  ShieldCheck,
  RefreshCw,
  Download,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  Eye,
  Check,
  Tag,
  ArrowRight,
} from "lucide-react";
import API from "../../services/api";
import ErpPageBanner from "../../components/ErpPageBanner";
import bannerCartImg from "../../assets/banner-cart.png";
import "./ProductManagement.css";

const STATUS_FILTERS = ["All Statuses", "Active", "Suspended"];

const DATE_FILTERS = [
  { value: "all", label: "All Registration Dates" },
  { value: "today", label: "Registered Today" },
  { value: "week", label: "Registered This Week (7 Days)" },
  { value: "month", label: "Registered This Month (30 Days)" },
];

const TIER_FILTERS = [
  "All Membership Tiers",
  "VIP Platinum",
  "Gold Shoppers",
  "Regular Members",
];

export default function CustomersManagement() {
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [cartActivities, setCartActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(() => searchParams.get("search") || "");

  useEffect(() => {
    const q = searchParams.get("search");
    if (q !== null) {
      setSearch(q);
    }
  }, [searchParams]);
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");
  const [selectedDateFilter, setSelectedDateFilter] = useState("all");
  const [selectedTier, setSelectedTier] = useState("All Membership Tiers");

  // Profile modal & pagination
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [viewAll, setViewAll] = useState(false);
  const [actionToast, setActionToast] = useState("");

  // Customer account status override map persisted in localStorage
  const [statusOverrides, setStatusOverrides] = useState(() => {
    try {
      const saved = localStorage.getItem("grocerease_customer_statuses");
      return saved ? JSON.parse(saved) : {};
    } catch (_) {
      return {};
    }
  });

  const fetchData = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const [ordRes, actRes] = await Promise.allSettled([
        API.get("/orders"),
        API.get("/orders/cart-activity"),
      ]);

      if (ordRes.status === "fulfilled" && ordRes.value.data?.success) {
        setOrders(ordRes.value.data.orders || []);
      }
      if (actRes.status === "fulfilled" && actRes.value.data?.success) {
        setCartActivities(actRes.value.data.activities || []);
      }
    } catch (err) {
      console.warn("Customers data sync:", err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);

    // Auto-poll every 3.5s so when a new customer registers or checks out, the directory updates immediately
    const timer = setInterval(() => {
      fetchData(false);
    }, 3500);

    const handleStorageUpdate = () => {
      fetchData(false);
    };
    window.addEventListener("grocerease_storage_updated", handleStorageUpdate);

    return () => {
      clearInterval(timer);
      window.removeEventListener("grocerease_storage_updated", handleStorageUpdate);
    };
  }, []);

  // Derive genuine customer accounts purely from MongoDB Orders and Cart Activities
  const customers = useMemo(() => {
    const customerMap = new Map();

    // 1. Process all MongoDB Orders
    orders.forEach((order) => {
      const rawName = (order.customer?.name || "").trim() || "Guest Shopper";
      const rawPhone = (order.customer?.phone || "").trim();
      const rawEmail = (order.customer?.email || "").trim();

      // Formulate unique customer identity key (phone, email, or clean name)
      const identityKey = rawPhone || rawEmail || rawName.toLowerCase();

      let customer = customerMap.get(identityKey);
      if (!customer) {
        // Derive clean customer ID
        let idSuffix = "";
        if (rawPhone && rawPhone.length >= 4) {
          idSuffix = rawPhone.replace(/\D/g, "").slice(-4);
        } else if (order.orderNumber) {
          idSuffix = order.orderNumber.replace(/\D/g, "").slice(-4);
        } else {
          idSuffix = "1001";
        }
        const custId = `CUST-${idSuffix.padStart(4, "0")}`;

        customer = {
          id: custId,
          key: identityKey,
          name: rawName,
          phone: rawPhone || "Not provided",
          email: rawEmail || "",
          address: (order.customer?.address || "").trim(),
          registrationDate: new Date(order.createdAt || Date.now()),
          latestOrderDate: new Date(order.createdAt || Date.now()),
          orders: [],
          totalOrders: 0,
          totalSpent: 0,
          paymentMethodsUsed: {},
          recentCartItems: [],
        };
        customerMap.set(identityKey, customer);
      } else {
        if (!customer.address && order.customer?.address) {
          customer.address = (order.customer.address || "").trim();
        }
      }

      // Update earliest registration date
      const orderDate = new Date(order.createdAt || Date.now());
      if (orderDate < customer.registrationDate) {
        customer.registrationDate = orderDate;
      }
      if (orderDate > customer.latestOrderDate) {
        customer.latestOrderDate = orderDate;
      }

      // Attach real order
      customer.orders.push({
        id: order.orderNumber || order._id,
        orderId: order._id,
        date: orderDate,
        amount: Number(order.totalAmount || 0),
        discount: Number(order.discountAmount || 0),
        subtotal: Number(order.subtotalAmount || order.totalAmount || 0),
        paymentMethod: order.paymentMethod || "UPI",
        paymentStatus: order.paymentStatus || "Pending",
        exitBarcode: order.exitBarcode || "",
        items: (order.items || []).map((it) => ({
          name: it.name,
          quantity: it.quantity,
          price: it.price,
          subtotal: it.subtotal,
          brand: it.brand || "",
        })),
      });

      customer.totalOrders += 1;

      // Count only verified completed payments as total purchase amount
      if (order.paymentStatus === "Completed") {
        customer.totalSpent += Number(order.totalAmount || 0);
      }

      // Track payment methods
      const pm = order.paymentMethod || "UPI";
      customer.paymentMethodsUsed[pm] = (customer.paymentMethodsUsed[pm] || 0) + 1;
    });

    // 2. Incorporate cart activity sessions (live shoppers who may be shopping now)
    cartActivities.forEach((act) => {
      const rawName = (act.customerName || "").trim() || "Mobile Shopper";
      const rawSession = (act.sessionId || "").trim();
      const identityKey = rawSession || rawName.toLowerCase();

      let customer = customerMap.get(identityKey);
      if (!customer) {
        const idSuffix = rawSession.replace(/\D/g, "").slice(-4) || "8801";
        customer = {
          id: `CUST-${idSuffix.padStart(4, "0")}`,
          key: identityKey,
          name: rawName,
          phone: rawSession.startsWith("+") || /^\d+$/.test(rawSession) ? rawSession : "Not provided",
          email: "",
          registrationDate: new Date(act.createdAt || Date.now()),
          latestOrderDate: new Date(act.createdAt || Date.now()),
          orders: [],
          totalOrders: 0,
          totalSpent: 0,
          paymentMethodsUsed: {},
          recentCartItems: [],
        };
        customerMap.set(identityKey, customer);
      }

      if (act.productName && !customer.recentCartItems.includes(act.productName)) {
        customer.recentCartItems.push(act.productName);
      }
    });

    // 3. Finalize customer metrics, sorting, membership tier, and status overrides
    return Array.from(customerMap.values()).map((c) => {
      // Sort orders descending
      c.orders.sort((a, b) => b.date - a.date);

      // Determine preferred payment method
      let topMethod = "UPI";
      let topCount = 0;
      Object.entries(c.paymentMethodsUsed).forEach(([method, count]) => {
        if (count > topCount) {
          topMethod = method;
          topCount = count;
        }
      });
      c.preferredPayment = topMethod;

      // Derive Membership Tier based on actual completed spend
      if (c.totalSpent >= 10000) {
        c.tier = "VIP Platinum";
      } else if (c.totalSpent >= 3000) {
        c.tier = "Gold Shoppers";
      } else {
        c.tier = "Regular Members";
      }

      // Status (Active vs Suspended)
      c.status = statusOverrides[c.key] || "Active";

      return c;
    });
  }, [orders, cartActivities, statusOverrides]);

  // Executive KPI Metrics
  const totalRegisteredCount = customers.length;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const activeCustomersCount = useMemo(() => {
    return customers.filter(
      (c) => c.status === "Active" && c.latestOrderDate >= thirtyDaysAgo
    ).length;
  }, [customers, thirtyDaysAgo]);

  const newCustomersCount = useMemo(() => {
    return customers.filter((c) => c.registrationDate >= thirtyDaysAgo).length;
  }, [customers, thirtyDaysAgo]);

  const customersWithOrdersCount = useMemo(() => {
    return customers.filter((c) => c.totalOrders > 0).length;
  }, [customers]);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return customers.filter((c) => {
      // 1. Status Filter
      if (selectedStatus !== "All Statuses" && c.status !== selectedStatus) {
        return false;
      }

      // 2. Membership Tier Filter
      if (selectedTier !== "All Membership Tiers" && c.tier !== selectedTier) {
        return false;
      }

      // 3. Registration Date Filter
      if (selectedDateFilter === "today" && c.registrationDate < startOfToday) {
        return false;
      }
      if (selectedDateFilter === "week" && c.registrationDate < sevenDaysAgo) {
        return false;
      }
      if (selectedDateFilter === "month" && c.registrationDate < thirtyDaysAgo) {
        return false;
      }

      // 4. Search Filter
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchName = c.name?.toLowerCase().includes(q);
        const matchPhone = c.phone?.toLowerCase().includes(q);
        const matchEmail = c.email?.toLowerCase().includes(q);
        const matchId = c.id?.toLowerCase().includes(q);

        if (!matchName && !matchPhone && !matchEmail && !matchId) {
          return false;
        }
      }

      return true;
    });
  }, [customers, selectedStatus, selectedTier, selectedDateFilter, search, now, thirtyDaysAgo]);

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedCustomers = useMemo(() => {
    if (viewAll) return filteredCustomers;
    const start = (validCurrentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, validCurrentPage, pageSize, viewAll]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedStatus, selectedTier, selectedDateFilter, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Toggle Customer Account Status
  const handleToggleCustomerStatus = (customer) => {
    const newStatus = customer.status === "Active" ? "Suspended" : "Active";
    const updatedMap = {
      ...statusOverrides,
      [customer.key]: newStatus,
    };
    setStatusOverrides(updatedMap);
    try {
      localStorage.setItem("grocerease_customer_statuses", JSON.stringify(updatedMap));
    } catch (_) {}

    // Update active customer modal if open
    if (activeCustomer && activeCustomer.key === customer.key) {
      setActiveCustomer((prev) => ({ ...prev, status: newStatus }));
    }

    setActionToast(`✓ Customer "${customer.name}" status updated to ${newStatus}.`);
    setTimeout(() => setActionToast(""), 4000);
  };

  // Export Customers to CSV
  const handleExportCSV = () => {
    if (filteredCustomers.length === 0) {
      alert("No customer records match the current filter.");
      return;
    }

    const headers = [
      "Customer ID",
      "Customer Name",
      "Mobile Number",
      "Email Address",
      "Registration Date",
      "Total Orders",
      "Total Verified Spend (INR)",
      "Membership Tier",
      "Account Status",
      "Preferred Payment",
    ];

    const rows = filteredCustomers.map((c) => [
      `"${c.id}"`,
      `"${c.name}"`,
      `"${c.phone}"`,
      `"${c.email || "N/A"}"`,
      `"${c.registrationDate.toLocaleDateString("en-IN")}"`,
      c.totalOrders,
      Number(c.totalSpent).toFixed(2),
      `"${c.tier}"`,
      `"${c.status}"`,
      `"${c.preferredPayment}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `supermarket_customers_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Avatar Initials Helper
  const getInitials = (name) => {
    if (!name) return "GS";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="grocer-page-container">
      {/* ========================================================================= */}
      {/* 1. TOP HERO BANNER - EXACT MATCH TO REGISTER NEW PRODUCT                  */}
      {/* ========================================================================= */}
      <ErpPageBanner
        title="Customer Management"
        subtitle="Registered shopper profiles, verified self-checkout purchase histories & loyalty tiers"
        badges={["Verified Shopper Profiles", "Loyalty Tier Automation", "Self-Checkout Tracking"]}
        icon={<Users size={22} color="#ffffff" strokeWidth={2.4} />}
      />

      {/* Action Toast Feedback */}
      {actionToast && (
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
          <span>{actionToast}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. FOUR HORIZONTAL CUSTOMER KPI CARDS (SPEC REQUIREMENT #1)               */}
      {/* ========================================================================= */}
      <section className="pm-kpi-grid">
        {/* Card 1: Total Registered Customers */}
        <div className="pm-kpi-card blue-theme">
          <div className="pm-kpi-icon-pill blue">
            <Users size={20} color="#2563EB" strokeWidth={2.4} />
          </div>
          <div className="pm-kpi-content">
            <h3 className="pm-kpi-number">{totalRegisteredCount}</h3>
            <span className="pm-kpi-label">Total Registered Customers</span>
            <div className="pm-kpi-trend green">
              <span className="trend-arrow">↑</span>
              <span>From MongoDB Records</span>
            </div>
          </div>
        </div>

        {/* Card 2: Active Customers */}
        <div className="pm-kpi-card green-theme">
          <div className="pm-kpi-icon-pill green">
            <CheckCircle2 size={20} color="#059669" strokeWidth={2.4} />
          </div>
          <div className="pm-kpi-content">
            <h3 className="pm-kpi-number">{activeCustomersCount}</h3>
            <span className="pm-kpi-label">Active Customers</span>
            <div className="pm-kpi-trend green">
              <span className="trend-arrow">✓</span>
              <span>Activity in last 30 days</span>
            </div>
          </div>
        </div>

        {/* Card 3: New Customers */}
        <div className="pm-kpi-card yellow-theme">
          <div className="pm-kpi-icon-pill yellow">
            <Sparkles size={20} color="#D97706" strokeWidth={2.4} />
          </div>
          <div className="pm-kpi-content">
            <h3 className="pm-kpi-number">{newCustomersCount}</h3>
            <span className="pm-kpi-label">New Customers</span>
            <div className="pm-kpi-trend green">
              <span className="trend-arrow">↑</span>
              <span>Joined recently</span>
            </div>
          </div>
        </div>

        {/* Card 4: Customers with Orders */}
        <div className="pm-kpi-card purple-theme">
          <div className="pm-kpi-icon-pill purple">
            <ShoppingBag size={20} color="#7C3AED" strokeWidth={2.4} />
          </div>
          <div className="pm-kpi-content">
            <h3 className="pm-kpi-number">{customersWithOrdersCount}</h3>
            <span className="pm-kpi-label">Customers with Orders</span>
            <div className="pm-kpi-trend green">
              <span className="trend-arrow">✓</span>
              <span>
                {totalRegisteredCount > 0
                  ? `${Math.round((customersWithOrdersCount / totalRegisteredCount) * 100)}% conversion`
                  : "0%"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SEARCH & FILTERS TOOLBAR                                               */}
      {/* ========================================================================= */}
      <section className="pm-toolbar-row">
        <div className="pm-toolbar-search">
          <Search size={18} className="pm-search-ico" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, mobile number, email, or customer ID (CUST-...)"
          />
        </div>

        <div className="pm-toolbar-filters">
          {/* Status Filter */}
          <div className="pm-select-pill-wrap">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="pm-select-pill"
            >
              {STATUS_FILTERS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Registration Date Filter */}
          <div className="pm-select-pill-wrap">
            <select
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              className="pm-select-pill"
            >
              {DATE_FILTERS.map((df) => (
                <option key={df.value} value={df.value}>
                  {df.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tier Filter */}
          <div className="pm-select-pill-wrap">
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="pm-select-pill"
            >
              {TIER_FILTERS.map((tf) => (
                <option key={tf} value={tf}>
                  {tf}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. CUSTOMER DIRECTORY LISTING TABLE                                       */}
      {/* ========================================================================= */}
      <div className="pm-catalog-card">
        <div className="pm-catalog-header">
          <div className="pm-catalog-title-group">
            <div className="pm-catalog-icon-box">
              <Users size={18} color="#FFFFFF" />
            </div>
            <h3 className="pm-catalog-heading">
              Customer Directory ({filteredCustomers.length} Shoppers Listed)
            </h3>
          </div>

          <div className="cm-header-controls" style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            {/* Top Interactive Page Navigation Control */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "2px",
                background: "#F8FAFC",
                border: "1px solid #CBD5E1",
                borderRadius: "8px",
                padding: "2px 6px",
              }}
            >
              <button
                type="button"
                className="pm-page-chevron"
                style={{ width: "24px", height: "24px", border: "none", background: "transparent", cursor: validCurrentPage <= 1 || viewAll ? "not-allowed" : "pointer" }}
                disabled={validCurrentPage <= 1 || viewAll}
                onClick={() => {
                  setViewAll(false);
                  setCurrentPage((p) => Math.max(1, p - 1));
                }}
                title="Previous Page"
              >
                <ChevronLeft size={14} />
              </button>

              <span
                style={{
                  fontSize: "12px",
                  color: "#334155",
                  fontWeight: 700,
                  padding: "0 6px",
                  whiteSpace: "nowrap",
                }}
              >
                {viewAll ? `All (${filteredCustomers.length})` : `Page ${validCurrentPage} of ${totalPages}`}
              </span>

              <button
                type="button"
                className="pm-page-chevron"
                style={{ width: "24px", height: "24px", border: "none", background: "transparent", cursor: validCurrentPage >= totalPages || viewAll ? "not-allowed" : "pointer" }}
                disabled={validCurrentPage >= totalPages || viewAll}
                onClick={() => {
                  setViewAll(false);
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                }}
                title="Next Page"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            {/* View All / Paginate View Toggle Button */}
            <button
              type="button"
              className={`pm-view-all-btn ${viewAll ? "active" : ""}`}
              onClick={() => {
                setCurrentPage(1);
                setViewAll((prev) => !prev);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 700,
                border: "1px solid #CBD5E1",
                background: viewAll ? "#2563EB" : "#FFFFFF",
                color: viewAll ? "#FFFFFF" : "#334155",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              title={viewAll ? "Switch back to paginated view" : "View all customers on a single page"}
            >
              <span>{viewAll ? `Paginate (${pageSize}/p)` : "View All"}</span>
              <ArrowRight
                size={13}
                style={{
                  transform: viewAll ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s ease",
                }}
              />
            </button>

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
          </div>
        </div>

        <div className="pm-table-wrapper">
          {filteredCustomers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px", color: "#64748B" }}>
              <Users size={36} color="#CBD5E1" style={{ margin: "0 auto 12px" }} />
              <p style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 700, color: "#0F172A" }}>
                No customer records match your filter.
              </p>
              <span style={{ fontSize: "13px" }}>
                Customers placing orders or browsing carts will automatically appear here.
              </span>
            </div>
          ) : (
            <table className="pm-products-table">
              <thead>
                <tr>
                  <th>CUSTOMER INFO</th>
                  <th>MOBILE & EMAIL</th>
                  <th>REGISTRATION DATE</th>
                  <th>TOTAL ORDERS</th>
                  <th>TOTAL VERIFIED SPEND</th>
                  <th>LATEST ORDER DATE</th>
                  <th>ACCOUNT STATUS</th>
                  <th style={{ textAlign: "center" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCustomers.map((c) => {
                  const regFormatted = c.registrationDate.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  const latestFormatted = c.latestOrderDate.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });

                  return (
                    <tr key={c.key}>
                      {/* Customer Info (Avatar & ID) */}
                      <td>
                        <div className="pm-cell-details">
                          <div className="cm-avatar-initials">{getInitials(c.name)}</div>
                          <div className="pm-details-text">
                            <span className="pm-name-main">{c.name}</span>
                            <span
                              style={{
                                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                                fontSize: "11.5px",
                                color: "#1D4ED8",
                                fontWeight: 800,
                              }}
                            >
                              {c.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span
                            style={{
                              fontSize: "12.5px",
                              fontWeight: 700,
                              color: "#0F172A",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <Phone size={12} color="#64748B" />
                            {c.phone}
                          </span>
                          {c.address ? (
                            <span style={{ fontSize: "11px", color: "#64748B" }} title={c.address}>
                              📍 {c.address}
                            </span>
                          ) : null}
                          {c.email ? (
                            <span
                              style={{
                                fontSize: "11px",
                                color: "#64748B",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <Mail size={11} /> {c.email}
                            </span>
                          ) : (
                            <span style={{ fontSize: "11px", color: "#94A3B8" }}>No email provided</span>
                          )}
                        </div>
                      </td>

                      {/* Registration Date */}
                      <td>
                        <span style={{ fontSize: "12.5px", color: "#334155", fontWeight: 600 }}>
                          {regFormatted}
                        </span>
                      </td>

                      {/* Total Orders */}
                      <td>
                        <span
                          style={{
                            fontSize: "12.5px",
                            fontWeight: 800,
                            background: "#F1F5F9",
                            color: "#0F172A",
                            padding: "3px 9px",
                            borderRadius: "6px",
                          }}
                        >
                          {c.totalOrders} {c.totalOrders === 1 ? "order" : "orders"}
                        </span>
                      </td>

                      {/* Total Verified Spend */}
                      <td>
                        <span className="pm-price-bold">
                          ₹{c.totalSpent.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Latest Order Date */}
                      <td>
                        <span style={{ fontSize: "12px", color: "#475569" }}>
                          {c.totalOrders > 0 ? latestFormatted : "No orders yet"}
                        </span>
                      </td>

                      {/* Customer Account Status */}
                      <td>
                        <span className={`cm-status-pill ${c.status === "Active" ? "active" : "suspended"}`}>
                          {c.status === "Active" ? "✓ Active" : "✕ Suspended"}
                        </span>
                      </td>

                      {/* Action Button */}
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            type="button"
                            className="action-pill-btn refresh"
                            style={{ padding: "6px 12px", fontSize: "12px" }}
                            onClick={() => setActiveCustomer(c)}
                            title="View Complete Customer Profile & Order History"
                          >
                            <Eye size={13} />
                            <span>View Details</span>
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

        {/* ========================================================================= */}
        {/* 5. PAGINATION CONTROLS (SPEC REQUIREMENT #4)                              */}
        {/* ========================================================================= */}
        {filteredCustomers.length > 0 && (
          <div className="cm-pagination-wrap">
            <div className="cm-pagination-info">
              {viewAll
                ? `Showing all ${filteredCustomers.length} registered customers`
                : `Showing ${(validCurrentPage - 1) * pageSize + 1} to ${Math.min(
                    validCurrentPage * pageSize,
                    filteredCustomers.length
                  )} of ${filteredCustomers.length} registered customers (Page ${validCurrentPage} of ${totalPages})`}
            </div>

            <div className="cm-pagination-actions">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                  setViewAll(false);
                }}
                style={{
                  padding: "5px 10px",
                  borderRadius: "8px",
                  border: "1px solid #CBD5E1",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#334155",
                  background: "#FFFFFF",
                  cursor: "pointer",
                }}
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>

              {/* Prev Button */}
              <button
                type="button"
                className="cm-page-btn"
                disabled={validCurrentPage <= 1 || viewAll}
                onClick={() => {
                  setViewAll(false);
                  setCurrentPage((p) => Math.max(1, p - 1));
                }}
                title="Previous Page"
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>

              {/* Individual Interactive Page Number Buttons */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  className={`pm-page-num ${validCurrentPage === pageNum && !viewAll ? "active" : ""}`}
                  onClick={() => {
                    setViewAll(false);
                    setCurrentPage(pageNum);
                  }}
                  title={`Go to page ${pageNum}`}
                  style={{
                    cursor: "pointer",
                    minWidth: "30px",
                    height: "30px",
                  }}
                >
                  {pageNum}
                </button>
              ))}

              {/* Next Button */}
              <button
                type="button"
                className="cm-page-btn"
                disabled={validCurrentPage >= totalPages || viewAll}
                onClick={() => {
                  setViewAll(false);
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                }}
                title="Next Page"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>

              {/* Jump to page */}
              <div
                className="pm-goto-wrap"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  color: "#64748B",
                  marginLeft: "4px",
                }}
              >
                <span>Go to page</span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={validCurrentPage}
                  disabled={viewAll || totalPages <= 1}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val >= 1 && val <= totalPages) {
                      setViewAll(false);
                      setCurrentPage(val);
                    }
                  }}
                  style={{
                    width: "48px",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    fontSize: "12px",
                    textAlign: "center",
                    fontWeight: 700,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 6. PROFESSIONAL CUSTOMER PROFILE & ORDER HISTORY MODAL                    */}
      {/* ========================================================================= */}
      {activeCustomer && (
        <div className="pm-modal-overlay" onClick={() => setActiveCustomer(null)}>
          <div
            className="pm-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "620px", padding: "24px" }}
          >
            {/* Modal Header */}
            <div className="pm-modal-header" style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div className="cm-avatar-initials" style={{ width: "48px", height: "48px", fontSize: "17px" }}>
                  {getInitials(activeCustomer.name)}
                </div>
                <div>
                  <h3 className="pm-modal-title" style={{ margin: 0, fontSize: "17px" }}>
                    {activeCustomer.name}
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "3px" }}>
                    <span style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: "12px", color: "#1D4ED8", fontWeight: 800 }}>
                      {activeCustomer.id}
                    </span>
                    <span style={{ fontSize: "11px", color: "#64748B" }}>&bull;</span>
                    <span className={`cm-status-pill ${activeCustomer.status === "Active" ? "active" : "suspended"}`}>
                      {activeCustomer.status === "Active" ? "✓ Active" : "✕ Suspended"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="pm-modal-close"
                onClick={() => setActiveCustomer(null)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Profile Overview Card */}
            <div
              style={{
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "18px",
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "12.5px" }}>
                <div>
                  <span style={{ color: "#64748B", display: "block", fontSize: "11px", textTransform: "uppercase" }}>
                    Mobile Number
                  </span>
                  <strong style={{ color: "#0F172A" }}>{activeCustomer.phone}</strong>
                </div>

                <div>
                  <span style={{ color: "#64748B", display: "block", fontSize: "11px", textTransform: "uppercase" }}>
                    Email Address
                  </span>
                  <strong style={{ color: "#0F172A" }}>{activeCustomer.email || "Not registered"}</strong>
                </div>

                <div>
                  <span style={{ color: "#64748B", display: "block", fontSize: "11px", textTransform: "uppercase" }}>
                    Member Since
                  </span>
                  <strong style={{ color: "#0F172A" }}>
                    {activeCustomer.registrationDate.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </strong>
                </div>

                <div>
                  <span style={{ color: "#64748B", display: "block", fontSize: "11px", textTransform: "uppercase" }}>
                    Preferred Payment
                  </span>
                  <strong style={{ color: "#0F172A" }}>{activeCustomer.preferredPayment}</strong>
                </div>
              </div>

              {/* Account Status Authorization Action */}
              <div
                style={{
                  marginTop: "14px",
                  paddingTop: "12px",
                  borderTop: "1px dashed #CBD5E1",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "12px", color: "#475569" }}>
                  Account Status: <strong>{activeCustomer.status}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleCustomerStatus(activeCustomer)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    border: "1px solid",
                    background: activeCustomer.status === "Active" ? "#FEF2F2" : "#F0FDF4",
                    color: activeCustomer.status === "Active" ? "#DC2626" : "#16A34A",
                    borderColor: activeCustomer.status === "Active" ? "#FECACA" : "#BBF7D0",
                  }}
                >
                  {activeCustomer.status === "Active" ? "Suspend Account" : "Reactivate Account"}
                </button>
              </div>
            </div>

            {/* 3 Metric Stat Boxes */}
            <div className="cm-profile-stats-grid">
              <div className="cm-profile-stat-box">
                <span className="num">{activeCustomer.totalOrders}</span>
                <span className="lbl">Total Orders Placed</span>
              </div>

              <div className="cm-profile-stat-box">
                <span className="num" style={{ color: "#2563EB" }}>
                  ₹{activeCustomer.totalSpent.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
                <span className="lbl">Lifetime Verified Spend</span>
              </div>

              <div className="cm-profile-stat-box">
                <span className="num" style={{ color: "#059669" }}>
                  ₹
                  {activeCustomer.totalOrders > 0
                    ? Math.round(activeCustomer.totalSpent / activeCustomer.totalOrders).toLocaleString("en-IN")
                    : "0"}
                </span>
                <span className="lbl">Avg Order Value</span>
              </div>
            </div>

            {/* Complete Order History (Spec Requirement #3) */}
            <h4
              style={{
                margin: "18px 0 10px",
                fontSize: "14px",
                fontWeight: 800,
                color: "#0F172A",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>Complete Order History ({activeCustomer.orders.length} Records)</span>
              <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 600 }}>
                Actual MongoDB Orders
              </span>
            </h4>

            {activeCustomer.orders.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "24px 16px",
                  background: "#F8FAFC",
                  borderRadius: "10px",
                  color: "#64748B",
                  fontSize: "13px",
                }}
              >
                This customer has not completed any orders yet.
              </div>
            ) : (
              <div
                style={{
                  maxHeight: "220px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {activeCustomer.orders.map((ord) => (
                  <div
                    key={ord.id}
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "10px",
                      padding: "12px 14px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontFamily: "monospace", fontSize: "12px", fontWeight: 800, color: "#1D4ED8" }}>
                          #{ord.id}
                        </span>
                        <span
                          style={{
                            fontSize: "10.5px",
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background:
                              ord.paymentStatus === "Completed"
                                ? "#DCFCE7"
                                : ord.paymentStatus === "Approved"
                                ? "#EEF2FF"
                                : "#FEF3C7",
                            color:
                              ord.paymentStatus === "Completed"
                                ? "#166534"
                                : ord.paymentStatus === "Approved"
                                ? "#4338CA"
                                : "#B45309",
                          }}
                        >
                          {ord.paymentStatus}
                        </span>
                      </div>

                      <p
                        style={{
                          margin: "4px 0 2px",
                          fontSize: "11.5px",
                          color: "#475569",
                          maxWidth: "320px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {ord.items.map((it) => `${it.name} (x${it.quantity})`).join(", ") || "General Grocery"}
                      </p>

                      <span style={{ fontSize: "10.5px", color: "#94A3B8" }}>
                        {ord.date.toLocaleDateString("en-IN")}, {ord.date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} &bull; {ord.paymentMethod}
                      </span>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "15px", fontWeight: 800, color: "#0F172A", display: "block" }}>
                        ₹{ord.amount.toFixed(2)}
                      </span>
                      <span style={{ fontSize: "10.5px", color: "#64748B" }}>
                        {ord.items.length} items
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Recent Shopping Activity from Cart Activity */}
            {activeCustomer.recentCartItems && activeCustomer.recentCartItems.length > 0 && (
              <div style={{ marginTop: "14px" }}>
                <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "6px" }}>
                  Recent Cart Items:
                </span>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {activeCustomer.recentCartItems.map((prod, i) => (
                    <span
                      key={i}
                      style={{
                        background: "#EFF6FF",
                        color: "#1D4ED8",
                        border: "1px solid #DBEAFE",
                        borderRadius: "6px",
                        padding: "2px 8px",
                        fontSize: "11px",
                        fontWeight: 600,
                      }}
                    >
                      {prod}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: "20px", textAlign: "right" }}>
              <button
                type="button"
                className="pm-btn-cancel"
                onClick={() => setActiveCustomer(null)}
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
