import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Search,
  Filter,
  DollarSign,
  ShoppingBag,
  Building2,
  Calendar,
  Sparkles,
  Phone,
  CheckCircle2,
  Award,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "./SuperAdmin.css";

const DEMO_CUSTOMERS = [
  {
    id: "cust-1",
    name: "SREE",
    phone: "+91 1234567899",
    supermarketName: "GrocerEase Flagship - Indiranagar",
    supermarketCode: "STR-001",
    totalOrders: 14,
    totalSpend: 12450,
    loyaltyTier: "Platinum VIP",
    lastVisit: "Today at 10:15 AM",
  },
  {
    id: "cust-2",
    name: "POOJA",
    phone: "+91 8521456986",
    supermarketName: "FreshMart Supermarket - Koramangala",
    supermarketCode: "STR-002",
    totalOrders: 9,
    totalSpend: 8200,
    loyaltyTier: "Gold Member",
    lastVisit: "Today at 09:40 AM",
  },
  {
    id: "cust-3",
    name: "Mobile Shopper (App User #491)",
    phone: "+91 98450 11223",
    supermarketName: "GrocerEase Flagship - Indiranagar",
    supermarketCode: "STR-001",
    totalOrders: 5,
    totalSpend: 3100,
    loyaltyTier: "Silver",
    lastVisit: "Yesterday",
  },
  {
    id: "cust-4",
    name: "Rahul Sharma",
    phone: "+91 97401 88392",
    supermarketName: "FreshMart Supermarket - Koramangala",
    supermarketCode: "STR-002",
    totalOrders: 6,
    totalSpend: 4700,
    loyaltyTier: "Gold Member",
    lastVisit: "2 days ago",
  },
  {
    id: "cust-5",
    name: "Priya Nair",
    phone: "+91 99002 44556",
    supermarketName: "GrocerEase Flagship - Indiranagar",
    supermarketCode: "STR-001",
    totalOrders: 8,
    totalSpend: 7500,
    loyaltyTier: "Gold Member",
    lastVisit: "3 days ago",
  },
];

export default function CustomersDirectory() {
  const { supermarkets } = useAuth();
  const [customers, setCustomers] = useState(DEMO_CUSTOMERS);
  const [search, setSearch] = useState("");
  const [selectedStore, setSelectedStore] = useState("all");

  const filtered = customers.filter((c) => {
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.supermarketName.toLowerCase().includes(search.toLowerCase());
    const matchStore = selectedStore === "all" || c.supermarketCode === selectedStore;
    return matchSearch && matchStore;
  });

  return (
    <div className="sa-page-container">
      {/* 1. Header */}
      <div className="sa-page-header">
        <div className="sa-page-header-content">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span className="sa-badge active">Shopper Intelligence</span>
            <span style={{ fontSize: "12px", color: "#64748b" }}>Multi-Tenant Customer Directory</span>
          </div>
          <h1>Centralized Customer Directory</h1>
          <p>
            Unified registry of registered customer profiles, self-checkout transaction histories, and lifetime value across all supermarkets.
          </p>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="sa-filter-bar">
        <div className="sa-search-input-wrap">
          <Search size={16} className="sa-search-icon" />
          <input
            type="text"
            className="sa-search-input"
            placeholder="Search by customer name, phone number, or store..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="sa-filter-controls">
          <select
            className="sa-select-input"
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
          >
            <option value="all">All Supermarkets ({supermarkets.length || 2})</option>
            {supermarkets.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Table */}
      <div className="sa-section-card">
        <div className="sa-table-wrapper">
          <table className="sa-data-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Mobile Number</th>
                <th>Preferred Supermarket</th>
                <th>Lifetime Spend (₹)</th>
                <th>Total Orders</th>
                <th>Loyalty Tier</th>
                <th>Recent Visit</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "2.5rem", color: "#64748b" }}>
                    No customer records found matching your search.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "34px",
                            height: "34px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: "13px",
                          }}
                        >
                          {c.name[0]}
                        </div>
                        <strong style={{ color: "#0f172a" }}>{c.name}</strong>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: "monospace", color: "#475569", fontWeight: 600 }}>
                        {c.phone}
                      </span>
                    </td>
                    <td>
                      <div>
                        <strong style={{ fontSize: "13px", color: "#0f172a" }}>{c.supermarketName}</strong>
                        <span style={{ display: "block", fontSize: "11px", color: "#64748b" }}>
                          {c.supermarketCode}
                        </span>
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: "#0f172a", fontSize: "14px" }}>
                        ₹{Number(c.totalSpend).toLocaleString("en-IN")}
                      </strong>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: "#0f172a" }}>{c.totalOrders}</span>
                      <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "4px" }}>orders</span>
                    </td>
                    <td>
                      <span className="sa-badge plan" style={{ background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a" }}>
                        ★ {c.loyaltyTier}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>{c.lastVisit}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

