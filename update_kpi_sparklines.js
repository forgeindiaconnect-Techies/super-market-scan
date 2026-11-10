const fs = require('fs');
const jsxPath = 'd:\\PROJECTS\\Super market\\frontend\\src\\pages\\admin\\AdminDashboard.jsx';
const cssPath = 'd:\\PROJECTS\\Super market\\frontend\\src\\pages\\admin\\AdminDashboard.css';

let jsx = fs.readFileSync(jsxPath, 'utf8');

// Replace the vertical bars section in the 4 KPI cards with smooth glowing wave sparklines
const oldKpiSectionRegex = /<section className="db-kpi-grid">[\s\S]*?<\/section>/;

const newKpiSection = `<section className="db-kpi-grid">
        {/* Card 1: Total Sales (Blue Glowing Wave) */}
        <div className="db-kpi-card blue-theme">
          <div className="db-kpi-left-group">
            <div className="db-kpi-icon-pill blue">
              <TrendingUp size={19} strokeWidth={2.4} />
            </div>
            <div className="db-kpi-info">
              <span className="db-kpi-title">Total Sales</span>
              <h2 className="db-kpi-value">₹{Number(stats.totalSales).toLocaleString("en-IN")}</h2>
              <span className="db-kpi-trend green">↑ 12.5% vs last month</span>
            </div>
          </div>
          <div className="db-kpi-sparkline-wrap">
            <svg viewBox="0 0 100 42" className="db-kpi-sparkline-svg" preserveAspectRatio="none">
              <defs>
                <linearGradient id="kpiBlueGrad" x1="0" y1="0" x2="0" y2="100%">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <path d="M0,32 Q25,30 50,18 T100,6 L100,42 L0,42 Z" fill="url(#kpiBlueGrad)" />
              <path d="M0,32 Q25,30 50,18 T100,6" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Card 2: Total Orders (Rose Glowing Wave) */}
        <div className="db-kpi-card rose-theme">
          <div className="db-kpi-left-group">
            <div className="db-kpi-icon-pill rose">
              <ShoppingCart size={19} strokeWidth={2.4} />
            </div>
            <div className="db-kpi-info">
              <span className="db-kpi-title">Total Orders</span>
              <h2 className="db-kpi-value">{stats.totalOrders}</h2>
              <span className="db-kpi-trend green">↑ 0.3% vs last month</span>
            </div>
          </div>
          <div className="db-kpi-sparkline-wrap">
            <svg viewBox="0 0 100 42" className="db-kpi-sparkline-svg" preserveAspectRatio="none">
              <defs>
                <linearGradient id="kpiRoseGrad" x1="0" y1="0" x2="0" y2="100%">
                  <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <path d="M0,34 Q25,30 50,20 T100,6 L100,42 L0,42 Z" fill="url(#kpiRoseGrad)" />
              <path d="M0,34 Q25,30 50,20 T100,6" fill="none" stroke="#F43F5E" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Card 3: Customers (Green Glowing Wave) */}
        <div className="db-kpi-card green-theme">
          <div className="db-kpi-left-group">
            <div className="db-kpi-icon-pill green">
              <Users size={19} strokeWidth={2.4} />
            </div>
            <div className="db-kpi-info">
              <span className="db-kpi-title">Customers</span>
              <h2 className="db-kpi-value">{stats.activeCustomers}</h2>
              <span className="db-kpi-trend green">↑ 15.2% vs last month</span>
            </div>
          </div>
          <div className="db-kpi-sparkline-wrap">
            <svg viewBox="0 0 100 42" className="db-kpi-sparkline-svg" preserveAspectRatio="none">
              <defs>
                <linearGradient id="kpiGreenGrad" x1="0" y1="0" x2="0" y2="100%">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <path d="M0,32 Q25,28 50,18 T100,6 L100,42 L0,42 Z" fill="url(#kpiGreenGrad)" />
              <path d="M0,32 Q25,28 50,18 T100,6" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Card 4: Active Products (Purple Glowing Wave) */}
        <div className="db-kpi-card purple-theme">
          <div className="db-kpi-left-group">
            <div className="db-kpi-icon-pill purple">
              <Package size={19} strokeWidth={2.4} />
            </div>
            <div className="db-kpi-info">
              <span className="db-kpi-title">Active Products</span>
              <h2 className="db-kpi-value">{stats.catalogProducts}</h2>
              <span className="db-kpi-trend green">↑ 10.1% vs last month</span>
            </div>
          </div>
          <div className="db-kpi-sparkline-wrap">
            <svg viewBox="0 0 100 42" className="db-kpi-sparkline-svg" preserveAspectRatio="none">
              <defs>
                <linearGradient id="kpiPurpleGrad" x1="0" y1="0" x2="0" y2="100%">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <path d="M0,34 Q25,32 50,20 T100,6 L100,42 L0,42 Z" fill="url(#kpiPurpleGrad)" />
              <path d="M0,34 Q25,32 50,20 T100,6" fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </section>`;

if (oldKpiSectionRegex.test(jsx)) {
  jsx = jsx.replace(oldKpiSectionRegex, newKpiSection);
  fs.writeFileSync(jsxPath, jsx, 'utf8');
}

// Append CSS rules for the sparkline wrap
const sparklineCss = `
/* ===================================================================
   KPI SPARKLINE GLOWING WAVES MATCHING TARGET REFERENCE
   =================================================================== */
.db-kpi-sparkline-wrap {
  width: 76px !important;
  height: 42px !important;
  flex-shrink: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: flex-end !important;
  pointer-events: none !important;
}

.db-kpi-sparkline-svg {
  width: 100% !important;
  height: 100% !important;
  overflow: visible !important;
}
`;

fs.appendFileSync(cssPath, sparklineCss, 'utf8');
console.log('SUCCESS: KPI cards updated with smooth upward glowing wave curves!');
