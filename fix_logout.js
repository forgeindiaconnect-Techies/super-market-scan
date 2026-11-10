const fs = require('fs');
const layoutCssPath = 'd:\\PROJECTS\\Super market\\frontend\\src\\layouts\\AdminLayout.css';

const sleekLogoutCss = `
/* ===================================================================
   PERFECT SLEEK LOGOUT BUTTON & BOTTOM PROPORTIONS
   =================================================================== */
.sidebar-promo-wrap {
  margin-top: 8px !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 6px !important;
}

.sidebar-store-card {
  padding: 8px 10px !important;
  border-radius: 12px !important;
  background: rgba(10, 37, 88, 0.85) !important;
  border: 1px solid rgba(59, 130, 246, 0.35) !important;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25) !important;
}

.sidebar-logout-btn {
  margin-top: 4px !important;
  margin-bottom: 2px !important;
  background: rgba(255, 255, 255, 0.06) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  color: #FFFFFF !important;
  font-weight: 600 !important;
  font-size: 13px !important;
  padding: 8px 12px !important;
  border-radius: 10px !important;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

.sidebar-logout-btn .nav-icon-wrap {
  color: #93C5FD !important;
}

.sidebar-logout-btn:hover {
  background: rgba(239, 68, 68, 0.2) !important;
  border-color: rgba(239, 68, 68, 0.5) !important;
  color: #FFFFFF !important;
  transform: translateX(3px) !important;
  box-shadow: 0 2px 10px rgba(239, 68, 68, 0.25) !important;
}

.sidebar-logout-btn:hover .nav-icon-wrap {
  color: #F87171 !important;
}

.sidebar-version-pill {
  padding-top: 4px !important;
  text-align: center !important;
}

.sidebar-version-pill span {
  font-size: 9px !important;
  color: rgba(255, 255, 255, 0.45) !important;
  letter-spacing: 0.3px !important;
}
`;

fs.appendFileSync(layoutCssPath, sleekLogoutCss, 'utf8');
console.log('SUCCESS: Logout button redesigned to match the sleek dark navy sidebar perfectly!');
