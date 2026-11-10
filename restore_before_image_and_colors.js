const fs = require('fs');
const dashboardJsxPath = 'd:\\PROJECTS\\Super market\\frontend\\src\\pages\\admin\\AdminDashboard.jsx';
const dashboardCssPath = 'd:\\PROJECTS\\Super market\\frontend\\src\\pages\\admin\\AdminDashboard.css';
const pmCssPath = 'd:\\PROJECTS\\Super market\\frontend\\src\\pages\\admin\\ProductManagement.css';

// 1. Restore the 3D Storefront building ("before image") in AdminDashboard.jsx
let dJsx = fs.readFileSync(dashboardJsxPath, 'utf8');

dJsx = dJsx.replace(
  /<div className="db-storefront-3d-wrap">\s*<img[\s\S]*?alt="GrocerEase Shopping Bag"[\s\S]*?\/>\s*<\/div>/,
  `<div className="db-storefront-3d-wrap">
            <img
              src="/storefront-3d.jpg"
              alt="GrocerEase 3D Storefront"
              className="db-storefront-3d-img"
              onError={(e) => { e.currentTarget.src = "/storefront-3d.png"; }}
            />
          </div>`
);

fs.writeFileSync(dashboardJsxPath, dJsx, 'utf8');

// 2. Style the 3D storefront card in AdminDashboard.css
const storefrontCardCss = `
/* ===================================================================
   3D STOREFRONT "BEFORE IMAGE" RESTORATION
   =================================================================== */
.db-storefront-3d-wrap {
  width: 90px !important;
  height: 90px !important;
  flex-shrink: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  background: #FFFFFF !important;
  border-radius: 16px !important;
  padding: 6px !important;
  border: 1.5px solid #BFDBFE !important;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.12) !important;
}

.db-storefront-3d-img {
  width: 100% !important;
  height: 100% !important;
  object-fit: contain !important;
  border-radius: 12px !important;
  mix-blend-mode: normal !important;
}
`;
fs.appendFileSync(dashboardCssPath, storefrontCardCss, 'utf8');

// 3. Apply bright, luminous colors to Product Management banner & cards in ProductManagement.css
const pmBrightCss = `
/* ===================================================================
   PRODUCT MANAGEMENT VIBRANT HERO BANNER & KPI CARDS (MATCHING DASHBOARD)
   =================================================================== */
.pm-hero-section {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  position: relative !important;
  background: linear-gradient(135deg, #DBEAFE 0%, #EDF5FE 50%, #F4F8FE 100%) !important;
  border: 1.5px solid #BFDBFE !important;
  border-radius: 20px !important;
  padding: 20px 30px !important;
  margin-bottom: 16px !important;
  overflow: hidden !important;
  box-shadow: 0 4px 20px rgba(37, 99, 235, 0.08) !important;
  min-height: 135px !important;
}

.pm-hero-left {
  position: relative !important;
  z-index: 10 !important;
  display: flex !important;
  align-items: center !important;
  gap: 16px !important;
}

.pm-hero-bag-icon {
  width: 50px !important;
  height: 50px !important;
  border-radius: 14px !important;
  background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35) !important;
  flex-shrink: 0 !important;
}

.pm-main-title {
  font-size: 24px !important;
  font-weight: 800 !important;
  color: #0F172A !important;
  margin: 0 0 3px 0 !important;
  letter-spacing: -0.4px !important;
}

.pm-main-subtitle {
  font-size: 13px !important;
  color: #475569 !important;
  margin: 0 0 10px 0 !important;
  font-weight: 500 !important;
}

.pm-hero-badges-row {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  flex-wrap: wrap !important;
}

.pm-hero-badge {
  display: inline-flex !important;
  align-items: center !important;
  gap: 5px !important;
  background: #FFFFFF !important;
  border: 1.5px solid #DBEAFE !important;
  padding: 4px 12px !important;
  border-radius: 9999px !important;
  font-size: 11px !important;
  font-weight: 700 !important;
  color: #1E40AF !important;
  box-shadow: 0 1px 4px rgba(37, 99, 235, 0.08) !important;
}

.pm-hero-badge .check {
  color: #10B981 !important;
  font-weight: 800 !important;
}

/* Product Management 4 KPI Cards - Rich Vibrant Theme */
.pm-kpi-card {
  border-radius: 16px !important;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05) !important;
  padding: 12px 18px !important;
}

.pm-kpi-card.blue-theme {
  background: linear-gradient(135deg, #EEF6FF 0%, #FFFFFF 100%) !important;
  border: 1.5px solid #BFDBFE !important;
}

.pm-kpi-card.rose-theme {
  background: linear-gradient(135deg, #FFF1F3 0%, #FFFFFF 100%) !important;
  border: 1.5px solid #FECDD3 !important;
}

.pm-kpi-card.green-theme {
  background: linear-gradient(135deg, #ECFDF5 0%, #FFFFFF 100%) !important;
  border: 1.5px solid #A7F3D0 !important;
}

.pm-kpi-card.purple-theme {
  background: linear-gradient(135deg, #FAF5FF 0%, #FFFFFF 100%) !important;
  border: 1.5px solid #E9D5FF !important;
}

.pm-kpi-icon-pill.blue {
  background: #DBEAFE !important;
  color: #1D4ED8 !important;
  border: 1px solid #BFDBFE !important;
}

.pm-kpi-icon-pill.rose {
  background: #FFE4E6 !important;
  color: #E11D48 !important;
  border: 1px solid #FECDD3 !important;
}

.pm-kpi-icon-pill.green {
  background: #DCFCE7 !important;
  color: #059669 !important;
  border: 1px solid #BBF7D0 !important;
}

.pm-kpi-icon-pill.purple {
  background: #F3E8FF !important;
  color: #7E22CE !important;
  border: 1px solid #E9D5FF !important;
}
`;

fs.appendFileSync(pmCssPath, pmBrightCss, 'utf8');
console.log('SUCCESS: Dashboard storefront "before image" restored & Product Management colors updated to vibrant theme!');
