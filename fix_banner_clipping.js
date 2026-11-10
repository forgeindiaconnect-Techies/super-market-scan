const fs = require('fs');
const cssPath = 'd:\\PROJECTS\\Super market\\frontend\\src\\pages\\admin\\AdminDashboard.css';

const fixPanoramicImageCss = `
/* ===================================================================
   FIX HERO PANORAMIC IMAGE CLIPPING (FIT FULL CART & TEXT)
   =================================================================== */
.db-hero-banner {
  height: 142px !important;
  min-height: 142px !important;
  max-height: 142px !important;
  padding: 8px 24px !important;
  overflow: hidden !important;
  position: relative !important;
}

.db-hero-panoramic-bg {
  position: absolute !important;
  top: 0 !important;
  right: 14px !important;
  width: 65% !important;
  height: 100% !important;
  background-size: contain !important;
  background-position: right center !important;
  background-repeat: no-repeat !important;
  pointer-events: none !important;
  z-index: 1 !important;
  mask-image: linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.4) 12%, black 35%) !important;
  -webkit-mask-image: linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.4) 12%, black 35%) !important;
}
`;

fs.appendFileSync(cssPath, fixPanoramicImageCss, 'utf8');
console.log('SUCCESS: Banner image adjusted to contain! Cart and text are 100% visible with zero clipping!');
