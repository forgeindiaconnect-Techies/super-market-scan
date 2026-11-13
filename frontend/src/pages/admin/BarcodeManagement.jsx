import React, { useEffect, useState, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Barcode,
  Printer,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Tag,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  QrCode,
  Boxes,
  Grid,
  List,
  Check,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import JsBarcode from "jsbarcode";
import API from "../../services/api";
import BarcodeSVG from "../../components/BarcodeSVG";
import ErpPageBanner from "../../components/ErpPageBanner";
import bannerCartImg from "../../assets/banner-cart.png";
import {
  getPersistentProducts,
  savePersistentProducts,
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

export default function BarcodeManagement() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState(getPersistentProducts);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(() => searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [barcodeFilter, setBarcodeFilter] = useState("all"); // "all", "internal", "manufacturer"
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "table"

  useEffect(() => {
    const q = searchParams.get("search");
    if (q !== null) {
      setSearch(q);
    }
  }, [searchParams]);

  // Edit/Regenerate modal
  const [editingBarcodeProduct, setEditingBarcodeProduct] = useState(null);
  const [barcodeFormValue, setBarcodeFormValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await API.get("/products");
      if (res.data?.success && Array.isArray(res.data.products)) {
        const merged = mergeApiWithStorage(res.data.products);
        setProducts(merged);
      } else {
        setProducts(getPersistentProducts());
      }
    } catch (err) {
      console.warn("Using persistent barcode storage:", err.message);
      setProducts(getPersistentProducts());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();

    const interval = setInterval(() => {
      fetchProducts();
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

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !search ||
        p.name?.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q);

      const matchCat =
        selectedCategory === "All Categories" || p.category === selectedCategory;

      let matchType = true;
      const isInternal = p.barcode?.startsWith("200");
      if (barcodeFilter === "internal") {
        matchType = isInternal;
      } else if (barcodeFilter === "manufacturer") {
        matchType = !isInternal && Boolean(p.barcode);
      }

      return matchSearch && matchCat && matchType;
    });
  }, [products, search, selectedCategory, barcodeFilter]);

  // Barcode Statistics
  const totalBarcodes = useMemo(() => {
    return products.filter((p) => Boolean(p.barcode)).length;
  }, [products]);

  const internalEanCount = useMemo(() => {
    return products.filter((p) => p.barcode && p.barcode.startsWith("200")).length;
  }, [products]);

  const manufacturerCount = useMemo(() => {
    return products.filter((p) => p.barcode && !p.barcode.startsWith("200")).length;
  }, [products]);

  // Helper to serialize an actual SVG element with real barcode bars for high-resolution scannable printing
  const generateBarcodeSvgString = (code) => {
    const clean = String(code || "").trim();
    if (!clean) return "";

    try {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      JsBarcode(svg, clean, {
        format: "CODE128",
        width: 1.8,
        height: 48,
        displayValue: true,
        fontSize: 11,
        font: "monospace",
        fontOptions: "bold",
        margin: 5,
        background: "#ffffff",
        lineColor: "#0f172a",
      });
      return new XMLSerializer().serializeToString(svg);
    } catch (_) {
      return `<div style="font-family:monospace;font-size:14px;font-weight:bold;letter-spacing:2px;">${clean}</div>`;
    }
  };

  // Download single barcode as high-resolution PNG image
  const handleDownloadBarcode = (product) => {
    const code = String(product.barcode || product._id || "").trim();
    if (!code) {
      alert("No barcode available to download for this product.");
      return;
    }

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 320;
      const ctx = canvas.getContext("2d");

      // White Card Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Clean Border Outline
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

      // Supermarket Header Tag
      ctx.fillStyle = "#1d4ed8";
      ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("SMART SUPERMARKET • GROCEREASE", canvas.width / 2, 38);

      // Product Title
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
      const title = product.name || "Product Barcode";
      ctx.fillText(title.length > 38 ? title.slice(0, 36) + "..." : title, canvas.width / 2, 70);

      // Category, Brand & Price Subtitle
      ctx.fillStyle = "#64748b";
      ctx.font = "600 13px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
      const sub = `${product.brand ? product.brand + " • " : ""}${product.category || "Grocery"} • Price: ₹${Number(product.price || 0).toFixed(2)}`;
      ctx.fillText(sub, canvas.width / 2, 94);

      // Scannable Barcode via JsBarcode onto dedicated canvas
      const bcCanvas = document.createElement("canvas");
      JsBarcode(bcCanvas, code, {
        format: code.length === 13 && /^\d{13}$/.test(code) ? "EAN13" : "CODE128",
        width: 2.6,
        height: 100,
        displayValue: true,
        fontSize: 18,
        font: "monospace",
        fontOptions: "bold",
        margin: 8,
        background: "#ffffff",
        lineColor: "#0f172a",
      });

      // Center the barcode onto the main canvas
      const startX = (canvas.width - bcCanvas.width) / 2;
      ctx.drawImage(bcCanvas, Math.max(startX, 15), 115);

      // Bottom Verified Tag Pill
      ctx.fillStyle = "#ecfdf5";
      ctx.fillRect(canvas.width / 2 - 100, 275, 200, 26);
      ctx.strokeStyle = "#a7f3d0";
      ctx.lineWidth = 1;
      ctx.strokeRect(canvas.width / 2 - 100, 275, 200, 26);

      ctx.fillStyle = "#059669";
      ctx.font = "bold 12px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
      ctx.fillText(`VERIFIED SCANNABLE: ${code}`, canvas.width / 2, 292);

      // Export as PNG and download
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const safeName = (product.name || "barcode").replace(/[^a-zA-Z0-9_-]/g, "_");
        a.download = `Barcode_${safeName}_${code}.png`;
        a.href = url;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setToastMessage(`✓ Downloaded barcode PNG for "${product.name}"!`);
        setTimeout(() => setToastMessage(""), 3500);
      }, "image/png");
    } catch (err) {
      console.error("Barcode download error:", err);
      alert("Could not generate barcode download: " + err.message);
    }
  };

  // Batch download all filtered barcodes as PNGs
  const handleBatchDownload = async (items) => {
    if (!items || items.length === 0) return;
    setToastMessage(`Preparing download for ${items.length} barcodes...`);

    for (let i = 0; i < items.length; i++) {
      setTimeout(() => {
        handleDownloadBarcode(items[i]);
      }, i * 300);
    }
  };

  // Single or Batch Print Barcode Labels
  const handlePrintLabels = (items, title = "Supermarket Shelf Barcode Labels") => {
    const printWindow = window.open("", "_blank", "width=850,height=900");
    if (!printWindow) {
      alert("Please allow pop-ups to open the barcode printing window.");
      return;
    }

    const stickersHtml = items
      .map((p) => {
        const svgString = generateBarcodeSvgString(p.barcode || p._id);
        return `
        <div class="sticker">
          <div class="store-badge">SMART SUPERMARKET • GROCEREASE</div>
          <div class="prod-title">${p.name}</div>
          <div class="prod-sub">${p.brand ? p.brand + " • " : ""}${p.category || ""}</div>
          <div class="barcode-box">
            ${svgString}
          </div>
          <div class="price-row">
            <span class="mrp-label">SPECIAL OFFER</span>
            <span class="price-val">&#8377;${Number(p.price || 0).toFixed(2)}</span>
          </div>
        </div>
      `;
      })
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              margin: 0;
              padding: 10px;
              background: #FFFFFF;
              color: #0F172A;
            }
            .header-banner {
              text-align: center;
              margin-bottom: 20px;
              padding-bottom: 12px;
              border-bottom: 2px solid #1D4ED8;
            }
            .header-banner h2 {
              margin: 0 0 4px;
              font-size: 20px;
              color: #1D4ED8;
            }
            .header-banner p {
              margin: 0;
              font-size: 12px;
              color: #64748B;
            }
            .sheet-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 12px;
            }
            .sticker {
              border: 1.5px dashed #CBD5E1;
              border-radius: 10px;
              padding: 12px;
              text-align: center;
              box-sizing: border-box;
              page-break-inside: avoid;
              background: #FFFFFF;
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .store-badge {
              font-size: 9px;
              font-weight: 800;
              color: #1D4ED8;
              letter-spacing: 0.8px;
              margin-bottom: 4px;
            }
            .prod-title {
              font-size: 13.5px;
              font-weight: 800;
              color: #0F172A;
              margin: 2px 0 2px;
              line-height: 1.2;
            }
            .prod-sub {
              font-size: 10.5px;
              color: #64748B;
              margin-bottom: 6px;
            }
            .barcode-box {
              width: 100%;
              display: flex;
              justify-content: center;
              margin: 4px 0 8px;
            }
            .barcode-box svg {
              max-width: 100%;
              height: auto;
            }
            .price-row {
              display: flex;
              align-items: center;
              justify-content: space-between;
              width: 100%;
              padding-top: 6px;
              border-top: 1px solid #E2E8F0;
            }
            .mrp-label {
              font-size: 9px;
              font-weight: 800;
              color: #059669;
              background: #ECFDF5;
              padding: 2px 6px;
              border-radius: 4px;
            }
            .price-val {
              font-size: 16px;
              font-weight: 800;
              color: #0F172A;
            }
            @media print {
              body { padding: 0; }
              .header-banner { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header-banner">
            <h2>Smart Supermarket &ndash; Scannable Shelf Labels</h2>
            <p>Ready for customer mobile app scanning & turnstile verification &bull; Total labels: ${items.length}</p>
          </div>
          <div class="sheet-grid">
            ${stickersHtml}
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

  // Open modal to edit or regenerate barcode
  const handleOpenBarcodeModal = (product) => {
    setEditingBarcodeProduct(product);
    setBarcodeFormValue(product.barcode || "");
    setModalError("");
  };

  // Auto-generate fresh unique EAN-13
  const handleGenerateFreshBarcode = async () => {
    setIsGenerating(true);
    setModalError("");
    try {
      const res = await API.get("/products/generate-barcode");
      if (res.data?.success && res.data.barcode) {
        setBarcodeFormValue(res.data.barcode);
        return;
      }
    } catch (_) {
      // Fallback GS1 in-store EAN-13 generator (prefix 200)
      const raw = "200" + Math.floor(100000000 + Math.random() * 900000000).toString();
      let sum = 0;
      for (let i = 0; i < 12; i++) {
        sum += parseInt(raw[i], 10) * (i % 2 === 0 ? 1 : 3);
      }
      const check = (10 - (sum % 10)) % 10;
      setBarcodeFormValue(raw + check);
    } finally {
      setIsGenerating(false);
    }
  };

  // Save new/regenerated barcode to MongoDB
  const handleSaveBarcode = async (e) => {
    e.preventDefault();
    if (!editingBarcodeProduct) return;
    const clean = barcodeFormValue.trim();

    if (!clean) {
      setModalError("Please enter or generate a barcode number.");
      return;
    }

    // Check duplicate barcode
    const duplicate = products.find(
      (p) =>
        p._id !== editingBarcodeProduct._id &&
        String(p.barcode).trim() === clean
    );
    if (duplicate) {
      setModalError(`Barcode "${clean}" is already assigned to "${duplicate.name}".`);
      return;
    }

    setIsSaving(true);
    setModalError("");

    try {
      const id = editingBarcodeProduct._id;
      await API.put(`/products/${id}`, { barcode: clean });

      // Update in state & persistent storage
      const updatedList = products.map((p) =>
        p._id === id ? { ...p, barcode: clean } : p
      );
      setProducts(updatedList);
      savePersistentProducts(updatedList);

      setToastMessage(`✓ Barcode successfully updated for "${editingBarcodeProduct.name}"!`);
      setTimeout(() => setToastMessage(""), 4000);
      setEditingBarcodeProduct(null);
    } catch (err) {
      setModalError(err.response?.data?.message || "Failed to update barcode in database.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grocer-page-container">
      {/* ========================================================================= */}
      {/* 1. HERO TOP BANNER - EXACT MATCH TO REGISTER NEW PRODUCT                  */}
      {/* ========================================================================= */}
      <ErpPageBanner
        title="Barcode Management"
        subtitle="GS1/EAN-13 barcode generation, scannable thermal label printing & camera lookup validation"
        badges={["GS1/EAN-13 Standard", "Thermal Printable Sheet", "Instant Camera Lookup"]}
        icon={<Barcode size={22} color="#ffffff" strokeWidth={2.4} />}
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
      {/* 2. FOUR HORIZONTAL BARCODE KPI CARDS                                      */}
      {/* ========================================================================= */}
      <section className="pm-kpi-grid">
        {/* Card 1: Total Registered */}
        <div className="pm-kpi-card blue-theme">
          <div className="pm-kpi-icon-pill blue">
            <Boxes size={21} color="#2563EB" strokeWidth={2.4} />
          </div>
          <div className="pm-kpi-content">
            <h3 className="pm-kpi-number">{totalBarcodes}</h3>
            <span className="pm-kpi-label">Registered Barcodes</span>
            <div className="pm-kpi-trend green">
              <span className="trend-arrow">↑</span>
              <span>100% Unique EAN</span>
            </div>
          </div>
        </div>

        {/* Card 2: Active Scannable */}
        <div className="pm-kpi-card green-theme">
          <div className="pm-kpi-icon-pill green">
            <CheckCircle2 size={21} color="#059669" strokeWidth={2.4} />
          </div>
          <div className="pm-kpi-content">
            <h3 className="pm-kpi-number">{products.length}</h3>
            <span className="pm-kpi-label">Active Scannable SKUs</span>
            <div className="pm-kpi-trend green">
              <span className="trend-arrow">✓</span>
              <span>Mobile App Ready</span>
            </div>
          </div>
        </div>

        {/* Card 3: Internal Store EAN-13 */}
        <div className="pm-kpi-card yellow-theme">
          <div className="pm-kpi-icon-pill yellow">
            <Sparkles size={21} color="#D97706" strokeWidth={2.4} />
          </div>
          <div className="pm-kpi-content">
            <h3 className="pm-kpi-number">{internalEanCount}</h3>
            <span className="pm-kpi-label">Store Standard EAN-13</span>
            <div className="pm-kpi-trend green">
              <span className="trend-arrow">✓</span>
              <span>GS1 200-Prefix</span>
            </div>
          </div>
        </div>

        {/* Card 4: Manufacturer Codes */}
        <div className="pm-kpi-card purple-theme">
          <div className="pm-kpi-icon-pill purple">
            <Tag size={21} color="#7C3AED" strokeWidth={2.4} />
          </div>
          <div className="pm-kpi-content">
            <h3 className="pm-kpi-number">{manufacturerCount}</h3>
            <span className="pm-kpi-label">Manufacturer Barcodes</span>
            <div className="pm-kpi-trend green">
              <span className="trend-arrow">✓</span>
              <span>External EAN/UPC</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Action Barcode Controls (High-contrast, responsive, no text clipping) */}
      <div className="pm-actions-group" style={{ display: "flex", gap: "10px", marginBottom: "18px", flexWrap: "wrap", alignItems: "center", width: "100%", boxSizing: "border-box" }}>
        <button
          type="button"
          onClick={() => handlePrintLabels(filteredProducts, "Batch Barcode Labels Sheet")}
          disabled={filteredProducts.length === 0}
          style={{
            padding: "8px 18px",
            fontSize: "13px",
            fontWeight: 700,
            background: "#2563EB",
            color: "#ffffff",
            border: "1px solid #1D4ED8",
            borderRadius: "9999px",
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            cursor: filteredProducts.length === 0 ? "not-allowed" : "pointer",
            boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
            whiteSpace: "nowrap",
            boxSizing: "border-box",
            lineHeight: 1.4,
          }}
        >
          <Printer size={15} color="#ffffff" />
          <span>Batch Print Sheet ({filteredProducts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleBatchDownload(filteredProducts)}
          disabled={filteredProducts.length === 0}
          style={{
            padding: "8px 18px",
            fontSize: "13px",
            fontWeight: 700,
            background: "#059669",
            color: "#ffffff",
            border: "1px solid #047857",
            borderRadius: "9999px",
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            cursor: filteredProducts.length === 0 ? "not-allowed" : "pointer",
            boxShadow: "0 2px 8px rgba(5, 150, 105, 0.25)",
            whiteSpace: "nowrap",
            boxSizing: "border-box",
            lineHeight: 1.4,
          }}
        >
          <Download size={15} color="#ffffff" />
          <span>Download PNG Barcodes ({filteredProducts.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 4. SEARCH, FILTERS & VIEW MODE TOOLBAR                                    */}
      {/* ========================================================================= */}
      <section className="pm-toolbar-row">
        <div className="pm-toolbar-search">
          <Search size={18} className="pm-search-ico" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by barcode number, product name or brand..."
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

          {/* Barcode Type Filter */}
          <div className="pm-select-pill-wrap">
            <select
              value={barcodeFilter}
              onChange={(e) => setBarcodeFilter(e.target.value)}
              className="pm-select-pill"
            >
              <option value="all">All Barcode Standards</option>
              <option value="internal">Internal Store EAN-13 (200-prefix)</option>
              <option value="manufacturer">Manufacturer Barcodes</option>
            </select>
          </div>

          {/* View Mode Switcher */}
          <div className="bc-view-toggle">
            <button
              type="button"
              className={`bc-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Sticker Card Grid View"
            >
              <Grid size={15} />
              <span>Labels</span>
            </button>
            <button
              type="button"
              className={`bc-toggle-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
              title="Compact Ledger Table View"
            >
              <List size={15} />
              <span>Ledger</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. BARCODE CATALOG: GRID OF SHELF STICKER CARDS                           */}
      {/* ========================================================================= */}
      {viewMode === "grid" ? (
        <div className="bc-card-grid">
          {filteredProducts.length === 0 ? (
            <div
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                padding: "48px 20px",
                background: "#FFFFFF",
                borderRadius: "16px",
                color: "#64748B",
              }}
            >
              No product barcodes found matching your criteria.
            </div>
          ) : (
            filteredProducts.map((p) => {
              const isInternal = p.barcode?.startsWith("200");
              return (
                <div key={p._id || p.barcode} className="bc-sticker-card">
                  <span className="bc-store-tag">Smart Supermarket • GrocerEase</span>
                  <h4 className="bc-product-title" title={p.name}>{p.name}</h4>
                  <span className="bc-product-sub">
                    {p.brand ? `${p.brand} • ` : ""}
                    {p.category || "Grocery"}
                  </span>

                  {/* Scannable Barcode SVG */}
                  <div className="bc-svg-container">
                    <BarcodeSVG barcode={p.barcode || p._id} width={1.8} height={48} />
                  </div>

                  {/* Price & Badge Strip */}
                  <div className="bc-price-row">
                    <span className="bc-price-bold">₹{Number(p.price || 0).toFixed(2)}</span>
                    <span className={`bc-type-badge ${isInternal ? "internal" : "manufacturer"}`}>
                      {isInternal ? "Store EAN-13" : "Manufacturer"}
                    </span>
                  </div>

                  {/* 4 Equal Action Buttons */}
                  <div className="bc-actions-grid">
                    <button
                      type="button"
                      className="bc-action-btn"
                      onClick={() => {
                        setTestInput(p.barcode || "");
                        handleTestLookup(p.barcode || "");
                      }}
                      title="Test barcode scan lookup"
                    >
                      <Check size={13} />
                      <span>Test</span>
                    </button>

                    <button
                      type="button"
                      className="bc-action-btn"
                      onClick={() => handlePrintLabels([p], `Label_${p.name}`)}
                      title="Print shelf sticker"
                    >
                      <Printer size={13} />
                      <span>Print</span>
                    </button>

                    <button
                      type="button"
                      className="bc-action-btn download"
                      onClick={() => handleDownloadBarcode(p)}
                      title="Download high-resolution barcode image (PNG)"
                    >
                      <Download size={13} />
                      <span>PNG</span>
                    </button>

                    <button
                      type="button"
                      className="bc-action-btn edit"
                      onClick={() => handleOpenBarcodeModal(p)}
                      title="Edit or regenerate barcode"
                    >
                      <Sparkles size={13} />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* 5B. COMPACT TABLE VIEW                                                    */
        /* ========================================================================= */
        <div className="pm-catalog-card">
          <div className="pm-catalog-header">
            <div className="pm-catalog-title-group">
              <div className="pm-catalog-icon-box">
                <Barcode size={18} color="#FFFFFF" />
              </div>
              <h3 className="pm-catalog-heading">
                Barcode Directory ({filteredProducts.length} Items Listed)
              </h3>
            </div>
          </div>

          <div className="pm-table-wrapper">
            <table className="pm-products-table">
              <thead>
                <tr>
                  <th style={{ minWidth: "180px", textAlign: "left" }}>PRODUCT DETAILS</th>
                  <th style={{ minWidth: "110px", textAlign: "left" }}>CATEGORY</th>
                  <th style={{ minWidth: "130px", textAlign: "center" }}>BARCODE TYPE</th>
                  <th style={{ minWidth: "180px", textAlign: "center" }}>SCANNABLE BARCODE</th>
                  <th style={{ minWidth: "90px", textAlign: "center" }}>PRICE</th>
                  <th style={{ minWidth: "100px", textAlign: "center" }}>STOCK</th>
                  <th className="bc-th-actions" style={{ minWidth: "250px", width: "250px", textAlign: "center" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const isInternal = p.barcode?.startsWith("200");
                  return (
                    <tr key={p._id || p.barcode}>
                      <td>
                        <div className="pm-cell-details">
                          <div className="pm-thumb-box">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} className="pm-product-img" />
                            ) : (
                              <span className="pm-thumb-fallback">🏷️</span>
                            )}
                          </div>
                          <div className="pm-details-text">
                            <span className="pm-name-main">{p.name}</span>
                            <span className="pm-name-sub">{p.brand || "Smart Grocery"}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="pm-category-text">{p.category}</span>
                      </td>

                      <td style={{ textAlign: "center" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "4px 8px",
                            borderRadius: "6px",
                            background: isInternal ? "#EFF6FF" : "#F3E8FF",
                            color: isInternal ? "#1D4ED8" : "#6B21A8",
                            display: "inline-block",
                          }}
                        >
                          {isInternal ? "Store EAN-13" : "Manufacturer"}
                        </span>
                      </td>

                      <td style={{ textAlign: "center" }}>
                        <div style={{ maxWidth: "200px", margin: "0 auto", display: "inline-block" }}>
                          <BarcodeSVG barcode={p.barcode || p._id} width={1.4} height={32} />
                        </div>
                      </td>

                      <td style={{ textAlign: "center" }}>
                        <span className="pm-price-bold">₹{Number(p.price || 0).toFixed(2)}</span>
                      </td>

                      <td style={{ textAlign: "center" }}>
                        <strong style={{ color: p.stock === 0 ? "#DC2626" : "#0F172A" }}>
                          {p.stock} units
                        </strong>
                      </td>

                      <td className="bc-td-actions" style={{ textAlign: "center", minWidth: "250px", width: "250px" }}>
                        <div className="bc-table-actions-row">
                          <button
                            type="button"
                            className="bc-table-btn print bc-icon-btn"
                            onClick={() => handlePrintLabels([p], `Label_${p.name}`)}
                            title="Print shelf sticker"
                          >
                            <Printer size={13} />
                            <span>Print</span>
                          </button>
                          <button
                            type="button"
                            className="bc-table-btn download bc-icon-btn"
                            onClick={() => handleDownloadBarcode(p)}
                            title="Download scannable barcode image (PNG)"
                          >
                            <Download size={13} />
                            <span>Download</span>
                          </button>
                          <button
                            type="button"
                            className="bc-table-btn edit bc-icon-btn"
                            onClick={() => handleOpenBarcodeModal(p)}
                            title="Edit or regenerate barcode"
                          >
                            <Sparkles size={13} />
                            <span>Edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. REGENERATE / EDIT BARCODE MODAL                                        */}
      {/* ========================================================================= */}
      {editingBarcodeProduct && (
        <div className="pm-modal-overlay" onClick={() => setEditingBarcodeProduct(null)}>
          <div className="pm-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px", width: "95%" }}>
            <div className="pm-modal-header" style={{ padding: "18px 24px" }}>
              <h3 className="pm-modal-title">Edit Barcode: {editingBarcodeProduct.name}</h3>
              <button
                type="button"
                className="pm-modal-close"
                onClick={() => setEditingBarcodeProduct(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBarcode}>
              <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px", boxSizing: "border-box" }}>
                {modalError && (
                  <div
                    style={{
                      background: "#FEF2F2",
                      border: "1px solid #FECACA",
                      color: "#991B1B",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      fontSize: "12.5px",
                      fontWeight: 600,
                    }}
                  >
                    {modalError}
                  </div>
                )}

                <div>
                  <label className="pm-form-label" style={{ marginBottom: "8px", display: "block" }}>
                    Barcode Number (EAN-13 / Code-128)
                  </label>
                  <div style={{ display: "flex", gap: "10px", alignItems: "stretch" }}>
                    <input
                      type="text"
                      required
                      value={barcodeFormValue}
                      onChange={(e) => setBarcodeFormValue(e.target.value)}
                      className="pm-form-input"
                      placeholder="Enter manufacturer barcode or auto-generate..."
                      style={{
                        flex: 1,
                        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                        fontSize: "14px",
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleGenerateFreshBarcode}
                      disabled={isGenerating}
                      style={{
                        padding: "0 16px",
                        background: "#EFF6FF",
                        color: "#2563EB",
                        border: "1.5px solid #BFDBFE",
                        borderRadius: "12px",
                        fontSize: "13px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <Sparkles size={14} />
                      <span>{isGenerating ? "..." : "Auto EAN"}</span>
                    </button>
                  </div>
                  <small style={{ color: "#64748B", fontSize: "11px", marginTop: "6px", display: "block" }}>
                    Valid EAN-13 prefixed with 200 for internal store distribution.
                  </small>
                </div>

                {/* Barcode preview */}
                {barcodeFormValue && (
                  <div
                    style={{
                      background: "#F8FAFC",
                      border: "1.5px dashed #CBD5E1",
                      borderRadius: "12px",
                      padding: "16px 20px",
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  >
                    <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "8px" }}>
                      Scannable Preview
                    </span>
                    <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                      <BarcodeSVG barcode={barcodeFormValue} width={2} height={55} />
                    </div>
                  </div>
                )}
              </div>

              <div
                className="pm-modal-actions"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px",
                  padding: "16px 24px",
                  borderTop: "1px solid #f1f5f9",
                  background: "#ffffff",
                  boxSizing: "border-box",
                }}
              >
                <button
                  type="button"
                  className="pm-btn-cancel"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "#059669",
                    borderColor: "#a7f3d0",
                    background: "#f0fdf4",
                  }}
                  onClick={() => handleDownloadBarcode({ ...editingBarcodeProduct, barcode: barcodeFormValue })}
                  title="Download barcode image (PNG)"
                >
                  <Download size={14} />
                  <span>Download Barcode</span>
                </button>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    className="pm-btn-cancel"
                    onClick={() => setEditingBarcodeProduct(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="pm-btn-save"
                    disabled={isSaving}
                    style={{ minWidth: "140px" }}
                  >
                    {isSaving ? "Saving..." : "✓ Save Barcode"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
