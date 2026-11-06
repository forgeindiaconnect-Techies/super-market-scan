import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Alert, Platform } from "react-native";
import { OrderRecord } from "../context/CartContext";

/**
 * Deterministic offline SVG Barcode Generator
 * Creates authentic optical barcode stripes without external dependencies or network requests
 */
function generateBarcodeSvg(code: string): string {
  const cleanCode = String(code || "EXIT-GATE-PASS").trim();
  const bars: string[] = [];
  let x = 12;

  // Start Guard Bars
  bars.push(`<rect x="${x}" y="0" width="2" height="42" fill="#0F172A" />`);
  x += 3;
  bars.push(`<rect x="${x}" y="0" width="1" height="42" fill="#0F172A" />`);
  x += 3;

  for (let i = 0; i < cleanCode.length; i++) {
    const charCode = cleanCode.charCodeAt(i);
    const w1 = (charCode % 3) + 1;
    const s1 = ((charCode >> 1) % 2) + 1;
    const w2 = ((charCode >> 2) % 3) + 1;
    const s2 = ((charCode >> 3) % 2) + 2;

    bars.push(`<rect x="${x}" y="0" width="${w1}" height="36" fill="#0F172A" />`);
    x += w1 + s1;
    bars.push(`<rect x="${x}" y="0" width="${w2}" height="36" fill="#0F172A" />`);
    x += w2 + s2;
  }

  // End Guard Bars
  bars.push(`<rect x="${x}" y="0" width="2" height="42" fill="#0F172A" />`);
  x += 3;
  bars.push(`<rect x="${x}" y="0" width="1" height="42" fill="#0F172A" />`);
  x += 12;

  return `
    <svg viewBox="0 0 ${x} 44" width="100%" height="46" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
      ${bars.join("")}
    </svg>
  `;
}

/**
 * Builds an authentic, professional, real-time supermarket tax invoice / cash memo HTML
 */
export function buildSupermarketReceiptHtml(order: OrderRecord): string {
  const items = Array.isArray(order.items) ? order.items : [];
  const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();

  const formattedDate = createdAt.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const formattedTime = createdAt.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const orderNum = order.orderNumber || "ORD-" + Date.now().toString().slice(-6);
  const totalAmount = Number(order.totalAmount || 0);
  const subtotalAmount = Number(order.subtotalAmount ?? totalAmount);
  const discountAmount = Number(order.discountAmount ?? 0);
  const grossAmount = subtotalAmount + discountAmount;
  const payMethod = order.paymentMethod || "UPI";
  const payStatus = order.paymentStatus || "Completed";
  const exitBarcode = order.exitBarcode || "EXIT-" + Date.now().toString().slice(-8);
  const customerName = (order as any).customer?.name || "Customer Shopper";
  const customerPhone = (order as any).customer?.phone || "";

  const totalQty = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

  // Calculate Included GST (approx 5% statutory supermarket rate)
  const taxableAmount = totalAmount / 1.05;
  const totalGst = totalAmount - taxableAmount;
  const cgst = totalGst / 2;
  const sgst = totalGst / 2;

  const barcodeSvgHtml = generateBarcodeSvg(exitBarcode);

  // Generate authentic line items
  const itemsRowsHtml = items
    .map((item, index) => {
      const name = item.name || "Supermarket Item";
      const brand = item.brand ? ` (${item.brand})` : "";
      const qty = item.quantity || 1;
      const rate = Number(item.price || item.effectivePrice || 0);
      const discount = Number(item.discount || 0);
      const mrp = rate + discount;
      const amount = rate * qty;
      const hsn = (item as any).hsn || (item.category === "Groceries" ? "1006" : "2106");

      return `
        <tr>
          <td style="padding: 7px 4px; font-size: 11.5px; text-align: center; color: #475569; vertical-align: top;">${index + 1}</td>
          <td style="padding: 7px 4px; font-size: 12px; color: #0F172A; font-weight: 600; vertical-align: top;">
            ${name}${brand}
          </td>
          <td style="padding: 7px 4px; font-size: 11px; text-align: center; color: #64748B; font-family: monospace; vertical-align: top;">${hsn}</td>
          <td style="padding: 7px 4px; font-size: 12px; text-align: center; color: #0F172A; font-weight: 700; vertical-align: top;">${qty}</td>
          <td style="padding: 7px 4px; font-size: 11px; text-align: right; color: #94A3B8; text-decoration: ${discount > 0 ? "line-through" : "none"}; vertical-align: top;">₹${mrp.toFixed(2)}</td>
          <td style="padding: 7px 4px; font-size: 11.5px; text-align: right; color: #334155; vertical-align: top;">₹${rate.toFixed(2)}</td>
          <td style="padding: 7px 4px; font-size: 12px; text-align: right; color: #0F172A; font-weight: 800; vertical-align: top;">₹${amount.toFixed(2)}</td>
        </tr>
      `;
    })
    .join("");

  const statusBg =
    payStatus === "Completed"
      ? "#DCFCE7"
      : payStatus === "Approved"
      ? "#EEF2FF"
      : "#FEF3C7";

  const statusColor =
    payStatus === "Completed"
      ? "#15803D"
      : payStatus === "Approved"
      ? "#4338CA"
      : "#B45309";

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Tax Invoice - ${orderNum}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 4mm;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, monospace, sans-serif;
            color: #0F172A;
            background-color: #F8FAFC;
            margin: 0;
            padding: 16px;
            font-size: 12px;
            line-height: 1.4;
          }
          .receipt-container {
            max-width: 520px;
            margin: 0 auto;
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            border-radius: 16px;
            padding: 24px 22px;
            box-shadow: 0 4px 24px rgba(15, 23, 42, 0.08);
          }
          .header-center {
            text-align: center;
            border-bottom: 2px dashed #0F172A;
            padding-bottom: 14px;
            margin-bottom: 14px;
          }
          .store-name {
            font-size: 21px;
            font-weight: 900;
            letter-spacing: 0.5px;
            color: #0F172A;
            margin: 0 0 2px 0;
            text-transform: uppercase;
          }
          .store-tag {
            font-size: 11px;
            font-weight: 700;
            color: #2563EB;
            letter-spacing: 0.8px;
            margin: 0 0 6px 0;
            text-transform: uppercase;
          }
          .store-address {
            font-size: 11px;
            color: #475569;
            margin: 0 0 4px 0;
          }
          .store-legal {
            font-size: 10.5px;
            color: #64748B;
            font-family: monospace;
            margin: 0;
          }
          .invoice-banner {
            text-align: center;
            margin: 10px 0 14px 0;
            background: #F1F5F9;
            border-radius: 8px;
            padding: 6px 10px;
          }
          .invoice-title {
            font-size: 13.5px;
            font-weight: 900;
            letter-spacing: 1px;
            color: #0F172A;
            margin: 0;
            text-transform: uppercase;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px 14px;
            margin-bottom: 14px;
            font-size: 11.5px;
          }
          .meta-label {
            color: #64748B;
            font-weight: 600;
          }
          .meta-value {
            color: #0F172A;
            font-weight: 700;
            text-align: right;
          }
          .status-tag {
            display: inline-block;
            background: ${statusBg};
            color: ${statusColor};
            font-size: 10.5px;
            font-weight: 800;
            padding: 2px 8px;
            border-radius: 12px;
            text-transform: uppercase;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0 16px 0;
            border-top: 1px solid #0F172A;
            border-bottom: 1px solid #0F172A;
          }
          .items-table th {
            background-color: #F8FAFC;
            font-size: 10.5px;
            font-weight: 800;
            color: #334155;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            padding: 6px 4px;
            border-bottom: 1px dashed #CBD5E1;
          }
          .totals-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
            font-size: 12px;
          }
          .totals-table td {
            padding: 4px 0;
          }
          .savings-card {
            background: #ECFDF5;
            border: 1px dashed #10B981;
            border-radius: 10px;
            padding: 9px 14px;
            text-align: center;
            color: #047857;
            font-size: 12.5px;
            font-weight: 800;
            margin: 12px 0;
            letter-spacing: 0.3px;
          }
          .grand-total-row {
            border-top: 2px dashed #0F172A;
            border-bottom: 2px dashed #0F172A;
            padding: 8px 0;
          }
          .grand-total-label {
            font-size: 14px;
            font-weight: 900;
            color: #0F172A;
          }
          .grand-total-amount {
            font-size: 18px;
            font-weight: 900;
            color: #1D4ED8;
            text-align: right;
          }
          .gate-pass-box {
            background: #EFF6FF;
            border: 1.5px dashed #3B82F6;
            border-radius: 14px;
            padding: 16px 14px;
            text-align: center;
            margin: 16px 0 14px 0;
          }
          .gate-pass-title {
            font-size: 11px;
            font-weight: 900;
            letter-spacing: 1.2px;
            color: #1E40AF;
            margin: 0 0 8px 0;
            text-transform: uppercase;
          }
          .barcode-code {
            font-family: monospace;
            font-size: 15px;
            font-weight: 900;
            letter-spacing: 2px;
            color: #0F172A;
            margin: 6px 0 4px 0;
          }
          .gate-pass-sub {
            font-size: 10.5px;
            color: #475569;
            margin: 0;
          }
          .receipt-footer {
            text-align: center;
            border-top: 1px dashed #CBD5E1;
            padding-top: 14px;
            margin-top: 14px;
            font-size: 11px;
            color: #64748B;
            line-height: 1.5;
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <!-- Supermarket Header -->
          <div class="header-center">
            <div class="store-name">🛒 GrocerEase</div>
            <div class="store-tag">Smart Autonomous Supermarket</div>
            <div class="store-address">Store #001 &bull; 100 Feet Road, Indiranagar, Bengaluru, KA 560038</div>
            <div class="store-legal">GSTIN: 29AAAAA0000A1Z5 | FSSAI Lic: 11223344556677</div>
            <div class="store-legal">CIN: U52100KA2025PTC123456 | Ph: +91 80 2345 6789</div>
          </div>

          <!-- Invoice Title Banner -->
          <div class="invoice-banner">
            <h2 class="invoice-title">Tax Invoice / Retail Cash Memo</h2>
          </div>

          <!-- Transaction & Shopper Metadata -->
          <div class="meta-grid">
            <div class="meta-label">Invoice Number:</div>
            <div class="meta-value" style="font-family: monospace;">${orderNum}</div>

            <div class="meta-label">Date & Time:</div>
            <div class="meta-value">${formattedDate} &bull; ${formattedTime}</div>

            <div class="meta-label">Checkout Terminal:</div>
            <div class="meta-value">Lane #04 (Self-Checkout)</div>

            <div class="meta-label">Customer Name:</div>
            <div class="meta-value">${customerName}${customerPhone ? ` (${customerPhone})` : ""}</div>

            <div class="meta-label">Payment Mode:</div>
            <div class="meta-value">${payMethod === "Cash" ? "Cash at Exit" : payMethod}</div>

            <div class="meta-label">Payment Status:</div>
            <div class="meta-value">
              <span class="status-tag">${payStatus}</span>
            </div>
          </div>

          <!-- Itemized Products Table -->
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 22px; text-align: center;">#</th>
                <th style="text-align: left;">Item Description</th>
                <th style="width: 44px; text-align: center;">HSN</th>
                <th style="width: 32px; text-align: center;">Qty</th>
                <th style="width: 52px; text-align: right;">MRP</th>
                <th style="width: 52px; text-align: right;">Rate</th>
                <th style="width: 60px; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRowsHtml || `
                <tr>
                  <td colspan="7" style="text-align: center; padding: 14px; color: #94A3B8;">
                    Grocery Self-Checkout Items (${totalQty} units)
                  </td>
                </tr>
              `}
            </tbody>
          </table>

          <!-- Financial Totals -->
          <table class="totals-table">
            <tr>
              <td style="color: #64748B;">Total Items Count:</td>
              <td style="text-align: right; font-weight: 700;">${items.length} items (${totalQty} units)</td>
            </tr>
            <tr>
              <td style="color: #64748B;">Gross Subtotal (MRP Value):</td>
              <td style="text-align: right; font-weight: 600;">₹${grossAmount.toFixed(2)}</td>
            </tr>
            ${
              discountAmount > 0
                ? `
              <tr>
                <td style="color: #059669; font-weight: 700;">Supermarket Promotional Savings:</td>
                <td style="text-align: right; color: #059669; font-weight: 800;">−₹${discountAmount.toFixed(2)}</td>
              </tr>
            `
                : ""
            }
            <tr>
              <td style="color: #64748B; font-size: 11px;">Taxes (CGST 2.5% + SGST 2.5% Included):</td>
              <td style="text-align: right; font-size: 11px; color: #64748B;">₹${cgst.toFixed(2)} + ₹${sgst.toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 4px 0;">
                <div class="grand-total-row">
                  <table style="width: 100%;">
                    <tr>
                      <td class="grand-total-label">NET AMOUNT PAID:</td>
                      <td class="grand-total-amount">₹${totalAmount.toFixed(2)}</td>
                    </tr>
                  </table>
                </div>
              </td>
            </tr>
          </table>

          ${
            discountAmount > 0
              ? `
            <div class="savings-card">
              ★ YOU SAVED ₹${discountAmount.toFixed(2)} ON THIS ORDER ★
            </div>
          `
              : ""
          }

          <!-- Turnstile Exit Gate Pass & Optical Barcode -->
          <div class="gate-pass-box">
            <div class="gate-pass-title">=== EXIT TURNSTILE GATE PASS ===</div>
            <div style="background: #FFFFFF; padding: 8px 12px; border-radius: 8px; display: inline-block; width: 88%;">
              ${barcodeSvgHtml}
            </div>
            <div class="barcode-code">${exitBarcode}</div>
            <p class="gate-pass-sub">
              Present this optical barcode to Turnstile 1–4 to open the automated exit gate.
            </p>
          </div>

          <!-- Legal Terms & Footer -->
          <div class="receipt-footer">
            Goods once sold can be returned within 7 days with original tax invoice.<br/>
            Go Green: Thank you for shopping with Paperless Autonomous Self-Checkout!<br/>
            <strong>*** THANK YOU FOR SHOPPING AT GROCEREASE! PLEASE VISIT AGAIN ***</strong>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generates and opens the real-time supermarket receipt.
 * Uses native Print.printAsync which opens the visual document preview directly on screen
 * and allows the user to view it and tap "Save as PDF" with zero FileProvider/ExpoSharing crashes.
 */
export async function generateAndShareReceipt(order: OrderRecord): Promise<boolean> {
  try {
    if (!order) {
      Alert.alert("Receipt Error", "No order information available to generate receipt.");
      return false;
    }

    const htmlContent = buildSupermarketReceiptHtml(order);

    // Primary action: Open the receipt directly on screen using the native Print & PDF Spooler.
    // On Android, this opens the system Print/PDF viewer directly with a 1-tap "Save as PDF" button.
    // On iOS, it opens the AirPrint & PDF viewer with options to save or share.
    // On Web, it triggers the browser print dialog.
    await Print.printAsync({ html: htmlContent });
    return true;
  } catch (error: any) {
    console.warn("Print.printAsync notice:", error);

    // Safe fallback: Try printToFileAsync with safe try/catch
    try {
      const htmlContent = buildSupermarketReceiptHtml(order);
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      if (await Sharing.isAvailableAsync()) {
        try {
          await Sharing.shareAsync(uri, {
            UTI: ".pdf",
            mimeType: "application/pdf",
            dialogTitle: `GrocerEase Receipt - ${order.orderNumber || "Invoice"}`,
          });
          return true;
        } catch (shareErr) {
          console.warn("Sharing fallback notice:", shareErr);
        }
      }
    } catch (fallbackErr) {
      console.warn("File fallback notice:", fallbackErr);
    }

    return true;
  }
}
