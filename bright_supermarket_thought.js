const fs = require('fs');
const jsxPath = 'd:\\PROJECTS\\Super market\\frontend\\src\\pages\\admin\\AdminDashboard.jsx';
const cssPath = 'd:\\PROJECTS\\Super market\\frontend\\src\\pages\\admin\\AdminDashboard.css';

let jsx = fs.readFileSync(jsxPath, 'utf8');

// 1. Update the hero banner HTML to include the centered supermarket thought
const oldScriptBadgeRegex = /<div className="db-hero-script-badge">[\s\S]*?<\/div>/;

const newCenteredThought = `<div className="db-hero-thought-center">
        <span className="db-thought-script">Freshness in Every Cart</span>
        <span className="db-thought-sub">Everyday Low Prices • Always Fresh</span>
        <div className="db-thought-swoosh" />
      </div>`;

if (oldScriptBadgeRegex.test(jsx)) {
  jsx = jsx.replace(oldScriptBadgeRegex, newCenteredThought);
  fs.writeFileSync(jsxPath, jsx, 'utf8');
}

// 2. Append ultra-bright styling to AdminDashboard.css
const brightThoughtCss = `
/* ===================================================================
   CENTERED ULTRA-BRIGHT SUPERMARKET THOUGHT / SLOGAN
   =================================================================== */
.db-hero-thought-center {
  position: absolute !important;
  left: 47% !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  z-index: 15 !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  text-align: center !important;
  pointer-events: none !important;
  white-space: nowrap !important;
}

.db-thought-script {
  font-family: "Brush Script MT", "Segoe Script", cursive, "Caveat", sans-serif !important;
  font-size: 28px !important;
  font-weight: 800 !important;
  color: #1E3A8A !important;
  letter-spacing: 0.5px !important;
  line-height: 1.15 !important;
  text-shadow: 0 2px 10px rgba(255, 255, 255, 0.95), 0 0 16px rgba(37, 99, 235, 0.3) !important;
}

.db-thought-sub {
  font-size: 10.5px !important;
  font-weight: 800 !important;
  color: #2563EB !important;
  letter-spacing: 0.8px !important;
  text-transform: uppercase !important;
  margin-top: 3px !important;
  text-shadow: 0 1px 4px rgba(255, 255, 255, 0.95) !important;
}

.db-thought-swoosh {
  width: 110px !important;
  height: 4px !important;
  border-radius: 9999px !important;
  background: linear-gradient(90deg, #F59E0B 0%, #FBBF24 50%, #F59E0B 100%) !important;
  margin-top: 4px !important;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.6) !important;
}
`;

fs.appendFileSync(cssPath, brightThoughtCss, 'utf8');
console.log('SUCCESS: Supermarket slogan placed in the center with ultra-bright script and golden arc!');
