import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  ShoppingBag, QrCode, Search, Plus, Minus,
  Trash2, X, Camera, LoaderCircle
} from "lucide-react";
import API from "../../services/api";

export default function CustomerDashboard() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const scannerRef = useRef(null);
  const startingRef = useRef(false);
  const scannedRef = useRef(false);

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity, 0
  );

  const itemCount = cart.reduce(
    (sum, item) => sum + item.quantity, 0
  );

  const loadProducts = async () => {
    try {
      const { data } = await API.get("/products");
      setProducts(data.products || []);
    } catch {
      setError("Unable to load products. Check your backend connection.");
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const addToCart = (product) => {
    if (product.stock <= 0) {
      setError("This product is out of stock.");
      return;
    }

    setCart((current) => {
      const existing = current.find((item) => item._id === product._id);

      if (existing) {
        if (existing.quantity >= product.stock) {
          setError("Maximum available stock reached.");
          return current;
        }

        return current.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...current, { ...product, quantity: 1 }];
    });

    setError("");
  };

  const updateQuantity = (id, amount) => {
    setCart((current) =>
      current
        .map((item) =>
          item._id === id
            ? { ...item, quantity: item.quantity + amount }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const lookupBarcode = async (barcode) => {
    setLoading(true);
    setError("");

    try {
      const { data } = await API.get(
        `/products/barcode/${encodeURIComponent(barcode)}`
      );

      addToCart(data.product);
    } catch (err) {
      setError(
        err.response?.data?.message || "Product not found."
      );
    } finally {
      setLoading(false);
    }
  };

  const stopScanner = async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;

    if (scanner) {
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
        await scanner.clear();
      } catch (err) {
        console.warn("Scanner cleanup:", err.message);
      }
    }

    startingRef.current = false;
    setScannerOpen(false);
  };

  const startScanner = async () => {
    if (startingRef.current) return;

    startingRef.current = true;
    scannedRef.current = false;
    setError("");
    setScannerOpen(true);

    const scanner = new Html5Qrcode("barcode-reader");
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          formatsToSupport: [
            0,  // QR_CODE
            2,  // EAN_13
            3,  // EAN_8
            4,  // UPC_A
            5,  // UPC_E
            6,  // CODE_39
            7,  // CODE_93
            8,  // CODE_128
            9,  // ITF
            10  // ITF-14
          ]
        },
        async (decodedText) => {
          if (scannedRef.current) return;

          scannedRef.current = true;
          await stopScanner();
          await lookupBarcode(decodedText.trim());
        },
        () => {}
      );
    } catch (err) {
      console.error("Camera error:", err);
      await stopScanner();
      setError(
        "Camera access failed. Allow camera permission and use HTTPS or localhost."
      );
    } finally {
      startingRef.current = false;
    }
  };

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;

      if (scanner) {
        if (scanner.isScanning) {
          scanner.stop()
            .then(() => scanner.clear())
            .catch(console.error);
        } else {
          scanner.clear().catch(console.error);
        }
        scannerRef.current = null;
      }
    };
  }, []);

  const filteredProducts = products.filter((product) =>
    `${product.name} ${product.brand || ""} ${product.category}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="customer-dashboard">
      <section className="customer-hero">
        <div className="hero-badge">
          <ShoppingBag size={16} />
          Smart Self-Checkout
        </div>

        <h1>Welcome to Smart Supermarket</h1>
        <p>Scan products, add them to your cart and shop faster.</p>

        <button className="primary-button" onClick={startScanner}>
          <QrCode size={19} />
          Scan Product Barcode
        </button>
      </section>

      {error && (
        <div style={{
          background: "#fff1f0",
          color: "#b42318",
          padding: 12,
          borderRadius: 10,
          marginTop: 16
        }}>
          {error}
          <button onClick={() => setError("")} style={{ marginLeft: 10 }}>
            <X size={15} />
          </button>
        </div>
      )}

      {scannerOpen && (
        <section className="dashboard-panel" style={{ marginTop: 20 }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <h2><Camera size={20} /> Scan Barcode</h2>
            <button onClick={stopScanner}><X /></button>
          </div>

          <p>Point your rear camera at the product's original barcode.</p>
          <div id="barcode-reader" style={{ width: "100%" }} />
        </section>
      )}

      <section className="dashboard-panel" style={{ marginTop: 24 }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap"
        }}>
          <h2>Available Products</h2>
          <button onClick={loadProducts}>Refresh</button>
        </div>

        <div style={{ position: "relative", margin: "16px 0" }}>
          <Search size={18} style={{
            position: "absolute", left: 12, top: 13
          }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            style={{
              width: "100%", padding: "12px 12px 12px 40px",
              boxSizing: "border-box", borderRadius: 10,
              border: "1px solid #ddd"
            }}
          />
        </div>

        {filteredProducts.length === 0 ? (
          <p>No products available.</p>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: 16
          }}>
            {filteredProducts.map((product) => (
              <article key={product._id} style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12, padding: 14
              }}>
                {product.imageUrl && (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    style={{
                      width: "100%", height: 130,
                      objectFit: "contain"
                    }}
                  />
                )}
                <h3>{product.name}</h3>
                <p>{product.brand} · {product.category}</p>
                <strong>₹{product.price.toLocaleString("en-IN")}</strong>
                <p>Stock: {product.stock}</p>
                <button
                  className="primary-button"
                  disabled={product.stock <= 0}
                  onClick={() => addToCart(product)}
                >
                  <Plus size={16} /> Add to Cart
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-panel" style={{ marginTop: 24 }}>
        <h2>
          <ShoppingBag size={20} /> Shopping Cart ({itemCount})
        </h2>

        {cart.length === 0 ? (
          <p>Your cart is empty. Scan a product to get started.</p>
        ) : (
          cart.map((item) => (
            <div key={item._id} style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", gap: 12,
              padding: "12px 0", borderBottom: "1px solid #eee"
            }}>
              <div>
                <strong>{item.name}</strong>
                <p>₹{item.price.toLocaleString("en-IN")} each</p>
              </div>

              <div style={{
                display: "flex", alignItems: "center", gap: 10
              }}>
                <button onClick={() => updateQuantity(item._id, -1)}>
                  <Minus size={16} />
                </button>
                {item.quantity}
                <button
                  disabled={item.quantity >= item.stock}
                  onClick={() => updateQuantity(item._id, 1)}
                >
                  <Plus size={16} />
                </button>
                <button onClick={() => updateQuantity(item._id, -item.quantity)}>
                  <Trash2 size={16} />
                </button>
              </div>

              <strong>
                ₹{(item.price * item.quantity).toLocaleString("en-IN")}
              </strong>
            </div>
          ))
        )}

        <h2 style={{ textAlign: "right", marginTop: 20 }}>
          Total: ₹{total.toLocaleString("en-IN")}
        </h2>

        {loading && <LoaderCircle className="spin" />}
      </section>
    </div>
  );
}
