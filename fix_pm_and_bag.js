const fs = require('fs');

// 1. Copy the clean original 3D Blue Shopping Bag
const sourceBag = 'C:\\Users\\Forgeindiaconnect\\.gemini\\antigravity\\brain\\fb582fb9-2b2b-411c-ac43-40149f4c94a9\\clean_blue_shopping_bag_original_1794313763324.jpg';
const destPublic = 'd:\\PROJECTS\\Super market\\frontend\\public\\blue-shopping-bag-3d.jpg';
const destAssets = 'd:\\PROJECTS\\Super market\\frontend\\src\\assets\\blue-shopping-bag-3d.jpg';

if (fs.existsSync(sourceBag)) {
  fs.copyFileSync(sourceBag, destPublic);
  fs.copyFileSync(sourceBag, destAssets);
}

// 2. Fix Product Management header text and typography in ProductManagement.css
const pmCssPath = 'd:\\PROJECTS\\Super market\\frontend\\src\\pages\\admin\\ProductManagement.css';
const fixPmHeaderCss = `
/* ===================================================================
   FIX PRODUCT MANAGEMENT HEADER TYPOGRAPHY & SPACING
   =================================================================== */
.pm-hero-section {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  background: #FFFFFF !important;
  border: 1.5px solid #E2E8F0 !important;
  border-radius: 20px !important;
  padding: 18px 28px !important;
  margin-bottom: 16px !important;
  box-shadow: 0 4px 18px rgba(0, 50, 150, 0.05) !important;
  min-height: 120px !important;
}

.pm-hero-left {
  display: flex !important;
  align-items: center !important;
  gap: 16px !important;
  position: relative !important;
  z-index: 5 !important;
  max-width: 580px !important;
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

.pm-hero-text-block {
  display: flex !important;
  flex-direction: column !important;
  align-items: flex-start !important;
  gap: 3px !important;
}

.pm-main-title {
  font-size: 24px !important;
  font-weight: 800 !important;
  color: #0F172A !important;
  margin: 0 !important;
  line-height: 1.15 !important;
  letter-spacing: -0.3px !important;
  display: block !important;
}

.pm-main-subtitle {
  font-size: 13px !important;
  font-weight: 600 !important;
  color: #475569 !important;
  margin: 0 0 6px 0 !important;
  line-height: 1.3 !important;
  display: block !important;
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
  background: #F8FAFC !important;
  border: 1.5px solid #CBD5E1 !important;
  padding: 4px 12px !important;
  border-radius: 9999px !important;
  font-size: 11.5px !important;
  font-weight: 700 !important;
  color: #1E293B !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04) !important;
}

.pm-hero-badge .check {
  color: #10B981 !important;
  font-weight: 900 !important;
  font-size: 12px !important;
}
`;

fs.appendFileSync(pmCssPath, fixPmHeaderCss, 'utf8');
console.log('SUCCESS: Clean original shopping bag restored and Product Management header text cleanly formatted!');
