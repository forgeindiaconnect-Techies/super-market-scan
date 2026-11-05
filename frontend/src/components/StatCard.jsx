import React from "react";

export default function StatCard({ title, value, icon: Icon, change, trend = "neutral" }) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <div className="stat-icon">
          {Icon && <Icon size={22} />}
        </div>
        {change && (
          <span className={`stat-badge ${trend}`}>
            {change}
          </span>
        )}
      </div>
      <div className="stat-card-body">
        <p className="stat-title">{title}</p>
        <h2 className="stat-value">{value}</h2>
      </div>
    </div>
  );
}
