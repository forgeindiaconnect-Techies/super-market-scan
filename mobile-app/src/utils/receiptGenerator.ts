import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Alert, Platform } from "react-native";
import { OrderRecord } from "../context/CartContext";

export async function generateAndShareReceipt(order: OrderRecord): Promise<boolean> {
  try {
    if (!order) {
      Alert.alert("Receipt Error", "No order information available to generate receipt.");
      return false;
    }

    const items = Array.isArray(order.items) ? order.items : [];
    const formattedDate = order.createdAt
      ? new Date(order.createdAt).toLocaleString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : new Date().toLocaleString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

    const subtotal = Number(order.subtotalAmount ?? order.totalAmount ?? 0);
    const discount = Number(order.discountAmount ?? 0);
    const total = Number(order.totalAmount ?? 0);
    const customerName = (order as any).customer?.name || "Customer Shopper";
    const orderNum = order.orderNumber || "#ORD-" + Date.now().toString().slice(-6);
    const payMethod = order.paymentMethod || "UPI";
    const payStatus = order.paymentStatus || "Completed";
    const exitBarcode = order.exitBarcode || "EXIT-" + Date.now().toString().slice(-8);

    const itemsRowsHtml = items
      .map((item, index) => {
        const itemName = item.name || "Grocery Item";
        const brand = item.brand ? ` (${item.brand})` : "";
        const qty = item.quantity || 1;
        const price = Number(item.price || item.effectivePrice || 0);
        const itemTotal = price * qty;

        return `
          <tr style="border-bottom: 1px solid #E2E8F0;">
            <td style="padding: 10px 8px; font-size: 13px; color: #64748B; text-align: center;">${index + 1}</td>
            <td style="padding: 10px 8px; font-size: 13px; color: #1E293B; font-weight: 500;">
              ${itemName}${brand}
            </td>
            <td style="padding: 10px 8px; font-size: 13px; color: #1E293B; text-align: center;">${qty}</td>
            <td style="padding: 10px 8px; font-size: 13px; color: #1E293B; text-align: right;">₹${price.toLocaleString("en-IN")}</td>
            <td style="padding: 10px 8px; font-size: 13px; color: #2E0854; font-weight: 700; text-align: right;">₹${itemTotal.toLocaleString("en-IN")}</td>
          </tr>
        `;
      })
      .join("");

    const statusBadgeColor =
      payStatus === "Completed"
        ? "#16A34A"
        : payStatus === "Approved"
        ? "#4F46E5"
        : "#D97706";

    const statusBadgeBg =
      payStatus === "Completed"
        ? "#DCFCE7"
        : payStatus === "Approved"
        ? "#EEF2FF"
        : "#FEF3C7";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Smart Supermarket Receipt - ${orderNum}</title>
          <style>
            @page {
              size: A4;
              margin: 20mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #1E293B;
              background-color: #FFFFFF;
              margin: 0;
              padding: 24px;
            }
            .receipt-card {
              max-width: 650px;
              margin: 0 auto;
              border: 1px solid #E2E8F0;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 20px rgba(0,0,0,0.06);
            }
            .header-banner {
              background: linear-gradient(135deg, #2E0854 0%, #4A154B 100%);
              color: #FFFFFF;
              padding: 28px 24px;
              text-align: center;
            }
            .logo-title {
              font-size: 24px;
              font-weight: 800;
              letter-spacing: 0.5px;
              margin: 0 0 4px 0;
            }
            .logo-sub {
              font-size: 13px;
              color: #E9D5FF;
              margin: 0;
              letter-spacing: 0.8px;
              text-transform: uppercase;
            }
            .receipt-body {
              padding: 24px;
            }
            .info-grid {
              display: flex;
              justify-content: space-between;
              margin-bottom: 24px;
              padding-bottom: 18px;
              border-bottom: 1px dashed #CBD5E1;
            }
            .info-col {
              flex: 1;
            }
            .info-label {
              font-size: 11px;
              text-transform: uppercase;
              color: #64748B;
              font-weight: 700;
              letter-spacing: 0.5px;
              margin-bottom: 4px;
            }
            .info-value {
              font-size: 14px;
              font-weight: 600;
              color: #0F172A;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 10px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 700;
              color: ${statusBadgeColor};
              background-color: ${statusBadgeBg};
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th {
              background-color: #F8FAFC;
              color: #475569;
              font-size: 12px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              padding: 10px 8px;
              border-top: 1px solid #E2E8F0;
              border-bottom: 2px solid #E2E8F0;
            }
            .totals-container {
              margin-left: auto;
              width: 280px;
              margin-bottom: 24px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 6px 0;
              font-size: 14px;
              color: #475569;
            }
            .total-row.discount {
              color: #16A34A;
              font-weight: 600;
            }
            .total-row.grand-total {
              border-top: 2px solid #2E0854;
              margin-top: 6px;
              padding-top: 10px;
              font-size: 18px;
              font-weight: 800;
              color: #2E0854;
            }
            .barcode-section {
              text-align: center;
              background-color: #FAF5FF;
              border: 1px solid #E9D5FF;
              border-radius: 12px;
              padding: 16px;
              margin-top: 10px;
            }
            .barcode-text {
              font-family: monospace;
              font-size: 18px;
              font-weight: 800;
              letter-spacing: 4px;
              color: #2E0854;
              margin: 8px 0 4px 0;
            }
            .footer-note {
              text-align: center;
              font-size: 12px;
              color: #64748B;
              margin-top: 20px;
              padding-top: 16px;
              border-top: 1px solid #F1F5F9;
            }
          </style>
        </head>
        <body>
          <div class="receipt-card">
            <div class="header-banner">
              <h1 class="logo-title">🛒 Smart Supermarket</h1>
              <p class="logo-sub">Official Tax Invoice & Exit Gate Pass</p>
            </div>

            <div class="receipt-body">
              <div class="info-grid">
                <div class="info-col">
                  <div class="info-label">Order Number</div>
                  <div class="info-value">${orderNum}</div>
                  <div style="height: 8px;"></div>
                  <div class="info-label">Date & Time</div>
                  <div class="info-value">${formattedDate}</div>
                </div>

                <div class="info-col" style="text-align: right;">
                  <div class="info-label">Payment Method</div>
                  <div class="info-value">${payMethod}</div>
                  <div style="height: 8px;"></div>
                  <div class="info-label">Payment Status</div>
                  <div><span class="status-badge">${payStatus}</span></div>
                </div>
              </div>

              <!-- Purchased Products Table -->
              <table>
                <thead>
                  <tr>
                    <th style="width: 32px; text-align: center;">#</th>
                    <th style="text-align: left;">Item Description</th>
                    <th style="width: 48px; text-align: center;">Qty</th>
                    <th style="width: 80px; text-align: right;">Unit Price</th>
                    <th style="width: 80px; text-align: right;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRowsHtml || `
                    <tr>
                      <td colspan="5" style="text-align: center; padding: 16px; color: #94A3B8;">
                        Self-Checkout Grocery Items (${order.totalItems || 1} units)
                      </td>
                    </tr>
                  `}
                </tbody>
              </table>

              <!-- Totals Breakdown -->
              <div class="totals-container">
                <div class="total-row">
                  <span>Subtotal:</span>
                  <span>₹${subtotal.toLocaleString("en-IN")}</span>
                </div>
                ${
                  discount > 0
                    ? `
                  <div class="total-row discount">
                    <span>Supermarket Discount:</span>
                    <span>−₹${discount.toLocaleString("en-IN")}</span>
                  </div>
                `
                    : ""
                }
                <div class="total-row grand-total">
                  <span>Amount Paid:</span>
                  <span>₹${total.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <!-- Turnstile Exit Barcode Pass -->
              <div class="barcode-section">
                <div class="info-label" style="color: #6B21A8;">Turnstile Exit Gate Pass</div>
                <div class="barcode-text">||| | |||| | ||| | || ${exitBarcode} || | ||||</div>
                <div style="font-size: 11px; color: #64748B;">
                  Scan this barcode at Exit Turnstile 1–4 to automatically open the gate.
                </div>
              </div>

              <div class="footer-note">
                Thank you for shopping at Smart Supermarket!<br/>
                For queries or support, visit our customer desk or reach out via the app.
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    if (Platform.OS === "web") {
      // In web browser, trigger native print / PDF export
      await Print.printAsync({ html: htmlContent });
      return true;
    }

    // On iOS & Android: generate genuine PDF file on disk
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
    });

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(uri, {
        UTI: ".pdf",
        mimeType: "application/pdf",
        dialogTitle: `Smart Supermarket Receipt - ${orderNum}`,
      });
      Alert.alert(
        "Receipt Downloaded",
        "Your official PDF receipt has been generated and is ready to save or share."
      );
    } else {
      Alert.alert(
        "Receipt Ready",
        `Receipt PDF saved to device:\n${uri}`
      );
    }

    return true;
  } catch (error: any) {
    console.error("Receipt generation error:", error);
    Alert.alert("Receipt Error", error.message || "Failed to generate receipt PDF.");
    return false;
  }
}

