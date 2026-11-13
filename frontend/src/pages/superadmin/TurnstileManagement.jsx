import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Building2,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Clock,
  Search,
  RefreshCw,
  Lock,
  Unlock,
  Radio,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "./SuperAdmin.css";

const DEMO_GATES = [
  {
    gateId: "GATE-01-IND",
    gateName: "Indiranagar Express Turnstile 1",
    supermarketName: "GrocerEase Flagship - Indiranagar",
    supermarketCode: "STR-001",
    status: "Operational",
    mode: "Autonomous QR Scanning",
    todayPasses: 42,
    lastPassTime: "Today at 10:15 AM",
    firmware: "v2.4.1 IoT-Secure",
  },
  {
    gateId: "GATE-02-IND",
    gateName: "Indiranagar Express Turnstile 2",
    supermarketName: "GrocerEase Flagship - Indiranagar",
    supermarketCode: "STR-001",
    status: "Operational",
    mode: "Autonomous QR Scanning",
    todayPasses: 38,
    lastPassTime: "Today at 10:02 AM",
    firmware: "v2.4.1 IoT-Secure",
  },
  {
    gateId: "GATE-01-KOR",
    gateName: "Koramangala Smart Turnstile 1",
    supermarketName: "FreshMart Supermarket - Koramangala",
    supermarketCode: "STR-002",
    status: "Operational",
    mode: "Autonomous QR Scanning",
    todayPasses: 22,
    lastPassTime: "Today at 09:40 AM",
    firmware: "v2.4.1 IoT-Secure",
  },
  {
    gateId: "GATE-02-KOR",
    gateName: "Koramangala Smart Turnstile 2",
    supermarketName: "FreshMart Supermarket - Koramangala",
    supermarketCode: "STR-002",
    status: "Operational",
    mode: "Autonomous QR Scanning",
    todayPasses: 19,
    lastPassTime: "Today at 09:15 AM",
    firmware: "v2.4.1 IoT-Secure",
  },
];

const DEMO_TURNSTILE_LOGS = [
  {
    id: "log-1",
    timestamp: "2026-11-13T10:15:02Z",
    gateId: "GATE-01-IND",
    supermarket: "GrocerEase Flagship - Indiranagar",
    orderId: "ORD-948201-9481",
    customer: "SREE",
    result: "Gate Unlocked & Passed",
    scanLatencyMs: 142,
  },
  {
    id: "log-2",
    timestamp: "2026-11-13T09:40:11Z",
    gateId: "GATE-01-KOR",
    supermarket: "FreshMart Supermarket - Koramangala",
    orderId: "ORD-839102-3921",
    customer: "POOJA",
    result: "Gate Unlocked & Passed",
    scanLatencyMs: 128,
  },
  {
    id: "log-3",
    timestamp: "2026-11-13T08:20:44Z",
    gateId: "GATE-02-IND",
    supermarket: "GrocerEase Flagship - Indiranagar",
    orderId: "ORD-739104-1029",
    customer: "Mobile Shopper",
    result: "Gate Unlocked & Passed",
    scanLatencyMs: 135,
  },
];

export default function TurnstileManagement() {
  const { supermarkets } = useAuth();
  const [gates, setGates] = useState(DEMO_GATES);
  const [logs, setLogs] = useState(DEMO_TURNSTILE_LOGS);

  return (
    <div className="sa-page-container">
      {/* 1. Header */}
      <div className="sa-page-header">
        <div className="sa-page-header-content">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span className="sa-badge active">Loss Prevention Hub</span>
            <span style={{ fontSize: "12px", color: "#64748b" }}>IoT Turnstile Monitoring</span>
          </div>
          <h1>Loss Prevention & QR Turnstile Gates</h1>
          <p>
            Central monitoring of physical automated checkout turnstiles, barcode receipt verification, and zero-leakage security telemetry.
          </p>
        </div>
      </div>

      {/* 2. Turnstile Status Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
        {gates.map((g) => (
          <div key={g.gateId} className="sa-section-card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: "14px", color: "#0f172a" }}>{g.gateName}</strong>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>{g.supermarketName}</span>
                </div>
              </div>
              <span className="sa-badge active">Online</span>
            </div>

            <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "8px", fontSize: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Turnstiles Cleared Today:</span>
                <strong style={{ color: "#0f172a" }}>{g.todayPasses} shoppers</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Last Activity:</span>
                <span style={{ color: "#1e293b", fontWeight: 600 }}>{g.lastPassTime}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Security Mode:</span>
                <span style={{ color: "#2563eb", fontWeight: 700 }}>QR Exit Pass Verified</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Turnstile Live Event Log */}
      <div className="sa-section-card">
        <div className="sa-section-header">
          <div>
            <h2>Real-Time Turnstile Verification Stream</h2>
            <p>Live QR barcode exit scan events across all supermarket branch turnstiles.</p>
          </div>
        </div>

        <div className="sa-table-wrapper">
          <table className="sa-data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Turnstile Gate</th>
                <th>Supermarket</th>
                <th>Order Reference</th>
                <th>Customer Name</th>
                <th>Scan Latency</th>
                <th>Turnstile Gate Action</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      {new Date(log.timestamp).toLocaleTimeString("en-IN")}
                    </span>
                  </td>
                  <td>
                    <strong style={{ fontFamily: "monospace", fontSize: "12px", color: "#2563eb" }}>
                      {log.gateId}
                    </strong>
                  </td>
                  <td>
                    <span style={{ fontSize: "13px", color: "#0f172a", fontWeight: 600 }}>
                      {log.supermarket}
                    </span>
                  </td>
                  <td>
                    <code style={{ fontSize: "12px", color: "#475569" }}>{log.orderId}</code>
                  </td>
                  <td>
                    <strong style={{ color: "#0f172a" }}>{log.customer}</strong>
                  </td>
                  <td>
                    <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: 700 }}>
                      {log.scanLatencyMs} ms
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <CheckCircle2 size={15} color="#16a34a" />
                      <strong style={{ color: "#16a34a", fontSize: "12px" }}>{log.result}</strong>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

