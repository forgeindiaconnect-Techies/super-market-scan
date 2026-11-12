import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  ShoppingBag, QrCode, Search, Plus, Minus,
  Trash2, X, Camera, LoaderCircle
} from "lucide-react";
import API from "../../services/api";
import { printSupermarketReceipt } from "../../utils/receiptGenerator";

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

    const shopperName = customerName?.trim() || localStorage.getItem("grocerease_customer_name") || "Mobile Shopper";
    API.post("/orders/cart-activity", {
      customerName: shopperName,
      productName: product.name,
      productId: product._id,
      quantity: 1,
      price: product.price,
      action: "added",
    }).catch(() => {});

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

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState(() => {
    return localStorage.getItem("grocerease_customer_name") || "";
  });
  const [customerPhone, setCustomerPhone] = useState(() => {
    return localStorage.getItem("grocerease_customer_phone") || "";
  });
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (customerName.trim()) {
      localStorage.setItem("grocerease_customer_name", customerName.trim());
    }
    if (customerPhone.trim()) {
      localStorage.setItem("grocerease_customer_phone", customerPhone.trim());
    }

    setPlacingOrder(true);
    setError("");

    try {
      const itemsPayload = cart.map((item) => ({
        productId: item._id,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        barcode: item.barcode,
        category: item.category,
      }));

      const res = await API.post("/orders/checkout", {
        items: itemsPayload,
        paymentMethod,
        customer: {
          name: customerName.trim() || "Guest Shopper",
          phone: customerPhone.trim() || "+91 98765 00000",
          address: customerAddress.trim() || "",
          email: `${(customerName || "guest").toLowerCase().replace(/\s+/g, "")}@customer.com`,
        },
      });

      if (res.data?.success && res.data.order) {
        setCompletedOrder(res.data.order);
        setCart([]);
        setCheckoutOpen(false);
      } else {
        setError(res.data?.message || "Checkout failed. Please try again.");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err.response?.data?.message || "Failed to process checkout.");
    } finally {
      setPlacingOrder(false);
    }
  };

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

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
          <h2 style={{ margin: 0 }}>Total: ₹{total.toLocaleString("en-IN")}</h2>
          <button
            className="primary-button"
            disabled={cart.length === 0}
            onClick={() => setCheckoutOpen(true)}
            style={{
              background: "#16a34a",
              color: "#ffffff",
              padding: "10px 24px",
              borderRadius: "10px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            Proceed to Checkout →
          </button>
        </div>

        {loading && <LoaderCircle className="spin" />}
      </section>

      {/* Checkout Modal */}
      {checkoutOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              padding: 24,
              maxWidth: 440,
              width: "100%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Complete Checkout</h3>
              <button
                type="button"
                onClick={() => setCheckoutOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCheckout} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
                Full Name
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    marginTop: 4,
                    boxSizing: "border-box",
                  }}
                />
              </label>

              <label style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
                Phone Number (Mandatory)
                <input
                  type="text"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    marginTop: 4,
                    boxSizing: "border-box",
                  }}
                />
              </label>

              <label style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
                Delivery / Billing Address <span style={{ color: "#64748b", fontWeight: 400 }}>(Optional)</span>
                <input
                  type="text"
                  placeholder="Street, Area, Landmark (optional)"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    marginTop: 4,
                    boxSizing: "border-box",
                  }}
                />
              </label>

              <label style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
                Payment Method
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    marginTop: 4,
                    boxSizing: "border-box",
                  }}
                >
                  <option value="UPI">UPI (PhonePe, GPay, Paytm)</option>
                  <option value="Cash">Cash at Supermarket Exit</option>
                  <option value="Card">Debit / Credit Card</option>
                </select>
              </label>

              <div
                style={{
                  background: "#f8fafc",
                  padding: 12,
                  borderRadius: 8,
                  fontSize: 13,
                  color: "#475569",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>Items: {itemCount}</span>
                <strong>Grand Total: ₹{total.toLocaleString("en-IN")}</strong>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setCheckoutOpen(false)}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    background: "#f1f5f9",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={placingOrder}
                  style={{
                    flex: 2,
                    padding: "10px 16px",
                    borderRadius: 8,
                    border: "none",
                    background: "#2563eb",
                    color: "#ffffff",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {placingOrder ? "Processing..." : `Pay ₹${total.toLocaleString("en-IN")}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Completed Order Success Modal */}
      {completedOrder && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              padding: 24,
              maxWidth: 440,
              width: "100%",
              textAlign: "center",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "#dcfce7",
                color: "#16a34a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
                fontSize: 26,
              }}
            >
              ✓
            </div>
            <h3 style={{ margin: "0 0 6px 0", fontSize: 20, fontWeight: 800 }}>Order Placed Successfully!</h3>
            <p style={{ margin: "0 0 14px 0", color: "#64748b", fontSize: 13 }}>
              Order #{completedOrder.orderNumber} is registered in the supermarket system.
            </p>

            <div
              style={{
                background: "#f8fafc",
                border: "1px dashed #cbd5e1",
                borderRadius: 10,
                padding: 14,
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Transaction ID:</div>
              <strong style={{ fontSize: 14.5, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 800, color: "#0f172a", letterSpacing: "0.3px" }}>
                {completedOrder.paymentId || completedOrder.transactionId || `TXN-${(completedOrder.orderNumber || "").replace(/^ORD-/, "")}`}
              </strong>
              <div style={{ marginTop: 8, fontSize: 12, color: "#2563eb", fontWeight: 700 }}>
                Status: {completedOrder.paymentStatus} ({completedOrder.paymentMethod})
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", flexDirection: "column" }}>
              <button
                type="button"
                onClick={() => printSupermarketReceipt(completedOrder)}
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: "1.5px solid #2563eb",
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                📄 Print / Download Official Tax Invoice
              </button>

              <button
                type="button"
                onClick={() => setCompletedOrder(null)}
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: "#2563eb",
                  color: "#ffffff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
