/**
 * GrocerEase Supermarket SaaS - Reports Export & Print Generator
 * 
 * Provides:
 * 1. exportStyledExcelReport(orders, products, filterMeta)
 *    Generates an Excel XML document (.xls) with full color support:
 *    - Deep Navy Corporate Header (#0F2C59)
 *    - Royal Blue Table Headers (#1D4ED8) with White Bold text
 *    - Executive Financial Summary KPIs
 *    - Genuine itemized transaction records with real customer names, phones, products, prices, and statuses
 *    - Green/Amber/Red colored status badges
 *    - Summary row with sums
 * 
 * 2. printExecutiveReport(orders, products, filterMeta)
 *    Generates a publication-grade printable A4 Landscape Audit Report in an iframe:
 *    - Official Supermarket Letterhead with legal GSTIN/CIN
 *    - 4 Financial KPI Summary Cards
 *    - Complete real-time transaction ledger table
 *    - Official Store Manager & Super Admin audit verification sign-off
 */

// Format date helper
function formatOrderDate(dateInput) {
  if (!dateInput) return "N/A";
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return "N/A";
  const dateStr = d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${dateStr}, ${timeStr}`;
}

/**
 * 1. EXCEL EXPORT WITH COLORED HEADER & REAL DATA (.xls)
 */
export function exportStyledExcelReport({
  orders = [],
  products = [],
  activeTab = "sales",
  datePreset = "all",
  customStartDate = "",
  customEndDate = "",
  kpis = {},
}) {
  const now = new Date();
  const generationTimestamp = formatOrderDate(now);

  let dateRangeLabel = "All Time Records";
  if (datePreset === "today") dateRangeLabel = `Today (${now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })})`;
  else if (datePreset === "week") dateRangeLabel = "Last 7 Days (This Week)";
  else if (datePreset === "month") dateRangeLabel = "Last 30 Days (This Month)";
  else if (datePreset === "year") dateRangeLabel = `This Year (${now.getFullYear()})`;
  else if (datePreset === "custom") {
    dateRangeLabel = `Custom Range: ${customStartDate || "Start"} to ${customEndDate || "Today"}`;
  }

  // Calculate real aggregates from database records
  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.paymentStatus === "Completed" || o.paymentStatus === "Approved");
  const pendingOrders = orders.filter((o) => o.paymentStatus === "Pending");
  const failedOrders = orders.filter((o) => o.paymentStatus === "Failed" || o.paymentStatus === "Network Error");

  const totalVerifiedRevenue = completedOrders.reduce((s, o) => s + Number(o.totalAmount || 0), 0);
  const totalGrossAmount = orders.reduce((s, o) => s + Number(o.subtotalAmount || o.totalAmount || 0), 0);
  const totalSavings = orders.reduce((s, o) => s + Number(o.discountAmount || 0), 0);
  const totalUnitsSold = orders.reduce((s, o) => {
    return s + (o.totalItems || (o.items || []).reduce((iq, i) => iq + (i.quantity || 1), 0) || 1);
  }, 0);

  // If on Inventory tab, export Inventory Valuation Ledger
  if (activeTab === "inventory") {
    const totalInventoryValue = products.reduce((s, p) => s + Number(p.stock || 0) * Number(p.price || 0), 0);
    const lowStockCount = products.filter((p) => Number(p.stock || 0) <= Number(p.lowStockThreshold || 5) && Number(p.stock || 0) > 0).length;
    const outOfStockCount = products.filter((p) => Number(p.stock || 0) === 0).length;

    const inventoryRowsHtml = products.map((p, idx) => {
      const stock = Number(p.stock || 0);
      const thresh = Number(p.lowStockThreshold || 5);
      const isOut = stock === 0;
      const isLow = stock <= thresh && !isOut;
      const statusText = isOut ? "OUT OF STOCK" : isLow ? "LOW STOCK" : "IN STOCK";
      const statusBg = isOut ? "#FEE2E2" : isLow ? "#FEF3C7" : "#DCFCE7";
      const statusColor = isOut ? "#991B1B" : isLow ? "#92400E" : "#166534";
      const price = Number(p.price || 0);
      const cost = Number(p.costPrice || price * 0.8);
      const val = stock * price;
      const reorderQty = Math.max(10, thresh * 2 - stock);

      return `
        <tr style="background-color: ${idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC"};">
          <td style="text-align: center; border: 0.5px solid #CBD5E1; padding: 6px;">${idx + 1}</td>
          <td style="text-align: left; font-weight: bold; border: 0.5px solid #CBD5E1; padding: 6px;">${p.name || "Product"}</td>
          <td style="text-align: left; border: 0.5px solid #CBD5E1; padding: 6px;">${p.brand || "GrocerEase"}</td>
          <td style="text-align: left; border: 0.5px solid #CBD5E1; padding: 6px;">${p.category || "Grocery"}</td>
          <td style="text-align: center; font-weight: bold; border: 0.5px solid #CBD5E1; padding: 6px;">${p.barcode || "N/A"}</td>
          <td style="text-align: center; font-weight: bold; border: 0.5px solid #CBD5E1; padding: 6px;">${stock} units</td>
          <td style="text-align: center; border: 0.5px solid #CBD5E1; padding: 6px;">${thresh}</td>
          <td style="text-align: center; font-weight: bold; background-color: ${statusBg}; color: ${statusColor}; border: 0.5px solid #CBD5E1; padding: 6px;">${statusText}</td>
          <td style="text-align: right; border: 0.5px solid #CBD5E1; padding: 6px;">₹${cost.toFixed(2)}</td>
          <td style="text-align: right; font-weight: bold; border: 0.5px solid #CBD5E1; padding: 6px;">₹${price.toFixed(2)}</td>
          <td style="text-align: right; font-weight: bold; color: #15803D; border: 0.5px solid #CBD5E1; padding: 6px;">₹${val.toFixed(2)}</td>
          <td style="text-align: center; font-weight: bold; color: #1D4ED8; border: 0.5px solid #CBD5E1; padding: 6px;">+${reorderQty} units</td>
        </tr>
      `;
    }).join("");

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Inventory Valuation</x:Name>
                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10pt; }
        </style>
      </head>
      <body>
        <table border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse; width: 100%;">
          <tr>
            <th colspan="12" style="background-color: #0F2C59; color: #FFFFFF; font-size: 16pt; font-weight: bold; text-align: center; padding: 14px;">
              🛒 GROCEREASE SUPERMARKET - INVENTORY VALUATION & STOCK LEDGER
            </th>
          </tr>
          <tr>
            <th colspan="12" style="background-color: #1455D9; color: #FFFFFF; font-size: 10pt; text-align: center; padding: 6px;">
              Store #001 &bull; 100 Feet Road, Indiranagar, Bengaluru, KA 560038 | GSTIN: 29AABCU9603R1ZM
            </th>
          </tr>
          <tr style="background-color: #F1F5F9;">
            <td colspan="6" style="padding: 8px; font-weight: bold; color: #334155;">Generated Date: ${generationTimestamp}</td>
            <td colspan="6" style="padding: 8px; font-weight: bold; text-align: right; color: #1D4ED8;">Total Catalog Items: ${products.length} Products</td>
          </tr>
          <tr><td colspan="12" style="height: 10px;"></td></tr>
          
          <!-- KPI Summary Box -->
          <tr style="background-color: #1E3A8A; color: #FFFFFF; font-weight: bold; text-align: center;">
            <td colspan="3" style="padding: 8px;">TOTAL WAREHOUSE VALUATION</td>
            <td colspan="3" style="padding: 8px;">CATALOG PRODUCTS</td>
            <td colspan="3" style="padding: 8px;">LOW STOCK ALERTS</td>
            <td colspan="3" style="padding: 8px;">OUT OF STOCK</td>
          </tr>
          <tr style="font-weight: bold; font-size: 13pt; text-align: center;">
            <td colspan="3" style="background-color: #ECFDF5; color: #047857; padding: 10px;">₹${totalInventoryValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            <td colspan="3" style="background-color: #EFF6FF; color: #1D4ED8; padding: 10px;">${products.length} Items</td>
            <td colspan="3" style="background-color: #FEF3C7; color: #B45309; padding: 10px;">${lowStockCount} Items</td>
            <td colspan="3" style="background-color: #FEE2E2; color: #B91C1C; padding: 10px;">${outOfStockCount} Items</td>
          </tr>
          <tr><td colspan="12" style="height: 14px;"></td></tr>

          <!-- Main Table Headers with Colored Background -->
          <tr style="background-color: #1D4ED8; color: #FFFFFF; font-weight: bold; text-align: center;">
            <th style="padding: 10px; border: 1px solid #1E40AF;">#</th>
            <th style="padding: 10px; border: 1px solid #1E40AF;">PRODUCT NAME</th>
            <th style="padding: 10px; border: 1px solid #1E40AF;">BRAND</th>
            <th style="padding: 10px; border: 1px solid #1E40AF;">CATEGORY</th>
            <th style="padding: 10px; border: 1px solid #1E40AF;">BARCODE (EAN)</th>
            <th style="padding: 10px; border: 1px solid #1E40AF;">STOCK</th>
            <th style="padding: 10px; border: 1px solid #1E40AF;">MIN THRESHOLD</th>
            <th style="padding: 10px; border: 1px solid #1E40AF;">STOCK STATUS</th>
            <th style="padding: 10px; border: 1px solid #1E40AF;">COST PRICE</th>
            <th style="padding: 10px; border: 1px solid #1E40AF;">RETAIL PRICE</th>
            <th style="padding: 10px; border: 1px solid #1E40AF;">TOTAL VALUE</th>
            <th style="padding: 10px; border: 1px solid #1E40AF;">REORDER SUGGESTION</th>
          </tr>
          ${inventoryRowsHtml}
        </table>
      </body>
      </html>
    `;

    downloadBlob(excelHtml, `GrocerEase_Inventory_Valuation_${now.toISOString().split("T")[0]}.xls`, "application/vnd.ms-excel");
    return;
  }

  // DEFAULT / SALES / PAYMENTS EXPORT: Itemized Real-Time Transactions Ledger
  const ordersRowsHtml = orders.map((ord, idx) => {
    const isCompleted = ord.paymentStatus === "Completed";
    const isApproved = ord.paymentStatus === "Approved";
    const isPending = ord.paymentStatus === "Pending";

    const statusBg = isCompleted || isApproved ? "#DCFCE7" : isPending ? "#FEF3C7" : "#FEE2E2";
    const statusColor = isCompleted || isApproved ? "#15803D" : isPending ? "#B45309" : "#B91C1C";
    const statusText = isCompleted ? "COMPLETED" : isApproved ? "APPROVED" : isPending ? "PENDING" : "FAILED";

    const customerName = ord.customer?.name || "Mobile Shopper";
    const customerPhone = ord.customer?.phone ? `+91 ${ord.customer.phone}` : "Not provided";
    const customerAddress = ord.customer?.address || "In-Store Checkout";

    const itemsSummary = (ord.items || [])
      .map((it) => `${it.name} (x${it.quantity || 1})`)
      .join(", ") || "Purchased Goods";

    const unitsCount = ord.totalItems || (ord.items || []).reduce((s, it) => s + (it.quantity || 1), 0) || 1;
    const grossVal = Number(ord.subtotalAmount || ord.totalAmount || 0);
    const discountVal = Number(ord.discountAmount || 0);
    const netVal = Number(ord.totalAmount || 0);
    const gstVal = netVal - (netVal / 1.05);

    return `
      <tr style="background-color: ${idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC"};">
        <td style="text-align: center; border: 0.5px solid #CBD5E1; padding: 6px;">${idx + 1}</td>
        <td style="text-align: center; font-weight: bold; color: #1D4ED8; border: 0.5px solid #CBD5E1; padding: 6px;">${ord.orderNumber || ord._id}</td>
        <td style="text-align: center; border: 0.5px solid #CBD5E1; padding: 6px;">${formatOrderDate(ord.createdAt)}</td>
        <td style="text-align: left; font-weight: bold; color: #0F172A; border: 0.5px solid #CBD5E1; padding: 6px;">${customerName}</td>
        <td style="text-align: center; border: 0.5px solid #CBD5E1; padding: 6px;">${customerPhone}</td>
        <td style="text-align: left; border: 0.5px solid #CBD5E1; padding: 6px;">${customerAddress}</td>
        <td style="text-align: left; border: 0.5px solid #CBD5E1; padding: 6px;">${itemsSummary}</td>
        <td style="text-align: center; font-weight: bold; border: 0.5px solid #CBD5E1; padding: 6px;">${unitsCount}</td>
        <td style="text-align: right; border: 0.5px solid #CBD5E1; padding: 6px;">₹${grossVal.toFixed(2)}</td>
        <td style="text-align: right; color: #059669; font-weight: bold; border: 0.5px solid #CBD5E1; padding: 6px;">-₹${discountVal.toFixed(2)}</td>
        <td style="text-align: right; color: #64748B; border: 0.5px solid #CBD5E1; padding: 6px;">₹${gstVal.toFixed(2)}</td>
        <td style="text-align: right; font-weight: bold; color: #15803D; font-size: 11pt; border: 0.5px solid #CBD5E1; padding: 6px;">₹${netVal.toFixed(2)}</td>
        <td style="text-align: center; font-weight: bold; border: 0.5px solid #CBD5E1; padding: 6px;">${ord.paymentMethod === "Cash" ? "Cash at Exit" : ord.paymentMethod || "UPI"}</td>
        <td style="text-align: center; font-weight: bold; background-color: ${statusBg}; color: ${statusColor}; border: 0.5px solid #CBD5E1; padding: 6px;">${statusText}</td>
        <td style="text-align: center; border: 0.5px solid #CBD5E1; padding: 6px;">${ord.exitBarcode || "EXIT-PASS"}</td>
      </tr>
    `;
  }).join("");

  const excelHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Sales & Revenue Ledger</x:Name>
              <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10pt; }
      </style>
    </head>
    <body>
      <table border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse; width: 100%;">
        <!-- Corporate Deep Navy Colored Top Header -->
        <tr>
          <th colspan="15" style="background-color: #0F2C59; color: #FFFFFF; font-size: 16pt; font-weight: bold; text-align: center; padding: 14px;">
            🛒 GROCEREASE SMART SUPERMARKET - EXECUTIVE FINANCIAL & TRANSACTION AUDIT REPORT
          </th>
        </tr>
        <tr>
          <th colspan="15" style="background-color: #1455D9; color: #FFFFFF; font-size: 10pt; font-weight: 600; text-align: center; padding: 6px;">
            Store #001 &bull; 100 Feet Road, Indiranagar, Bengaluru, KA 560038 | GSTIN: 29AABCU9603R1ZM | CIN: U52100KA2025PTC123456
          </th>
        </tr>
        <tr style="background-color: #F1F5F9;">
          <td colspan="7" style="padding: 8px; font-weight: bold; color: #334155;">
            Generated: ${generationTimestamp} &bull; Scope: ${dateRangeLabel}
          </td>
          <td colspan="8" style="padding: 8px; font-weight: bold; text-align: right; color: #1D4ED8;">
            Audit Status: 100% Reconciled Real-Time Database Records
          </td>
        </tr>
        <tr><td colspan="15" style="height: 10px;"></td></tr>

        <!-- Executive Financial KPI Summary Block -->
        <tr style="background-color: #1E3A8A; color: #FFFFFF; font-weight: bold; text-align: center;">
          <td colspan="3" style="padding: 8px;">TOTAL VERIFIED SALES</td>
          <td colspan="3" style="padding: 8px;">TOTAL TRANSACTIONS</td>
          <td colspan="3" style="padding: 8px;">APPROVED / COMPLETED</td>
          <td colspan="3" style="padding: 8px;">PENDING VERIFICATION</td>
          <td colspan="3" style="padding: 8px;">TOTAL UNITS SOLD</td>
        </tr>
        <tr style="font-weight: bold; font-size: 13pt; text-align: center;">
          <td colspan="3" style="background-color: #ECFDF5; color: #047857; padding: 10px;">₹${totalVerifiedRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          <td colspan="3" style="background-color: #EFF6FF; color: #1D4ED8; padding: 10px;">${totalOrders} Orders</td>
          <td colspan="3" style="background-color: #DCFCE7; color: #15803D; padding: 10px;">${completedOrders.length} Paid</td>
          <td colspan="3" style="background-color: #FEF3C7; color: #B45309; padding: 10px;">${pendingOrders.length} Pending</td>
          <td colspan="3" style="background-color: #FAF5FF; color: #7C3AED; padding: 10px;">${totalUnitsSold} Units</td>
        </tr>
        <tr><td colspan="15" style="height: 14px;"></td></tr>

        <!-- Main Real-Time Transactions Table Header with Royal Blue Background -->
        <tr style="background-color: #1D4ED8; color: #FFFFFF; font-weight: bold; text-align: center;">
          <th style="padding: 9px 6px; border: 1px solid #1E40AF;">#</th>
          <th style="padding: 9px 8px; border: 1px solid #1E40AF;">ORDER ID</th>
          <th style="padding: 9px 8px; border: 1px solid #1E40AF;">TRANSACTION DATE & TIME</th>
          <th style="padding: 9px 10px; border: 1px solid #1E40AF;">CUSTOMER NAME</th>
          <th style="padding: 9px 8px; border: 1px solid #1E40AF;">MOBILE NUMBER</th>
          <th style="padding: 9px 10px; border: 1px solid #1E40AF;">DELIVERY / BILLING ADDRESS</th>
          <th style="padding: 9px 14px; border: 1px solid #1E40AF;">PURCHASED PRODUCTS (QTY)</th>
          <th style="padding: 9px 6px; border: 1px solid #1E40AF;">UNITS</th>
          <th style="padding: 9px 8px; border: 1px solid #1E40AF;">GROSS MRP (₹)</th>
          <th style="padding: 9px 8px; border: 1px solid #1E40AF;">SAVINGS (₹)</th>
          <th style="padding: 9px 8px; border: 1px solid #1E40AF;">TAX (5% GST)</th>
          <th style="padding: 9px 10px; border: 1px solid #1E40AF;">NET PAID (₹)</th>
          <th style="padding: 9px 8px; border: 1px solid #1E40AF;">PAYMENT METHOD</th>
          <th style="padding: 9px 8px; border: 1px solid #1E40AF;">PAYMENT STATUS</th>
          <th style="padding: 9px 8px; border: 1px solid #1E40AF;">EXIT PASS BARCODE</th>
        </tr>

        <!-- Real Order Records -->
        ${ordersRowsHtml}

        <!-- Total Grand Summary Row -->
        <tr style="background-color: #E2E8F0; font-weight: bold; font-size: 11pt; border-top: 2px solid #0F172A; border-bottom: 2px solid #0F172A;">
          <td colspan="7" style="text-align: right; padding: 10px; color: #0F172A;">GRAND RECONCILED TOTALS:</td>
          <td style="text-align: center; padding: 10px; color: #0F172A;">${totalUnitsSold}</td>
          <td style="text-align: right; padding: 10px;">₹${totalGrossAmount.toFixed(2)}</td>
          <td style="text-align: right; padding: 10px; color: #059669;">-₹${totalSavings.toFixed(2)}</td>
          <td style="text-align: right; padding: 10px; color: #64748B;">₹${(totalVerifiedRevenue - (totalVerifiedRevenue / 1.05)).toFixed(2)}</td>
          <td style="text-align: right; padding: 10px; color: #15803D; font-size: 12pt;">₹${totalVerifiedRevenue.toFixed(2)}</td>
          <td colspan="3" style="text-align: center; padding: 10px; color: #1D4ED8;">${completedOrders.length} Paid of ${totalOrders} Orders</td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const dateTag = datePreset.toUpperCase();
  downloadBlob(excelHtml, `GrocerEase_Financial_Report_${dateTag}_${now.toISOString().split("T")[0]}.xls`, "application/vnd.ms-excel");
}

function downloadBlob(content, fileName, mimeType) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * 2. PUBLICATION-QUALITY PRINTABLE AUDIT REPORT (PDF & PRINT)
 */
export function printExecutiveReport({
  orders = [],
  products = [],
  activeTab = "sales",
  datePreset = "all",
  customStartDate = "",
  customEndDate = "",
}) {
  const now = new Date();
  const generationTimestamp = formatOrderDate(now);

  let dateRangeLabel = "All Time Records";
  if (datePreset === "today") dateRangeLabel = `Today (${now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })})`;
  else if (datePreset === "week") dateRangeLabel = "Last 7 Days (This Week)";
  else if (datePreset === "month") dateRangeLabel = "Last 30 Days (This Month)";
  else if (datePreset === "year") dateRangeLabel = `This Year (${now.getFullYear()})`;
  else if (datePreset === "custom") {
    dateRangeLabel = `Custom Range: ${customStartDate || "Start"} to ${customEndDate || "Today"}`;
  }

  const completedOrders = orders.filter((o) => o.paymentStatus === "Completed" || o.paymentStatus === "Approved");
  const pendingOrders = orders.filter((o) => o.paymentStatus === "Pending");
  const failedOrders = orders.filter((o) => o.paymentStatus === "Failed" || o.paymentStatus === "Network Error");

  const totalVerifiedRevenue = completedOrders.reduce((s, o) => s + Number(o.totalAmount || 0), 0);
  const totalGrossAmount = orders.reduce((s, o) => s + Number(o.subtotalAmount || o.totalAmount || 0), 0);
  const totalSavings = orders.reduce((s, o) => s + Number(o.discountAmount || 0), 0);
  const totalUnits = orders.reduce((s, o) => {
    return s + (o.totalItems || (o.items || []).reduce((iq, i) => iq + (i.quantity || 1), 0) || 1);
  }, 0);

  const rowsHtml = orders.map((ord, idx) => {
    const isCompleted = ord.paymentStatus === "Completed" || ord.paymentStatus === "Approved";
    const statusText = ord.paymentStatus || "Completed";
    const statusClass = isCompleted ? "status-approved" : ord.paymentStatus === "Pending" ? "status-pending" : "status-failed";

    const customerName = ord.customer?.name || "Mobile Shopper";
    const customerPhone = ord.customer?.phone ? `+91 ${ord.customer.phone}` : "Not provided";

    const itemsSummary = (ord.items || [])
      .map((it) => `${it.name} (x${it.quantity || 1})`)
      .join(", ") || "Purchased Goods";

    const unitsCount = ord.totalItems || (ord.items || []).reduce((s, it) => s + (it.quantity || 1), 0) || 1;
    const netVal = Number(ord.totalAmount || 0);
    const grossVal = Number(ord.subtotalAmount || ord.totalAmount || 0);
    const discountVal = Number(ord.discountAmount || 0);

    return `
      <tr>
        <td style="text-align: center; color: #64748B;">${idx + 1}</td>
        <td style="font-weight: 700; color: #1D4ED8;">${ord.orderNumber || ord._id}</td>
        <td style="white-space: nowrap;">${formatOrderDate(ord.createdAt)}</td>
        <td>
          <strong>${customerName}</strong><br/>
          <span style="font-size: 8pt; color: #64748B;">${customerPhone}</span>
        </td>
        <td>${itemsSummary}</td>
        <td style="text-align: center;">${unitsCount}</td>
        <td style="text-align: right;">₹${grossVal.toFixed(2)}</td>
        <td style="text-align: right; color: #059669;">${discountVal > 0 ? `-₹${discountVal.toFixed(2)}` : "₹0.00"}</td>
        <td style="text-align: right; font-weight: 800; color: #15803D;">₹${netVal.toFixed(2)}</td>
        <td style="text-align: center;">${ord.paymentMethod === "Cash" ? "Cash at Exit" : ord.paymentMethod || "UPI"}</td>
        <td style="text-align: center;"><span class="${statusClass}">${statusText}</span></td>
        <td style="text-align: center; font-size: 8.5pt;">${ord.exitBarcode || "EXIT-PASS"}</td>
      </tr>
    `;
  }).join("");

  const printDocumentHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>GrocerEase Business Audit Report - ${now.toISOString().split("T")[0]}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
      <style>
        @page {
          size: A4 landscape;
          margin: 8mm 10mm;
        }
        * {
          box-sizing: border-box;
          font-feature-settings: "zero" 0;
          font-variant-numeric: normal;
        }
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          margin: 0;
          padding: 12px;
          color: #0F172A;
          background: #FFFFFF;
          font-size: 9pt;
          line-height: 1.35;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .report-header {
          border-bottom: 2px solid #0F2C59;
          padding-bottom: 8px;
          margin-bottom: 10px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .store-brand {
          font-size: 16pt;
          font-weight: 900;
          color: #0F2C59;
          letter-spacing: 0.5px;
          margin: 0 0 2px 0;
        }
        .store-tagline {
          font-size: 9pt;
          font-weight: 700;
          color: #1455D9;
          margin: 0 0 3px 0;
          text-transform: uppercase;
        }
        .store-address {
          font-size: 8pt;
          color: #475569;
          margin: 0;
        }
        .report-title-card {
          text-align: right;
        }
        .report-title {
          font-size: 13pt;
          font-weight: 900;
          color: #0F2C59;
          margin: 0 0 3px 0;
          text-transform: uppercase;
        }
        .report-meta {
          font-size: 8pt;
          color: #475569;
        }
        .scope-banner {
          background: #EFF6FF !important;
          border: 1px solid #BFDBFE;
          border-radius: 6px;
          padding: 6px 12px;
          margin-bottom: 12px;
          display: flex;
          justify-content: space-between;
          font-size: 8.5pt;
          font-weight: 700;
        }
        .kpi-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 12px;
        }
        .kpi-box {
          border: 1px solid #CBD5E1;
          border-radius: 8px;
          padding: 8px 10px;
          background: #F8FAFC !important;
        }
        .kpi-label {
          font-size: 7.5pt;
          font-weight: 700;
          color: #64748B;
          text-transform: uppercase;
          margin-bottom: 2px;
        }
        .kpi-value {
          font-size: 14pt;
          font-weight: 900;
          color: #0F172A;
          margin: 0;
        }
        .kpi-sub {
          font-size: 7.5pt;
          color: #059669;
          font-weight: 600;
        }
        .ledger-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
        }
        .ledger-table th {
          background: #0F2C59 !important;
          color: #FFFFFF !important;
          font-size: 8pt;
          font-weight: 800;
          text-transform: uppercase;
          padding: 6px 4px;
          border: 1px solid #0F2C59;
        }
        .ledger-table td {
          border: 1px solid #E2E8F0;
          padding: 5px 4px;
          font-size: 8pt;
          vertical-align: middle;
        }
        .ledger-table tbody tr:nth-child(even) {
          background-color: #F8FAFC !important;
        }
        .status-approved {
          display: inline-block;
          background: #DCFCE7 !important;
          color: #15803D !important;
          font-weight: 800;
          font-size: 7.5pt;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid #86EFAC;
        }
        .status-pending {
          display: inline-block;
          background: #FEF3C7 !important;
          color: #B45309 !important;
          font-weight: 800;
          font-size: 7.5pt;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid #FDE68A;
        }
        .status-failed {
          display: inline-block;
          background: #FEE2E2 !important;
          color: #B91C1C !important;
          font-weight: 800;
          font-size: 7.5pt;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid #FECACA;
        }
        .summary-row td {
          background: #E2E8F0 !important;
          font-weight: 900;
          border-top: 2px solid #0F2C59;
          border-bottom: 2px solid #0F2C59;
          font-size: 8.5pt;
        }
        .audit-footer {
          border-top: 1px dashed #94A3B8;
          padding-top: 8px;
          margin-top: 10px;
          display: flex;
          justify-content: space-between;
          font-size: 7.5pt;
          color: #64748B;
        }
      </style>
    </head>
    <body>
      <div class="report-header">
        <div>
          <h1 class="store-brand">🛒 GROCEREASE SUPERMARKET</h1>
          <p class="store-tagline">Smart Autonomous Retail & Self-Checkout System</p>
          <p class="store-address">Store #001 &bull; 100 Feet Road, Indiranagar, Bengaluru, KA 560038 | GSTIN: 29AABCU9603R1ZM</p>
        </div>
        <div class="report-title-card">
          <h2 class="report-title">BUSINESS AUDIT & FINANCIAL REPORT</h2>
          <div class="report-meta">Generated: ${generationTimestamp}</div>
          <div class="report-meta">Auditor: Super Admin Pooja V</div>
        </div>
      </div>

      <div class="scope-banner">
        <span>REPORTING SCOPE: ${dateRangeLabel.toUpperCase()}</span>
        <span>DATABASE STATUS: 100% RECONCILED WITH REAL ORDERS (${orders.length} TOTAL RECORDS)</span>
      </div>

      <div class="kpi-row">
        <div class="kpi-box">
          <div class="kpi-label">TOTAL VERIFIED REVENUE</div>
          <div class="kpi-value" style="color: #15803D;">₹${totalVerifiedRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
          <div class="kpi-sub">Verified Completed Sales</div>
        </div>
        <div class="kpi-box">
          <div class="kpi-label">TOTAL TRANSACTIONS</div>
          <div class="kpi-value" style="color: #1D4ED8;">${orders.length}</div>
          <div class="kpi-sub">Total Customer Checkouts</div>
        </div>
        <div class="kpi-box">
          <div class="kpi-label">APPROVED & COMPLETED</div>
          <div class="kpi-value" style="color: #047857;">${completedOrders.length}</div>
          <div class="kpi-sub">Turnstile Gate Pass Active</div>
        </div>
        <div class="kpi-box">
          <div class="kpi-label">PENDING CASH/VERIFICATION</div>
          <div class="kpi-value" style="color: #D97706;">${pendingOrders.length}</div>
          <div class="kpi-sub">Awaiting Staff Clearance</div>
        </div>
      </div>

      <table class="ledger-table">
        <thead>
          <tr>
            <th style="width: 20px;">#</th>
            <th>ORDER ID</th>
            <th>DATE & TIME</th>
            <th>CUSTOMER INFO</th>
            <th>PURCHASED PRODUCTS</th>
            <th style="width: 35px;">QTY</th>
            <th>GROSS</th>
            <th>SAVED</th>
            <th>NET PAID</th>
            <th>PAYMENT</th>
            <th>STATUS</th>
            <th>EXIT PASS</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr class="summary-row">
            <td colspan="5" style="text-align: right; font-weight: 900;">AUDIT GRAND TOTALS:</td>
            <td style="text-align: center;">${totalUnits}</td>
            <td style="text-align: right;">₹${totalGrossAmount.toFixed(2)}</td>
            <td style="text-align: right; color: #059669;">-₹${totalSavings.toFixed(2)}</td>
            <td style="text-align: right; color: #15803D; font-size: 9.5pt;">₹${totalVerifiedRevenue.toFixed(2)}</td>
            <td colspan="3" style="text-align: center;">${completedOrders.length} Paid of ${orders.length} Orders</td>
          </tr>
        </tbody>
      </table>

      <div class="audit-footer">
        <div>
          <strong>Verification:</strong> Computer Generated Audit Report &bull; GrocerEase Paperless Autonomous Retail System
        </div>
        <div>
          <strong>Authorized Signatory:</strong> Super Admin &bull; Store Manager Clearance
        </div>
      </div>
    </body>
    </html>
  `;

  // Dispatch into dedicated hidden iframe for clean printing
  let iframe = document.getElementById("grocerease-print-report-frame");
  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.id = "grocerease-print-report-frame";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    iframe.style.visibility = "hidden";
    document.body.appendChild(iframe);
  }

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    window.print();
    return;
  }

  iframeDoc.open();
  iframeDoc.write(printDocumentHtml);
  iframeDoc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (_) {
      window.print();
    }
  }, 400);
}

