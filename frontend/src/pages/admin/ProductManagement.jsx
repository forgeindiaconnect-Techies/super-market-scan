import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Barcode,
  Printer,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  X,
  AlertTriangle,
  Boxes,
} from "lucide-react";
import API from "../../services/api";
import BarcodeSVG from "../../components/BarcodeSVG";
import "./ProductManagement.css";

const CATEGORIES = [
  "All Categories",
  "Groceries",
  "Fruits & Vegetables",
  "Dairy",
  "Beverages",
  "Snacks",
  "Personal Care",
  "Household",
  "Other",
];

export default function ProductManagement() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [stockFilter, setStockFilter] = useState("all");

  // Modal states
  const [editingProduct, setEditingProduct] = useState(null);
  const [barcodePreviewProduct, setBarcodePreviewProduct] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({});

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get("/products");
      if (res.data?.success) {
        setProducts(res.data.products || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filtered and searched list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode?.toLowerCase().includes(search.toLowerCase()) ||
        p.brand?.toLowerCase().includes(search.toLowerCase());

      const matchesCat =
        categoryFilter === "All Categories" || p.category === categoryFilter;

      let matchesStock = true;
      const threshold = Number(p.lowStockThreshold || 5);
      if (stockFilter === "low") {
        matchesStock = p.stock > 0 && p.stock <= threshold;
      } else if (stockFilter === "out") {
        matchesStock = p.stock === 0;
      } else if (stockFilter === "in") {
        matchesStock = p.stock > threshold;
      }

      return matchesSearch && matchesCat && matchesStock;
    });
  }, [products, search, categoryFilter, stockFilter]);

  // Adjust stock quantity (+1 or -1)
  const handleQuickStock = async (product, change) => {
    const newStock = Math.max(0, Number(product.stock) + change);
    try {
      await API.patch(`/products/${product._id}/stock`, { stock: newStock });
      setProducts((prev) =>
        prev.map((item) =>
          item._id === product._id ? { ...item, stock: newStock } : item
        )
      );
    } catch (err) {
      alert("Failed to adjust stock: " + (err.response?.data?.message || err.message));
    }
  };

  // Open Edit Modal
  const openEditModal = (product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      category: product.category,
      brand: product.brand || "",
      barcode: product.barcode || "",
      price: product.price,
      costPrice: product.costPrice || 0,
      stock: product.stock,
      lowStockThreshold: product.lowStockThreshold || 5,
      imageUrl: product.imageUrl || "",
      description: product.description || "",
    });
  };

  // Save Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const res = await API.put(`/products/${editingProduct._id}`, editForm);
      if (res.data?.success) {
        setProducts((prev) =>
          prev.map((item) =>
            item._id === editingProduct._id ? res.data.product : item
          )
        );
        setEditingProduct(null);
      }
    } catch (err) {
      alert("Save failed: " + (err.response?.data?.message || err.message));
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete product
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from active inventory?`)) {
      return;
    }

    try {
      await API.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      alert("Delete failed: " + (err.response?.data?.message || err.message));
    }
  };

  // Print barcode label
  const handlePrintBarcode = (product) => {
    const printWindow = window.open("", "_blank", "width=500,height=450");
    if (!printWindow) {
      alert("Please allow pop-ups to print barcode labels.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Barcode Label - ${product.name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 20px;
              color: #0f172a;
            }
            .label-card {
              border: 1px dashed #cbd5e1;
              border-radius: 10px;
              padding: 16px;
              display: inline-block;
              width: 280px;
            }
            .store-name {
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              color: #2563eb;
              font-weight: 800;
              margin-bottom: 4px;
            }
            .product-name {
              font-size: 15px;
              font-weight: bold;
              margin: 4px 0 8px;
            }
            .price-tag {
              font-size: 18px;
              font-weight: 800;
              color: #0f172a;
              margin-top: 8px;
            }
            @media print {
              body { padding: 0; }
              .label-card { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="label-card">
            <div class="store-name">SMART SUPERMARKET</div>
            <div class="product-name">${product.name}</div>
            <div id="barcode-slot"></div>
            <div class="price-tag">₹${Number(product.price).toFixed(2)}</div>
            <p style="font-size:10px;color:#64748b;margin-top:4px;">Scan with mobile app</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="product-management-page">
      {/* Header Row */}
      <div className="pm-topbar">
        <div>
          <h1 className="page-heading">Product Management</h1>
          <p className="page-subheading">
            Manage your full supermarket catalog, prices, barcodes and stock levels.
          </p>
        </div>

        <div className="pm-actions">
          <button
            type="button"
            className="action-pill-btn refresh"
            onClick={fetchProducts}
            disabled={loading}
          >
            Refresh
          </button>

          <button
            type="button"
            className="action-pill-btn primary"
            onClick={() => navigate("/admin/add-product")}
          >
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="pm-filter-panel">
        <div className="pm-search-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by product name, brand or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="pm-filter-selects">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="pm-select"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="pm-select"
          >
            <option value="all">All Stock Statuses</option>
            <option value="in">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="dashboard-content-card">
        <div className="card-top-header">
          <h3>
            Products Catalog ({filteredProducts.length}{" "}
            {filteredProducts.length === 1 ? "item" : "items"})
          </h3>
        </div>

        <div className="overview-table-container">
          {loading ? (
            <div className="empty-state-box">
              <p>Loading catalog items...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state-box">
              <p>No products found matching your filter criteria.</p>
              <button
                type="button"
                className="action-pill-btn primary"
                onClick={() => navigate("/admin/add-product")}
              >
                + Add New Product
              </button>
            </div>
          ) : (
            <table className="grocer-table">
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>Category</th>
                  <th>Barcode</th>
                  <th>Selling Price</th>
                  <th>Purchase Price</th>
                  <th>Available Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const threshold = Number(p.lowStockThreshold || 5);
                  const isLow = p.stock > 0 && p.stock <= threshold;
                  const isOut = p.stock === 0;

                  return (
                    <tr key={p._id}>
                      <td>
                        <div className="product-identity-cell">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="product-thumb-img"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="product-thumb-placeholder">🛍️</div>
                          )}
                          <div className="product-text-details">
                            <span className="product-title-text">{p.name}</span>
                            <span className="product-category-text">
                              {p.brand || "Standard Brand"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>{p.category}</td>
                      <td>
                        <button
                          type="button"
                          className="barcode-view-btn"
                          title="View Barcode"
                          onClick={() => setBarcodePreviewProduct(p)}
                        >
                          <Barcode size={14} />
                          <span>{p.barcode || "N/A"}</span>
                        </button>
                      </td>
                      <td className="price-cell">
                        ₹{Number(p.price).toFixed(2)}
                      </td>
                      <td style={{ color: "#64748b" }}>
                        ₹{Number(p.costPrice || 0).toFixed(2)}
                      </td>
                      <td>
                        <div className="stock-adjuster-cell">
                          <button
                            type="button"
                            className="stock-btn minus"
                            disabled={p.stock <= 0}
                            onClick={() => handleQuickStock(p, -1)}
                            title="Decrement stock"
                          >
                            -
                          </button>
                          <span className="stock-count-display">
                            {p.stock}
                          </span>
                          <button
                            type="button"
                            className="stock-btn plus"
                            onClick={() => handleQuickStock(p, 1)}
                            title="Increment stock"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${
                            isOut
                              ? "reorder"
                              : isLow
                              ? "stock-low"
                              : "in-stock"
                          }`}
                        >
                          {isOut
                            ? "Out of Stock"
                            : isLow
                            ? "Stock Low"
                            : "In Stock"}
                        </span>
                      </td>
                      <td>
                        <div className="pm-row-actions">
                          <button
                            type="button"
                            className="icon-action-btn print"
                            title="Print Barcode Label"
                            onClick={() => handlePrintBarcode(p)}
                          >
                            <Printer size={15} />
                          </button>

                          <button
                            type="button"
                            className="icon-action-btn edit"
                            title="Edit Product"
                            onClick={() => openEditModal(p)}
                          >
                            <Edit2 size={15} />
                          </button>

                          <button
                            type="button"
                            className="icon-action-btn delete"
                            title="Delete Product"
                            onClick={() => handleDelete(p._id, p.name)}
                          >
                            <Trash2 size={15} />
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

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Edit Product: {editingProduct.name}</h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => setEditingProduct(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="modal-form">
              <div className="modal-grid">
                <label>
                  Product Name *
                  <input
                    required
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                  />
                </label>

                <label>
                  Category *
                  <select
                    value={editForm.category}
                    onChange={(e) =>
                      setEditForm({ ...editForm, category: e.target.value })
                    }
                  >
                    {CATEGORIES.filter((c) => c !== "All Categories").map(
                      (cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  Brand Name
                  <input
                    value={editForm.brand}
                    onChange={(e) =>
                      setEditForm({ ...editForm, brand: e.target.value })
                    }
                  />
                </label>

                <label>
                  Barcode (Optional)
                  <input
                    value={editForm.barcode}
                    onChange={(e) =>
                      setEditForm({ ...editForm, barcode: e.target.value })
                    }
                  />
                </label>

                <label>
                  Selling Price (₹) *
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={editForm.price}
                    onChange={(e) =>
                      setEditForm({ ...editForm, price: e.target.value })
                    }
                  />
                </label>

                <label>
                  Purchase / Cost Price (₹)
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.costPrice}
                    onChange={(e) =>
                      setEditForm({ ...editForm, costPrice: e.target.value })
                    }
                  />
                </label>

                <label>
                  Available Stock *
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={editForm.stock}
                    onChange={(e) =>
                      setEditForm({ ...editForm, stock: e.target.value })
                    }
                  />
                </label>

                <label>
                  Minimum Stock Alert Threshold
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={editForm.lowStockThreshold}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        lowStockThreshold: e.target.value,
                      })
                    }
                  />
                </label>
              </div>

              <label style={{ marginTop: 12 }}>
                Image URL
                <input
                  type="url"
                  value={editForm.imageUrl}
                  onChange={(e) =>
                    setEditForm({ ...editForm, imageUrl: e.target.value })
                  }
                />
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setEditingProduct(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="action-pill-btn primary"
                  disabled={savingEdit}
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Preview Modal */}
      {barcodePreviewProduct && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 400, textAlign: "center" }}>
            <div className="modal-header">
              <h3>Product Barcode</h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => setBarcodePreviewProduct(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "20px 10px" }}>
              <h4>{barcodePreviewProduct.name}</h4>
              <p style={{ color: "#64748b", fontSize: 13, margin: "6px 0 16px" }}>
                Price: ₹{Number(barcodePreviewProduct.price).toFixed(2)}
              </p>

              <div
                style={{
                  background: "#ffffff",
                  padding: 16,
                  borderRadius: 10,
                  border: "1px dashed #cbd5e1",
                  display: "inline-block",
                }}
              >
                <BarcodeSVG
                  value={barcodePreviewProduct.barcode || barcodePreviewProduct._id}
                  width={2}
                  height={65}
                />
              </div>

              <div style={{ marginTop: 24, display: "flex", gap: 10, justifyContent: "center" }}>
                <button
                  type="button"
                  className="action-pill-btn primary"
                  onClick={() => handlePrintBarcode(barcodePreviewProduct)}
                >
                  <Printer size={15} /> Print Label
                </button>
                <button
                  type="button"
                  className="action-pill-btn refresh"
                  onClick={() => setBarcodePreviewProduct(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

