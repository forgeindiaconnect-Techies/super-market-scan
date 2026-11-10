const fs = require('fs');
const jsxPath = 'd:\\PROJECTS\\Super market\\frontend\\src\\pages\\admin\\AdminDashboard.jsx';

let jsx = fs.readFileSync(jsxPath, 'utf8');

// Replace the plain modal with a professional Supermarket Tax Invoice design
const oldModalRegex = /\{\/\* =+ \*\/\}\s*\{\/\* 4\. ORDER DETAILS RECEIPT MODAL[\s\S]*?\{selectedOrder && \([\s\S]*?<\/div>\s*\)\}\s*<\/div>\s*\);\s*\}/;

const newInvoiceModal = `{/* ========================================================================= */}
      {/* 4. PROFESSIONAL SUPERMARKET TAX INVOICE & RECEIPT MODAL                   */}
      {/* ========================================================================= */}
      {selectedOrder && (
        <div
          className="db-modal-backdrop"
          onClick={() => setSelectedOrder(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            className="db-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#FFFFFF",
              borderRadius: "18px",
              width: "92%",
              maxWidth: "560px",
              maxHeight: "92vh",
              overflowY: "auto",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.25)",
              border: "1.5px solid #E2E8F0",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header with GrocerEase Supermarket Branding */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 22px",
                borderBottom: "1.5px solid #F1F5F9",
                background: "linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 100%)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FFFFFF",
                    boxShadow: "0 3px 8px rgba(37, 99, 235, 0.35)",
                    flexShrink: 0,
                  }}
                >
                  <ShoppingCart size={19} color="#FFFFFF" strokeWidth={2.4} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "#0F172A" }}>
                      GrocerEase Supermarket
                    </h3>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: "800",
                        background: "#DBEAFE",
                        color: "#1D4ED8",
                        padding: "2px 8px",
                        borderRadius: "9999px",
                        letterSpacing: "0.5px",
                      }}
                    >
                      TAX INVOICE
                    </span>
                  </div>
                  <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#64748B" }}>
                    Verified Digital Self-Checkout Receipt • Lane 02
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                style={{
                  background: "#F1F5F9",
                  border: "none",
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#64748B",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "18px 22px" }}>
              {/* Receipt Info Card */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "12px",
                  background: "#F8FAFC",
                  padding: "14px 16px",
                  borderRadius: "12px",
                  marginBottom: "16px",
                  border: "1px solid #E2E8F0",
                }}
              >
                <div>
                  <span style={{ fontSize: "10px", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>
                    INVOICE NO
                  </span>
                  <span style={{ fontSize: "12.5px", fontWeight: "800", color: "#0F172A", display: "block", marginTop: "2px" }}>
                    #{selectedOrder.orderId}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: "10px", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>
                    ORDER STATUS
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      color: selectedOrder.status === "Completed" ? "#15803D" : "#D97706",
                      background: selectedOrder.status === "Completed" ? "#DCFCE7" : "#FEF3C7",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      display: "inline-block",
                      marginTop: "2px",
                    }}
                  >
                    ✓ {selectedOrder.status || "Completed"}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: "10px", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>
                    CUSTOMER
                  </span>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#1E293B", display: "block", marginTop: "2px" }}>
                    {selectedOrder.customerName}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: "10px", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>
                    PAYMENT METHOD
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      color: "#1D4ED8",
                      background: "#DBEAFE",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      display: "inline-block",
                      marginTop: "2px",
                    }}
                  >
                    {selectedOrder.payment === "COD" ? "Cash on Delivery" : "UPI / Online Paid"}
                  </span>
                </div>
              </div>

              {/* Items Purchased Table */}
              <div style={{ marginBottom: "16px" }}>
                <h4 style={{ margin: "0 0 8px 0", fontSize: "12.5px", fontWeight: "800", color: "#0F172A" }}>
                  Items Purchased
                </h4>
                <div style={{ border: "1.5px solid #E2E8F0", borderRadius: "10px", overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                    <thead>
                      <tr style={{ background: "#F1F5F9", borderBottom: "1.5px solid #E2E8F0" }}>
                        <th style={{ padding: "8px 12px", textAlign: "left", color: "#475569", fontWeight: "700" }}>
                          Product Name
                        </th>
                        <th style={{ padding: "8px 12px", textAlign: "center", color: "#475569", fontWeight: "700", width: "60px" }}>
                          Qty
                        </th>
                        <th style={{ padding: "8px 12px", textAlign: "right", color: "#475569", fontWeight: "700", width: "85px" }}>
                          Price
                        </th>
                        <th style={{ padding: "8px 12px", textAlign: "right", color: "#475569", fontWeight: "700", width: "95px" }}>
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                        selectedOrder.items.map((item, idx) => {
                          const itemPrice = Number(item.price || item.totalPrice || 10);
                          const itemQty = Number(item.quantity || item.qty || 1);
                          return (
                            <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9", background: idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC" }}>
                              <td style={{ padding: "9px 12px", fontWeight: "600", color: "#0F172A" }}>
                                {item.name || item.title || "Supermarket Item"}
                              </td>
                              <td style={{ padding: "9px 12px", textAlign: "center", fontWeight: "700", color: "#475569" }}>
                                {itemQty}
                              </td>
                              <td style={{ padding: "9px 12px", textAlign: "right", color: "#64748B" }}>
                                ₹{itemPrice.toFixed(2)}
                              </td>
                              <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: "800", color: "#0F172A" }}>
                                ₹{(itemPrice * itemQty).toFixed(2)}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td style={{ padding: "9px 12px", fontWeight: "600", color: "#0F172A" }}>Grocery Order Items</td>
                          <td style={{ padding: "9px 12px", textAlign: "center", fontWeight: "700", color: "#475569" }}>1</td>
                          <td style={{ padding: "9px 12px", textAlign: "right", color: "#64748B" }}>₹{Number(selectedOrder.amount).toFixed(2)}</td>
                          <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: "800", color: "#0F172A" }}>₹{Number(selectedOrder.amount).toFixed(2)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Grand Total Highlight Card */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 18px",
                  background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
                  borderRadius: "12px",
                  border: "1.5px solid #93C5FD",
                }}
              >
                <div>
                  <span style={{ fontSize: "11px", fontWeight: "800", color: "#1D4ED8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Grand Total Paid (Incl. Taxes)
                  </span>
                  <span style={{ display: "block", fontSize: "11px", color: "#475569", marginTop: "2px" }}>
                    GSTIN: 33AAAAA0000A1Z5 • Thank you for shopping!
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "20px", fontWeight: "900", color: "#1E3A8A" }}>
                    ₹{Number(selectedOrder.amount).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer with High-Visibility Action Buttons */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: "10px",
                padding: "14px 22px",
                borderTop: "1.5px solid #F1F5F9",
                background: "#F8FAFC",
                borderBottomLeftRadius: "18px",
                borderBottomRightRadius: "18px",
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                style={{
                  background: "#FFFFFF",
                  border: "1.5px solid #CBD5E1",
                  borderRadius: "9px",
                  padding: "7px 18px",
                  fontSize: "12px",
                  fontWeight: "700",
                  color: "#475569",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
                  border: "none",
                  borderRadius: "9px",
                  padding: "7px 20px",
                  fontSize: "12px",
                  fontWeight: "700",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  cursor: "pointer",
                  boxShadow: "0 3px 10px rgba(37, 99, 235, 0.35)",
                }}
              >
                <Printer size={15} color="#FFFFFF" />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}`;

if (oldModalRegex.test(jsx)) {
  jsx = jsx.replace(oldModalRegex, newInvoiceModal);
  fs.writeFileSync(jsxPath, jsx, 'utf8');
  console.log('SUCCESS: Order Details modal upgraded to a professional Supermarket Tax Invoice!');
} else {
  console.log('NOTICE: Pattern not found or already upgraded.');
}
