import React, { useEffect, useState, useMemo } from "react";
import {
  Barcode,
  Printer,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Tag,
  Download,
} from "lucide-react";
import API from "../../services/api";
import BarcodeSVG from "../../components/BarcodeSVG";

export default function BarcodeManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await API.get("/products");
      if (res.data?.success) {
        setProducts(res.data.products || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = search.toLowerCase();
      return (
        p.name?.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
    });
  }, [products, search]);

  // Batch Print All Barcode Labels (Sheet Layout)
  const handlePrintSheet = (items) => {
    const printWindow = window.open("", "_blank", "width=850,height=900");
    if (!printWindow) {
      alert("Please allow pop-ups to print barcode sheets.");
      return;
    }

    const labelsHtml = items
      .map(
        (p) => `
        <div class="sticker">
          <div class="store">SMART SUPERMARKET</div>
          <div class="name">${p.name}</div>
          <div class="barcode">${p.barcode || "N/A"}</div>
          <div class="price">₹${Number(p.price).toFixed(2)}</div>
        </div>
      `
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Supermarket Barcode Labels Sheet</title>
          <style>
            @page { size: A4; margin: 10mm; }
            body { font-family: Arial, sans-serif; margin: 0; padding: 10px; }
            .sheet-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 12px;
            }
            .sticker {
              border: 1px dashed #94a3b8;
              border-radius: 8px;
              padding: 12px;
              text-align: center;
              page-break-inside: avoid;
            }
            .store { font-size: 9px; font-weight: 800; color: #2563eb; letter-spacing: 1px; }
            .name { font-size: 13px; font-weight: bold; margin: 4px 0; }
            .barcode { font-family: monospace; font-size: 14px; font-weight: bold; letter-spacing: 2px; margin: 6px 0; }
            .price { font-size: 16px; font-weight: 800; color: #0f172a; }
          </style>
        </head>
        <body>
          <h2 style="text-align:center;margin-bottom:20px;">Supermarket Physical Barcode Labels</h2>
          <div class="sheet-grid">
            ${labelsHtml}
          </div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="grocer-dashboard-page">
      {/* Header */}
      <div className="dashboard-topbar-row">
        <div>
          <h1 className="page-heading">Barcode Management & Printing</h1>
          <p className="page-subheading">
            Print physical product barcode labels for scanning with the mobile app camera.
          </p>
        </div>

        <div className="dashboard-action-group">
          <button
            type="button"
            className="action-pill-btn refresh"
            onClick={fetchProducts}
            disabled={loading}
          >
            <RefreshCw size={15} /> Refresh
          </button>

          <button
            type="button"
            className="action-pill-btn primary"
            onClick={() => handlePrintSheet(filteredProducts)}
            disabled={filteredProducts.length === 0}
          >
            <Printer size={16} /> Batch Print Sheet ({filteredProducts.length})
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="pm-filter-panel">
        <div className="pm-search-wrap" style={{ maxWidth: "100%" }}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search barcode number, product or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Grid of Barcode Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 20,
        }}
      >
        {filteredProducts.map((product) => (
          <div
            key={product._id}
            style={{
              background: "#ffffff",
              border: "1px solid #e8edf5",
              borderRadius: 14,
              padding: 20,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: "#2563eb",
                letterSpacing: 1,
              }}
            >
              SMART SUPERMARKET
            </span>
            <strong style={{ fontSize: 15, color: "#0f172a" }}>
              {product.name}
            </strong>
            <span style={{ fontSize: 12, color: "#64748b" }}>
              {product.category} · Stock: {product.stock}
            </span>

            <div
              style={{
                background: "#f8fafc",
                border: "1px dashed #cbd5e1",
                padding: 12,
                borderRadius: 8,
                margin: "8px 0",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <BarcodeSVG value={product.barcode || product._id} width={1.8} height={50} />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                marginTop: 6,
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
                ₹{Number(product.price).toFixed(2)}
              </span>

              <button
                type="button"
                className="action-pill-btn refresh"
                style={{ padding: "6px 14px", fontSize: 12 }}
                onClick={() => handlePrintSheet([product])}
              >
                <Printer size={13} /> Print Label
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

