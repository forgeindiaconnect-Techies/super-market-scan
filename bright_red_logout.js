const fs = require('fs');
const layoutCssPath = 'd:\\PROJECTS\\Super market\\frontend\\src\\layouts\\AdminLayout.css';

const brightRedLogoutCss = `
/* ===================================================================
   VIVID RED LOGOUT BUTTON WITH BRIGHT WHITE TEXT
   =================================================================== */
.sidebar-logout-btn {
  margin-top: 6px !important;
  margin-bottom: 3px !important;
  background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%) !important;
  border: 1.5px solid #F87171 !important;
  color: #FFFFFF !important;
  font-weight: 800 !important;
  font-size: 13.5px !important;
  padding: 8px 14px !important;
  border-radius: 10px !important;
  box-shadow: 0 4px 14px rgba(220, 38, 38, 0.45) !important;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
  width: 100% !important;
  cursor: pointer !important;
}

.sidebar-logout-btn .nav-icon-wrap {
  color: #FFFFFF !important;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.35)) !important;
}

.sidebar-logout-btn .nav-label {
  color: #FFFFFF !important;
  font-weight: 800 !important;
  font-size: 13.5px !important;
  letter-spacing: 0.3px !important;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4) !important;
}

.sidebar-logout-btn:hover {
  background: linear-gradient(135deg, #F87171 0%, #EF4444 100%) !important;
  border-color: #FCA5A5 !important;
  color: #FFFFFF !important;
  transform: translateX(3px) !important;
  box-shadow: 0 6px 18px rgba(239, 68, 68, 0.65) !important;
}
`;

fs.appendFileSync(layoutCssPath, brightRedLogoutCss, 'utf8');
console.log('SUCCESS: Logout button updated to vivid red background with bright white text!');
