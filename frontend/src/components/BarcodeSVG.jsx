import React, { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

export default function BarcodeSVG({
  value,
  barcode,
  width = 1.8,
  height = 50,
  showText = true,
  displayValue,
  format = "CODE128",
  className = "",
  style = {},
}) {
  const svgRef = useRef(null);
  const codeValue = String(barcode || value || "").trim();
  const shouldShowText = displayValue !== undefined ? displayValue : showText;

  useEffect(() => {
    if (!codeValue || !svgRef.current) return;

    try {
      JsBarcode(svgRef.current, codeValue, {
        format: format || "CODE128",
        width,
        height,
        displayValue: shouldShowText,
        fontSize: 11,
        font: "monospace",
        fontOptions: "bold",
        margin: 6,
        background: "#ffffff",
        lineColor: "#0f172a",
      });
    } catch (err) {
      // Fallback to standard CODE128 if specific format failed
      try {
        JsBarcode(svgRef.current, codeValue, {
          format: "CODE128",
          width,
          height,
          displayValue: shouldShowText,
          fontSize: 11,
          font: "monospace",
          margin: 6,
          background: "#ffffff",
          lineColor: "#0f172a",
        });
      } catch (fallbackErr) {
        console.warn("Barcode rendering fallback:", fallbackErr.message);
      }
    }
  }, [codeValue, width, height, shouldShowText, format]);

  if (!codeValue) return null;

  return (
    <svg
      ref={svgRef}
      className={className}
      style={{ display: "block", margin: "0 auto", maxWidth: "100%", ...style }}
    />
  );
}
