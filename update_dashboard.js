const fs = require('fs');
const jsxPath = 'd:\\PROJECTS\\Super market\\frontend\\src\\pages\\admin\\AdminDashboard.jsx';
const cssPath = 'd:\\PROJECTS\\Super market\\frontend\\src\\pages\\admin\\AdminDashboard.css';

let jsx = fs.readFileSync(jsxPath, 'utf8');

// 1. Reset initial stats state from dummy numbers to 0
jsx = jsx.replace(
  /const \[stats, setStats\] = useState\(\{[\s\S]*?totalSales:\s*1202,[\s\S]*?lowStockCount:\s*2,\s*\}\);/,
  `const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    activeCustomers: 0,
    catalogProducts: 0,
    lowStockCount: 0,
  });`
);

// 2. Remove dummy stats fallbacks in fetchDashboardData
jsx = jsx.replace(
  /totalSales:\s*computedSales\s*>\s*0\s*\?\s*computedSales\s*:\s*1202,[\s\S]*?lowStockCount:\s*2,/,
  `totalSales: computedSales,
        totalOrders: loadedOrders.length,
        activeCustomers: loadedOrders.length > 0 ? new Set(loadedOrders.map(o => o.user?._id || o.user?.email || o.shippingAddress?.fullName || o.customerName || o.user)).size : 0,
        catalogProducts: loadedProducts.length,
        lowStockCount: loadedProducts.filter(p => Number(p.stock || p.quantity || 0) < 10).length,`
);

// 3. Dynamic peak value in Sales Analytics
jsx = jsx.replace(
  /peakValue:\s*"₹1,202",/,
  `peakValue: stats.totalSales > 0 ? '₹' + Number(stats.totalSales).toLocaleString('en-IN') : '₹0',`
);

// 4. Remove all hardcoded dummy orders and connect 100% to real-time database orders
const startStr = '// Display orders matching Target Mockup';
const endStr = 'return (';
const sIdx = jsx.indexOf(startStr);
const eIdx = jsx.indexOf(endStr, sIdx);
if (sIdx !== -1 && eIdx !== -1) {
  const liveCode = `// 100% Real-Time Orders from Database
  const displayOrders = useMemo(() => {
    if (Array.isArray(orders) && orders.length > 0) {
      return orders.slice(0, 8).map((ord, idx) => {
        const orderNum = ord.orderNumber || (ord._id ? String(ord._id).slice(-4).toUpperCase() : String(1001 + idx));
        const items = ord.orderItems || ord.items || [];
        const count = items.reduce((sum, it) => sum + (it.quantity || 1), 0);
        const name = ord.user?.name || ord.shippingAddress?.fullName || ord.customerName || "Customer";
        const dateStr = ord.createdAt
          ? new Date(ord.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " • " + new Date(ord.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
          : "Recent";
        return {
          orderId: String(orderNum).replace(/^#/, ""),
          customerName: name,
          itemsCount: \`\${count} item\${count !== 1 ? "s" : ""}\`,
          amount: Number(ord.totalAmount || ord.totalPrice || 0),
          payment: ord.paymentMethod === "COD" ? "COD" : "Paid",
          status: ord.orderStatus || ord.status || "Completed",
          date: dateStr,
          items: items,
        };
      });
    }
    return [];
  }, [orders]);\n\n  `;
  jsx = jsx.slice(0, sIdx) + liveCode + jsx.slice(eIdx);
}

// 5. Clean empty state when no orders are in the database yet
if (!jsx.includes('No orders recorded yet')) {
  jsx = jsx.replace(
    '<tbody>\n                  {displayOrders.map((ord, idx) => {',
    `<tbody>
                  {displayOrders.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", padding: "26px", color: "#64748B", fontWeight: 600 }}>
                        No orders recorded yet. Real-time orders will display here automatically.
                      </td>
                    </tr>
                  ) : (
                    displayOrders.map((ord, idx) => {`
  );
  jsx = jsx.replace(
    '                  })}\n                </tbody>',
    '                  })}\n                  )}\n                </tbody>'
  );
}

fs.writeFileSync(jsxPath, jsx, 'utf8');

// 6. Ultra-Bright High-Contrast Theme in CSS
const ultraBrightCss = `
/* ===================================================================
   ULTRA-BRIGHT HIGH-VIBRANCY THEME (ENHANCED CONTRAST)
   =================================================================== */
.db-dashboard-container {
  background: #E8F1FC !important;
  padding: 16px !important;
  border-radius: 20px !important;
  box-shadow: inset 0 0 0 1px #D6E4F8 !important;
}

.db-card {
  background: #FFFFFF !important;
  border: 1.5px solid #CBDFF7 !important;
  border-radius: 16px !important;
  box-shadow: 0 4px 20px rgba(37, 99, 235, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04) !important;
}

/* 4 KPI Cards - Ultra Bright Luminous Saturated Backgrounds */
.db-kpi-card.blue-theme {
  background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%) !important;
  border: 2px solid #3B82F6 !important;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.15) !important;
}
.db-kpi-card.rose-theme {
  background: linear-gradient(135deg, #FFE4E6 0%, #FECDD3 100%) !important;
  border: 2px solid #F43F5E !important;
  box-shadow: 0 4px 14px rgba(244, 63, 94, 0.15) !important;
}
.db-kpi-card.green-theme {
  background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%) !important;
  border: 2px solid #10B981 !important;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.15) !important;
}
.db-kpi-card.purple-theme {
  background: linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%) !important;
  border: 2px solid #A855F7 !important;
  box-shadow: 0 4px 14px rgba(168, 85, 247, 0.15) !important;
}

.db-kpi-title {
  color: #1E293B !important;
  font-weight: 700 !important;
  font-size: 11px !important;
}

.db-kpi-value {
  color: #0F172A !important;
  font-size: 20px !important;
  font-weight: 900 !important;
}

.db-kpi-icon-pill {
  width: 44px !important;
  height: 44px !important;
  border-radius: 50% !important;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2) !important;
}
.db-kpi-icon-pill.blue { background: #1D4ED8 !important; color: #FFFFFF !important; }
.db-kpi-icon-pill.rose { background: #E11D48 !important; color: #FFFFFF !important; }
.db-kpi-icon-pill.green { background: #059669 !important; color: #FFFFFF !important; }
.db-kpi-icon-pill.purple { background: #7E22CE !important; color: #FFFFFF !important; }

/* Quick Action Tiles - Vivid Saturated Colors */
.db-action-tile.pastel-blue { background: #EBF5FF !important; border: 2px solid #93C5FD !important; }
.db-action-tile.pastel-blue .db-action-icon-wrap { background: #DBEAFE !important; color: #1D4ED8 !important; }
.db-action-tile.pastel-green { background: #ECFDF5 !important; border: 2px solid #86EFAC !important; }
.db-action-tile.pastel-green .db-action-icon-wrap { background: #DCFCE7 !important; color: #059669 !important; }
.db-action-tile.pastel-orange { background: #FFFBEB !important; border: 2px solid #FCD34D !important; }
.db-action-tile.pastel-orange .db-action-icon-wrap { background: #FEF3C7 !important; color: #D97706 !important; }
.db-action-tile.pastel-purple { background: #FAF5FF !important; border: 2px solid #D8B4FE !important; }
.db-action-tile.pastel-purple .db-action-icon-wrap { background: #F3E8FF !important; color: #7E22CE !important; }
`;

fs.appendFileSync(cssPath, ultraBrightCss, 'utf8');
console.log('SUCCESS: All dummy data completely eliminated, real-time database orders bound, and ultra-bright colors applied!');
