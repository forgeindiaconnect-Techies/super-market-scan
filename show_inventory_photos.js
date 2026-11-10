const fs = require('fs');
const jsxPath = 'd:\\PROJECTS\\Super market\\frontend\\src\\pages\\admin\\AdminDashboard.jsx';

let jsx = fs.readFileSync(jsxPath, 'utf8');

// Replace the letter-only avatar with the real product image tag
const oldAlertLeftRegex = /<div className="db-alert-left">\s*<div style=\{\{\s*width:\s*"38px"[\s\S]*?\{item\.name \? item\.name\.charAt\(0\)\.toUpperCase\(\) : "P"\}\s*<\/div>/;

const newAlertLeft = `<div className="db-alert-left">
                      {(item.imageUrl || item.image) ? (
                        <img
                          src={item.imageUrl || item.image}
                          alt={item.name}
                          className="db-alert-thumb"
                          style={{
                            width: "42px",
                            height: "42px",
                            borderRadius: "10px",
                            objectFit: "cover",
                            flexShrink: 0,
                            border: "1.5px solid #E2E8F0",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.06)"
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            if (e.currentTarget.nextSibling) {
                              e.currentTarget.nextSibling.style.display = "flex";
                            }
                          }}
                        />
                      ) : null}
                      <div
                        style={{
                          width: "42px",
                          height: "42px",
                          borderRadius: "10px",
                          background: stockQty === 0 ? "#FEF2F2" : "#FFFBEB",
                          display: (item.imageUrl || item.image) ? "none" : "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: stockQty === 0 ? "#DC2626" : "#D97706",
                          flexShrink: 0,
                          fontWeight: 800,
                          fontSize: "15px",
                          border: \`1.5px solid \${stockQty === 0 ? "#FECACA" : "#FDE68A"}\`
                        }}
                      >
                        {item.name ? item.name.charAt(0).toUpperCase() : "P"}
                      </div>`;

if (oldAlertLeftRegex.test(jsx)) {
  jsx = jsx.replace(oldAlertLeftRegex, newAlertLeft);
  fs.writeFileSync(jsxPath, jsx, 'utf8');
  console.log('SUCCESS: Real product photos for Shampoo and Chocolate are now displaying!');
} else {
  console.log('NOTICE: Pattern already updated or not matched.');
}
