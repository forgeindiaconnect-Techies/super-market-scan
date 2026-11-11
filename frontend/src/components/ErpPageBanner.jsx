import React from "react";
import blueShoppingBagImg from "../assets/blue-shopping-bag-3d.jpg";
import erpBannerArt from "../assets/erp-banner-art.jpg";

export default function ErpPageBanner({
  title = "Management Module",
  subtitle = "Manage your supermarket operations efficiently",
  badges = ["Track Stock", "Monitor Sales", "Keep Store Ready"],
  icon = null,
}) {
  return (
    <div className="erp-page-banner">
      <div className="erp-banner-left">
        <div className={`erp-banner-icon-wrap ${icon ? "has-custom-icon" : ""}`}>
          {icon ? (
            icon
          ) : (
            <img
              src={blueShoppingBagImg}
              alt="GrocerEase Bag"
              className="erp-banner-bag-img"
              onError={(e) => {
                e.currentTarget.src = "/blue-shopping-bag-3d.jpg";
              }}
            />
          )}
        </div>
        <div className="erp-banner-title-block">
          <h1 className="erp-banner-title">{title}</h1>
          <p className="erp-banner-sub">{subtitle}</p>
          <div className="erp-banner-badges-row">
            {badges.map((b, i) => (
              <span key={i} className="erp-banner-pill-badge">
                <span className="erp-check">✓</span> {b}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="erp-banner-art-wrap">
        <img
          src={erpBannerArt}
          alt="Fresh Choices"
          className="erp-banner-art-img"
          onError={(e) => {
            e.currentTarget.src = "/erp-banner-art.jpg";
          }}
        />
      </div>
    </div>
  );
}
