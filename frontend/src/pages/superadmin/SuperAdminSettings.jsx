import React, { useState } from "react";
import {
  ShieldCheck,
  CreditCard,
  Sliders,
  Database,
  Lock,
  CheckCircle2,
  AlertCircle,
  Save,
  Server,
} from "lucide-react";
import "./SuperAdmin.css";

export default function SuperAdminSettings() {
  const [currency, setCurrency] = useState("INR");
  const [taxRate, setTaxRate] = useState("5");
  const [gateTimeoutSeconds, setGateTimeoutSeconds] = useState("30");
  const [toastMessage, setToastMessage] = useState("");

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setToastMessage("✓ Platform SaaS configurations updated successfully.");
    setTimeout(() => setToastMessage(""), 3500);
  };

  return (
    <div className="sa-page-container">
      {/* Toast */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background: "#0f172a",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: "12px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            zIndex: 2000,
            fontSize: "14px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <CheckCircle2 size={16} color="#4ade80" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header */}
      <div className="sa-page-header">
        <div className="sa-page-header-content">
          <h1>SaaS Platform Configuration & Security</h1>
          <p>Multi-tenant architecture parameters, subscription tiers, and tenant isolation diagnostics.</p>
        </div>
      </div>

      {/* 2. Tenant Isolation Audit Card */}
      <div className="sa-section-card" style={{ padding: "1.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.25rem" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              background: "#ecfdf5",
              color: "#059669",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800 }}>Multi-Tenant Cryptographic Partitioning</h2>
            <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#64748b" }}>
              Active isolation status across all registered supermarket tenants
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
          <div style={{ padding: "1rem", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#059669", fontWeight: 700, fontSize: "13px" }}>
              <CheckCircle2 size={16} />
              <span>Database Query Partitioning</span>
            </div>
            <p style={{ margin: "6px 0 0 0", fontSize: "12px", color: "#64748b", lineHeight: 1.5 }}>
              All Mongoose queries strictly enforce <code>req.supermarketId</code> from validated JWT session headers.
            </p>
          </div>

          <div style={{ padding: "1rem", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#059669", fontWeight: 700, fontSize: "13px" }}>
              <CheckCircle2 size={16} />
              <span>Offline LocalStorage Scoping</span>
            </div>
            <p style={{ margin: "6px 0 0 0", fontSize: "12px", color: "#64748b", lineHeight: 1.5 }}>
              Browser demo storage namespaces data under <code>grocerease_real_products_[storeId]</code>.
            </p>
          </div>

          <div style={{ padding: "1rem", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#059669", fontWeight: 700, fontSize: "13px" }}>
              <CheckCircle2 size={16} />
              <span>Separate Admin Credentials</span>
            </div>
            <p style={{ margin: "6px 0 0 0", fontSize: "12px", color: "#64748b", lineHeight: 1.5 }}>
              Store Admins can only log in to their assigned store and cannot view or alter other supermarkets.
            </p>
          </div>
        </div>
      </div>

      {/* 3. SaaS Subscription Tiers */}
      <div className="sa-section-card" style={{ padding: "1.75rem" }}>
        <h2 style={{ margin: "0 0 0.5rem 0", fontSize: "1.15rem", fontWeight: 800 }}>SaaS Subscription Tiers</h2>
        <p style={{ margin: "0 0 1.5rem 0", fontSize: "13px", color: "#64748b" }}>
          Feature sets allocated when creating or upgrading tenant supermarkets.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
          {/* Starter Plan */}
          <div style={{ padding: "1.25rem", border: "1.5px solid #e2e8f0", borderRadius: "14px", background: "#ffffff" }}>
            <span className="sa-badge" style={{ background: "#f1f5f9", color: "#475569" }}>Starter Tier</span>
            <h3 style={{ margin: "0.75rem 0 0.25rem 0", fontSize: "1.3rem", fontWeight: 800 }}>&#8377;4,999<span style={{ fontSize: "12px", color: "#64748b" }}>/month</span></h3>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 1rem 0" }}>Ideal for single-counter boutique convenience marts.</p>
            <ul style={{ paddingLeft: "1.1rem", fontSize: "12.5px", color: "#475569", lineHeight: 1.6, margin: 0 }}>
              <li>Up to 250 catalog SKUs</li>
              <li>Standard Barcode Generator (EAN-13)</li>
              <li>Basic Inventory Alerts</li>
              <li>Single Store Admin account</li>
            </ul>
          </div>

          {/* Professional Plan */}
          <div style={{ padding: "1.25rem", border: "1.5px solid #93c5fd", borderRadius: "14px", background: "#f0f7ff" }}>
            <span className="sa-badge active">Professional Tier</span>
            <h3 style={{ margin: "0.75rem 0 0.25rem 0", fontSize: "1.3rem", fontWeight: 800 }}>&#8377;12,499<span style={{ fontSize: "12px", color: "#64748b" }}>/month</span></h3>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 1rem 0" }}>For growing multi-aisle grocery stores with self-checkout.</p>
            <ul style={{ paddingLeft: "1.1rem", fontSize: "12.5px", color: "#475569", lineHeight: 1.6, margin: 0 }}>
              <li>Up to 2,000 catalog SKUs</li>
              <li>Customer Web Mirror & QR Checkout</li>
              <li>Daily Sales & GST Tax Reports</li>
              <li>Real-time stock deduction</li>
            </ul>
          </div>

          {/* Enterprise Plan */}
          <div style={{ padding: "1.25rem", border: "1.5px solid #a855f7", borderRadius: "14px", background: "#faf5ff" }}>
            <span className="sa-badge plan">Enterprise Flagship</span>
            <h3 style={{ margin: "0.75rem 0 0.25rem 0", fontSize: "1.3rem", fontWeight: 800 }}>&#8377;29,999<span style={{ fontSize: "12px", color: "#64748b" }}>/month</span></h3>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 1rem 0" }}>High-volume flagship hypermarkets with automated gates.</p>
            <ul style={{ paddingLeft: "1.1rem", fontSize: "12.5px", color: "#475569", lineHeight: 1.6, margin: 0 }}>
              <li>Unlimited SKUs & Barcode Generation</li>
              <li>Automated Turnstile QR Verification</li>
              <li>Loss-Prevention Security Station</li>
              <li>Priority SLA & Real-time Webhooks</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 4. Global Settings Form */}
      <form onSubmit={handleSaveSettings} className="sa-section-card" style={{ padding: "1.75rem" }}>
        <h2 style={{ margin: "0 0 0.5rem 0", fontSize: "1.15rem", fontWeight: 800 }}>Platform Operational Defaults</h2>
        <p style={{ margin: "0 0 1.25rem 0", fontSize: "13px", color: "#64748b" }}>
          Default settings applied across newly initialized supermarket environments.
        </p>

        <div className="sa-form-grid-2">
          <div className="sa-form-group">
            <label className="sa-form-label">Platform Currency</label>
            <select
              className="sa-select-input"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="INR">Indian Rupee (&#8377; INR)</option>
              <option value="USD">US Dollar ($ USD)</option>
              <option value="EUR">Euro (&euro; EUR)</option>
            </select>
          </div>

          <div className="sa-form-group">
            <label className="sa-form-label">Default GST Tax Percentage (%)</label>
            <input
              type="number"
              className="sa-form-input"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
            />
          </div>

          <div className="sa-form-group">
            <label className="sa-form-label">Turnstile Clearance Auto-Lock Window (seconds)</label>
            <input
              type="number"
              className="sa-form-input"
              value={gateTimeoutSeconds}
              onChange={(e) => setGateTimeoutSeconds(e.target.value)}
            />
          </div>
        </div>

        <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" className="sa-btn-primary">
            <Save size={15} />
            <span>Save Platform Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}

