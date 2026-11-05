import React, { useEffect, useState, useMemo } from "react";
import {
  ShoppingCart,
  Search,
  RefreshCw,
  Eye,
  CheckCircle,
  CreditCard,
  QrCode,
  Calendar,
  X,
  Printer,
  Clock,
  Check,
} from "lucide-react";
import API from "../../services/api";
import BarcodeSVG from "../../components/BarcodeSVG";

export default function OrdersManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState("ALL");
  const [confirmingId, setConfirmingId] = useState(null);
  const [actionMessage, setActionMessage] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await API.get("/orders");
      if (res.data?.success) {
        setOrders(res.data.orders || []);
      }
    } catch (err) {
      console.error("Fetch orders error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleConfirmCash = async (orderId, orderNumber) => {
    try {
      setConfirmingId(orderId);
      setActionMessage("");
      const res = await API.post(`/orders/${orderId}/confirm-cash`);
      if (res.data?.success) {
        setActionMessage(`Order #${orderNumber} marked as Paid & Inventory stock updated.`);
        // Refresh orders list
        await fetchOrders();
        setTimeout(() => setActionMessage(""), 4000);
      }
    } catch (err) {
      console.error("Confirm cash error:", err);
      alert(err.response?.data?.message || "Failed to confirm cash payment.");
    } finally {
      setConfirmingId(null);
    }
  };

  const pendingCashCount = useMemo(() => {
    return orders.filter(
      (o) => o.paymentMethod === "Cash" && o.paymentStatus === "Pending"
    ).length;
  }, [orders]);

  const completedCount = useMemo(() => {
    return orders.filter((o) => o.paymentStatus === "Completed").length;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Tab filter
      if (activeTab === "PENDING" && o.paymentStatus !== "Pending") return false;
      if (activeTab === "COMPLETED" && o.paymentStatus !== "Completed") return false;

      // Search query
      const q = search.toLowerCase();
      return (
        o.orderNumber?.toLowerCase().includes(q) ||
        o.customer?.name?.toLowerCase().includes(q) ||
        o.paymentMethod?.toLowerCase().includes(q) ||
        o.exitBarcode?.toLowerCase().includes(q)
      );
    });
  }, [orders, search, activeTab]);

  const totalRevenue = useMemo(() => {
    return orders
      .filter((o) => o.paymentStatus === "Completed")
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }, [orders]);

  const pendingRevenue = useMemo(() => {
    return orders
      .filter((o) => o.paymentStatus === "Pending")
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }, [orders]);

  return (
    <div className="grocer-dashboard-page">
      {/* Top Header */}
      <div className="dashboard-topbar-row">
        <div>
          <h1 className="page-heading">Orders & Self-Checkout Sales</h1>
          <p className="page-subheading">
            Live customer orders from mobile app with real-time payment and inventory synchronization.
          </p>
        </div>

        <div className="dashboard-action-group">
          <div className="filter-select-pill">
            <span>
              Verified Sales: <strong>₹{totalRevenue.toLocaleString("en-IN")}</strong>
            </span>
          </div>

          {pendingCashCount > 0 && (
            <div
              className="filter-select-pill"
              style={{ background: "#FEF3C7", borderColor: "#FDE68A", color: "#B45309" }}
            >
              <span>
                Pending Cash: <strong>₹{pendingRevenue.toLocaleString("en-IN")}</strong> ({pendingCashCount})
              </span>
            </div>
          )}

          <button
            type="button"
            className="action-pill-btn refresh"
            onClick={fetchOrders}
            disabled={loading}
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {actionMessage && (
        <div
          style={{
            backgroundColor: "#DCFCE7",
            border: "1px solid #86EFAC",
            color: "#166534",
            padding: "12px 16px",
            borderRadius: 10,
            marginBottom: 16,
            fontWeight: 600,
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <CheckCircle size={18} />
          {actionMessage}
        </div>
      )}

      {/* Tabs Row */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setActiveTab("ALL")}
          className={`action-pill-btn ${activeTab === "ALL" ? "primary" : "refresh"}`}
        >
          All Orders ({orders.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("PENDING")}
          className={`action-pill-btn ${activeTab === "PENDING" ? "primary" : "refresh"}`}
          style={
            pendingCashCount > 0 && activeTab !== "PENDING"
              ? { borderColor: "#F59E0B", color: "#D97706" }
              : {}
          }
        >
          ⏳ Pending Cash at Exit ({pendingCashCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("COMPLETED")}
          className={`action-pill-btn ${activeTab === "COMPLETED" ? "primary" : "refresh"}`}
        >
          ✓ Completed ({completedCount})
        </button>
      </div>

      {/* Filter / Search */}
      <div className="pm-filter-panel">
        <div className="pm-search-wrap" style={{ maxWidth: "100%" }}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by order number, customer, barcode or payment method..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="dashboard-content-card">
        <div className="card-top-header">
          <h3>
            Customer Orders ({filteredOrders.length})
            {activeTab === "PENDING" && " — Awaiting Cash at Exit Turnstile"}
          </h3>
        </div>

        <div className="overview-table-container">
          {filteredOrders.length === 0 ? (
            <div className="empty-state-box">
              <p>No orders matching current filter.</p>
              <span style={{ fontSize: 13, color: "#94a3b8" }}>
                Customer checkouts from the mobile app will update here automatically.
              </span>
            </div>
          ) : (
            <table className="grocer-table">
              <thead>
                <tr>
                  <th>Order Number</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total Amount</th>
                  <th>Payment Method</th>
                  <th>Payment Status & Action</th>
                  <th>Exit Barcode</th>
                  <th>Date</th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((ord) => {
                  const isPendingCash =
                    ord.paymentMethod === "Cash" && ord.paymentStatus === "Pending";

                  return (
                    <tr key={ord._id}>
                      <td>
                        <span className="order-number-tag">{ord.orderNumber}</span>
                      </td>
                      <td>{ord.customer?.name || "Guest Shopper"}</td>
                      <td>
                        <strong>{ord.totalItems}</strong> items
                      </td>
                      <td className="price-cell">
                        ₹{Number(ord.totalAmount).toLocaleString("en-IN")}
                      </td>
                      <td>
                        <span className="payment-method-pill">{ord.paymentMethod}</span>
                      </td>
                      <td>
                        {isPendingCash ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span
                              className="status-badge"
                              style={{
                                background: "#FEF3C7",
                                color: "#B45309",
                                border: "1px solid #FDE68A",
                              }}
                            >
                              ⏳ Pending Cash
                            </span>
                            <button
                              type="button"
                              className="action-pill-btn primary"
                              style={{
                                padding: "4px 10px",
                                fontSize: 12,
                                borderRadius: 8,
                                background: "#10B981",
                                borderColor: "#10B981",
                              }}
                              onClick={() => handleConfirmCash(ord._id, ord.orderNumber)}
                              disabled={confirmingId === ord._id}
                              title="Click after receiving cash to mark paid & deduct stock"
                            >
                              {confirmingId === ord._id ? (
                                "Updating..."
                              ) : (
                                <>
                                  <Check size={13} /> Confirm Cash
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="status-badge in-stock">
                            ✓ {ord.paymentStatus}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="barcode-tag">{ord.exitBarcode}</span>
                      </td>
                      <td className="date-cell">
                        {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="icon-action-btn edit"
                          onClick={() => setSelectedOrder(ord)}
                          title="View Digital Receipt"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Digital Receipt Modal */}
      {selectedOrder && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3>Customer Exit Receipt</h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => setSelectedOrder(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "24px 20px", textAlign: "center" }}>
              <div
                style={{
                  background:
                    selectedOrder.paymentStatus === "Pending" ? "#FEF3C7" : "#eff6ff",
                  padding: "16px 20px",
                  borderRadius: 14,
                  border: `1px solid ${
                    selectedOrder.paymentStatus === "Pending" ? "#FDE68A" : "#bfdbfe"
                  }`,
                  marginBottom: 20,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: 2,
                    color:
                      selectedOrder.paymentStatus === "Pending" ? "#B45309" : "#2563eb",
                  }}
                >
                  {selectedOrder.paymentStatus === "Pending"
                    ? "TURNSTILE CASH PASS BARCODE"
                    : "EXIT VERIFICATION BARCODE"}
                </span>

                <div style={{ margin: "12px 0" }}>
                  <BarcodeSVG
                    value={selectedOrder.exitBarcode}
                    height={55}
                  />
                </div>
                <small style={{ color: "#64748b", fontSize: 11 }}>
                  {selectedOrder.paymentStatus === "Pending"
                    ? "Present to cashier at exit turnstile to pay cash"
                    : "Scanned at supermarket exit gate to confirm paid items"}
                </small>
              </div>

              <div style={{ textAlign: "left", marginBottom: 18 }}>
                <h4 style={{ margin: "0 0 10px", fontSize: 14, color: "#0f172a" }}>
                  Purchased Items ({selectedOrder.items?.length})
                </h4>
                <div
                  style={{
                    maxHeight: 180,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {selectedOrder.items?.map((it, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 13,
                        paddingBottom: 6,
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      <span>
                        {it.name} <strong style={{ color: "#2563eb" }}>x{it.quantity}</strong>
                      </span>
                      <strong>₹{Number(it.subtotal).toFixed(2)}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 16,
                  fontWeight: 800,
                  padding: "12px 0",
                  borderTop: "2px dashed #cbd5e1",
                  borderBottom: "2px dashed #cbd5e1",
                  margin: "12px 0 20px",
                }}
              >
                <span>Total Amount:</span>
                <span style={{ color: "#2563eb" }}>
                  ₹{Number(selectedOrder.totalAmount).toFixed(2)}
                </span>
              </div>

              {selectedOrder.paymentStatus === "Pending" && (
                <button
                  type="button"
                  className="action-pill-btn primary"
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    marginBottom: 10,
                    background: "#10B981",
                    borderColor: "#10B981",
                  }}
                  onClick={() => {
                    handleConfirmCash(selectedOrder._id, selectedOrder.orderNumber);
                    setSelectedOrder(null);
                  }}
                >
                  <Check size={16} /> Confirm Cash Received & Update Stock
                </button>
              )}

              <button
                type="button"
                className="action-pill-btn refresh"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => window.print()}
              >
                <Printer size={15} /> Print Receipt Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
