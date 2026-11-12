import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Barcode,
  Camera,
  Upload,
  Zap,
  CheckCircle,
  AlertCircle,
  Package,
  RotateCcw,
  X,
  Save,
  Check,
  Tag,
  Info,
  Sparkles,
  Radio,
} from "lucide-react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import API from "../../services/api";
import BarcodeSVG from "../../components/BarcodeSVG";
import ErpPageBanner from "../../components/ErpPageBanner";
import { addPersistentProduct, getPersistentProducts } from "../../utils/realtimeStorage";
import "./ScanAndEnter.css";

// Built-in Supermarket Catalog matching reference items & user's database with crystal-clear high-res assets
// Re-trigger Vite HMR clean compile


export default function ScanAndEnter() {
  const navigate = useNavigate();

  // Mode: "generate" (Auto-GenerateScan / Enter), "upload", "camera"
  const [activeMode, setActiveMode] = useState("generate");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [activeBarcode, setActiveBarcode] = useState("");
  const [autoRegisterOnScan, setAutoRegisterOnScan] = useState(false);

  // Product state
  const [product, setProduct] = useState({
    name: "",
    category: "Groceries",
    brand: "",
    price: "",
    discount: 0,
    costPrice: "",
    stock: "",
    lowStockThreshold: 5,
    imageUrl: "",
    description: "",
  });

  const [detailsFetched, setDetailsFetched] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);


  // Barcode Lookup logic
  const lookupBarcode = async (rawCode, autoSave = false) => {
    const code = String(rawCode || "").trim();
    if (!code) {
      setMessage({ type: "error", text: "Please enter or scan a valid barcode number." });
      return;
    }

    setIsLookingUp(true);
    setActiveBarcode(code);
    setMessage({ type: "info", text: `Looking up product details for barcode: ${code}...` });

    let found = null;

    // 1. Check MongoDB Atlas
    try {
      const res = await API.get(`/products/barcode/${encodeURIComponent(code)}`);
      if (res.data?.success && res.data.product) {
        found = res.data.product;
      }
    } catch (_) { }

    // 2. Check local persistent inventory
    if (!found) {
      const local = getPersistentProducts();
      const match = local.find((p) => p.barcode === code);
      if (match) found = match;
    }

    // 3. External verified barcode and image lookup
    if (!found) {
      try {
        const ext = await API.get(`/products/external/${encodeURIComponent(code)}`);
        if (ext.data?.success && ext.data.product?.imageUrl) {
          found = { ...ext.data.product, price: "", discount: 0, sellingPrice: "", costPrice: "", stock: "", lowStockThreshold: 5, description: "Verified external barcode match." };
        }
      } catch (_) { }
    }
    if (!found) { setDetailsFetched(false); setIsLookingUp(false); setMessage({ type: "error", text: "Product not found. Please enter product details and upload its actual image." }); return; }

    setProduct({
      name: found.name || "",
      brand: found.brand || "",
      category: found.category || "Beverages",
      price: found.price ?? "",
      discount: Number(found.discount) || 0,
      sellingPrice: found.price != null ? Number(found.price) - (Number(found.discount) || 0) : "",
      costPrice: Number(found.costPrice) || 0,
      stock: found.stock ?? "",
      lowStockThreshold: Number(found.lowStockThreshold) || 5,
      imageUrl: found.imageUrl || "",
      description: found.description || "",
    });

    setDetailsFetched(false);
    setIsLookingUp(false);
    setMessage({
      type: "success",
      text: `Found details for "${found.name}"! Click "Save Product & Reg... →" below to store it.`,
    });

    if (autoSave || autoRegisterOnScan) {
      executeRegisterProduct(code, found);
    }
  };

  // Register Product
  const executeRegisterProduct = async (barcodeToSave, productData) => {
    const code = barcodeToSave || activeBarcode;
    const data = productData || product;

    if (!code || !data.name?.trim() || data.price === "" || data.sellingPrice === "" || !Number.isFinite(Number(data.price)) || !Number.isFinite(Number(data.sellingPrice)) || Number(data.price) <= 0 || Number(data.sellingPrice) <= 0 || Number(data.sellingPrice) > Number(data.price) || data.stock === "" || !Number.isInteger(Number(data.stock)) || Number(data.stock) < 0) {
      setMessage({ type: "error", text: "Enter a valid barcode, product name, selling price and whole-number stock before saving." });
      return;
    }

    setIsSaving(true);

    const payload = {
      name: data.name,
      barcode: code,
      category: data.category,
      brand: data.brand || "",
      price: Number(data.price),
      discount: Number(data.price) - Number(data.sellingPrice),
      costPrice: Number(data.costPrice),
      stock: Number(data.stock),
      lowStockThreshold: Number(data.lowStockThreshold) || 5,
      imageUrl: data.imageUrl,
      description: data.description,
      status: "In Stock",
      isActive: true,
    };

    let saved = false;

    // 1. Save to MongoDB Atlas Backend
    try {
      let existingId = null;
      try {
        const existingRes = await API.get(`/products/barcode/${encodeURIComponent(code)}`);
        existingId = existingRes.data?.product?._id || null;
      } catch (_) { }
      const res = existingId
        ? await API.put(`/products/${existingId}`, payload)
        : await API.post("/products", payload);
      if (res.data?.success || res.status === 201 || res.status === 200) {
        saved = true;
      }
    } catch (_) { }

    if (!saved) {
      setIsSaving(false);
      setMessage({ type: "error", text: "MongoDB save failed. Product was not registered. Please check the backend and try again." });
      return;
    }

    // 2. Save to local storage after successful MongoDB registration
    addPersistentProduct({
      ...payload,
      _id: `prod_${Date.now()}`,
      createdAt: new Date().toISOString(),
    });

    setIsSaving(false);
    setMessage({
      type: "success",
      text: `✓ Successfully saved "${payload.name}" to Super Admin Dashboard!`,
    });
  };

  // Toggle camera scanner
  const toggleCamera = async () => {
    if (cameraActive) {
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          scannerRef.current.clear();
        } catch (_) { }
        scannerRef.current = null;
      }
      setCameraActive(false);
      setActiveMode("generate");
    } else {
      setActiveMode("camera");
      setCameraActive(true);
      setTimeout(() => {
        startCameraScanner();
      }, 300);
    }
  };

  const startCameraScanner = () => {
    const qrDiv = document.getElementById("se-camera-viewport");
    if (!qrDiv) return;

    const html5QrCode = new Html5Qrcode("se-camera-viewport", {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.QR_CODE,
      ],
      verbose: false,
    });
    scannerRef.current = html5QrCode;

    html5QrCode
      .start(
        { facingMode: "environment" },
        { fps: 15, qrbox: { width: 250, height: 160 } },
        (decodedText) => {
          html5QrCode.stop().catch(() => { });
          setCameraActive(false);
          setActiveBarcode(decodedText);
          setBarcodeInput(decodedText);
          lookupBarcode(decodedText, autoRegisterOnScan);
        },
        () => { }
      )
      .catch((err) => {
        setCameraActive(false);
        setMessage({
          type: "error",
          text: `Camera permission denied: ${err?.message || "Please allow webcam access"}`,
        });
      });
  };

  // Handle uploaded image file
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setActiveMode("upload");
    setMessage({ type: "info", text: "Analyzing barcode image..." });

    try {
      const html5QrCode = new Html5Qrcode("se-hidden-canvas", {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        verbose: false,
      });

      const decodedText = await html5QrCode.scanFile(file, true);
      html5QrCode.clear();

      setActiveBarcode(decodedText);
      setBarcodeInput(decodedText);
      lookupBarcode(decodedText, autoRegisterOnScan);
    } catch (_) { setMessage({ type: "error", text: "No barcode detected. Try a clearer image or enter it manually." }); }
  };

  // Reset form
  const handleReset = () => {
    setBarcodeInput("");
    setActiveBarcode("");
    setProduct({ name: "", category: "Groceries", brand: "", price: "", discount: 0, sellingPrice: "", costPrice: "", stock: "", lowStockThreshold: 5, imageUrl: "", description: "" });
    setDetailsFetched(false);
    setActiveMode("generate");
    setMessage({ type: "", text: "" });
  };

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop();
          scannerRef.current.clear();
        } catch (_) { }
      }
    };
  }, []);

  return (
    <div className="se-container">
      {/* 1. Hero Top Banner - EXACT MATCH TO REGISTER NEW PRODUCT */}
      <ErpPageBanner
        title="Scan & Enter"
        subtitle="Scan, fetch & register products instantly to your supermarket catalog"
        badges={["Instant Barcode Lookup", "Auto-Fetch Product Data", "Real-Time Inventory Sync"]}
        icon={<Barcode size={22} color="#ffffff" strokeWidth={2.4} />}
      />

      {/* 2. Notification / Alert Toast (Only shown when active) */}
      {message.text && (
        <div className={`se-notice ${message.type || "info"}`}>
          <div className="se-notice-content">
            {message.type === "success" ? (
              <CheckCircle size={18} />
            ) : message.type === "error" ? (
              <AlertCircle size={18} />
            ) : (
              <Info size={18} />
            )}
            <span>{message.text.replace(/^[✓✔❌ℹ️]\s*/, "")}</span>
          </div>
          <button
            type="button"
            className="se-notice-close"
            onClick={() => setMessage({ type: "", text: "" })}
            aria-label="Dismiss notice"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* 3. Main Grid (Left Scanner + Right Preview) */}
      <div className="se-grid">
        {/* LEFT CARD: Barcode Configuration & Live Preview */}
        <div className="se-card se-left-card">
          {/* Action Mode Buttons */}
          <div className="se-mode-btn-row">
            <button
              type="button"
              className={`se-mode-btn ${activeMode === "generate" ? "active" : ""}`}
              onClick={() => {
                if (cameraActive) toggleCamera();
                setActiveMode("generate");
              }}
            >
              <Barcode size={16} />
              <span>Scan / Enter</span>
            </button>

            <button
              type="button"
              className={`se-mode-btn ${activeMode === "upload" ? "active" : ""}`}
              onClick={() => {
                if (cameraActive) toggleCamera();
                setActiveMode("upload");
                fileInputRef.current?.click();
              }}
            >
              <Upload size={16} />
              <span>Upload Barcode Image</span>
            </button>

            <button
              type="button"
              className={`se-mode-btn ${activeMode === "camera" || cameraActive ? "active" : ""}`}
              onClick={toggleCamera}
            >
              <Camera size={16} />
              <span>{cameraActive ? "Stop Camera" : "Scan via Camera"}</span>
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            style={{ display: "none" }}
          />
          <div id="se-hidden-canvas" style={{ display: "none" }} />

          {/* Camera Viewport */}
          {cameraActive && (
            <div className="se-camera-box">
              <div id="se-camera-viewport" className="se-camera-stream" />
              <div className="se-camera-reticle">
                <span className="se-scan-laser-line" />
              </div>
            </div>
          )}

          {/* Helper Info Banner */}
          <div className="se-info-pill">
            <Info size={16} className="se-info-icon" />
            <span>
              Scan with camera, upload a barcode picture, or type/scan manufacturer code to
              auto-fetch details & register to dashboard.
            </span>
          </div>

          {/* Barcode Input Group */}
          <div className="se-input-section">
            <label className="se-input-label">
              <Tag size={13} fill="#0f172a" stroke="#0f172a" />
              <span>Manufacturer Barcode (EAN / UPC / Code-128)</span>
            </label>
            <div className="se-input-row">
              <div className="se-input-box">
                <Barcode size={18} className="se-input-icon" />
                <input
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      lookupBarcode(barcodeInput);
                    }
                  }}
                  placeholder="Enter or scan barcode number..."
                  className="se-text-input"
                />
              </div>

              <button
                type="button"
                className="se-fetch-btn"
                disabled={isLookingUp}
                onClick={() => lookupBarcode(barcodeInput)}
              >
                <Zap size={15} fill="#ffffff" />
                <span>{isLookingUp ? "Fetching..." : "Fetch Details"}</span>
              </button>
            </div>
          </div>

          {/* Auto Register Checkbox */}
          <label className="se-checkbox-row">
            <input
              type="checkbox"
              checked={autoRegisterOnScan}
              onChange={(e) => setAutoRegisterOnScan(e.target.checked)}
              className="se-checkbox"
            />
            <span className="se-checkbox-text">
              <Zap size={13} color="#f59e0b" fill="#f59e0b" />
              <strong>Automatically register to Super Admin Dashboard upon scan / upload</strong>
            </span>
          </label>

          {/* LIVE BARCODE PREVIEW BOX with Wave Ribbon Header */}
          <div className="se-live-preview-box">
            <div className="se-live-preview-header">
              <div className="se-live-preview-title-wrap">
                <Radio size={14} className="se-pulse-icon" />
                <span className="se-live-preview-title">LIVE BARCODE PREVIEW</span>
              </div>
            </div>

            <div className="se-barcode-canvas-wrap">
              {/* Cyan Viewfinder Corner Reticles */}
              <div className="se-corner top-left" />
              <div className="se-corner top-right" />
              <div className="se-corner bottom-left" />
              <div className="se-corner bottom-right" />

              <div className="se-barcode-render">
                <BarcodeSVG
                  barcode={activeBarcode || ""}
                  width={2.2}
                  height={54}
                  showText={false}
                />
                <span className="se-barcode-digits">
                  {activeBarcode || ""}
                </span>
              </div>

              {detailsFetched && (
                <div className="se-fetched-badge">
                  <span className="se-check-circle">✓</span>
                  <span>Details Auto-Fetched</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT CARD: Product Image Preview & Details */}
        <div className="se-card se-right-card">
          <div className="se-card-header">
            <div className="se-card-title">
              <Package size={17} color="#1455d9" />
              <h3>Product Image Preview</h3>
            </div>
            <span className="se-live-url-pill">
              <span className="se-live-dot" />
              <span>Live URL Active</span>
            </span>
          </div>








          {/* Large Image Preview with Crisp High-Res Display */}
          <div className="se-img-preview-wrap">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="se-main-img"
            />
          </div>

          {/* Product Summary Info Card */}
          <div className="se-summary-card">
            <div className="se-summary-title-row">
              <Package size={16} color="#1455d9" className="se-summary-icon" />
              <h4 className="se-summary-name">{product.name}</h4>
            </div>

            <div className="se-badges-row">
              <span className="se-pill-badge category">
                <span>🍴</span>
                <span>{product.category}</span>
              </span>

              <span className="se-pill-badge price">
                <span>💵</span>
                <span>₹{Number(product.price).toFixed(0)}</span>
              </span>

              <span className="se-pill-badge stock">
                <span>📦</span>
                <span>{product.stock} in stock</span>
              </span>

              {product.brand && (
                <span className="se-pill-badge brand">
                  <span>🏷️</span>
                  <span>{product.brand}</span>
                </span>
              )}
            </div>
          </div>

          {/* Editable Store Price and Stock */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: "14px", marginTop: "18px" }}>
            <div>
              <label className="se-input-label">MRP (₹)</label>
              <input type="number" min="0.01" step="0.01" required placeholder="Enter MRP" className="se-text-input" value={product.price} onChange={(e) => setProduct(prev => ({ ...prev, price: e.target.value }))} />
            </div>
            <div>
              <label className="se-input-label">Selling Price (₹)</label>
              <input type="number" min="0.01" step="0.01" required placeholder="Enter selling price" className="se-text-input" value={product.sellingPrice ?? ""} onChange={(e) => setProduct(prev => ({ ...prev, sellingPrice: e.target.value }))} />
            </div>
            <div>
              <label className="se-input-label">Available Stock</label>
              <input type="number" min="0" step="1" required placeholder="Enter stock" className="se-text-input" value={product.stock} onChange={(e) => setProduct(prev => ({ ...prev, stock: e.target.value }))} />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Sticky Action Bar */}
      <div className="se-action-bar">
        <div className="se-action-bar-left">
          <button
            type="button"
            className="se-btn se-btn-secondary"
            onClick={handleReset}
          >
            <RotateCcw size={15} />
            <span>Reset to Default</span>
          </button>

          <button
            type="button"
            className="se-btn se-btn-cancel"
            onClick={() => navigate("/admin/products")}
          >
            <X size={15} />
            <span>Cancel</span>
          </button>
        </div>

        <div className="se-action-bar-right">
          <div className="se-sparkle-btn-wrap">
            <Sparkles size={16} className="se-btn-sparkle-decor" />
            <button
              type="button"
              className="se-btn se-btn-primary"
              disabled={isSaving}
              onClick={() => executeRegisterProduct(activeBarcode, product)}
            >
              <Save size={16} />
              <span>
                {isSaving ? "Saving..." : "Save Product & Reg... →"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


























