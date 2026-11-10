const fs = require('fs');
const jsxPath = 'd:\\PROJECTS\\Super market\\frontend\\src\\pages\\admin\\AdminDashboard.jsx';
const cssPath = 'd:\\PROJECTS\\Super market\\frontend\\src\\pages\\admin\\AdminDashboard.css';

let jsx = fs.readFileSync(jsxPath, 'utf8');

// 1. Re-order Hero Banner elements so db-hero-left is first on the left
const oldBannerRegex = /<section className="db-hero-banner">[\s\S]*?<\/section>/;

const correctHeroBanner = `<section className="db-hero-banner">
        {/* 1. Panoramic Background Produce Cart on the Right */}
        <div className="db-hero-panoramic-bg" style={{ backgroundImage: "url('/dashboard-hero-fresh-cart.jpg')" }} />

        {/* 2. Left Group: 3D Shopping Bag + Welcome Back Card */}
        <div className="db-hero-left">
          <div className="db-storefront-3d-wrap">
            <img
              src={blueShoppingBagImg}
              alt="GrocerEase Shopping Bag"
              className="db-storefront-3d-img"
              onError={(e) => { e.currentTarget.src = "/storefront-3d.jpg"; }}
            />
          </div>
          <div className="db-hero-text-block">
            <h1 className="db-hero-title">
              <span>Welcome Back,</span>
              <span className="db-hero-title-blue"> Pooja!</span>
              <span role="img" aria-label="wave"> 👋</span>
            </h1>
            <p className="db-hero-subtitle">Manage your supermarket efficiently and grow your business.</p>
            <div className="db-hero-meta-row">
              <div className="db-date-pill">
                <Calendar size={12} color="#2563EB" />
                <span>Mon, Nov 3, 2026 • 4:25 PM</span>
              </div>
              <button
                type="button"
                className="db-hero-insights-btn"
                onClick={() => {
                  const el = document.getElementById("sales-analytics-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <span>View Insights</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* 3. Center Supermarket Thought / Slogan */}
        <div className="db-hero-thought-center">
          <span className="db-thought-script">Freshness in Every Cart</span>
          <span className="db-thought-sub">Everyday Low Prices • Always Fresh</span>
          <div className="db-thought-swoosh" />
        </div>
      </section>`;

if (oldBannerRegex.test(jsx)) {
  jsx = jsx.replace(oldBannerRegex, correctHeroBanner);
  fs.writeFileSync(jsxPath, jsx, 'utf8');
}

// 2. Ensure CSS pins db-hero-left to the front with z-index 20
const fixBannerCss = `
/* ===================================================================
   HERO BANNER POSITIONING FIX (PINS 3D BAG & WELCOME CARD TO LEFT)
   =================================================================== */
.db-hero-banner {
  display: flex !important;
  align-items: center !important;
  justify-content: flex-start !important;
  position: relative !important;
  overflow: hidden !important;
  width: 100% !important;
  height: 130px !important;
  min-height: 130px !important;
  max-height: 130px !important;
  padding: 10px 24px !important;
  box-sizing: border-box !important;
}

.db-hero-left {
  display: flex !important;
  align-items: center !important;
  gap: 16px !important;
  position: relative !important;
  z-index: 25 !important;
  max-width: 50% !important;
}

.db-storefront-3d-wrap {
  width: 90px !important;
  height: 90px !important;
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

.db-hero-thought-center {
  position: absolute !important;
  left: 48% !important;
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

.db-hero-panoramic-bg {
  position: absolute !important;
  top: 0 !important;
  right: 0 !important;
  width: 48% !important;
  height: 100% !important;
  background-size: cover !important;
  background-position: right center !important;
  background-repeat: no-repeat !important;
  pointer-events: none !important;
  z-index: 1 !important;
}
`;

fs.appendFileSync(cssPath, fixBannerCss, 'utf8');
console.log('SUCCESS: 3D Bag and Welcome Card are now permanently pinned to the left in full view!');
