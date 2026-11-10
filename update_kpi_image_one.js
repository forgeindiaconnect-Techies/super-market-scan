const fs = require('fs');
const jsxPath = 'd:\\PROJECTS\\Super market\\frontend\\src\\pages\\admin\\AdminDashboard.jsx';
const cssPath = 'd:\\PROJECTS\\Super market\\frontend\\src\\pages\\admin\\AdminDashboard.css';

let jsx = fs.readFileSync(jsxPath, 'utf8');

// 1. Ensure ShoppingBag is imported
if (!jsx.includes('ShoppingBag,')) {
  jsx = jsx.replace('ShoppingCart,', 'ShoppingCart,\n  ShoppingBag,');
}

// 2. Replace KPI grid section with exact stepped mini-bars & glowing halos matching Image 1
const kpiGridRegex = /<section className="db-kpi-grid">[\s\S]*?<\/section>/;

const imageOneKpiSection = `<section className="db-kpi-grid">
        {/* Card 1: Total Sales (Blue) */}
        <div className="db-kpi-card blue-theme">
          <div className="db-kpi-left-group">
            <div className="db-kpi-halo blue">
              <div className="db-kpi-icon-pill blue">
                <ShoppingCart size={18} color="#FFFFFF" strokeWidth={2.4} />
              </div>
            </div>
            <div className="db-kpi-info">
              <span className="db-kpi-title">Total Sales</span>
              <h2 className="db-kpi-value">₹{Number(stats.totalSales).toLocaleString("en-IN")}</h2>
              <span className="db-kpi-trend green">↑ 12.5% vs last month</span>
            </div>
          </div>
          <div className="db-kpi-stepped-bars">
            <div className="db-bar blue" style={{ height: "35%" }} />
            <div className="db-bar blue" style={{ height: "50%" }} />
            <div className="db-bar blue" style={{ height: "68%" }} />
            <div className="db-bar blue" style={{ height: "84%" }} />
            <div className="db-bar blue active" style={{ height: "100%" }} />
          </div>
        </div>

        {/* Card 2: Total Orders (Rose) */}
        <div className="db-kpi-card rose-theme">
          <div className="db-kpi-left-group">
            <div className="db-kpi-halo rose">
              <div className="db-kpi-icon-pill rose">
                <ShoppingBag size={18} color="#FFFFFF" strokeWidth={2.4} />
              </div>
            </div>
            <div className="db-kpi-info">
              <span className="db-kpi-title">Total Orders</span>
              <h2 className="db-kpi-value">{stats.totalOrders}</h2>
              <span className="db-kpi-trend green">↑ 0.3% vs last month</span>
            </div>
          </div>
          <div className="db-kpi-stepped-bars">
            <div className="db-bar rose" style={{ height: "35%" }} />
            <div className="db-bar rose" style={{ height: "50%" }} />
            <div className="db-bar rose" style={{ height: "68%" }} />
            <div className="db-bar rose" style={{ height: "84%" }} />
            <div className="db-bar rose active" style={{ height: "100%" }} />
          </div>
        </div>

        {/* Card 3: Customers (Green) */}
        <div className="db-kpi-card green-theme">
          <div className="db-kpi-left-group">
            <div className="db-kpi-halo green">
              <div className="db-kpi-icon-pill green">
                <Users size={18} color="#FFFFFF" strokeWidth={2.4} />
              </div>
            </div>
            <div className="db-kpi-info">
              <span className="db-kpi-title">Customers</span>
              <h2 className="db-kpi-value">{stats.activeCustomers}</h2>
              <span className="db-kpi-trend green">↑ 15.2% vs last month</span>
            </div>
          </div>
          <div className="db-kpi-stepped-bars">
            <div className="db-bar green" style={{ height: "35%" }} />
            <div className="db-bar green" style={{ height: "50%" }} />
            <div className="db-bar green" style={{ height: "68%" }} />
            <div className="db-bar green" style={{ height: "84%" }} />
            <div className="db-bar green active" style={{ height: "100%" }} />
          </div>
        </div>

        {/* Card 4: Active Products (Purple) */}
        <div className="db-kpi-card purple-theme">
          <div className="db-kpi-left-group">
            <div className="db-kpi-halo purple">
              <div className="db-kpi-icon-pill purple">
                <Package size={18} color="#FFFFFF" strokeWidth={2.4} />
              </div>
            </div>
            <div className="db-kpi-info">
              <span className="db-kpi-title">Active Products</span>
              <h2 className="db-kpi-value">{stats.catalogProducts}</h2>
              <span className="db-kpi-trend green">↑ 10.1% vs last month</span>
            </div>
          </div>
          <div className="db-kpi-stepped-bars">
            <div className="db-bar purple" style={{ height: "35%" }} />
            <div className="db-bar purple" style={{ height: "50%" }} />
            <div className="db-bar purple" style={{ height: "68%" }} />
            <div className="db-bar purple" style={{ height: "84%" }} />
            <div className="db-bar purple active" style={{ height: "100%" }} />
          </div>
        </div>
      </section>`;

if (kpiGridRegex.test(jsx)) {
  jsx = jsx.replace(kpiGridRegex, imageOneKpiSection);
  fs.writeFileSync(jsxPath, jsx, 'utf8');
}

// 3. Append exact Stepped Bars & Luminous Halo styles matching Image 1
const imageOneCss = `
/* ===================================================================
   KPI CARDS EXACT MATCH TO REFERENCE IMAGE 1
   =================================================================== */
.db-kpi-card {
  border-radius: 14px !important;
  padding: 10px 14px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  height: 74px !important;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04) !important;
  transition: transform 0.15s ease, box-shadow 0.15s ease !important;
}

.db-kpi-card.blue-theme {
  background: linear-gradient(135deg, #EEF6FF 0%, #FFFFFF 100%) !important;
  border: 1.5px solid #BFDBFE !important;
}

.db-kpi-card.rose-theme {
  background: linear-gradient(135deg, #FFF1F3 0%, #FFFFFF 100%) !important;
  border: 1.5px solid #FECDD3 !important;
}

.db-kpi-card.green-theme {
  background: linear-gradient(135deg, #ECFDF5 0%, #FFFFFF 100%) !important;
  border: 1.5px solid #A7F3D0 !important;
}

.db-kpi-card.purple-theme {
  background: linear-gradient(135deg, #FAF5FF 0%, #FFFFFF 100%) !important;
  border: 1.5px solid #E9D5FF !important;
}

/* Luminous Halo Ring around Icon */
.db-kpi-halo {
  padding: 4px !important;
  border-radius: 50% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  flex-shrink: 0 !important;
}

.db-kpi-halo.blue { background: rgba(37, 99, 235, 0.16) !important; }
.db-kpi-halo.rose { background: rgba(244, 63, 94, 0.16) !important; }
.db-kpi-halo.green { background: rgba(16, 185, 129, 0.16) !important; }
.db-kpi-halo.purple { background: rgba(139, 92, 246, 0.16) !important; }

.db-kpi-icon-pill {
  width: 36px !important;
  height: 36px !important;
  border-radius: 50% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.db-kpi-icon-pill.blue { background: #2563EB !important; box-shadow: 0 3px 8px rgba(37, 99, 235, 0.35) !important; }
.db-kpi-icon-pill.rose { background: #F43F5E !important; box-shadow: 0 3px 8px rgba(244, 63, 94, 0.35) !important; }
.db-kpi-icon-pill.green { background: #10B981 !important; box-shadow: 0 3px 8px rgba(16, 185, 129, 0.35) !important; }
.db-kpi-icon-pill.purple { background: #8B5CF6 !important; box-shadow: 0 3px 8px rgba(139, 92, 246, 0.35) !important; }

.db-kpi-title {
  font-size: 11px !important;
  font-weight: 700 !important;
  color: #475569 !important;
}

.db-kpi-value {
  font-size: 21px !important;
  font-weight: 800 !important;
  color: #0F172A !important;
  margin: 1px 0 !important;
  letter-spacing: -0.3px !important;
}

.db-kpi-trend {
  font-size: 10px !important;
  font-weight: 700 !important;
}

/* 5 Stepped Gradient Mini-Bars (|||||) matching Image 1 */
.db-kpi-stepped-bars {
  display: flex !important;
  align-items: flex-end !important;
  gap: 4px !important;
  height: 40px !important;
  padding-right: 2px !important;
  flex-shrink: 0 !important;
}

.db-bar {
  width: 6px !important;
  border-radius: 3px !important;
}

/* Blue Stepped Bars */
.db-bar.blue:nth-child(1) { background: rgba(59, 130, 246, 0.35) !important; }
.db-bar.blue:nth-child(2) { background: rgba(59, 130, 246, 0.5) !important; }
.db-bar.blue:nth-child(3) { background: rgba(59, 130, 246, 0.65) !important; }
.db-bar.blue:nth-child(4) { background: rgba(59, 130, 246, 0.8) !important; }
.db-bar.blue.active { background: #2563EB !important; box-shadow: 0 0 8px rgba(37, 99, 235, 0.45) !important; }

/* Rose Stepped Bars */
.db-bar.rose:nth-child(1) { background: rgba(244, 63, 94, 0.35) !important; }
.db-bar.rose:nth-child(2) { background: rgba(244, 63, 94, 0.5) !important; }
.db-bar.rose:nth-child(3) { background: rgba(244, 63, 94, 0.65) !important; }
.db-bar.rose:nth-child(4) { background: rgba(244, 63, 94, 0.8) !important; }
.db-bar.rose.active { background: #F43F5E !important; box-shadow: 0 0 8px rgba(244, 63, 94, 0.45) !important; }

/* Green Stepped Bars */
.db-bar.green:nth-child(1) { background: rgba(16, 185, 129, 0.35) !important; }
.db-bar.green:nth-child(2) { background: rgba(16, 185, 129, 0.5) !important; }
.db-bar.green:nth-child(3) { background: rgba(16, 185, 129, 0.65) !important; }
.db-bar.green:nth-child(4) { background: rgba(16, 185, 129, 0.8) !important; }
.db-bar.green.active { background: #10B981 !important; box-shadow: 0 0 8px rgba(16, 185, 129, 0.45) !important; }

/* Purple Stepped Bars */
.db-bar.purple:nth-child(1) { background: rgba(168, 85, 247, 0.35) !important; }
.db-bar.purple:nth-child(2) { background: rgba(168, 85, 247, 0.5) !important; }
.db-bar.purple:nth-child(3) { background: rgba(168, 85, 247, 0.65) !important; }
.db-bar.purple:nth-child(4) { background: rgba(168, 85, 247, 0.8) !important; }
.db-bar.purple.active { background: #8B5CF6 !important; box-shadow: 0 0 8px rgba(139, 92, 246, 0.45) !important; }
`;

fs.appendFileSync(cssPath, imageOneCss, 'utf8');
console.log('SUCCESS: KPI cards updated to exact match of Image 1 (5 stepped mini-bars & glowing halos)!');
