import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Boxes,
  Search,
  Filter,
  Plus,
  AlertTriangle,
  CheckCircle,
  PackageCheck,
  TrendingDown,
  ArrowUpRight,
  RefreshCw,
  PlusCircle,
  X,
  Tag,
  IndianRupee,
  AlertCircle,
  History,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";
import API from "../../services/api";
import BarcodeSVG from "../../components/BarcodeSVG";
import ErpPageBanner from "../../components/ErpPageBanner";
import bannerCartImg from "../../assets/banner-cart.png";
import {
  getPersistentProducts,
  updatePersistentStock,
  mergeApiWithStorage,
} from "../../utils/realtimeStorage";
import "./ProductManagement.css";

const CATEGORIES = [
  "All Categories",
  "Groceries",
  "Beverages",
  "Household",
  "Snacks",
  "Personal Care",
  "Dairy",
  "Fruits & Vegetables",
  "Other",
];

const STOCK_FILTERS = [
  "All Stock Levels",
  "Low Stock (<= Threshold)",
  "Healthy Stock (> Threshold)",
  "Out of Stock (0)",
];

const SORT_OPTIONS = [
  { value: "lowest", label: "Sort: Lowest Stock First" },
  { value: "highest", label: "Sort: Highest Stock First" },
  { value: "name", label: "Sort: Name (A-Z)" },
  { value: "value", label: "Sort: Highest Valuation" },
];

export default function InventoryManagement() {
  const [products, setProducts] = useState(getPersistentProducts);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedStockFilter, setSelectedStockFilter] = useState("All Stock Levels");
  const [sortBy, setSortBy] = useState("lowest");

  // Modals state
  const [restockProduct, setRestockProduct] = useState(null);
  const [restockUnits, setRestockUnits] = useState(25);
  const [newThreshold, setNewThreshold] = useState(5);
  const [restockNote, setRestockNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [historyProduct, setHistoryProduct] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const [prodRes, ordRes] = await Promise.allSettled([
        API.get("/products"),
        API.get("/orders"),
      ]);

      if (prodRes.status === "fulfilled" && prodRes.value.data?.success && Array.isArray(prodRes.value.data.products)) {
        const merged = mergeApiWithStorage(prodRes.value.data.products);
        setProducts(merged);
      } else {
        setProducts(getPersistentProducts());
      }

      if (ordRes.status === "fulfilled" && ordRes.value.data?.success) {
        setOrders(ordRes.value.data.orders || []);
      }
    } catch (err) {
      console.warn("Using persistent inventory storage:", err.message);
      setProducts(getPersistentProducts());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();

    const interval = setInterval(() => {
      fetchInventory();
    }, 3500);

    const handleStorageUpdate = () => {
      setProducts(getPersistentProducts());
    };
    window.addEventListener("grocerease_storage_updated", handleStorageUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener("grocerease_storage_updated", handleStorageUpdate);
    };
  }, []);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        p.name?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q);

      const matchCat =
        selectedCategory === "All Categories" || p.category === selectedCategory;

      let matchStock = true;
      const threshold = Number(p.lowStockThreshold || 5);
      if (selectedStockFilter === "Low Stock (<= Threshold)") {
        matchStock = p.stock <= threshold && p.stock > 0;
      } else if (selectedStockFilter === "Healthy Stock (> Threshold)") {
        matchStock = p.stock > threshold;
      } else if (selectedStockFilter === "Out of Stock (0)") {
        matchStock = p.stock === 0;
      }

      return matchSearch && matchCat && matchStock;
    });

    // Apply sorting
    list = [...list].sort((a, b) => {
      if (sortBy === "lowest") return (a.stock || 0) - (b.stock || 0);
      if (sortBy === "highest") return (b.stock || 0) - (a.stock || 0);
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "value") {
        return (b.stock || 0) * (b.price || 0) - (a.stock || 0) * (a.price || 0);
      }
      return 0;
    });

    return list;
  }, [products, search, selectedCategory, selectedStockFilter, sortBy]);

  // Inventory KPI Metrics
  const totalStockUnits = useMemo(() => {
    return products.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.stock > 0 && p.stock <= Number(p.lowStockThreshold || 5)).length;
  }, [products]);

  const outOfStockCount = useMemo(() => {
    return products.filter((p) => Number(p.stock) === 0).length;
  }, [products]);

  const healthyStockCount = useMemo(() => {
    return products.filter((p) => p.stock > Number(p.lowStockThreshold || 5)).length;
  }, [products]);

  const totalInventoryValuation = useMemo(() => {
    return products.reduce((acc, p) => acc + (Number(p.price) || 0) * (Number(p.stock) || 0), 0);
  }, [products]);

  // Adjust stock via stepper with permanent persistence
  const handleStockStep = async (productId, delta) => {
    const target = products.find((p) => p._id === productId || p.barcode === productId);
    if (!target) return;
    const newStock = Math.max(0, Number(target.stock) + delta);
    const identifier = target._id || target.barcode;

    // Immediately persist in local storage & dispatch sync event
    updatePersistentStock(identifier, newStock);

    setProducts((prev) =>
      prev.map((p) => (p._id === target._id || p.barcode === target.barcode ? { ...p, stock: newStock } : p))
    );

    try {
      await API.patch(`/products/${identifier}/stock`, { stock: newStock });
    } catch (err) {
      console.warn("Stock update sync queued:", err.message);
    }
  };

  // Open restock modal
  const openRestockModal = (product) => {
    setRestockProduct(product);
    setRestockUnits(25);
    setNewThreshold(product.lowStockThreshold || 5);
    setRestockNote("Direct warehouse restock");
  };

  // Submit Restock
  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!restockProduct) return;
    setIsSaving(true);
    const added = Number(restockUnits) || 0;
    const newStock = Math.max(0, (Number(restockProduct.stock) || 0) + added);
    const threshold = Math.max(1, Number(newThreshold) || 5);
    const identifier = restockProduct._id || restockProduct.barcode;

    // Immediately persist
    updatePersistentStock(identifier, newStock);

    setProducts((prev) =>
      prev.map((p) =>
        p._id === restockProduct._id || p.barcode === restockProduct.barcode
          ? { ...p, stock: newStock, lowStockThreshold: threshold }
          : p
      )
    );

    try {
      await Promise.allSettled([
        API.patch(`/products/${identifier}/stock`, { stock: newStock }),
        API.put(`/products/${identifier}`, { stock: newStock, lowStockThreshold: threshold }),
      ]);
      setToastMessage(`✓ Successfully added +${added} units to "${restockProduct.name}"!`);
      setTimeout(() => setToastMessage(""), 4000);
    } catch (err) {
      console.warn("Restock API sync:", err.message);
    } finally {
      setIsSaving(false);
      setRestockProduct(null);
    }
  };

  // Compute movement history for a selected product
  const productMovements = useMemo(() => {
    if (!historyProduct) return [];
    const logs = [];

    // Check sales in completed orders
    orders.forEach((order) => {
      const match = (order.items || []).find(
        (it) => it.product === historyProduct._id || it.barcode === historyProduct.barcode
      );
      if (match) {
        logs.push({
          type: "SALE",
          amount: -match.quantity,
          reference: `#${order.orderNumber || order._id?.slice(-6) || "ORDER"}`,
          customer: order.customer?.name || "Shopper",
          date: new Date(order.createdAt || Date.now()).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
      }
    });

    // Add baseline entry
    logs.push({
      type: "STOCK_UPDATE",
      amount: historyProduct.stock,
      reference: "Current Stock",
      customer: "Admin Verified",
      date: new Date(historyProduct.updatedAt || Date.now()).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
    });

    return logs;
  }, [historyProduct, orders]);

  return (
    <div className="grocer-page-container">
      {/* ========================================================================= */}
      {/* 1. HERO TOP BANNER - EXACT MATCH TO REGISTER NEW PRODUCT                  */}
      {/* ========================================================================= */}
      <ErpPageBanner
        title="Inventory Management"
        subtitle="Real-time supermarket stock ledger, minimum threshold triggers & automated replenishment"
        badges={["Real-time Stock Ledger", "Automated Thresholds", "Direct Restock Sync"]}
        icon={<Boxes size={22} color="#ffffff" strokeWidth={2.4} />}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            background: "#DCFCE7",
            border: "1px solid #86EFAC",
            color: "#166534",
            padding: "12px 18px",
            borderRadius: "14px",
            fontSize: "13.5px",
            fontWeight: "700",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 4px 12px rgba(22, 101, 52, 0.08)",
          }}
        >
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. FOUR HORIZONTAL INVENTORY KPI CARDS                                     */}
      {/* Exact Match to Image 1 Sleek Proportions                                  */}
      {/* ========================================================================= */}
      <section className="pm-kpi-grid">
        {/* Card 1: Total Stock Units */}
        <div className="pm-kpi-card blue-theme">
          <div className="pm-kpi-icon-pill blue">
            <Boxes size={21} color="#2563EB" strokeWidth={2.4} />
          </div>
          <div className="pm-kpi-content">
            <h3 className="pm-kpi-number">{totalStockUnits.toLocaleString()}</h3>
            <span className="pm-kpi-label">Total Stock Units</span>
            <div className="pm-kpi-trend green">
              <span className="trend-arrow">↑</span>
              <span>100% Tracked</span>
            </div>
          </div>
        </div>

        {/* Card 2: Healthy Stock Products */}
        <div className="pm-kpi-card green-theme">
          <div className="pm-kpi-icon-pill green">
            <PackageCheck size={21} color="#059669" strokeWidth={2.4} />
          </div>
          <div className="pm-kpi-content">
            <h3 className="pm-kpi-number">{healthyStockCount}</h3>
            <span className="pm-kpi-label">Optimal Stock Products</span>
            <div className="pm-kpi-trend green">
              <span className="trend-arrow">✓</span>
              <span>Safe Buffer</span>
            </div>
          </div>
        </div>

        {/* Card 3: Low Stock Warnings */}
        <div className="pm-kpi-card yellow-theme">
          <div className="pm-kpi-icon-pill yellow">
            <AlertTriangle size={21} color="#D97706" strokeWidth={2.4} />
          </div>
          <div className="pm-kpi-content">
            <h3 className="pm-kpi-number">{lowStockCount}</h3>
            <span className="pm-kpi-label">Low Stock Warnings</span>
            <div className="pm-kpi-trend warn" style={{ color: lowStockCount > 0 ? "#DC2626" : "#059669" }}>
              <span className="trend-arrow">{lowStockCount > 0 ? "▲" : "✓"}</span>
              <span>{lowStockCount > 0 ? "Reorder Needed" : "All Clear"}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Out of Stock Items */}
        <div className="pm-kpi-card purple-theme">
          <div className="pm-kpi-icon-pill purple">
            <AlertCircle size={21} color="#DC2626" strokeWidth={2.4} />
          </div>
          <div className="pm-kpi-content">
            <h3 className="pm-kpi-number">{outOfStockCount}</h3>
            <span className="pm-kpi-label">Out of Stock Items</span>
            <div className="pm-kpi-trend" style={{ color: outOfStockCount > 0 ? "#DC2626" : "#059669" }}>
              <span className="trend-arrow">{outOfStockCount > 0 ? "✖" : "✓"}</span>
              <span>{outOfStockCount > 0 ? "Critical Restock" : "0 Out"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SEARCH, FILTERS & SORT TOOLBAR                                         */}
      {/* ========================================================================= */}
      <section className="pm-toolbar-row">
        <div className="pm-toolbar-search">
          <Search size={18} className="pm-search-ico" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name, brand, SKU or barcode..."
          />
        </div>

        <div className="pm-toolbar-filters">
          {/* Category Filter */}
          <div className="pm-select-pill-wrap">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pm-select-pill"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Level Filter */}
          <div className="pm-select-pill-wrap">
            <select
              value={selectedStockFilter}
              onChange={(e) => setSelectedStockFilter(e.target.value)}
              className="pm-select-pill"
            >
              {STOCK_FILTERS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Selector */}
          <div className="pm-select-pill-wrap">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="pm-select-pill"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. INVENTORY CATALOG TABLE CARD                                           */}
      {/* ========================================================================= */}
      <div className="pm-catalog-card">
        <div className="pm-catalog-header">
          <div className="pm-catalog-title-group">
            <div className="pm-catalog-icon-box">
              <Boxes size={18} color="#FFFFFF" />
            </div>
            <h3 className="pm-catalog-heading">
              Inventory Ledger ({filteredProducts.length} Products Monitored)
            </h3>
          </div>

          {/* Actions & Valuation badge */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              type="button"
              className="action-pill-btn refresh"
              onClick={fetchInventory}
              disabled={loading}
              style={{ padding: "6px 14px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "5px" }}
            >
              <RefreshCw size={13} className={loading ? "spin" : ""} />
              <span>{loading ? "Syncing..." : "Sync Stock"}</span>
            </button>
            <Link
              to="/admin/add-product"
              className="action-pill-btn primary"
              style={{ padding: "6px 14px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "5px", textDecoration: "none" }}
            >
              <Plus size={13} />
              <span>Add Product</span>
            </Link>
            <div className="inv-valuation-badge">
              Total Valuation: <strong>₹{totalInventoryValuation.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
            </div>
          </div>
        </div>

        <div className="pm-table-wrapper">
          <table className="pm-products-table">
            <thead>
              <tr>
                <th>PRODUCT DETAILS</th>
                <th>CATEGORY</th>
                <th>BARCODE</th>
                <th>AVAILABLE UNITS</th>
                <th>THRESHOLD HEALTH</th>
                <th>UNIT PRICE & VALUE</th>
                <th>STOCK STATUS</th>
                <th style={{ textAlign: "center" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#64748B" }}>
                    No products matched your search or stock filter.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const threshold = Number(p.lowStockThreshold || 5);
                  const isLow = p.stock <= threshold && p.stock > 0;
                  const isOut = Number(p.stock) === 0;
                  const maxRef = Math.max(threshold * 3, 20);
                  const pct = Math.min(100, Math.round((Number(p.stock) / maxRef) * 100));
                  const itemValue = Number(p.stock || 0) * Number(p.price || 0);

                  return (
                    <tr key={p._id || p.barcode}>
                      {/* Product Details */}
                      <td>
                        <div className="pm-cell-details">
                          <div className="pm-thumb-box">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} className="pm-product-img" />
                            ) : (
                              <span className="pm-thumb-fallback">📦</span>
                            )}
                          </div>
                          <div className="pm-details-text">
                            <span className="pm-name-main">{p.name}</span>
                            <span className="pm-name-sub">{p.brand || "Smart Supermarket"}</span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td>
                        <span className="pm-category-text">{p.category}</span>
                      </td>

                      {/* Barcode */}
                      <td>
                        <div className="pm-barcode-badge">
                          <BarcodeSVG barcode={p.barcode || "N/A"} width={1} height={18} />
                          <span className="pm-barcode-code">{p.barcode || "N/A"}</span>
                        </div>
                      </td>

                      {/* Available Units (Stepper) */}
                      <td>
                        <div className="pm-stock-stepper">
                          <button
                            type="button"
                            onClick={() => handleStockStep(p._id, -1)}
                            disabled={p.stock <= 0}
                            className="pm-step-btn"
                            title="Decrease 1 unit"
                          >
                            -
                          </button>
                          <span className="pm-step-count">{p.stock}</span>
                          <button
                            type="button"
                            onClick={() => handleStockStep(p._id, 1)}
                            className="pm-step-btn"
                            title="Increase 1 unit"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Threshold Health & Progress */}
                      <td>
                        <div className="inv-progress-wrapper">
                          <div className="inv-progress-track">
                            <div
                              className={`inv-progress-fill ${isOut ? "out" : isLow ? "low" : "healthy"}`}
                              style={{ width: `${isOut ? 100 : Math.max(8, pct)}%` }}
                            />
                          </div>
                          <div className="inv-threshold-text">
                            <span>Min: {threshold} units</span>
                            <span>{isOut ? "Empty" : isLow ? "Low Buffer" : "Optimal"}</span>
                          </div>
                        </div>
                      </td>

                      {/* Unit Price & Stock Value */}
                      <td>
                        <div className="inv-val-col">
                          <span className="pm-price-bold">₹{Number(p.price || 0).toFixed(2)}</span>
                          <span className="inv-val-total">
                            Val: ₹{itemValue.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                          </span>
                        </div>
                      </td>

                      {/* Status Badges */}
                      <td>
                        {isOut ? (
                          <span className="pm-status-pill low" style={{ background: "#FEE2E2", color: "#DC2626" }}>
                            <span>✖ Out of Stock</span>
                          </span>
                        ) : isLow ? (
                          <span className="pm-status-pill low" style={{ background: "#FEF3C7", color: "#D97706" }}>
                            <span className="pm-status-warn">▲</span>
                            <span>Stock Low</span>
                          </span>
                        ) : (
                          <span className="pm-status-pill in-stock">
                            <span>✓ In Stock</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}>
                          <button
                            type="button"
                            className="inv-restock-btn"
                            onClick={() => openRestockModal(p)}
                            title="Restock units"
                          >
                            <PlusCircle size={14} />
                            <span>Restock</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setHistoryProduct(p)}
                            title="View stock movement history"
                            style={{
                              background: "none",
                              border: "1px solid #E2E8F0",
                              borderRadius: "8px",
                              padding: "5px 8px",
                              color: "#64748B",
                              cursor: "pointer",
                            }}
                          >
                            <History size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. RESTOCK MODAL (WITH QUICK PRESETS & THRESHOLD TUNING)                  */}
      {/* ========================================================================= */}
      {restockProduct && (
        <div className="pm-modal-overlay" onClick={() => setRestockProduct(null)}>
          <div className="pm-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "460px" }}>
            <div className="pm-modal-header">
              <h3 className="pm-modal-title">Restock Inventory: {restockProduct.name}</h3>
              <button
                type="button"
                className="pm-modal-close"
                onClick={() => setRestockProduct(null)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="pm-modal-form">
              {/* Product summary */}
              <div className="inv-summary-box">
                <div>
                  <strong style={{ fontSize: "14px", color: "#0F172A", display: "block" }}>
                    {restockProduct.name}
                  </strong>
                  <span style={{ fontSize: "12px", color: "#64748B" }}>
                    Barcode: {restockProduct.barcode || "N/A"}
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "11px", color: "#64748B", display: "block" }}>Current Stock</span>
                  <strong style={{ fontSize: "16px", color: restockProduct.stock === 0 ? "#DC2626" : "#2563EB" }}>
                    {restockProduct.stock} units
                  </strong>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <label className="pm-form-label">Select Restock Pack</label>
              <div className="inv-presets-grid">
                {[10, 25, 50, 100].map((pack) => (
                  <button
                    key={pack}
                    type="button"
                    className={`inv-preset-pill ${Number(restockUnits) === pack ? "active" : ""}`}
                    onClick={() => setRestockUnits(pack)}
                  >
                    +{pack} Units
                  </button>
                ))}
              </div>

              {/* Custom Units Input */}
              <div style={{ marginBottom: "16px" }}>
                <label className="pm-form-label">Units to Add to Shelves</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockUnits}
                  onChange={(e) => setRestockUnits(e.target.value)}
                  className="pm-form-input"
                  style={{ fontSize: "15px", fontWeight: "700" }}
                />
              </div>

              {/* Low Stock Threshold Setting */}
              <div style={{ marginBottom: "16px" }}>
                <label className="pm-form-label">Low-Stock Alert Trigger (Minimum Buffer)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(e.target.value)}
                  className="pm-form-input"
                  placeholder="Example: 5 units"
                />
                <small style={{ color: "#64748B", fontSize: "11px" }}>
                  Alert triggers when stock drops to or below this quantity.
                </small>
              </div>

              {/* New Stock Preview */}
              <div
                style={{
                  background: "#EFF6FF",
                  border: "1px solid #BFDBFE",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  marginBottom: "20px",
                  fontSize: "13px",
                  color: "#1E3A8A",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>Resulting Available Stock:</span>
                <strong>
                  {Number(restockProduct.stock || 0) + (Number(restockUnits) || 0)} units
                </strong>
              </div>

              <div className="pm-modal-actions">
                <button
                  type="button"
                  className="pm-btn-cancel"
                  onClick={() => setRestockProduct(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="pm-btn-save"
                  disabled={isSaving}
                  style={{ minWidth: "140px" }}
                >
                  {isSaving ? "Saving..." : "✓ Confirm Restock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. STOCK MOVEMENT HISTORY MODAL                                           */}
      {/* ========================================================================= */}
      {historyProduct && (
        <div className="pm-modal-overlay" onClick={() => setHistoryProduct(null)}>
          <div className="pm-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px" }}>
            <div className="pm-modal-header">
              <h3 className="pm-modal-title">Stock Ledger History: {historyProduct.name}</h3>
              <button
                type="button"
                className="pm-modal-close"
                onClick={() => setHistoryProduct(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #EEF2F6" }}>
                <span>Available On Shelves: <strong style={{ color: "#0F172A" }}>{historyProduct.stock} units</strong></span>
                <span>Threshold: <strong style={{ color: "#D97706" }}>{historyProduct.lowStockThreshold || 5} units</strong></span>
              </div>

              <h4 style={{ margin: "0 0 10px", fontSize: "13px", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Recent Inventory Transactions
              </h4>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "280px", overflowY: "auto" }}>
                {productMovements.map((log, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      background: "#F8FAFC",
                      borderRadius: "10px",
                      border: "1px solid #EEF2F6",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#0F172A", display: "block" }}>
                        {log.type === "SALE" ? `Self-Checkout Sale (${log.reference})` : log.reference}
                      </span>
                      <span style={{ fontSize: "11px", color: "#64748B" }}>
                        {log.customer} &bull; {log.date}
                      </span>
                    </div>
                    <strong
                      style={{
                        fontSize: "14px",
                        color: log.amount < 0 ? "#DC2626" : "#059669",
                      }}
                    >
                      {log.amount > 0 ? `+${log.amount}` : log.amount} units
                    </strong>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="pm-btn-cancel"
                  onClick={() => setHistoryProduct(null)}
                >
                  Close History
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
