const fs = require('fs');

// 1. Copy the new 3D Blue Shopping Bag with green leaves
const sourceImg = 'C:\\Users\\Forgeindiaconnect\\.gemini\\antigravity\\brain\\fb582fb9-2b2b-411c-ac43-40149f4c94a9\\blue_shopping_bag_3d_leaves_1794312161414.jpg';
const destPublic = 'd:\\PROJECTS\\Super market\\frontend\\public\\blue-shopping-bag-3d.jpg';
const destAssets = 'd:\\PROJECTS\\Super market\\frontend\\src\\assets\\blue-shopping-bag-3d.jpg';

if (fs.existsSync(sourceImg)) {
  fs.copyFileSync(sourceImg, destPublic);
  fs.copyFileSync(sourceImg, destAssets);
}

// 2. Append pixel-perfect Hero Banner styles to AdminDashboard.css
const cssPath = 'd:\\PROJECTS\\Super market\\frontend\\src\\pages\\admin\\AdminDashboard.css';
const heroMatchCss = `
/* ===================================================================
   HERO BANNER EXACT RECREATION (PIXEL-PERFECT MATCH TO REFERENCE)
   =================================================================== */
.db-hero-banner {
  background: linear-gradient(135deg, #dbeafe 0%, #edf5fe 50%, #f4f8fe 100%) !important;
  border: 1.5px solid #bfdbfe !important;
  border-radius: 18px !important;
  padding: 12px 24px !important;
  position: relative !important;
  overflow: hidden !important;
  box-shadow: 0 4px 20px rgba(37, 99, 235, 0.08) !important;
  height: 130px !important;
  min-height: 130px !important;
  max-height: 130px !important;
}

.db-hero-left {
  display: flex !important;
  align-items: center !important;
  gap: 16px !important;
  position: relative !important;
  z-index: 10 !important;
}

/* 3D Blue Bag without box - standing naturally with leaves on the surface */
.db-storefront-3d-wrap {
  width: 95px !important;
  height: 95px !important;
  flex-shrink: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  filter: drop-shadow(0 8px 18px rgba(20, 85, 217, 0.25)) !important;
  padding: 0 !important;
}

.db-storefront-3d-img {
  width: 100% !important;
  height: 100% !important;
  object-fit: contain !important;
  border-radius: 0 !important;
  mix-blend-mode: multiply !important;
}

/* Frosted-White Capsule Pill around "Welcome Back, Pooja!" */
.db-hero-text-block {
  display: flex !important;
  flex-direction: column !important;
  background: rgba(255, 255, 255, 0.76) !important;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
  border: 1.5px solid rgba(255, 255, 255, 0.95) !important;
  border-radius: 20px !important;
  padding: 10px 22px 12px 22px !important;
  box-shadow: 0 4px 18px rgba(37, 99, 235, 0.08) !important;
}

.db-hero-title {
  font-size: 20px !important;
  font-weight: 800 !important;
  color: #0F172A !important;
  margin: 0 0 2px 0 !important;
}

.db-hero-title-blue {
  color: #1455D9 !important;
}

.db-hero-subtitle {
  font-size: 12px !important;
  color: #475569 !important;
  margin: 0 0 9px 0 !important;
  font-weight: 500 !important;
}

.db-hero-meta-row {
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
}

.db-date-pill {
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
  background: #FFFFFF !important;
  border: 1.5px solid #DBEAFE !important;
  padding: 4px 12px !important;
  border-radius: 9999px !important;
  font-size: 11px !important;
  font-weight: 700 !important;
  color: #2563EB !important;
  box-shadow: 0 1px 4px rgba(37, 99, 235, 0.08) !important;
}

.db-hero-insights-btn {
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
  background: #1455D9 !important;
  color: #FFFFFF !important;
  border: none !important;
  border-radius: 9999px !important;
  padding: 5px 16px !important;
  font-size: 11px !important;
  font-weight: 700 !important;
  cursor: pointer !important;
  box-shadow: 0 3px 10px rgba(20, 85, 217, 0.4) !important;
  transition: all 0.15s ease !important;
}

/* Script Overlay: "Freshness in Every Cart" with Golden Swoosh Arc */
.db-hero-script-badge {
  position: absolute !important;
  top: 50% !important;
  right: 22% !important;
  z-index: 3 !important;
  pointer-events: none !important;
  transform: translateY(-50%) rotate(-3deg) !important;
}

.db-hero-script-badge span {
  font-family: "Brush Script MT", "Segoe Script", cursive, sans-serif !important;
  font-size: 24px !important;
  font-weight: 700 !important;
  color: #1E40AF !important;
  text-shadow: 0 2px 4px rgba(255, 255, 255, 0.9), 0 0 10px rgba(30, 64, 175, 0.2) !important;
  position: relative !important;
  display: inline-block !important;
}

.db-hero-script-badge::after {
  content: "" !important;
  position: absolute !important;
  bottom: -6px !important;
  right: 8px !important;
  width: 90px !important;
  height: 4px !important;
  border-radius: 9999px !important;
  background: linear-gradient(90deg, #F59E0B 0%, #FBBF24 100%) !important;
  box-shadow: 0 1px 4px rgba(245, 158, 11, 0.4) !important;
}
`;

fs.appendFileSync(cssPath, heroMatchCss, 'utf8');
console.log('SUCCESS: Banner updated! Bag box removed, green leaves blended, frosted pill card and golden swoosh active!');
