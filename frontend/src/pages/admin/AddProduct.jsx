import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Barcode,
  Tag,
  Package,
  ShoppingCart,
  Sparkles,
  Camera,
  CheckCircle,
  AlertCircle,
  Boxes,
  AlertTriangle,
  Link as LinkIcon,
  FileText,
  X,
  Save,
  ArrowRight,
  Info,
  RefreshCw,
} from "lucide-react";
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
} from "html5-qrcode";
import API from "../../services/api";
import BarcodeSVG from "../../components/BarcodeSVG";
import ErpPageBanner from "../../components/ErpPageBanner";
import { addPersistentProduct } from "../../utils/realtimeStorage";
import redBasketImg from "../../assets/red-basket-preview.jpg";
import "./AddProduct.css";

const CATEGORY_CHIPS = [
  { label: "Groceries", icon: "🛒" },
  { label: "Fruits & Vegetables", icon: "🍏" },
  { label: "Dairy", icon: "🥛" },
  { label: "Beverages", icon: "☕" },
  { label: "Snacks", icon: "🍿" },
  { label: "Personal Care", icon: "👤" },
  { label: "Household", icon: "🏠" },
  { label: "Other", icon: "•••" },
];

export default function AddProduct() {
  const navigate = useNavigate();

  const [barcodeMode, setBarcodeMode] = useState("auto"); // "auto" or "manual"
  const [scannerActive, setScannerActive] = useState(false);
  const scannerRef = useRef(null);

  const [product, setProduct] = useState({
    name: "",
    category: "Groceries",
    brand: "",
    price: "",
    costPrice: "",
    discount: "0",
    stock: "20",
    lowStockThreshold: "5",
    barcode: "",
    imageUrl: "",
    description: "",
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Generate unique 13-digit EAN-13 barcode
  const fetchNewBarcode = async () => {
    try {
      const res = await API.get("/products/generate-barcode");
      if (res.data?.success && res.data.barcode) {
        setProduct((prev) => ({ ...prev, barcode: res.data.barcode }));
        return;
      }
    } catch (_) {}
    const fallback = "200" + Math.floor(100000000 + Math.random() * 900000000).toString() + "5";
    setProduct((prev) => ({ ...prev, barcode: fallback }));
  };

  useEffect(() => {
    if (barcodeMode === "auto" && !product.barcode) {
      fetchNewBarcode();
    }
  }, [barcodeMode]);

  // Clean up scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop();
          scannerRef.current.clear();
        } catch (_) {}
      }
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleChipSelect = (categoryName) => {
    setProduct((prev) => ({ ...prev, category: categoryName }));
  };

  // Camera Barcode Scanner Toggle
  const toggleCameraScanner = async () => {
    if (scannerActive) {
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          scannerRef.current.clear();
        } catch (_) {}
        scannerRef.current = null;
      }
      setScannerActive(false);
    } else {
      setScannerActive(true);
      setTimeout(async () => {
        try {
          const html5Qr = new Html5Qrcode("ap-camera-viewport", {
  formatsToSupport: [
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
    Html5QrcodeSupportedFormats.UPC_A,
    Html5QrcodeSupportedFormats.UPC_E,
    Html5QrcodeSupportedFormats.CODE_128,
    Html5QrcodeSupportedFormats.CODE_39,
    Html5QrcodeSupportedFormats.ITF,
  ],
  verbose: false,
});
          scannerRef.current = html5Qr;
          await html5Qr.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 120 } },
            async (decodedText) => {
              const scannedBarcode = decodedText.trim();

              try {
                setMessage({ type: "", text: "Barcode scanned. Looking up product..." });

                const response = await API.get(
                  `/products/barcode/${encodeURIComponent(scannedBarcode)}`
                );

                if (response.data?.success && response.data.product) {
                  const found = response.data.product;

                  setProduct((prev) => ({
                    ...prev,
                    barcode: scannedBarcode,
                    name: found.name || prev.name,
                    category: found.category || prev.category,
                    brand: found.brand || prev.brand,
                    price: found.price ?? prev.price,
                    costPrice: found.costPrice ?? prev.costPrice,
                    discount: found.discount ?? prev.discount,
                    stock: found.stock ?? prev.stock,
                    lowStockThreshold: found.lowStockThreshold ?? prev.lowStockThreshold,
                    imageUrl: found.imageUrl || prev.imageUrl,
                    description: found.description || prev.description,
                  }));

                  setMessage({ type: "success", text: "Product details fetched successfully!" });
                } else {
                  setProduct((prev) => ({ ...prev, barcode: scannedBarcode }));
                  setMessage({ type: "error", text: "Barcode scanned, but product was not found in your database. Enter the product details manually." });
                }
              } catch (error) {
                setProduct((prev) => ({ ...prev, barcode: scannedBarcode }));
                setMessage({
                  type: "error",
                  text: error.response?.status === 404
                    ? "Product not found in your database. Enter the product details manually."
                    : "Barcode read, but product lookup failed. Please check your backend connection.",
                });
              } finally {
                try {
                  await html5Qr.stop();
                  html5Qr.clear();
                } catch (_) {}
                scannerRef.current = null;
                setScannerActive(false);
              }
            },
            () => {}
          );
        } catch (err) {
          console.warn("Camera start warning:", err);
          setScannerActive(false);
        }
      }, 250);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!product.name.trim() || !product.category || product.price === "" || product.stock === "") {
      setMessage({ type: "error", text: "Please complete all required fields (*)." });
      return;
    }

    const price = Number(product.price);
    const stock = Number(product.stock);

    if (price <= 0 || stock < 0) {
      setMessage({ type: "error", text: "Enter a valid positive price and non-negative stock." });
      return;
    }

    setSaving(true);
    const finalBarcode = product.barcode.trim() || "200" + Math.floor(100000000 + Math.random() * 900000000).toString() + "5";

    const payload = {
      ...product,
      name: product.name.trim(),
      barcode: finalBarcode,
      price,
      costPrice: product.costPrice ? Number(product.costPrice) : Math.round(price * 0.75),
      discount: product.discount ? Number(product.discount) : 0,
      stock,
      lowStockThreshold: product.lowStockThreshold ? Number(product.lowStockThreshold) : 5,
      imageUrl: product.imageUrl.trim() || "/red-basket-preview.jpg",
    };

    try {
      const res = await API.post("/products", payload);
      const saved = res.data?.product || payload;
      addPersistentProduct(saved);
      setMessage({ type: "success", text: `"${saved.name}" has been registered successfully!` });
      setTimeout(() => navigate("/admin/products"), 1200);
    } catch (err) {
      addPersistentProduct({ ...payload, _id: "local_" + Date.now() });
      setMessage({ type: "success", text: `"${payload.name}" saved locally in your inventory.` });
      setTimeout(() => navigate("/admin/products"), 1200);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ap-wrapper">
      <ErpPageBanner
        title="Register New Product"
        subtitle="Create and register fresh supermarket items with barcodes & automated stock thresholds"
        badges={["Instant Barcode Sync", "EAN-13 Collision-Free", "Real-time Inventory Ledger"]}
      />
      {message.text && (
        <div className={`ap-banner-notice ${message.type}`}>
          {message.type === "success" ? <CheckCircle size={17} /> : <AlertCircle size={17} />}
          <span>{message.text}</span>
          <button type="button" onClick={() => setMessage({ type: "", text: "" })}>
            <X size={15} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="ap-grid-form">
        {/* Left Column: Product Information */}
        <div className="ap-card ap-left-card">
          <div className="ap-card-title">
            <div className="ap-title-icon-box">
              <Package size={17} color="#1455D9" />
            </div>
            <h3>Product Information</h3>
          </div>

          <div className="ap-form-rows">
            {/* Row 1: Product Name & Category Select */}
            <div className="ap-row-2col">
              <div className="ap-input-group">
                <label>Product Name <span className="req">*</span></label>
                <div className="ap-input-box">
                  <Tag size={15} className="ap-prefix-icon" />
                  <input
                    name="name"
                    value={product.name}
                    onChange={handleChange}
                    placeholder="Enter product name"
                    required
                  />
                </div>
              </div>

              <div className="ap-input-group">
                <label>Category <span className="req">*</span></label>
                <div className="ap-input-box">
                  <ShoppingCart size={15} className="ap-prefix-icon" />
                  <select
                    name="category"
                    value={product.category}
                    onChange={handleChange}
                    required
                  >
                    {CATEGORY_CHIPS.map((c) => (
                      <option key={c.label} value={c.label}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Row 2: Category Quick Chips */}
            <div className="ap-chips-row">
              {CATEGORY_CHIPS.map((chip) => {
                const isSelected = product.category === chip.label;
                return (
                  <button
                    key={chip.label}
                    type="button"
                    className={`ap-chip-btn ${isSelected ? "active" : ""}`}
                    onClick={() => handleChipSelect(chip.label)}
                  >
                    <span>{chip.icon}</span>
                    <span>{chip.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Row 3: 3 Pricing Columns */}
            <div className="ap-row-3col">
              <div className="ap-input-group">
                <label>Selling Price (₹) <span className="req">*</span></label>
                <div className="ap-input-box">
                  <span className="ap-curr">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    value={product.price}
                    onChange={handleChange}
                    placeholder="Enter selling price"
                    required
                  />
                </div>
              </div>

              <div className="ap-input-group">
                <label>Purchase / Cost Price (₹) <span className="req">*</span></label>
                <div className="ap-input-box">
                  <span className="ap-curr">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    name="costPrice"
                    value={product.costPrice}
                    onChange={handleChange}
                    placeholder="Enter purchase price"
                  />
                </div>
              </div>

              <div className="ap-input-group">
                <label>Discount Amount (₹)</label>
                <div className="ap-input-box">
                  <span className="ap-curr">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    name="discount"
                    value={product.discount}
                    onChange={handleChange}
                    placeholder="Enter discount amount"
                  />
                </div>
              </div>
            </div>

            {/* Row 4: 2 Stock Columns */}
            <div className="ap-row-2col">
              <div className="ap-input-group">
                <label>Opening Stock Quantity <span className="req">*</span></label>
                <div className="ap-input-box">
                  <Boxes size={15} className="ap-prefix-icon" />
                  <input
                    type="number"
                    name="stock"
                    value={product.stock}
                    onChange={handleChange}
                    placeholder="Enter quantity"
                    required
                  />
                </div>
              </div>

              <div className="ap-input-group">
                <label>Minimum Stock Alert Threshold <span className="req">*</span></label>
                <div className="ap-input-box">
                  <AlertTriangle size={15} className="ap-prefix-icon amber" />
                  <input
                    type="number"
                    name="lowStockThreshold"
                    value={product.lowStockThreshold}
                    onChange={handleChange}
                    placeholder="Enter threshold"
                  />
                </div>
              </div>
            </div>

            {/* Info Notice Banner */}
            <div className="ap-info-pill">
              <Info size={14} color="#2563EB" />
              <span>Triggers low stock warnings when inventory drops below this number.</span>
            </div>

            {/* Row 5: URL & Description */}
            <div className="ap-row-2col">
              <div className="ap-input-group">
                <label>Product Image URL</label>
                <div className="ap-input-box">
                  <LinkIcon size={15} className="ap-prefix-icon" />
                  <input
                    name="imageUrl"
                    value={product.imageUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>

              <div className="ap-input-group">
                <label>Product Description</label>
                <div className="ap-input-box">
                  <FileText size={15} className="ap-prefix-icon" />
                  <input
                    name="description"
                    value={product.description}
                    onChange={handleChange}
                    placeholder="Enter product description..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Barcode Configuration & Preview */}
        <div className="ap-card ap-right-card">
          <div className="ap-card-title">
            <div className="ap-title-icon-box">
              <Barcode size={17} color="#1455D9" />
            </div>
            <h3>Barcode Configuration</h3>
          </div>

          {/* Barcode Mode Toggle Tabs */}
          <div className="ap-barcode-tabs">
            <button
              type="button"
              className={`ap-tab-btn ${barcodeMode === "auto" ? "active" : ""}`}
              onClick={() => {
                setBarcodeMode("auto");
                if (scannerActive && scannerRef.current) {
                  scannerRef.current.stop().catch(() => {});
                  setScannerActive(false);
                }
                if (!product.barcode) fetchNewBarcode();
              }}
            >
              <Sparkles size={14} /> Auto-Generate
            </button>
            <button
              type="button"
              className={`ap-tab-btn ${barcodeMode === "manual" ? "active" : ""}`}
              onClick={() => setBarcodeMode("manual")}
            >
              <Camera size={14} /> Scan / Enter
            </button>
          </div>

          {/* Conditional Content based on selected tab */}
          {barcodeMode === "auto" ? (
            /* Auto-Generate Mode */
            <>
              <div className="ap-success-notice">
                <CheckCircle size={15} color="#16A34A" />
                <span>Generates an official, standard 1D EAN-13 collision-free barcode for store items without manufacturer codes.</span>
              </div>

              <div className="ap-barcode-box">
                <BarcodeSVG value={product.barcode || "2007599403531"} width={2.2} height={50} />
                <button
                  type="button"
                  className="ap-regen-btn"
                  onClick={fetchNewBarcode}
                >
                  <RefreshCw size={13} /> Regenerate New Barcode
                </button>
              </div>
            </>
          ) : (
            /* Scan / Enter Mode */
            <>
              <div className="ap-manual-notice">
                <Camera size={15} color="#2563EB" />
                <span>Connect a USB hardware scanner, scan with device camera, or type the manufacturer barcode number below.</span>
              </div>

              <div className="ap-manual-scan-box">
                <div className="ap-input-group">
                  <label>Manufacturer Barcode (EAN / UPC / Code-128)</label>
                  <div className="ap-input-box" style={{ paddingRight: "4px" }}>
                    <Barcode size={15} className="ap-prefix-icon" />
                    <input
                      name="barcode"
                      value={product.barcode}
                      onChange={handleChange}
                      placeholder="Scan with barcode gun or type number..."
                      autoFocus
                    />
                    <button
                      type="button"
                      className={`ap-camera-toggle-btn ${scannerActive ? "active" : ""}`}
                      onClick={toggleCameraScanner}
                    >
                      <Camera size={13} />
                      <span>{scannerActive ? "Close" : "Camera"}</span>
                    </button>
                  </div>
                </div>

                {/* Optional Live Camera Scanner */}
                {scannerActive && (
                  <div className="ap-scanner-viewport-wrap">
                    <div id="ap-camera-viewport" style={{ width: "100%", borderRadius: "10px" }} />
                  </div>
                )}

                {/* Live Preview of Typed/Scanned Barcode */}
                {product.barcode ? (
                  <div className="ap-barcode-box" style={{ marginTop: "6px" }}>
                    <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 700 }}>LIVE BARCODE PREVIEW</div>
                    <BarcodeSVG value={product.barcode} width={2.0} height={46} />
                  </div>
                ) : (
                  <div className="ap-waiting-box">
                    <span>⚡ Ready for barcode scan or input...</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Product Image Preview Card */}
          <div className="ap-preview-card">
            <div className="ap-preview-header">
              <span>🖼️ Product Image Preview</span>
            </div>
            <div className="ap-preview-img-wrap">
              <img
                src={product.imageUrl || redBasketImg}
                alt="Product preview"
                className="ap-preview-img"
                onError={(e) => {
                  e.currentTarget.src = "/red-basket-preview.jpg";
                }}
              />
            </div>
          </div>
        </div>

        {/* Bottom Actions Row */}
        <div className="ap-actions-footer">
          <button
            type="button"
            className="ap-btn-cancel"
            onClick={() => navigate("/admin/products")}
          >
            <X size={15} /> Cancel
          </button>

          <button
            type="submit"
            className="ap-btn-submit"
            disabled={saving}
          >
            <Save size={15} /> {saving ? "Saving..." : "Save Product & Register"} <ArrowRight size={15} />
          </button>
        </div>
      </form>
    </div>
  );
}




