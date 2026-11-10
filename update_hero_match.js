const fs = require('fs');

// 1. Copy the newly generated 3D Blue Shopping Bag with green leaves
const sourceImg = 'C:\\Users\\Forgeindiaconnect\\.gemini\\antigravity\\brain\\fb582fb9-2b2b-411c-ac43-40149f4c94a9\\blue_shopping_bag_3d_leaves_1794312161414.jpg';
const destPublic = 'd:\\PROJECTS\\Super market\\frontend\\public\\blue-shopping-bag-3d.jpg';
const destAssets = 'd:\\PROJECTS\\Super market\\frontend\\src\\assets\\blue-shopping-bag-3d.jpg';

if (fs.existsSync(sourceImg)) {
  fs.copyFileSync(sourceImg, destPublic);
  fs.copyFileSync(sourceImg, destAssets);
}

// 2. Update AdminDashboard.css to match Image 2 exactly
const cssPath = 'd:\\PROJECTS\\Super market\\frontend\\src\\pages\\admin\\AdminDashboard.css';
const heroMatchCss = `
/* ===================================================================
   HERO BANNER EXACT MATCH TO REFERENCE IMAGE 2
   =================================================================== */
.db-hero-left {
  display: flex !important;
  align-items: center !important;
  gap: 16px !important;
}

/* Remove the white square box around the bag */
.db-storefront-3d-wrap {
  width: 90px !important;
  height: 90px !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  filter: drop-shadow(0 8px 18px rgba(20, 85, 217, 0.25)) !important;
  padding: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

/* Seamless blending of bag leaves onto the sky-blue banner */
.db-storefront-3d-img {
  width: 100% !important;
  height: 100% !important;
  object-fit: contain !important;
  border-radius: 0 !important;
  mix-blend-mode: multiply !important;
}

/* Frosted-White Capsule Pill around "Welcome Back, Pooja!" matching Image 2 */
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
`;

fs.appendFileSync(cssPath, heroMatchCss, 'utf8');
console.log('SUCCESS: Hero banner updated! Bag box removed & frosted-white capsule pill active!');
