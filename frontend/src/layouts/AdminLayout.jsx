import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import "./AdminLayout.css";

// Resilient Error Boundary to prevent any white screen crashes
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Supermarket Admin layout caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "48px 32px",
            textAlign: "center",
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "20px",
            boxShadow: "0 6px 24px rgba(0,0,0,0.04)",
            margin: "24px 0",
          }}
        >
          <div
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              background: "#FEE2E2",
              color: "#EF4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: "24px",
            }}
          >
            ⚠️
          </div>
          <h2 style={{ color: "#0F172A", margin: "0 0 8px 0", fontSize: "20px", fontWeight: "800" }}>
            Workspace Refresh Required
          </h2>
          <p style={{ color: "#64748B", margin: "0 0 20px 0", fontSize: "14px" }}>
            {this.state.error?.message || "A temporary rendering issue occurred in this section."}
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              background: "#2563EB",
              color: "#FFFFFF",
              border: "none",
              padding: "10px 24px",
              borderRadius: "12px",
              fontWeight: "700",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(37,99,235,0.3)",
            }}
          >
            Reload Section
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="admin-app-container">
      {/* Top Full-Width Header Bar matching Image 2 */}
      <Header onMenuClick={() => setSidebarOpen((prev) => !prev)} />

      {/* Main Row: Floating Curved Sidebar on the Left + Main Content on the Right */}
      <div className="admin-body-row">
        {/* Mobile Backdrop */}
        {sidebarOpen && (
          <div
            className="sidebar-backdrop"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Floating Curved Left Sidebar matching Image 2 */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content Canvas with Error Boundary (Guarantees No White Screen) */}
        <main className="admin-main-canvas">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
