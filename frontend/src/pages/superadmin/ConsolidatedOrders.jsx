import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingCart,
  Building2,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  QrCode,
  DollarSign,
  Eye,
  RefreshCw,
  Printer,
  X,
  CreditCard,
  User,
  Phone,
} from "lucide-react";
import API from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "./SuperAdmin.css";

const DEMO_ORDERS = [
  {
    _id: "ord-1",
    orderId: "ORD-948201-9481",
    customerName: "SREE",
    customerPhone: "+91 98765 12345",
    supermarketName: "GrocerEase Flagship - Indiranagar",
    supermarketCode: "STR-001",
    totalAmount: 180,
    paymentMethod: "UPI",
    paymentStatus: "Completed",
    gateStatus: "Turnstile Verified & Exited",
    itemsCount: 1,
    items: [
      { name: "Fresh Red Apples (Washington)", quantity: 1, price: 180, subtotal: 180 },
    ],
    createdAt: "2026-11-13T10:15:00Z",
  },
  {
    _id: "ord-2",
    orderId: "ORD-839102-3921",
    customerName: "POOJA",
    customerPhone: "+91 98123 45678",
    supermarketName: "FreshMart Supermarket - Koramangala",
    supermarketCode: "STR-002",
    totalAmount: 4320,
    paymentMethod: "Card",
    paymentStatus: "Completed",
    gateStatus: "Turnstile Verified & Exited",
    itemsCount: 24,
    items: [
      { name: "Fresh Red Apples (Washington)", quantity: 24, price: 180, subtotal: 4320 },
    ],
    createdAt: "2026-11-13T09:40:00Z",
  },
  {
    _id: "ord-3",
    orderId: "ORD-739104-1029",
    customerName: "Mobile Shopper",
    customerPhone: "+91 99001 22334",
    supermarketName: "GrocerEase Flagship - Indiranagar",
    supermarketCode: "STR-001",
    totalAmount: 704,
    paymentMethod: "UPI",
    paymentStatus: "Completed",
    gateStatus: "Turnstile Verified & Exited",
    itemsCount: 2,
    items: [
      { name: "Chocolate", quantity: 2, price: 352, subtotal: 704 },
    ],
    createdAt: "2026-11-13T08:20:00Z",
  },
  {
    _id: "ord-4",
    orderId: "ORD-629104-5829",
    customerName: "Rahul Sharma",
    customerPhone: "+91 97401 88392",
    supermarketName: "FreshMart Supermarket - Koramangala",
    supermarketCode: "STR-002",
    totalAmount: 670,
    paymentMethod: "Cash",
    paymentStatus: "Completed",
    gateStatus: "Turnstile Verified & Exited",
    itemsCount: 2,
    items: [
      { name: "Royal Basmati Rice 5kg", quantity: 1, price: 650, subtotal: 650 },
      { name: "Lays Potato Chips", quantity: 1, price: 20, subtotal: 20 },
    ],
    createdAt: "2026-11-12T18:30:00Z",
  },
];

export default function ConsolidatedOrders() {
  const { supermarkets } = useAuth();
  const [orders, setOrders] = useState(DEMO_ORDERS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedStore, setSelectedStore] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [activeModalOrder, setActiveModalOrder] = useState(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await API.get("/super-admin/orders", {
        params: { supermarketId: selectedStore, search, status: selectedStatus },
      });
      if (res.data?.success && res.data.orders?.length > 0) {
        setOrders(
          res.data.orders.map((o) => ({
            _id: o._id,
            orderId: o.orderId || `ORD-${String(o._id).slice(-6)}`,
            customerName: o.customerName || "Autonomous Shopper",
            customerPhone: o.customerPhone || "N/A",
            supermarketName: o.supermarket?.name || o.supermarketName || "Supermarket Store",
            supermarketCode: o.supermarket?.code || o.supermarketCode || "STR-001",
            totalAmount: o.totalAmount || 0,
            paymentMethod: o.paymentMethod || "UPI",
            paymentStatus: o.paymentStatus || "Completed",
            gateStatus: "Turnstile Verified & Exited",
            itemsCount: o.items?.length || 1,
            items: o.items || [],
            createdAt: o.createdAt || new Date().toISOString(),
          }))
        );
      }
    } catch (_) {
      // Fallback to demo orders
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [selectedStore, selectedStatus]);

  const filtered = orders.filter((o) => {
    const matchSearch =
      !search ||
      o.orderId.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.customerPhone.includes(search) ||
      o.supermarketName.toLowerCase().includes(search.toLowerCase());
    const matchStore = selectedStore === "all" || o.supermarketCode === selectedStore;
    const matchStatus = selectedStatus === "all" || o.paymentStatus === selectedStatus;
    return matchSearch && matchStore && matchStatus;
  });

  return (
    <div className="sa-page-container">
      {/* 1. Header */}
      <div className="sa-page-header">
        <div className="sa-page-header-content">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span className="sa-badge active">Unified Feed</span>
            <span style={{ fontSize: "12px", color: "#64748b" }}>Multi-Tenant Order Ledger</span>
          </div>
          <h1>Consolidated Customer Orders</h1>
          <p>
            Centralized stream of all completed, POS-cleared, and turnstile-verified customer transactions across all supermarkets.
          </p>
        </div>

        <div className="sa-page-header-actions">
          <button type="button" className="sa-btn-secondary" onClick={loadOrders}>
            <RefreshCw size={15} className={loading ? "spin-icon" : ""} />
            <span>Refresh Orders</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="sa-filter-bar">
        <div className="sa-search-input-wrap">
          <Search size={16} className="sa-search-icon" />
          <input
            type="text"
            className="sa-search-input"
            placeholder="Search by Order ID, Customer name, Phone, or Store..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="sa-filter-controls">
          <select
            className="sa-select-input"
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
          >
            <option value="all">All Supermarkets ({supermarkets.length || 2})</option>
            {supermarkets.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>

          <select
            className="sa-select-input"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">All Payment Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      {/* 3. Orders Table */}
      <div className="sa-section-card">
        <div className="sa-table-wrapper">
          <table className="sa-data-table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Tenant Supermarket</th>
                <th>Customer / Shopper</th>
                <th>Items</th>
                <th>Total Paid (₹)</th>
                <th>Payment Mode</th>
                <th>Gate Clearance</th>
                <th>Date & Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "2.5rem", color: "#64748b" }}>
                    No customer orders found matching your search.
                  </td>
                </tr>
              ) : (
                filtered.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <strong style={{ fontFamily: "monospace", color: "#2563eb", fontSize: "13px" }}>
                        #{order.orderId}
                      </strong>
                    </td>
                    <td>
                      <div>
                        <strong style={{ fontSize: "13px", color: "#0f172a" }}>{order.supermarketName}</strong>
                        <span style={{ display: "block", fontSize: "11px", color: "#64748b" }}>
                          {order.supermarketCode}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong style={{ display: "block", color: "#0f172a" }}>{order.customerName}</strong>
                        <span style={{ fontSize: "11px", color: "#64748b" }}>{order.customerPhone}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: "#0f172a" }}>{order.itemsCount}</span>
                      <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "4px" }}>
                        {order.itemsCount === 1 ? "item" : "items"}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: "#0f172a", fontSize: "14px" }}>
                        ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                      </strong>
                    </td>
                    <td>
                      <span className="sa-badge plan">{order.paymentMethod}</span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <CheckCircle2 size={14} color="#16a34a" />
                        <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: 600 }}>Cleared</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>
                        {new Date(order.createdAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="sa-btn-secondary"
                        style={{ padding: "4px 10px", fontSize: "12px" }}
                        onClick={() => setActiveModalOrder(order)}
                      >
                        <Eye size={13} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Order Modal */}
      {activeModalOrder && (
        <div className="sa-modal-overlay" onClick={() => setActiveModalOrder(null)}>
          <div className="sa-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="sa-modal-header">
              <div>
                <h3>Order #{activeModalOrder.orderId}</h3>
                <p>{activeModalOrder.supermarketName} &bull; {activeModalOrder.supermarketCode}</p>
              </div>
              <button
                type="button"
                className="sa-modal-close-btn"
                onClick={() => setActiveModalOrder(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="sa-modal-body">
              <div style={{ display: "flex", justifyContent: "space-between", background: "#f8fafc", padding: "12px", borderRadius: "10px" }}>
                <div>
                  <small style={{ color: "#64748b" }}>Customer</small>
                  <strong style={{ display: "block" }}>{activeModalOrder.customerName}</strong>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>{activeModalOrder.customerPhone}</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <small style={{ color: "#64748b" }}>Payment Mode</small>
                  <strong style={{ display: "block", color: "#2563eb" }}>{activeModalOrder.paymentMethod}</strong>
                  <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: 700 }}>✓ Verified</span>
                </div>
              </div>

              <div>
                <h4 style={{ margin: "0 0 8px 0", fontSize: "13px", fontWeight: 700, color: "#475569" }}>
                  Billed Items
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {activeModalOrder.items.map((it, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: "13px" }}>{it.name}</strong>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>
                          Qty: {it.quantity} &times; ₹{it.price}
                        </div>
                      </div>
                      <strong style={{ fontSize: "14px", color: "#0f172a" }}>₹{it.subtotal || it.price * it.quantity}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px dashed #cbd5e1", paddingTop: "12px" }}>
                <span style={{ fontWeight: 700 }}>Total Billed:</span>
                <strong style={{ fontSize: "16px", color: "#0f172a" }}>
                  ₹{Number(activeModalOrder.totalAmount).toLocaleString("en-IN")}
                </strong>
              </div>
            </div>

            <div className="sa-modal-footer">
              <button
                type="button"
                className="sa-btn-secondary"
                onClick={() => setActiveModalOrder(null)}
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

