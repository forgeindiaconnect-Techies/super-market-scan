const fs = require('fs');
const jsxPath = 'd:\\PROJECTS\\Super market\\frontend\\src\\pages\\admin\\AdminDashboard.jsx';

let jsx = fs.readFileSync(jsxPath, 'utf8');

// 1. Add lowStockItems useMemo if not already present
if (!jsx.includes('const lowStockItems = useMemo')) {
  const insertMarker = 'const handleRestockApples = async () => {';
  const lowStockCode = `// Real-time Low Stock items from live database products
  const lowStockItems = useMemo(() => {
    if (!Array.isArray(products) || products.length === 0) return [];
    return products
      .filter((p) => {
        const qty = Number(p.stock !== undefined ? p.stock : (p.quantity !== undefined ? p.quantity : 0));
        return qty <= 10;
      })
      .slice(0, 3);
  }, [products]);\n\n  `;
  jsx = jsx.replace(insertMarker, lowStockCode + insertMarker);
}

// 2. Replace the hardcoded Apples block with live lowStockItems mapping
const oldAlertBlockRegex = /<div className="db-alert-row">\s*<div className="db-alert-left">\s*<img[\s\S]*?alt="Apples"[\s\S]*?<h4>Apples<\/h4>[\s\S]*?<\/button>\s*<\/div>/;

const liveAlertBlock = `{lowStockItems.length === 0 ? (
              <div style={{ padding: "12px 14px", background: "#ECFDF5", borderRadius: "10px", border: "1px solid #A7F3D0", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "14px", color: "#10B981" }}>✓</span>
                <span style={{ fontSize: "12px", color: "#065F46", fontWeight: 600 }}>All inventory levels are healthy! No low stock alerts.</span>
              </div>
            ) : (
              lowStockItems.map((item, idx) => {
                const stockQty = Number(item.stock !== undefined ? item.stock : (item.quantity !== undefined ? item.quantity : 0));
                return (
                  <div key={item._id || item.id || idx} className="db-alert-row" style={{ marginBottom: idx < lowStockItems.length - 1 ? "10px" : 0 }}>
                    <div className="db-alert-left">
                      <div style={{ width: "38px", height: "38px", borderRadius: "8px", background: stockQty === 0 ? "#FEF2F2" : "#FFFBEB", display: "flex", alignItems: "center", justifyContent: "center", color: stockQty === 0 ? "#DC2626" : "#D97706", flexShrink: 0, fontWeight: 800, fontSize: "14px", border: \`1px solid \${stockQty === 0 ? "#FECACA" : "#FDE68A"}\` }}>
                        {item.name ? item.name.charAt(0).toUpperCase() : "P"}
                      </div>
                      <div className="db-alert-details">
                        <h4 style={{ margin: 0, fontSize: "12.5px", fontWeight: 700, color: "#1E293B" }}>{item.name}</h4>
                        <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: stockQty === 0 ? "#DC2626" : "#D97706", fontWeight: 700 }}>
                          {stockQty === 0 ? "Out of stock!" : \`Only \${stockQty} left in stock!\`}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="db-restock-pill-btn"
                      style={{ background: stockQty === 0 ? "#FEE2E2" : "#FEF3C7", color: stockQty === 0 ? "#DC2626" : "#B45309", border: \`1px solid \${stockQty === 0 ? "#FCA5A5" : "#FCD34D"}\` }}
                      onClick={() => navigate("/admin/inventory")}
                    >
                      {stockQty === 0 ? "Out of Stock" : "Low Stock"}
                    </button>
                  </div>
                );
              })
            )}`;

if (oldAlertBlockRegex.test(jsx)) {
  jsx = jsx.replace(oldAlertBlockRegex, liveAlertBlock);
  fs.writeFileSync(jsxPath, jsx, 'utf8');
  console.log('SUCCESS: Inventory alerts updated with 100% real-time database products!');
} else {
  console.log('NOTICE: Already updated or block not found.');
}
