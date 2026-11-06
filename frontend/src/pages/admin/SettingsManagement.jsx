import React, { useState } from "react";
import {
  Settings,
  Store,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Save,
  Cpu,
  Bell,
  Smartphone,
  IndianRupee,
  RotateCcw,
  Phone,
  Mail,
  MapPin,
  Lock,
  Volume2,
  CreditCard,
  Building2,
  BadgeCheck,
  Sparkles,
} from "lucide-react";
import bannerCartImg from "../../assets/banner-cart.png";
import "./ProductManagement.css";

const SETTINGS_TABS = [
  { id: "store", label: "Store & Branch Profile", icon: Store },
  { id: "turnstile", label: "Exit Turnstiles & IoT Gates", icon: Cpu },
  { id: "payment", label: "UPI & Cashier Config", icon: QrCode },
  { id: "security", label: "Admin Security & Roles", icon: ShieldCheck },
];

export default function SettingsManagement() {
  const [activeTab, setActiveTab] = useState("store");
  const [toastMessage, setToastMessage] = useState("");

  // Store Settings State
  const [storeForm, setStoreForm] = useState({
    storeName: "Smart Supermarket - GrocerEase",
    branchCode: "STORE-001 (Downtown Central)",
    address: "100 Feet Road, Indiranagar, Bengaluru, KA 560038",
    phone: "+91 80 2345 6789",
    email: "support@grocerease.com",
    gstin: "29AAAAA0000A1Z5",
    currency: "INR (₹)",
    defaultGstRate: "5%",
  });

  // Turnstile Hardware State
  const [turnstileForm, setTurnstileForm] = useState({
    autoOpenOnApproved: true,
    gateCount: 4,
    gatePassExpiryMinutes: 15,
    soundBeepOnExit: true,
    requireCashierPinForCash: true,
  });

  // Payment Config State
  const [paymentForm, setPaymentForm] = useState({
    upiId: "smartsupermarket@upi",
    merchantName: "Smart Supermarket GrocerEase",
    enableCashAtExit: true,
    enableUpiQRFastPay: true,
    enableCardPayment: true,
  });

  const handleSave = (e) => {
    e.preventDefault();
    setToastMessage("✓ Settings saved and synced with store turnstiles successfully!");
    setTimeout(() => setToastMessage(""), 4500);
  };

  const handleReset = () => {
    if (window.confirm("Reset settings on this tab to default values?")) {
      if (activeTab === "store") {
        setStoreForm({
          storeName: "Smart Supermarket - GrocerEase",
          branchCode: "STORE-001 (Downtown Central)",
          address: "100 Feet Road, Indiranagar, Bengaluru, KA 560038",
          phone: "+91 80 2345 6789",
          email: "support@grocerease.com",
          gstin: "29AAAAA0000A1Z5",
          currency: "INR (₹)",
          defaultGstRate: "5%",
        });
      } else if (activeTab === "turnstile") {
        setTurnstileForm({
          autoOpenOnApproved: true,
          gateCount: 4,
          gatePassExpiryMinutes: 15,
          soundBeepOnExit: true,
          requireCashierPinForCash: true,
        });
      } else if (activeTab === "payment") {
        setPaymentForm({
          upiId: "smartsupermarket@upi",
          merchantName: "Smart Supermarket GrocerEase",
          enableCashAtExit: true,
          enableUpiQRFastPay: true,
          enableCardPayment: true,
        });
      }
      setToastMessage("✓ Tab configuration reset to default values.");
      setTimeout(() => setToastMessage(""), 3500);
    }
  };

  return (
    <div className="grocer-page-container">
      {/* ========================================================================= */}
      {/* 1. TOP HERO BANNER WITH SHOPPING CART & DYNAMIC CURVED RIBBON             */}
      {/* ========================================================================= */}
      <section className="pm-hero-section">
        <div className="pm-hero-left">
          <h1 className="pm-main-title">Store & Hardware Settings</h1>
          <p className="pm-main-subtitle">
            Configure supermarket branch profile, exit turnstile IoT gates, UPI billing & administrative security
          </p>
          <div className="pm-title-underline" />

          {/* Quick Info Badges */}
          <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#EFF6FF",
                border: "1px solid #DBEAFE",
                color: "#1D4ED8",
                fontWeight: 700,
                fontSize: "12px",
                padding: "6px 14px",
                borderRadius: "20px",
              }}
            >
              <Store size={14} />
              <span>Branch: STORE-001 (Active)</span>
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#ECFDF5",
                border: "1px solid #A7F3D0",
                color: "#059669",
                fontWeight: 700,
                fontSize: "12px",
                padding: "6px 14px",
                borderRadius: "20px",
              }}
            >
              <Cpu size={14} />
              <span>4 Turnstiles Online</span>
            </div>
          </div>
        </div>

        {/* Dynamic Curved Ribbon & Fresh Groceries Shopping Cart */}
        <div className="pm-hero-art">
          <div className="pm-hero-store-bg" />

          <div className="pm-hero-ribbon-wrap">
            <svg className="pm-hero-ribbon-svg" viewBox="0 0 640 150" fill="none" preserveAspectRatio="none">
              <defs>
                <linearGradient id="goldRibbonGradSettings" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0" />
                  <stop offset="15%" stopColor="#FDE047" />
                  <stop offset="50%" stopColor="#FBBF24" />
                  <stop offset="80%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#FBBF24" />
                </linearGradient>
                <linearGradient id="blueRibbonGradSettings" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0" />
                  <stop offset="15%" stopColor="#1D4ED8" />
                  <stop offset="50%" stopColor="#2563EB" />
                  <stop offset="80%" stopColor="#1E40AF" />
                  <stop offset="100%" stopColor="#1E3A8A" />
                </linearGradient>
              </defs>
              <path
                d="M 0 115 C 120 75, 220 50, 340 68 C 450 82, 540 60, 640 45 L 640 68 C 540 82, 450 105, 340 92 C 220 75, 120 100, 0 138 Z"
                fill="url(#blueRibbonGradSettings)"
                opacity="0.95"
              />
              <path
                d="M 0 108 C 120 68, 220 43, 340 61 C 450 75, 540 53, 640 38 L 640 46 C 540 61, 450 83, 340 69 C 220 51, 120 76, 0 116 Z"
                fill="url(#goldRibbonGradSettings)"
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
            marginBottom: "20px",
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
      {/* 2. NAVIGATION TABS STRIP                                                  */}
      {/* ========================================================================= */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "22px", flexWrap: "wrap" }}>
        {SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`om-tab-btn ${isActive ? "active" : ""}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                borderRadius: "14px",
                fontSize: "13.5px",
                fontWeight: 700,
                cursor: "pointer",
                border: "1px solid",
                background: isActive ? "#2563EB" : "#FFFFFF",
                color: isActive ? "#FFFFFF" : "#475569",
                borderColor: isActive ? "#2563EB" : "#E2E8F0",
                boxShadow: isActive ? "0 4px 14px rgba(37, 99, 235, 0.28)" : "0 2px 6px rgba(0,0,0,0.02)",
                transition: "all 0.15s ease",
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 3. SETTINGS CONTENT CARD                                                  */}
      {/* ========================================================================= */}
      <div className="pm-catalog-card" style={{ padding: "30px 36px", marginBottom: "48px" }}>
        <form onSubmit={handleSave}>
          {/* TAB 1: STORE & BRANCH PROFILE */}
          {activeTab === "store" && (
            <div>
              <div style={{ borderBottom: "1px solid #F1F5F9", paddingBottom: "16px", marginBottom: "24px" }}>
                <h3 style={{ margin: "0 0 4px", fontSize: "17.5px", fontWeight: "800", color: "#0F172A" }}>
                  Supermarket Branch Information
                </h3>
                <p style={{ margin: 0, fontSize: "13px", color: "#64748B" }}>
                  These branch details appear on customer digital receipts, tax invoices, and mobile order records.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "22px" }}>
                <div className="pm-form-group">
                  <label className="pm-form-label">
                    <Store size={14} color="#2563EB" />
                    <span>Supermarket Trade Name</span>
                  </label>
                  <input
                    type="text"
                    value={storeForm.storeName}
                    onChange={(e) => setStoreForm({ ...storeForm, storeName: e.target.value })}
                    className="pm-form-input"
                    placeholder="e.g. Smart Supermarket - GrocerEase"
                    required
                  />
                </div>

                <div className="pm-form-group">
                  <label className="pm-form-label">
                    <Building2 size={14} color="#2563EB" />
                    <span>Store Branch Code</span>
                  </label>
                  <input
                    type="text"
                    value={storeForm.branchCode}
                    onChange={(e) => setStoreForm({ ...storeForm, branchCode: e.target.value })}
                    className="pm-form-input"
                    placeholder="e.g. STORE-001 (Downtown Central)"
                    required
                  />
                </div>

                <div className="pm-form-group">
                  <label className="pm-form-label">
                    <BadgeCheck size={14} color="#2563EB" />
                    <span>GSTIN / Tax ID</span>
                  </label>
                  <input
                    type="text"
                    value={storeForm.gstin}
                    onChange={(e) => setStoreForm({ ...storeForm, gstin: e.target.value })}
                    className="pm-form-input"
                    placeholder="e.g. 29AAAAA0000A1Z5"
                    required
                  />
                </div>

                <div className="pm-form-group">
                  <label className="pm-form-label">
                    <IndianRupee size={14} color="#2563EB" />
                    <span>Default GST Rate</span>
                  </label>
                  <input
                    type="text"
                    value={storeForm.defaultGstRate}
                    onChange={(e) => setStoreForm({ ...storeForm, defaultGstRate: e.target.value })}
                    className="pm-form-input"
                    placeholder="e.g. 5%"
                    required
                  />
                </div>

                <div className="pm-form-group">
                  <label className="pm-form-label">
                    <Phone size={14} color="#2563EB" />
                    <span>Customer Support Phone</span>
                  </label>
                  <input
                    type="text"
                    value={storeForm.phone}
                    onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })}
                    className="pm-form-input"
                    placeholder="e.g. +91 80 2345 6789"
                  />
                </div>

                <div className="pm-form-group">
                  <label className="pm-form-label">
                    <Mail size={14} color="#2563EB" />
                    <span>Official Support Email</span>
                  </label>
                  <input
                    type="email"
                    value={storeForm.email}
                    onChange={(e) => setStoreForm({ ...storeForm, email: e.target.value })}
                    className="pm-form-input"
                    placeholder="e.g. support@grocerease.com"
                  />
                </div>

                <div className="pm-form-group" style={{ gridColumn: "span 2" }}>
                  <label className="pm-form-label">
                    <MapPin size={14} color="#2563EB" />
                    <span>Store Physical Address</span>
                  </label>
                  <input
                    type="text"
                    value={storeForm.address}
                    onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                    className="pm-form-input"
                    placeholder="Full street address, city, state, postal code"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TURNSTILE HARDWARE */}
          {activeTab === "turnstile" && (
            <div>
              <div style={{ borderBottom: "1px solid #F1F5F9", paddingBottom: "16px", marginBottom: "24px" }}>
                <h3 style={{ margin: "0 0 4px", fontSize: "17.5px", fontWeight: "800", color: "#0F172A" }}>
                  Exit Turnstiles & IoT Gate Pass Integration
                </h3>
                <p style={{ margin: 0, fontSize: "13px", color: "#64748B" }}>
                  Control automated supermarket exit turnstile hardware barriers, barcode scanners, and gate timers.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="settings-toggle-card">
                  <div className="settings-toggle-info">
                    <h4>Auto-Unlock Turnstile Upon Payment Approval</h4>
                    <p>
                      Automatically transmit open signal to Turnstile Exit Gates 1–4 when payment status transitions to Approved or Completed.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={turnstileForm.autoOpenOnApproved}
                    onChange={(e) =>
                      setTurnstileForm({ ...turnstileForm, autoOpenOnApproved: e.target.checked })
                    }
                    style={{ width: "22px", height: "22px", cursor: "pointer", accentColor: "#2563EB" }}
                  />
                </div>

                <div className="settings-toggle-card">
                  <div className="settings-toggle-info">
                    <h4>Audio Chime on Gate Pass Scan</h4>
                    <p>
                      Play high-fidelity confirmation chime when customer scans their mobile exit barcode at turnstile optical scanner.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={turnstileForm.soundBeepOnExit}
                    onChange={(e) =>
                      setTurnstileForm({ ...turnstileForm, soundBeepOnExit: e.target.checked })
                    }
                    style={{ width: "22px", height: "22px", cursor: "pointer", accentColor: "#2563EB" }}
                  />
                </div>

                <div className="settings-toggle-card">
                  <div className="settings-toggle-info">
                    <h4>Require Cashier PIN for Cash Clearance</h4>
                    <p>
                      Prompt exit security staff for verification confirmation before opening turnstile for cash payments.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={turnstileForm.requireCashierPinForCash}
                    onChange={(e) =>
                      setTurnstileForm({
                        ...turnstileForm,
                        requireCashierPinForCash: e.target.checked,
                      })
                    }
                    style={{ width: "22px", height: "22px", cursor: "pointer", accentColor: "#2563EB" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "8px" }}>
                  <div className="pm-form-group">
                    <label className="pm-form-label">Exit Pass Expiration Window</label>
                    <select
                      value={turnstileForm.gatePassExpiryMinutes}
                      onChange={(e) =>
                        setTurnstileForm({
                          ...turnstileForm,
                          gatePassExpiryMinutes: Number(e.target.value),
                        })
                      }
                      className="pm-form-select"
                    >
                      <option value={10}>10 Minutes from Checkout</option>
                      <option value={15}>15 Minutes (Recommended Standard)</option>
                      <option value={30}>30 Minutes Extended</option>
                    </select>
                  </div>

                  <div className="pm-form-group">
                    <label className="pm-form-label">Active Exit Turnstile Lanes</label>
                    <select
                      value={turnstileForm.gateCount}
                      onChange={(e) =>
                        setTurnstileForm({
                          ...turnstileForm,
                          gateCount: Number(e.target.value),
                        })
                      }
                      className="pm-form-select"
                    >
                      <option value={2}>2 Lanes (Express Exit)</option>
                      <option value={4}>4 Lanes (Standard Supermarket)</option>
                      <option value={6}>6 Lanes (High Traffic Hypermarket)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PAYMENTS & CASHIER CONFIG */}
          {activeTab === "payment" && (
            <div>
              <div style={{ borderBottom: "1px solid #F1F5F9", paddingBottom: "16px", marginBottom: "24px" }}>
                <h3 style={{ margin: "0 0 4px", fontSize: "17.5px", fontWeight: "800", color: "#0F172A" }}>
                  Payment Gateway & UPI Billing Configuration
                </h3>
                <p style={{ margin: 0, fontSize: "13px", color: "#64748B" }}>
                  Dynamic QR codes generated on customer mobile self-checkouts direct customer payments to this UPI Virtual Payment Address.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "22px", marginBottom: "24px" }}>
                <div className="pm-form-group">
                  <label className="pm-form-label">
                    <QrCode size={14} color="#2563EB" />
                    <span>Merchant UPI ID (VPA)</span>
                  </label>
                  <input
                    type="text"
                    value={paymentForm.upiId}
                    onChange={(e) => setPaymentForm({ ...paymentForm, upiId: e.target.value })}
                    className="pm-form-input"
                    placeholder="e.g. storename@upi"
                    required
                  />
                </div>

                <div className="pm-form-group">
                  <label className="pm-form-label">
                    <Building2 size={14} color="#2563EB" />
                    <span>Merchant Display Name</span>
                  </label>
                  <input
                    type="text"
                    value={paymentForm.merchantName}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, merchantName: e.target.value })
                    }
                    className="pm-form-input"
                    placeholder="e.g. Smart Supermarket GrocerEase"
                    required
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="settings-toggle-card">
                  <div className="settings-toggle-info">
                    <h4>Dynamic UPI Fast Pay QR Codes</h4>
                    <p>
                      Generate live UPI intent QR codes on customer mobile self-checkout screen with exact invoice subtotal.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={paymentForm.enableUpiQRFastPay}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, enableUpiQRFastPay: e.target.checked })
                    }
                    style={{ width: "22px", height: "22px", cursor: "pointer", accentColor: "#2563EB" }}
                  />
                </div>

                <div className="settings-toggle-card">
                  <div className="settings-toggle-info">
                    <h4>Enable "Cash at Exit" Self-Checkout Option</h4>
                    <p>
                      Allow shoppers to select cash and receive a temporary Gate Pass barcode to settle at the exit cashier counter.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={paymentForm.enableCashAtExit}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, enableCashAtExit: e.target.checked })
                    }
                    style={{ width: "22px", height: "22px", cursor: "pointer", accentColor: "#2563EB" }}
                  />
                </div>

                <div className="settings-toggle-card">
                  <div className="settings-toggle-info">
                    <h4>Enable Card / Swipe POS Integration</h4>
                    <p>
                      Accept debit and credit cards via integrated supermarket payment terminal devices.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={paymentForm.enableCardPayment}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, enableCardPayment: e.target.checked })
                    }
                    style={{ width: "22px", height: "22px", cursor: "pointer", accentColor: "#2563EB" }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ADMIN SECURITY & ROLES */}
          {activeTab === "security" && (
            <div>
              <div style={{ borderBottom: "1px solid #F1F5F9", paddingBottom: "16px", marginBottom: "24px" }}>
                <h3 style={{ margin: "0 0 4px", fontSize: "17.5px", fontWeight: "800", color: "#0F172A" }}>
                  Admin Authentication & Role-Based Access
                </h3>
                <p style={{ margin: 0, fontSize: "13px", color: "#64748B" }}>
                  Super Admin credentials, payment approval authority, and hardware access clearance.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "22px", marginBottom: "24px" }}>
                <div className="pm-form-group">
                  <label className="pm-form-label">
                    <ShieldCheck size={14} color="#2563EB" />
                    <span>Administrator Name</span>
                  </label>
                  <input
                    type="text"
                    defaultValue="Eleanor Pena"
                    className="pm-form-input"
                    readOnly
                  />
                </div>

                <div className="pm-form-group">
                  <label className="pm-form-label">
                    <Lock size={14} color="#2563EB" />
                    <span>Security Clearance Role</span>
                  </label>
                  <input
                    type="text"
                    value="Super Admin (Full Read, Write & Approval Rights)"
                    className="pm-form-input"
                    readOnly
                  />
                </div>

                <div className="pm-form-group" style={{ gridColumn: "span 2" }}>
                  <label className="pm-form-label">
                    <Mail size={14} color="#2563EB" />
                    <span>Authorized Admin Email</span>
                  </label>
                  <input
                    type="email"
                    defaultValue="admin@grocerease.com"
                    className="pm-form-input"
                    readOnly
                  />
                </div>
              </div>

              <div className="settings-toggle-card">
                <div className="settings-toggle-info">
                  <h4>Emergency Turnstile Lockdown Override</h4>
                  <p>
                    Enable immediate turnstile gate lock override in case of power failure or store evacuation protocol.
                  </p>
                </div>
                <span
                  style={{
                    background: "#EFF6FF",
                    color: "#1D4ED8",
                    padding: "4px 12px",
                    borderRadius: "12px",
                    fontWeight: 700,
                    fontSize: "12px",
                    border: "1px solid #DBEAFE",
                  }}
                >
                  Override Ready
                </span>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* ACTION FOOTER BAR                                                     */}
          {/* ===================================================================== */}
          <div
            style={{
              marginTop: "36px",
              paddingTop: "20px",
              borderTop: "1px solid #F1F5F9",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "14px",
            }}
          >
            <button
              type="button"
              onClick={handleReset}
              className="action-pill-btn refresh"
              style={{ padding: "10px 18px", fontSize: "13px" }}
            >
              <RotateCcw size={14} />
              <span>Reset Tab to Defaults</span>
            </button>

            <button
              type="submit"
              className="pm-btn-save"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "11px 26px",
                fontSize: "13.5px",
                boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)",
              }}
            >
              <Save size={16} />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
