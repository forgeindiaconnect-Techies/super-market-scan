import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Store,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  TrendingUp,
  Package,
  FileText,
  Users,
  ShieldCheck,
  Zap,
  Headphones,
  AlertCircle,
  X,
  Phone,
  Mail,
  Building2,
  Check,
  Sparkles,
  Receipt,
  Leaf,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
// Stylesheet for GrocerEase Supermarket Login Portal
import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const [bgSrc, setBgSrc] = useState("/supermarket-login-bg.jpg");

  // Ensure fields are completely blank on mount and clear browser autofill
  useEffect(() => {
    setUsername("");
    setPassword("");
    const timer = setTimeout(() => {
      setUsername("");
      setPassword("");
    }, 120);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage("Please enter both Supermarket Name / ID and password.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const result = await login(username, password);

      if (result.success) {
        if (result.user.role === "SUPER_ADMIN") {
          navigate("/super-admin");
        } else {
          navigate("/admin");
        }
      } else {
        setErrorMessage(result.message || "Invalid credentials.");
        setLoading(false);
      }
    } catch (err) {
      setErrorMessage(err.message || "Authentication failed.");
      setLoading(false);
    }
  };

  const handleQuickFill = (user, pass) => {
    setUsername(user);
    setPassword(pass);
    setErrorMessage("");
  };

  return (
    <div className="ge-login-root">
      {/* 1. Crystal-Clear Photorealistic 1080p Background Scene */}
      <img
        src={bgSrc}
        alt="GrocerEase Supermarket Scene"
        className="ge-bg-image"
        onError={() => {
          if (bgSrc !== "http://localhost:5001/api/login-bg") {
            setBgSrc("http://localhost:5001/api/login-bg");
          }
        }}
      />

      {/* 2. Soft Ambient Lighting Vignette (Enhances text contrast without hiding the store) */}
      <div className="ge-bg-ambient-vignette" />

      {/* Top-Left Neon Energy Arc (Exact Match to Reference Poster in Image 2) */}
      <div className="ge-top-corner-arc" aria-hidden="true">
        <svg viewBox="0 0 260 140" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M-10 -10 C 60 45, 140 85, 260 40" stroke="#4ade80" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M-10 5 C 60 60, 150 100, 250 55" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        </svg>
      </div>

      {/* 3. Top Header Bar */}
      <header className="ge-top-bar">
        {/* GrocerEase Brand Lockup: Matches Reference Image (Cart with Leaf + GrocerEase) */}
        <div className="ge-brand-lockup">
          <div className="ge-brand-icon-box">
            <ShoppingCart size={23} color="#4ade80" strokeWidth={2.4} />
            <Leaf size={13} color="#4ade80" className="ge-brand-leaf-badge" strokeWidth={2.6} />
          </div>
          <div className="ge-brand-text">
            <span className="ge-brand-title">
              Grocer<span className="ge-brand-accent">Ease</span>
            </span>
            <span className="ge-brand-tagline">Smart Supermarket Solutions &mdash;</span>
          </div>
        </div>

        {/* Top-Right Enterprise Operational Status & Helpline */}
        <div className="ge-header-right-meta">
          <div className="ge-status-pill">
            <span className="ge-status-pulse" />
            <span>Cloud Retail &bull; Live &amp; Online</span>
          </div>
          <button
            type="button"
            className="ge-header-support-btn"
            onClick={() => setShowSupportModal(true)}
            title="Open Support Desk"
          >
            <Headphones size={15} color="#4ade80" />
            <span>24/7 Support</span>
          </button>
        </div>
      </header>

      {/* 4. Main Body: Exactly Following Reference Layout */}
      <main className="ge-main-body">
        {/* Left Side: Exactly Matching Reference Typography & Cards */}
        <section className="ge-left-hero">
          <div className="ge-hero-text-block">
            <h1 className="ge-hero-heading">
              Welcome to Your <br />
              <span className="ge-highlight-neon">Supermarket</span> Portal
            </h1>
            <p className="ge-hero-subheading">
              Smarter Operations. Happier Customers.<br />
              Greater Growth.
            </p>
          </div>

          {/* 4 Feature Badges in 1 Row Exactly Like Reference Artwork */}
          <div className="ge-features-grid">
            <div className="ge-feature-card">
              <div className="ge-feature-icon-wrapper">
                <TrendingUp size={22} color="#4ade80" strokeWidth={2.4} />
              </div>
              <span className="ge-feature-label">Real-Time<br />Sales Analytics</span>
            </div>

            <div className="ge-feature-card">
              <div className="ge-feature-icon-wrapper">
                <Package size={22} color="#4ade80" strokeWidth={2.4} />
              </div>
              <span className="ge-feature-label">Smart<br />Inventory</span>
            </div>

            <div className="ge-feature-card">
              <div className="ge-feature-icon-wrapper">
                <Receipt size={22} color="#4ade80" strokeWidth={2.4} />
              </div>
              <span className="ge-feature-label">Easy<br />Billing</span>
            </div>

            <div className="ge-feature-card">
              <div className="ge-feature-icon-wrapper">
                <Users size={22} color="#4ade80" strokeWidth={2.4} />
              </div>
              <span className="ge-feature-label">Customer<br />Management</span>
            </div>
          </div>
        </section>

        {/* Right Side: The Crisp White Glass Login Card */}
        <section className="ge-right-card-section">
          <div className="ge-login-card">
            {/* Top Centered Cart Emblem */}
            <div className="ge-card-header">
              <div className="ge-header-lines">
                <div className="ge-line" />
                <div className="ge-cart-emblem">
                  <ShoppingCart size={24} color="#16a34a" strokeWidth={2.4} />
                </div>
                <div className="ge-line" />
              </div>

              <h2 className="ge-card-title">
                Supermarket <span className="ge-title-green">Login</span>
              </h2>
              <p className="ge-card-subtitle">Access your store dashboard</p>
            </div>

            {/* Error Notification Alert */}
            {errorMessage && (
              <div className="ge-error-alert" role="alert">
                <AlertCircle size={15} color="#dc2626" style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Interactive Login Form */}
            <form className="ge-form" onSubmit={handleSubmit} noValidate autoComplete="off">
              {/* Hidden decoy fields to trap browser password managers and prevent auto-filling */}
              <input
                type="text"
                name="prevent_autofill_user"
                tabIndex={-1}
                aria-hidden="true"
                autoComplete="new-password"
                style={{ position: "absolute", opacity: 0, height: 0, width: 0, pointerEvents: "none", zIndex: -1 }}
              />
              <input
                type="password"
                name="prevent_autofill_pass"
                tabIndex={-1}
                aria-hidden="true"
                autoComplete="new-password"
                style={{ position: "absolute", opacity: 0, height: 0, width: 0, pointerEvents: "none", zIndex: -1 }}
              />

              {/* Field 1: Supermarket Name / ID */}
              <div className="ge-input-group">
                <span className="ge-input-icon">
                  <Store size={18} color="#64748b" />
                </span>
                <input
                  id="ge-admin-id"
                  name="supermarket_admin_identity"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setErrorMessage("");
                  }}
                  placeholder="Supermarket Name / ID"
                  className="ge-input-control"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
              </div>

              {/* Field 2: Password */}
              <div className="ge-input-group">
                <span className="ge-input-icon">
                  <Lock size={18} color="#64748b" />
                </span>
                <input
                  id="ge-admin-secret"
                  name="supermarket_admin_secret"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage("");
                  }}
                  placeholder="Password"
                  className="ge-input-control"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="ge-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              {/* Options: Remember Me & Forgot Password */}
              <div className="ge-options-row">
                <label className="ge-remember-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="ge-checkbox-input"
                  />
                  <span className={`ge-checkbox-box ${rememberMe ? "checked" : ""}`}>
                    {rememberMe && <Check size={11} color="#ffffff" strokeWidth={3.5} />}
                  </span>
                  <span className="ge-remember-text">Remember Me</span>
                </label>

                <button
                  type="button"
                  className="ge-forgot-btn"
                  onClick={() => setShowForgotModal(true)}
                >
                  Forgot Password?
                </button>
              </div>

              {/* Primary Green Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="ge-primary-login-btn"
              >
                {loading ? (
                  <span className="ge-btn-spinner" />
                ) : (
                  <>
                    <ArrowRight size={18} strokeWidth={2.6} />
                    <span>Login</span>
                  </>
                )}
              </button>

              {/* Or Divider */}
              <div className="ge-divider">
                <span className="ge-divider-line" />
                <span className="ge-divider-text">Or</span>
                <span className="ge-divider-line" />
              </div>

              {/* Contact Support Button */}
              <button
                type="button"
                className="ge-support-btn"
                onClick={() => setShowSupportModal(true)}
              >
                <Headphones size={17} color="#16a34a" />
                <span>Contact Support</span>
              </button>
            </form>

            {/* Bottom 3 Trust Badges */}
            <div className="ge-trust-row">
              <div className="ge-trust-badge">
                <ShieldCheck size={16} color="#16a34a" strokeWidth={2.4} />
                <span>100% SECURE</span>
              </div>
              <div className="ge-trust-badge">
                <Zap size={16} color="#16a34a" strokeWidth={2.4} />
                <span>FAST ACCESS</span>
              </div>
              <div className="ge-trust-badge">
                <Headphones size={16} color="#16a34a" strokeWidth={2.4} />
                <span>24/7 SUPPORT</span>
              </div>
            </div>

            {/* Powered By Footer */}
            <div className="ge-powered-footer">
              <span>Powered by <strong>GrocerEase</strong></span>
              <span className="ge-heart">♥</span>
            </div>
          </div>
        </section>

        {/* Bottom Left Cursive Script Under Shopping Cart: "Shop Smart... Live Better..." */}
        <div className="ge-bottom-script">
          <span>Shop Smart...</span>
          <span>Live Better...</span>
        </div>
      </main>

      {/* MODAL 1: Contact Support Modal */}
      {showSupportModal && (
        <div
          className="ge-modal-backdrop"
          onClick={() => setShowSupportModal(false)}
        >
          <div
            className="ge-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="ge-modal-header">
              <div className="ge-modal-icon-badge">
                <Phone size={22} color="#16a34a" />
              </div>
              <div>
                <h3 className="ge-modal-title">GrocerEase Support Desk</h3>
                <p className="ge-modal-desc">
                  We are here to assist your supermarket 24/7
                </p>
              </div>
              <button
                type="button"
                className="ge-modal-close"
                onClick={() => setShowSupportModal(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="ge-modal-body">
              <div className="ge-support-channel-card">
                <Phone size={20} color="#16a34a" />
                <div>
                  <strong>Toll-Free Merchant Helpline</strong>
                  <p>1800-425-GROCER (1800-425-4762)</p>
                  <small>Available 24 hours &bull; Mon to Sun</small>
                </div>
              </div>

              <div className="ge-support-channel-card">
                <Mail size={20} color="#16a34a" />
                <div>
                  <strong>Super Admin Priority Email</strong>
                  <p>support@grocerease.store</p>
                  <small>Guaranteed response within 15 minutes</small>
                </div>
              </div>

              <div className="ge-support-channel-card">
                <Building2 size={20} color="#16a34a" />
                <div>
                  <strong>New Supermarket Registration</strong>
                  <p>Contact Platform Super Admin Pooja V to onboard a new store branch.</p>
                </div>
              </div>
            </div>

            <div className="ge-modal-footer">
              <button
                type="button"
                className="ge-modal-primary-btn"
                onClick={() => setShowSupportModal(false)}
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Forgot Password Modal */}
      {showForgotModal && (
        <div
          className="ge-modal-backdrop"
          onClick={() => setShowForgotModal(false)}
        >
          <div
            className="ge-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="ge-modal-header">
              <div className="ge-modal-icon-badge">
                <Lock size={22} color="#16a34a" />
              </div>
              <div>
                <h3 className="ge-modal-title">Password Recovery &amp; Demo Credentials</h3>
                <p className="ge-modal-desc">
                  Quick login credentials for evaluation &amp; testing
                </p>
              </div>
              <button
                type="button"
                className="ge-modal-close"
                onClick={() => setShowForgotModal(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="ge-modal-body">
              <div className="ge-cred-card">
                <div className="ge-cred-header">
                  <strong>Pooja Admin Account</strong>
                  <span className="ge-badge-saas">Store Admin</span>
                </div>
                <div className="ge-cred-details">
                  <div><span>Username / Mail:</span> <code>pooja</code></div>
                  <div><span>Password:</span> <code>pooja@123</code></div>
                </div>
                <button
                  type="button"
                  className="ge-cred-use-btn"
                  onClick={() => {
                    handleQuickFill("pooja", "pooja@123");
                    setShowForgotModal(false);
                  }}
                >
                  Use Pooja Admin Credentials
                </button>
              </div>

              <div className="ge-cred-card">
                <div className="ge-cred-header">
                  <strong>FreshMart Supermarket #1</strong>
                  <span className="ge-badge-tenant">STR-001</span>
                </div>
                <div className="ge-cred-details">
                  <div><span>Username:</span> <code>STR-001</code></div>
                  <div><span>Password:</span> <code>password123</code></div>
                </div>
                <button
                  type="button"
                  className="ge-cred-use-btn"
                  onClick={() => {
                    handleQuickFill("STR-001", "password123");
                    setShowForgotModal(false);
                  }}
                >
                  Use Store #1 Credentials
                </button>
              </div>
            </div>

            <div className="ge-modal-footer">
              <button
                type="button"
                className="ge-modal-primary-btn"
                onClick={() => setShowForgotModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
