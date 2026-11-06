import React, { useEffect, useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
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
  const [products, setProducts] = useState(getPersistentProducts);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [barcodeFilter, setBarcodeFilter] = useState("all"); // "all", "internal", "manufacturer"
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "table"

  // Tester state
  const [testerOpen, setTesterOpen] = useState(true);
  const [testInput, setTestInput] = useState("");
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

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
      if (res.data?.success && Array.isArray(res.data.products) && res.data.products.length > 0) {
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

  // Test Barcode Lookup
  const handleTestLookup = async (codeToTest) => {
    const code = (codeToTest || testInput).trim();
    if (!code) return;

    setTesting(true);
    setTestResult(null);

    try {
      // 1. Direct API Lookup
      const res = await API.get(`/products/barcode/${code}`);
      if (res.data?.success && res.data.product) {
        setTestResult({
          status: "FOUND",
          product: res.data.product,
          code,
        });
        return;
      }
    } catch (err) {
      // 2. Fallback check local storage
      const localMatch = products.find(
        (p) => String(p.barcode).trim() === code
      );
      if (localMatch) {
        setTestResult({
          status: "FOUND",
          product: localMatch,
          code,
        });
        return;
      }
    } finally {
      setTesting(false);
    }

    setTestResult({
      status: "NOT_FOUND",
      code,
      message: `Product Not Found: No product registered for barcode "${code}"`,
    });
  };

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
          <div class="store-badge">SMART SUPERMARKET &bull; GROCEREASE</div>
          <div class="prod-title">${p.name}</div>
          <div class="prod-sub">${p.brand ? p.brand + " &bull; " : ""}${p.category || ""}</div>
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
      {/* 1. HERO TOP BANNER WITH SHOPPING CART & DYNAMIC RIBBON                    */}
      {/* Matches Product Management and Reference Image 1                          */}
      {/* ========================================================================= */}
      <section className="pm-hero-section">
        <div className="pm-hero-left">
          <h1 className="pm-main-title">Barcode Management</h1>
          <p className="pm-main-subtitle">
            GS1/EAN-13 barcode generation, scannable thermal label printing & camera lookup validation
          </p>
          <div className="pm-title-underline" />

          {/* Action pills */}
          <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
            <button
              type="button"
              className="action-pill-btn primary"
              onClick={() => handlePrintLabels(filteredProducts, "Batch Barcode Labels Sheet")}
              disabled={filteredProducts.length === 0}
              style={{ padding: "8px 16px", fontSize: "12.5px" }}
            >
              <Printer size={15} />
              <span>Batch Print Sheet ({filteredProducts.length})</span>
            </button>

            <button
              type="button"
              className="action-pill-btn refresh"
              onClick={() => setTesterOpen(!testerOpen)}
              style={{ padding: "8px 16px", fontSize: "12.5px" }}
            >
              <Barcode size={15} />
              <span>{testerOpen ? "Hide Barcode Tester" : "Test Barcode Lookup"}</span>
            </button>

            <button
              type="button"
              className="action-pill-btn refresh"
              onClick={fetchProducts}
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
                <linearGradient id="goldRibbonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0" />
                  <stop offset="15%" stopColor="#FDE047" />
                  <stop offset="50%" stopColor="#FBBF24" />
                  <stop offset="80%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#FBBF24" />
                </linearGradient>
                <linearGradient id="blueRibbonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0" />
                  <stop offset="15%" stopColor="#1D4ED8" />
                  <stop offset="50%" stopColor="#2563EB" />
                  <stop offset="80%" stopColor="#1E40AF" />
                  <stop offset="100%" stopColor="#1E3A8A" />
                </linearGradient>
              </defs>
              <path
                d="M 0 115 C 120 75, 220 50, 340 68 C 450 82, 540 60, 640 45 L 640 68 C 540 82, 450 105, 340 92 C 220 75, 120 100, 0 138 Z"
                fill="url(#blueRibbonGrad)"
                opacity="0.95"
              />
              <path
                d="M 0 108 C 120 68, 220 43, 340 61 C 450 75, 540 53, 640 38 L 640 46 C 540 61, 450 83, 340 69 C 220 51, 120 76, 0 116 Z"
                fill="url(#goldRibbonGrad)"
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

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE LIVE BARCODE LOOKUP TESTER (REQUIREMENT #4)                */}
      {/* ========================================================================= */}
      {testerOpen && (
        <div className="bc-tester-card">
          <div className="bc-tester-header">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Barcode size={18} color="#2563EB" />
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#0F172A" }}>
                Live Barcode Lookup Tester (Mobile Camera Scan Verification)
              </h3>
            </div>
            <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 600 }}>
              Verify barcode lookup before printing shelf tags
            </span>
          </div>

          <div className="bc-tester-input-wrap">
            <input
              type="text"
              className="bc-tester-input"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTestLookup()}
              placeholder="Enter or scan barcode (e.g. 87654367, 12356, 1234561)..."
            />
            <button
              type="button"
              className="action-pill-btn primary"
              onClick={() => handleTestLookup()}
              disabled={testing || !testInput.trim()}
              style={{ padding: "0 20px" }}
            >
              {testing ? "Checking..." : "Lookup Product"}
            </button>
          </div>

          {/* Test Result Feedback */}
          {testResult && (
            <div style={{ marginTop: "14px" }}>
              {testResult.status === "FOUND" ? (
                <div
                  style={{
                    background: "#F0FDF4",
                    border: "1px solid #BBF7D0",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "8px",
                        background: "#DCFCE7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#16A34A",
                        fontSize: "20px",
                      }}
                    >
                      ✓
                    </div>
                    <div>
                      <strong style={{ fontSize: "14px", color: "#0F172A", display: "block" }}>
                        {testResult.product.name} ({testResult.product.brand || "Smart Grocery"})
                      </strong>
                      <span style={{ fontSize: "12px", color: "#166534", fontWeight: 600 }}>
                        Category: {testResult.product.category} &bull; Price: ₹{Number(testResult.product.price).toFixed(2)} &bull; Available Stock: {testResult.product.stock} units
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "11px", background: "#DCFCE7", color: "#166534", padding: "4px 10px", borderRadius: "12px", fontWeight: 700 }}>
                      Verified Valid Match
                    </span>
                    <button
                      type="button"
                      className="bc-icon-btn"
                      onClick={() => handlePrintLabels([testResult.product], `Label_${testResult.product.name}`)}
                    >
                      <Printer size={13} /> Print This
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: "#FEF2F2",
                    border: "1px solid #FECACA",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    color: "#991B1B",
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                >
                  <AlertCircle size={18} color="#DC2626" />
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

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
                  <span className="bc-store-tag">Smart Supermarket &bull; GrocerEase</span>
                  <h4 className="bc-product-title">{p.name}</h4>
                  <span className="bc-product-sub">
                    {p.brand ? `${p.brand} &bull; ` : ""}
                    {p.category}
                  </span>

                  {/* Scannable Barcode SVG */}
                  <div className="bc-svg-container">
                    <BarcodeSVG barcode={p.barcode || p._id} width={1.8} height={50} />
                  </div>

                  {/* Footer Row */}
                  <div className="bc-footer-row">
                    <div>
                      <span className="bc-price-bold">₹{Number(p.price || 0).toFixed(2)}</span>
                      <span style={{ display: "block", fontSize: "11px", color: isInternal ? "#2563EB" : "#7C3AED", fontWeight: 700 }}>
                        {isInternal ? "Store EAN-13" : "Manufacturer"}
                      </span>
                    </div>

                    <div className="bc-actions-group">
                      <button
                        type="button"
                        className="bc-icon-btn"
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
                        className="bc-icon-btn"
                        onClick={() => handlePrintLabels([p], `Label_${p.name}`)}
                        title="Print shelf sticker"
                      >
                        <Printer size={13} />
                        <span>Print</span>
                      </button>

                      <button
                        type="button"
                        className="bc-icon-btn"
                        onClick={() => handleOpenBarcodeModal(p)}
                        title="Edit or regenerate barcode"
                      >
                        <Sparkles size={13} />
                      </button>
                    </div>
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
                  <th>PRODUCT DETAILS</th>
                  <th>CATEGORY</th>
                  <th>BARCODE TYPE</th>
                  <th>SCANNABLE BARCODE</th>
                  <th>PRICE</th>
                  <th>STOCK</th>
                  <th style={{ textAlign: "center" }}>ACTIONS</th>
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

                      <td>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "4px 8px",
                            borderRadius: "6px",
                            background: isInternal ? "#EFF6FF" : "#F3E8FF",
                            color: isInternal ? "#1D4ED8" : "#6B21A8",
                          }}
                        >
                          {isInternal ? "Store EAN-13" : "Manufacturer"}
                        </span>
                      </td>

                      <td>
                        <div style={{ maxWidth: "200px" }}>
                          <BarcodeSVG barcode={p.barcode || p._id} width={1.4} height={32} />
                        </div>
                      </td>

                      <td>
                        <span className="pm-price-bold">₹{Number(p.price || 0).toFixed(2)}</span>
                      </td>

                      <td>
                        <strong style={{ color: p.stock === 0 ? "#DC2626" : "#0F172A" }}>
                          {p.stock} units
                        </strong>
                      </td>

                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            type="button"
                            className="bc-icon-btn"
                            onClick={() => handlePrintLabels([p], `Label_${p.name}`)}
                          >
                            <Printer size={13} />
                            <span>Print</span>
                          </button>
                          <button
                            type="button"
                            className="bc-icon-btn"
                            onClick={() => handleOpenBarcodeModal(p)}
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
          <div className="pm-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
            <div className="pm-modal-header">
              <h3 className="pm-modal-title">Edit Barcode: {editingBarcodeProduct.name}</h3>
              <button
                type="button"
                className="pm-modal-close"
                onClick={() => setEditingBarcodeProduct(null)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveBarcode} className="pm-modal-form">
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
                    marginBottom: "14px",
                  }}
                >
                  {modalError}
                </div>
              )}

              <div style={{ marginBottom: "16px" }}>
                <label className="pm-form-label">Barcode Number (EAN-13 / Code-128)</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    required
                    value={barcodeFormValue}
                    onChange={(e) => setBarcodeFormValue(e.target.value)}
                    className="pm-form-input"
                    placeholder="Enter manufacturer barcode or auto-generate..."
                    style={{ fontFamily: "monospace", fontSize: "14px", fontWeight: 700 }}
                  />
                  <button
                    type="button"
                    onClick={handleGenerateFreshBarcode}
                    disabled={isGenerating}
                    style={{
                      padding: "0 14px",
                      background: "#EFF6FF",
                      color: "#2563EB",
                      border: "1px solid #BFDBFE",
                      borderRadius: "10px",
                      fontSize: "12.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Sparkles size={14} />
                    <span>{isGenerating ? "..." : "Auto EAN"}</span>
                  </button>
                </div>
                <small style={{ color: "#64748B", fontSize: "11px", marginTop: "4px", display: "block" }}>
                  Valid EAN-13 prefixed with 200 for internal store distribution.
                </small>
              </div>

              {/* Barcode preview */}
              {barcodeFormValue && (
                <div
                  style={{
                    background: "#F8FAFC",
                    border: "1.5px dashed #CBD5E1",
                    borderRadius: "10px",
                    padding: "14px",
                    textAlign: "center",
                    marginBottom: "20px",
                  }}
                >
                  <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                    Scannable Preview
                  </span>
                  <BarcodeSVG barcode={barcodeFormValue} width={2} height={55} />
                </div>
              )}

              <div className="pm-modal-actions">
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
                  style={{ minWidth: "150px" }}
                >
                  {isSaving ? "Saving..." : "✓ Save Barcode"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
