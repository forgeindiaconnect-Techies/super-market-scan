import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  Download,
  Calendar,
  Search,
  Plus,
  RefreshCw,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  ChevronRight,
  Eye,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import API from "../../services/api";
import "./AdminDashboard.css";

const CHART_COLORS = [
  "#2563eb", // Blue
  "#eab308", // Yellow
  "#10b981", // Green
  "#f97316", // Orange
  "#ec4899", // Pink
  "#8b5cf6", // Purple
  "#06b6d4", // Cyan
  "#64748b", // Slate
];

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cartActivities, setCartActivities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [prodRes, statsRes, ordRes, cartRes] = await Promise.allSettled([
        API.get("/products"),
        API.get("/orders/stats"),
        API.get("/orders"),
        API.get("/orders/cart-activity"),
      ]);

      if (prodRes.status === "fulfilled" && prodRes.value.data.success) {
        setProducts(prodRes.value.data.products || []);
      }

      if (statsRes.status === "fulfilled" && statsRes.value.data.success) {
        setStats(statsRes.value.data.stats);
      }

      if (ordRes.status === "fulfilled" && ordRes.value.data.success) {
        setOrders(ordRes.value.data.orders || []);
      }

      if (cartRes.status === "fulfilled" && cartRes.value.data.success) {
        setCartActivities(cartRes.value.data.activities || []);
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
      setError("Failed to connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Poll live cart activities every 8 seconds
    const interval = setInterval(async () => {
      try {
        const res = await API.get("/orders/cart-activity");
        if (res.data?.success) {
          setCartActivities(res.data.activities || []);
        }
      } catch (_) {}
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Compute metrics dynamically if stats endpoint isn't fully populated yet
  const computedStats = useMemo(() => {
    const totalCount = products.length;
    let totalInvValue = 0;
    let lowStockCount = 0;
    let belowThresholdCount = 0;
    let reorderNeededCount = 0;
    const catCounts = {};

    products.forEach((p) => {
      const stock = Number(p.stock || 0);
      const price = Number(p.price || 0);
      const threshold = Number(p.lowStockThreshold || 5);

      totalInvValue += stock * price;

      if (stock === 0) {
        reorderNeededCount++;
      } else if (stock <= threshold) {
        lowStockCount++;
      } else if (stock <= threshold * 1.5) {
        belowThresholdCount++;
      }

      const cat = p.category || "General";
      catCounts[cat] = (catCounts[cat] || 0) + 1;
    });

    const categoryData = Object.keys(catCounts).map((cat) => ({
      name: cat,
      value: catCounts[cat],
    }));

    const totalSales = orders.reduce(
      (sum, ord) => sum + (ord.totalAmount || 0),
      0
    );

    return {
      totalCount: stats?.totalProducts ?? totalCount,
      totalInvValue: stats?.totalInventoryValue ?? totalInvValue,
      lowStockCount: stats?.lowStockCount ?? lowStockCount,
      belowThresholdCount: belowThresholdCount || lowStockCount,
      reorderNeededCount: stats?.outOfStockCount ?? reorderNeededCount,
      totalSales: stats?.totalSales ?? totalSales,
      totalOrders: stats?.totalOrders ?? orders.length,
      categoryData:
        stats?.categoryDistribution?.length > 0
          ? stats.categoryDistribution
          : categoryData,
    };
  }, [products, orders, stats]);

  // Filtered inventory table items
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const query = tableSearch.toLowerCase();
      return (
        p.name?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query) ||
        p.barcode?.toLowerCase().includes(query)
      );
    });
  }, [products, tableSearch]);

  // Filtered orders items
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const query = orderSearch.toLowerCase();
      return (
        o.orderNumber?.toLowerCase().includes(query) ||
        o.customer?.name?.toLowerCase().includes(query) ||
        o.paymentMethod?.toLowerCase().includes(query)
      );
    });
  }, [orders, orderSearch]);

  const formatCurrency = (num) =>
    Number(num || 0).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });

  const getStockBadge = (product) => {
    const stock = Number(product.stock || 0);
    const threshold = Number(product.lowStockThreshold || 5);

    if (stock === 0) {
      return <span className="status-badge reorder">Out of Stock</span>;
    }
    if (stock <= threshold) {
      return <span className="status-badge stock-low">Stock Low</span>;
    }
    if (stock <= threshold * 1.5) {
      return <span className="status-badge below-threshold">Below Threshold</span>;
    }
    return <span className="status-badge in-stock">In Stock</span>;
  };

  return (
    <div className="grocer-dashboard-page">
      {/* Top Header Row with Filters & Export */}
      <div className="dashboard-topbar-row">
        <div>
          <h1 className="page-heading">Inventory Management</h1>
          <p className="page-subheading">
            Live overview of products, stock thresholds and customer transactions.
          </p>
        </div>

        <div className="dashboard-action-group">
          <div className="filter-select-pill">
            <Calendar size={15} />
            <span>This Month</span>
          </div>

          <button
            type="button"
            className="action-pill-btn refresh"
            onClick={fetchData}
            disabled={loading}
            title="Refresh Live Data"
          >
            <RefreshCw size={15} className={loading ? "spin" : ""} />
            <span>{loading ? "Updating..." : "Refresh"}</span>
          </button>

          <button
            type="button"
            className="action-pill-btn primary"
            onClick={() => navigate("/admin/add-product")}
          >
            <Plus size={16} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="dashboard-alert-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button type="button" onClick={fetchData}>
            Retry
          </button>
        </div>
      )}

      {/* 4 Stat Cards Matching GrocerEase Mockup */}
      <div className="grocer-stats-grid">
        {/* Card 1: Total Products */}
        <div className="grocer-stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Total Products in Inventory</span>
            <div className="stat-icon-wrapper blue">
              <Package size={20} />
            </div>
          </div>
          <div className="stat-main-value">
            <h2>{computedStats.totalCount} items</h2>
          </div>
          <div className="stat-trend-footer positive">
            <ArrowUpRight size={14} />
            <span>+2.08% vs last month</span>
          </div>
        </div>

        {/* Card 2: Products Below Threshold */}
        <div className="grocer-stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Products Below Threshold</span>
            <div className="stat-icon-wrapper green">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="stat-main-value">
            <h2>{computedStats.belowThresholdCount} items</h2>
          </div>
          <div className="stat-trend-footer negative">
            <ArrowDownRight size={14} />
            <span>Needs attention</span>
          </div>
        </div>

        {/* Card 3: Low Stock Products */}
        <div className="grocer-stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Low Stock Products</span>
            <div className="stat-icon-wrapper red">
              <ShieldAlert size={20} />
            </div>
          </div>
          <div className="stat-main-value">
            <h2>{computedStats.lowStockCount} items</h2>
          </div>
          <div className="stat-trend-footer alert">
            <span>Critical stock level</span>
          </div>
        </div>

        {/* Card 4: Reorders Needed / Total Sales */}
        <div className="grocer-stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Total Sales & Revenue</span>
            <div className="stat-icon-wrapper yellow">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="stat-main-value">
            <h2>{formatCurrency(computedStats.totalSales)}</h2>
          </div>
          <div className="stat-trend-footer positive">
            <span>{computedStats.totalOrders} verified orders</span>
          </div>
        </div>
      </div>

      {/* Middle Split Grid: Inventory Status Overview + Inventory Distribution */}
      <div className="grocer-middle-grid">
        {/* Left Column: Inventory Status Overview */}
        <section className="dashboard-content-card inventory-overview-card">
          <div className="card-top-header">
            <div className="card-title-group">
              <div className="title-icon-badge blue">
                <Package size={17} />
              </div>
              <h3>Inventory Status Overview</h3>
            </div>

            <div className="card-controls">
              <div className="inline-search-box">
                <Search size={15} />
                <input
                  type="text"
                  placeholder="Search here..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="see-all-btn"
                onClick={() => navigate("/admin/products")}
              >
                See All <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="overview-table-container">
            {filteredProducts.length === 0 ? (
              <div className="empty-state-box">
                <p>No products match your search query.</p>
                <button
                  type="button"
                  className="action-pill-btn primary"
                  onClick={() => navigate("/admin/add-product")}
                >
                  + Add First Product
                </button>
              </div>
            ) : (
              <table className="grocer-table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Current Stock</th>
                    <th>Threshold</th>
                    <th>Status</th>
                    <th>Price</th>
                    <th>Barcode</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.slice(0, 6).map((product) => (
                    <tr key={product._id}>
                      <td>
                        <div className="product-identity-cell">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="product-thumb-img"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="product-thumb-placeholder">
                              🛍️
                            </div>
                          )}
                          <div className="product-text-details">
                            <span className="product-title-text">
                              {product.name}
                            </span>
                            <span className="product-category-text">
                              {product.brand || product.category}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="stock-number-cell">
                        <strong>{product.stock}</strong> units
                      </td>
                      <td className="threshold-cell">
                        {product.lowStockThreshold || 5}
                      </td>
                      <td>{getStockBadge(product)}</td>
                      <td className="price-cell">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="barcode-cell">
                        <span className="barcode-tag">
                          {product.barcode || "Auto QR"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Right Column: Inventory Distribution Donut Chart */}
        <section className="dashboard-content-card distribution-card">
          <div className="card-top-header">
            <div className="card-title-group">
              <h3>Inventory Distribution</h3>
            </div>
            <div className="chart-filter-tag">Categories</div>
          </div>

          <div className="donut-chart-container">
            {computedStats.categoryData.length === 0 ? (
              <div className="empty-state-box">
                <p>Add products to view category distribution.</p>
              </div>
            ) : (
              <>
                <div style={{ width: "100%", height: 210 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={computedStats.categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {computedStats.categoryData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val, name) => [`${val} products`, name]}
                        contentStyle={{
                          background: "#ffffff",
                          borderRadius: 8,
                          border: "1px solid #e2e8f0",
                          fontSize: 12,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Custom Donut Legend Matching GrocerEase */}
                <div className="distribution-legend">
                  {computedStats.categoryData.slice(0, 5).map((item, idx) => {
                    const total = computedStats.totalCount || 1;
                    const pct = Math.round((item.value / total) * 100);
                    return (
                      <div key={item.name} className="legend-row">
                        <div className="legend-label-col">
                          <span
                            className="legend-color-dot"
                            style={{
                              backgroundColor:
                                CHART_COLORS[idx % CHART_COLORS.length],
                            }}
                          />
                          <span className="legend-name">{item.name}</span>
                        </div>
                        <span className="legend-percentage">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {/* Live Customer Cart Activity Panel */}
      <section className="dashboard-content-card live-cart-card">
        <div className="card-top-header">
          <div className="card-title-group">
            <div className="title-icon-badge purple">
              <span className="live-dot-pulse" />
            </div>
            <div>
              <h3>Live Customer Cart Activity</h3>
              <p className="card-subtitle-text">
                Real-time tracking of items added to mobile customer shopping carts.
              </p>
            </div>
          </div>

          <div className="live-shopper-counter">
            <span className="live-indicator-tag">● LIVE STREAM</span>
            <span className="shopper-count-tag">
              {cartActivities.length} Recent Action{cartActivities.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="live-cart-grid">
          {cartActivities.length === 0 ? (
            <div className="empty-state-box" style={{ padding: "20px" }}>
              <p>No active customer cart actions right now.</p>
              <span style={{ fontSize: 13, color: "#94a3b8" }}>
                As customers scan and add products to their carts in the mobile app, live actions will stream here.
              </span>
            </div>
          ) : (
            <div className="cart-activity-feed">
              {cartActivities.slice(0, 6).map((act) => (
                <div key={act._id} className="cart-activity-pill">
                  <div className="activity-icon-badge">🛍️</div>
                  <div className="activity-details">
                    <div className="activity-main-line">
                      <strong>{act.customerName || "Customer"}</strong>{" "}
                      {act.action === "added" ? (
                        <span className="action-tag add">added</span>
                      ) : act.action === "cleared" ? (
                        <span className="action-tag clear">cleared cart</span>
                      ) : (
                        <span className="action-tag update">updated</span>
                      )}{" "}
                      <span className="product-highlight">{act.productName}</span>
                    </div>
                    <div className="activity-sub-line">
                      Qty: {act.quantity} · Price: ₹{Number(act.price).toFixed(2)}
                    </div>
                  </div>
                  <div className="activity-time-tag">
                    {new Date(act.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Bottom Section: Recent Orders & Customer Transactions */}
      <section className="dashboard-content-card orders-overview-card">
        <div className="card-top-header">
          <div className="card-title-group">
            <div className="title-icon-badge yellow">
              <TrendingUp size={17} />
            </div>
            <div>
              <h3>Recent Customer Orders & Transactions</h3>
              <p className="card-subtitle-text">
                Live self-checkout transactions processed from the mobile app.
              </p>
            </div>
          </div>

          <div className="card-controls">
            <div className="inline-search-box">
              <Search size={15} />
              <input
                type="text"
                placeholder="Search orders..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="see-all-btn"
              onClick={() => navigate("/admin/orders")}
            >
              All Orders <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="overview-table-container">
          {filteredOrders.length === 0 ? (
            <div className="empty-state-box">
              <p>No customer orders recorded yet.</p>
              <span style={{ fontSize: 13, color: "#94a3b8" }}>
                Orders will appear here as soon as customers checkout using the
                mobile app.
              </span>
            </div>
          ) : (
            <table className="grocer-table">
              <thead>
                <tr>
                  <th>Order Number</th>
                  <th>Customer</th>
                  <th>Items Purchased</th>
                  <th>Total Amount</th>
                  <th>Payment Method</th>
                  <th>Status</th>
                  <th>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.slice(0, 5).map((order) => (
                  <tr key={order._id}>
                    <td>
                      <span className="order-number-tag">
                        {order.orderNumber}
                      </span>
                    </td>
                    <td>{order.customer?.name || "Guest Shopper"}</td>
                    <td>
                      <strong>{order.totalItems}</strong> items
                    </td>
                    <td className="price-cell">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td>
                      <span className="payment-method-pill">
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td>
                      <span className="status-badge in-stock">
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="date-cell">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
