import React, { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

export default function BarcodeSVG({
  value,
  height = 55,
  showText = true,
  className = "",
  style = {},
}) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!value || !svgRef.current) return;

    try {
      JsBarcode(svgRef.current, String(value).trim(), {
        format: "CODE128",
        width: 2,
        height,
        displayValue: showText,
        fontSize: 12,
        margin: 10,
        background: "#ffffff",
        lineColor: "#111827",
      });
    } catch (error) {
      console.error("Barcode generation failed:", error);
    }
  }, [value, height, showText]);

  if (!value) return null;

  return (
    <svg
      ref={svgRef}
      className={className}
      style={style}
    />
  );
}
