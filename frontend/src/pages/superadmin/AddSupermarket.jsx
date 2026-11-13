import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Store,
  Crown,
  CreditCard,
  Plus,
  Users,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Check,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  Mail,
  Zap,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import API from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import modernSupermarketBanner from "C:/Users/Forgeindiaconnect/.gemini/antigravity/brain/ea64ddf2-7b46-4b95-b6c4-9ce99c9e82b3/supermarket_card_banner_1794572842698.jpg";
import "./SuperAdmin.css";

export default function AddSupermarket() {
  const navigate = useNavigate();
  const { switchSupermarket, loadSupermarkets } = useAuth();

  const [supermarketName, setSupermarketName] = useState("");
  const [storeCode, setStoreCode] = useState("");
  const [city, setCity] = useState("Bangalore");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("+91 ");
  const [email, setEmail] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("Premium");
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "", storeData: null });

  // Auto-generate store code and username as user types name
  const handleNameChange = (val) => {
    setSupermarketName(val);
    if (!storeCode || storeCode.startsWith("STR-")) {
      const codeSuffix = val.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase();
      if (codeSuffix) {
        setStoreCode(`STR-${codeSuffix}${Math.floor(10 + Math.random() * 90)}`);
      } else {
        setStoreCode("");
      }
    }
    if (!adminUsername || adminUsername.endsWith("_admin")) {
      const slug = val.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10);
      if (slug) {
        setAdminUsername(`${slug}_admin`);
        if (!email || email.includes("@")) {
          setEmail(`${slug}@grocerease.store`);
        }
      }
    }
  };

  const handleCreateSupermarket = async (e) => {
    e.preventDefault();
    setFeedback({ type: "", message: "", storeData: null });

    if (!supermarketName.trim()) {
      setFeedback({ type: "error", message: "Please enter a supermarket name." });
      return;
    }
    if (!adminUsername.trim()) {
      setFeedback({ type: "error", message: "Please enter an admin username." });
      return;
    }
    if (!adminPassword.trim() || adminPassword.length < 6) {
      setFeedback({ type: "error", message: "Password must be at least 6 characters long." });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: supermarketName.trim(),
        code: storeCode.trim() || `STR-${Math.floor(1000 + Math.random() * 9000)}`,
        city: city.trim() || "Bangalore",
        address: address.trim() || "Main Road",
        phone: phone.trim() || "+91 98765 43210",
        email: email.trim().toLowerCase() || `${adminUsername.trim()}@grocerease.store`,
        adminUsername: adminUsername.trim().toLowerCase(),
        adminPassword: adminPassword,
        adminName: `${supermarketName.trim()} Admin`,
        plan: selectedPlan || "Premium",
        status: "Active",
      };

      const res = await API.post("/super-admin/supermarkets", payload);

      if (res.data?.success) {
        const createdStore = res.data.supermarket || payload;
        setFeedback({
          type: "success",
          message: `Supermarket "${createdStore.name}" registered and deployed successfully!`,
          storeData: {
            ...createdStore,
            adminPassword: adminPassword,
            adminUsername: payload.adminUsername,
          },
        });

        // Refresh global stores cache
        if (loadSupermarkets) await loadSupermarkets();
      } else {
        setFeedback({
          type: "error",
          message: res.data?.message || "Failed to create supermarket.",
        });
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.response?.data?.message || "Network error while registering supermarket.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLaunchStore = (store) => {
    if (switchSupermarket) {
      switchSupermarket(store);
      navigate("/admin");
    }
  };

  const handleResetForAnother = () => {
    setSupermarketName("");
    setStoreCode("");
    setAddress("");
    setEmail("");
    setAdminUsername("");
    setAdminPassword("");
    setSelectedPlan("Premium");
    setFeedback({ type: "", message: "", storeData: null });
  };

  return (
    <div className="sa-add-page-container">
      {/* 1. Header & Navigation Breadcrumb */}
      <div className="sa-add-header-card">
        <div className="sa-add-header-left">
          <div className="sa-breadcrumb">
            <Link to="/super-admin" className="sa-bc-link">Dashboard</Link>
            <ChevronRight size={14} className="sa-bc-sep" />
            <Link to="/super-admin/supermarkets" className="sa-bc-link">Supermarket Management</Link>
            <ChevronRight size={14} className="sa-bc-sep" />
            <span className="sa-bc-current">Add Supermarket</span>
          </div>
          <h1 className="sa-add-page-title">Add New Supermarket</h1>
          <p className="sa-add-page-subtitle">
            Deploy an isolated tenant store, configure branding, and assign store administrator credentials
          </p>
        </div>

        <div className="sa-add-header-actions">
          <Link to="/super-admin" className="sa-btn-secondary">
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </Link>
          <Link to="/super-admin/supermarkets" className="sa-btn-secondary">
            <Store size={16} />
            <span>Manage Supermarkets</span>
          </Link>
        </div>
      </div>

      {/* 2. Success Banner (when supermarket created) */}
      {feedback.type === "success" && feedback.storeData && (
        <div className="sa-created-success-card">
          <div className="sa-success-header">
            <div className="sa-success-icon-wrap">
              <CheckCircle2 size={24} color="#15803d" />
            </div>
            <div className="sa-success-title-box">
              <h3>{feedback.storeData.name} Successfully Registered!</h3>
              <p>The supermarket tenant has been provisioned with dedicated database scoping.</p>
            </div>
          </div>

          <div className="sa-success-creds-grid">
            <div className="sa-cred-box">
              <span className="sa-cred-box-label">Store Code</span>
              <strong className="sa-cred-box-val">{feedback.storeData.code || "STR-NEW"}</strong>
            </div>
            <div className="sa-cred-box">
              <span className="sa-cred-box-label">Admin Username</span>
              <strong className="sa-cred-box-val">{feedback.storeData.adminUsername}</strong>
            </div>
            <div className="sa-cred-box">
              <span className="sa-cred-box-label">Admin Password</span>
              <strong className="sa-cred-box-val">{feedback.storeData.adminPassword}</strong>
            </div>
            <div className="sa-cred-box">
              <span className="sa-cred-box-label">Plan Active</span>
              <strong className="sa-cred-box-val sa-plan-highlight">{feedback.storeData.plan || "Premium"}</strong>
            </div>
          </div>

          <div className="sa-success-actions-row">
            <button
              type="button"
              className="sa-btn-primary"
              onClick={() => handleLaunchStore(feedback.storeData)}
            >
              <ExternalLink size={16} />
              <span>Launch Store Tenant Portal</span>
            </button>
            <Link to="/super-admin/supermarkets" className="sa-btn-secondary">
              <Store size={16} />
              <span>View All Supermarkets</span>
            </Link>
            <button
              type="button"
              className="sa-btn-outline"
              onClick={handleResetForAnother}
            >
              <Plus size={16} />
              <span>Register Another Supermarket</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Main Center Split Section */}
      <section className="sa-center-split-section">
        {/* Left Card: 3D Supermarket Storefront Banner + Add New Supermarket Form */}
        <div className="sa-split-form-card">
          {/* Left Column: 8K Photorealistic 3D Storefront Image Visual */}
          <div className="sa-form-visual-side">
            <div className="sa-visual-img-container">
              <img
                src={modernSupermarketBanner}
                alt="3D Supermarket Storefront with Cart"
                className="sa-visual-cover-img"
                onError={(e) => {
                  e.target.src = "/supermarket-storefront-banner.jpg";
                }}
              />
              <div className="sa-visual-overlay-gradient" />
              <div className="sa-visual-badge-pill">
                <Sparkles size={14} className="sa-badge-sparkle" />
                <span>Smart Multi-Tenant Cloud</span>
              </div>
            </div>

            {/* Quick Feature Strip */}
            <div className="sa-visual-perks-strip">
              <div className="sa-perk-item">
                <Zap size={14} className="sa-perk-icon" />
                <span>Zero-Downtime Provisioning</span>
              </div>
              <div className="sa-perk-item">
                <ShieldCheck size={14} className="sa-perk-icon" />
                <span>100% Tenant Data Isolation</span>
              </div>
            </div>
          </div>

          {/* Right Column: Add New Supermarket Form */}
          <div className="sa-form-input-side">
            <div className="sa-form-header">
              <h2 className="sa-form-title">Supermarket Registration</h2>
              <p className="sa-form-subtitle">
                Enter the supermarket credentials and tenant deployment configurations
              </p>
            </div>

            {feedback.message && feedback.type === "error" && (
              <div className="sa-form-alert error">
                <AlertCircle size={16} />
                <span>{feedback.message}</span>
              </div>
            )}

            <form
              onSubmit={handleCreateSupermarket}
              className="sa-registration-form"
              autoComplete="off"
            >
              {/* Dummy hidden inputs to absorb browser autofill */}
              <input
                type="text"
                name="fake_user"
                style={{ position: "absolute", opacity: 0, height: 0, width: 0, pointerEvents: "none" }}
                tabIndex={-1}
                autoComplete="username"
              />
              <input
                type="password"
                name="fake_pass"
                style={{ position: "absolute", opacity: 0, height: 0, width: 0, pointerEvents: "none" }}
                tabIndex={-1}
                autoComplete="current-password"
              />

              <div className="sa-form-row-2">
                {/* Field 1: Supermarket Name */}
                <div className="sa-form-group-v2">
                  <label className="sa-field-label">
                    Supermarket Name <span className="req-star">*</span>
                  </label>
                  <div className="sa-input-icon-box">
                    <Store size={16} className="sa-box-icon" />
                    <input
                      type="text"
                      className="sa-text-input"
                      placeholder="e.g. Apex Hypermarket"
                      value={supermarketName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Field 2: Store Code */}
                <div className="sa-form-group-v2">
                  <label className="sa-field-label">Store Code</label>
                  <div className="sa-input-icon-box">
                    <Building2 size={16} className="sa-box-icon" />
                    <input
                      type="text"
                      className="sa-text-input"
                      placeholder="e.g. STR-APEX01"
                      value={storeCode}
                      onChange={(e) => setStoreCode(e.target.value.toUpperCase())}
                    />
                  </div>
                </div>
              </div>

              <div className="sa-form-row-2">
                {/* Field 3: City / Location */}
                <div className="sa-form-group-v2">
                  <label className="sa-field-label">City / Region</label>
                  <div className="sa-input-icon-box">
                    <MapPin size={16} className="sa-box-icon" />
                    <input
                      type="text"
                      className="sa-text-input"
                      placeholder="e.g. Bangalore, Indiranagar"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                </div>

                {/* Field 4: Store Contact Email */}
                <div className="sa-form-group-v2">
                  <label className="sa-field-label">Store Email</label>
                  <div className="sa-input-icon-box">
                    <Mail size={16} className="sa-box-icon" />
                    <input
                      type="email"
                      className="sa-text-input"
                      placeholder="e.g. admin@apexstore.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="sa-form-row-2">
                {/* Field 5: Admin Username */}
                <div className="sa-form-group-v2">
                  <label className="sa-field-label">
                    Admin Username <span className="req-star">*</span>
                  </label>
                  <div className="sa-input-icon-box">
                    <Users size={16} className="sa-box-icon" />
                    <input
                      type="text"
                      className="sa-text-input"
                      placeholder="Enter admin username"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Field 6: Password */}
                <div className="sa-form-group-v2">
                  <label className="sa-field-label">
                    Password <span className="req-star">*</span>
                  </label>
                  <div className="sa-input-icon-box">
                    <Lock size={16} className="sa-box-icon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      className="sa-text-input"
                      placeholder="Enter password (min 6 chars)"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="sa-password-eye-btn"
                      onClick={() => setShowPassword((prev) => !prev)}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Field 7: Subscription Plan */}
              <div className="sa-form-group-v2">
                <label className="sa-field-label">Subscription Tier</label>
                <div className="sa-input-icon-box">
                  <Crown size={16} className="sa-box-icon" />
                  <select
                    className="sa-select-input"
                    value={selectedPlan}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                  >
                    <option value="Basic">Basic Plan (&#8377;4,999/mo) &mdash; Single Register POS</option>
                    <option value="Standard">Standard Plan (&#8377;9,999/mo) &mdash; Multi-Terminal Support</option>
                    <option value="Business">Business Plan (&#8377;12,499/mo) &mdash; Priority Gate Clearance</option>
                    <option value="Premium">Premium Plan (&#8377;19,999/mo) &mdash; Full Automation &amp; AI</option>
                    <option value="Enterprise">Enterprise Plan (&#8377;24,999/mo) &mdash; Unlimited Volume</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="sa-submit-pill-btn"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <RefreshCw size={16} className="spin-icon" />
                    <span>Deploying Supermarket Tenant...</span>
                  </>
                ) : (
                  <>
                    <Plus size={16} strokeWidth={2.8} />
                    <span>Register &amp; Deploy Supermarket</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Card: Multi-Tenant SaaS Platform Feature Highlights */}
        <div className="sa-saas-platform-card">
          <div className="sa-platform-card-header">
            <div className="sa-platform-shield-icon">
              <ShieldCheck size={20} strokeWidth={2.4} />
            </div>
            <h3 className="sa-platform-card-title">Multi-Tenant SaaS Platform</h3>
          </div>

          {/* Checklist */}
          <div className="sa-checklist-list">
            <div className="sa-check-item">
              <div className="sa-check-circle">
                <Check size={12} strokeWidth={3} />
              </div>
              <span>Manage Multiple Supermarkets</span>
            </div>

            <div className="sa-check-item">
              <div className="sa-check-circle">
                <Check size={12} strokeWidth={3} />
              </div>
              <span>Set Subscription Plans</span>
            </div>

            <div className="sa-check-item">
              <div className="sa-check-circle">
                <Check size={12} strokeWidth={3} />
              </div>
              <span>Track Registrations &amp; Revenue</span>
            </div>

            <div className="sa-check-item">
              <div className="sa-check-circle">
                <Check size={12} strokeWidth={3} />
              </div>
              <span>Ensure Data Isolation</span>
            </div>
          </div>

          {/* 3D Storefront Illustration & Security Badge */}
          <div className="sa-platform-badge-box">
            <div className="sa-store-badge-graphic">
              <img
                src="/storefront-3d.jpg"
                alt="Secure Store Architecture"
                className="sa-store-badge-img"
              />
              <div className="sa-shield-green-pill">
                <ShieldCheck size={14} />
              </div>
            </div>
            <div className="sa-badge-labels">
              <span className="sa-badge-tagline">
                Secure &bull; Scalable &bull; Reliable
              </span>
              <p className="sa-badge-desc">
                Your Complete Supermarket Management Solution
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

