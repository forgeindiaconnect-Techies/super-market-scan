import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Platform,
} from "react-native";
import * as Print from "expo-print";
import { OrderRecord } from "../context/CartContext";
import { buildSupermarketReceiptHtml } from "../utils/receiptGenerator";

const { width, height } = Dimensions.get("window");

interface ReceiptModalProps {
  visible: boolean;
  order: OrderRecord | null;
  onClose: () => void;
}

export default function ReceiptModal({ visible, order, onClose }: ReceiptModalProps) {
  const [printing, setPrinting] = useState(false);

  if (!order) return null;

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

  const totalAmount = Number(order.totalAmount || 0);
  const subtotalAmount = Number(order.subtotalAmount ?? totalAmount);
  const discountAmount = Number(order.discountAmount ?? 0);
  const grossAmount = subtotalAmount + discountAmount;
  const payMethod = order.paymentMethod || "UPI";
  const payStatus = order.paymentStatus || "Completed";
  const exitBarcode = order.exitBarcode || "EXIT-" + Date.now().toString().slice(-8);
  const customerName = (order as any).customer?.name || "Customer Shopper";
  const customerPhone = (order as any).customer?.phone || "";
  const customerAddress = (order as any).customer?.address || "";

  const totalQty = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const taxableAmount = totalAmount / 1.05;
  const totalGst = totalAmount - taxableAmount;
  const cgst = totalGst / 2;
  const sgst = totalGst / 2;

  const handlePrintPdf = async () => {
    try {
      setPrinting(true);
      const html = buildSupermarketReceiptHtml(order);
      await Print.printAsync({ html });
    } catch (err: any) {
      console.warn("Print receipt notice:", err?.message);
    } finally {
      setPrinting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header Action Bar */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalHeaderTitle}>Supermarket Tax Invoice</Text>
              <Text style={styles.modalHeaderSub}>Official Retail Cash Memo</Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Receipt Slip Scrollable Body */}
          <ScrollView
            style={styles.receiptScroll}
            contentContainerStyle={styles.receiptContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.receiptCard}>
              {/* Top Serration / Decorative Header */}
              <View style={styles.storeBranding}>
                <Text style={styles.storeIcon}>🛒</Text>
                <Text style={styles.storeName}>GROCEREASE SUPERMARKET</Text>
                <Text style={styles.storeTagline}>Smart Autonomous Retail & Self-Checkout</Text>
                <Text style={styles.storeAddress}>
                  Store #001 • 100 Feet Road, Indiranagar, Bengaluru
                </Text>
                <Text style={styles.storeLegal}>
                  GSTIN: 29AABCU9603R1ZM | FSSAI: 11223344556677
                </Text>
              </View>

              <View style={styles.dashedDivider} />

              {/* Title & Metadata */}
              <View style={styles.memoTitleBox}>
                <Text style={styles.memoTitle}>RETAIL TAX INVOICE / CASH MEMO</Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Customer Name:</Text>
                <Text style={styles.metaValue}>{customerName}</Text>
              </View>
              {customerPhone ? (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Mobile Number:</Text>
                  <Text style={styles.metaValue}>+91 {customerPhone}</Text>
                </View>
              ) : null}
              {customerAddress ? (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Delivery Address:</Text>
                  <Text style={styles.metaValue}>{customerAddress}</Text>
                </View>
              ) : null}
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Invoice No:</Text>
                <Text style={styles.metaValueMono}>{order.orderNumber || "ORD-2026"}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Transaction ID:</Text>
                <Text style={styles.metaValueMono}>
                  {(order as any).paymentId || (order as any).transactionId || `TXN-${(order.orderNumber || "").replace(/^ORD-/, "")}`}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Date & Time:</Text>
                <Text style={styles.metaValue}>{formattedDate} • {formattedTime}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Terminal:</Text>
                <Text style={styles.metaValue}>Register #01 (Self-Checkout)</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Payment Mode:</Text>
                <Text style={styles.metaValue}>{payMethod === "Cash" ? "Cash at Exit" : payMethod}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Payment Status:</Text>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>{payStatus}</Text>
                </View>
              </View>

              <View style={styles.dashedDivider} />

              {/* Items Table */}
              <View style={styles.itemsTableHeader}>
                <Text style={[styles.thText, { flex: 4 }]}>Item</Text>
                <Text style={[styles.thText, { flex: 1.2, textAlign: "center" }]}>Qty</Text>
                <Text style={[styles.thText, { flex: 2, textAlign: "right" }]}>Rate</Text>
                <Text style={[styles.thText, { flex: 2.2, textAlign: "right" }]}>Amount</Text>
              </View>

              {items.map((item, idx) => {
                const qty = item.quantity || 1;
                const rate = Number(item.price || item.effectivePrice || 0);
                const amt = rate * qty;
                return (
                  <View key={idx} style={styles.itemRow}>
                    <View style={{ flex: 4 }}>
                      <Text style={styles.itemName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      {item.brand ? (
                        <Text style={styles.itemBrand}>{item.brand}</Text>
                      ) : null}
                    </View>
                    <Text style={[styles.itemQty, { flex: 1.2, textAlign: "center" }]}>
                      {qty}
                    </Text>
                    <Text style={[styles.itemRate, { flex: 2, textAlign: "right" }]}>
                      ₹{rate.toFixed(2)}
                    </Text>
                    <Text style={[styles.itemAmount, { flex: 2.2, textAlign: "right" }]}>
                      ₹{amt.toFixed(2)}
                    </Text>
                  </View>
                );
              })}

              <View style={styles.dashedDivider} />

              {/* Totals Summary */}
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Total Items Count:</Text>
                <Text style={styles.calcValue}>{items.length} items ({totalQty} units)</Text>
              </View>
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Gross Subtotal (MRP Value):</Text>
                <Text style={styles.calcValue}>₹{grossAmount.toFixed(2)}</Text>
              </View>
              {discountAmount > 0 && (
                <View style={styles.calcRow}>
                  <Text style={[styles.calcLabel, { color: "#059669", fontWeight: "700" }]}>
                    Supermarket Savings:
                  </Text>
                  <Text style={[styles.calcValue, { color: "#059669", fontWeight: "800" }]}>
                    −₹{discountAmount.toFixed(2)}
                  </Text>
                </View>
              )}
              <View style={styles.calcRow}>
                <Text style={styles.calcLabelLight}>Taxes (CGST 2.5% + SGST 2.5% Included):</Text>
                <Text style={styles.calcValueLight}>
                  ₹{cgst.toFixed(2)} + ₹{sgst.toFixed(2)}
                </Text>
              </View>

              {/* Grand Total Box */}
              <View style={styles.netTotalBox}>
                <Text style={styles.netTotalLabel}>NET AMOUNT PAID</Text>
                <Text style={styles.netTotalAmount}>₹{totalAmount.toFixed(2)}</Text>
              </View>

              {discountAmount > 0 && (
                <View style={styles.savingsBanner}>
                  <Text style={styles.savingsBannerText}>
                    ★ YOU SAVED ₹{discountAmount.toFixed(2)} ON THIS ORDER ★
                  </Text>
                </View>
              )}

              {/* Footer (NO BARCODES) */}
              <View style={styles.footerNoteBox}>
                <Text style={styles.footerNote}>
                  Goods once sold can be returned within 7 days with original tax invoice.
                </Text>
                <Text style={styles.footerThanks}>
                  *** THANK YOU FOR SHOPPING AT GROCEREASE! PLEASE VISIT AGAIN ***
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Footer Buttons */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.printActionBtn}
              onPress={handlePrintPdf}
              disabled={printing}
              activeOpacity={0.85}
            >
              {printing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.printActionIcon}>🖨️</Text>
                  <Text style={styles.printActionText}>Print / Save as PDF</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.doneActionBtn}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Text style={styles.doneActionText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.92,
    display: "flex",
    flexDirection: "column",
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeaderTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  modalHeaderSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "500",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#64748B",
  },
  receiptScroll: {
    paddingHorizontal: 16,
  },
  receiptContent: {
    paddingVertical: 14,
  },
  receiptCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  storeBranding: {
    alignItems: "center",
    marginBottom: 10,
  },
  storeIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  storeName: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1E3A8A",
    letterSpacing: 0.5,
  },
  storeTagline: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginTop: 2,
  },
  storeAddress: {
    fontSize: 10.5,
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
  },
  storeLegal: {
    fontSize: 9.5,
    color: "#94A3B8",
    marginTop: 2,
  },
  dashedDivider: {
    height: 1,
    borderBottomWidth: 1,
    borderColor: "#CBD5E1",
    borderStyle: "dashed",
    marginVertical: 12,
  },
  memoTitleBox: {
    backgroundColor: "#F1F5F9",
    paddingVertical: 5,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 10,
  },
  memoTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1E293B",
    letterSpacing: 1,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  metaLabel: {
    fontSize: 11.5,
    color: "#64748B",
    fontWeight: "500",
  },
  metaValue: {
    fontSize: 11.5,
    color: "#0F172A",
    fontWeight: "600",
  },
  metaValueMono: {
    fontSize: 12,
    color: "#0F172A",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  statusPill: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#15803D",
  },
  itemsTableHeader: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginBottom: 6,
  },
  thText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F1F5F9",
  },
  itemName: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#0F172A",
  },
  itemBrand: {
    fontSize: 10,
    color: "#94A3B8",
    marginTop: 1,
  },
  itemQty: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#334155",
  },
  itemRate: {
    fontSize: 11.5,
    color: "#475569",
  },
  itemAmount: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#0F172A",
  },
  calcRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  calcLabel: {
    fontSize: 11.5,
    color: "#475569",
  },
  calcValue: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#0F172A",
  },
  calcLabelLight: {
    fontSize: 10.5,
    color: "#94A3B8",
  },
  calcValueLight: {
    fontSize: 10.5,
    color: "#94A3B8",
  },
  netTotalBox: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1.5,
    borderColor: "#3B82F6",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 6,
  },
  netTotalLabel: {
    fontSize: 12.5,
    fontWeight: "900",
    color: "#1E3A8A",
    letterSpacing: 0.5,
  },
  netTotalAmount: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1D4ED8",
  },
  savingsBanner: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#86EFAC",
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: "center",
    marginBottom: 10,
  },
  savingsBannerText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#166534",
  },
  exitPassSection: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    marginTop: 8,
  },
  exitPassTitle: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#1E40AF",
    letterSpacing: 1,
    marginBottom: 8,
  },
  barcodeVisualBox: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    width: "100%",
  },
  barcodeBarsRow: {
    flexDirection: "row",
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  barcodeBar: {
    height: 36,
    backgroundColor: "#0F172A",
  },
  barcodeText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    letterSpacing: 2,
    marginTop: 6,
  },
  exitPassNote: {
    fontSize: 10,
    color: "#64748B",
    textAlign: "center",
    marginTop: 6,
  },
  footerNoteBox: {
    alignItems: "center",
    marginTop: 14,
  },
  footerNote: {
    fontSize: 9.5,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 14,
  },
  footerThanks: {
    fontSize: 10,
    fontWeight: "800",
    color: "#475569",
    textAlign: "center",
    marginTop: 6,
    letterSpacing: 0.5,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  printActionBtn: {
    flex: 2,
    backgroundColor: "#1D4ED8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 12,
    shadowColor: "#1D4ED8",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  printActionIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  printActionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  doneActionBtn: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  doneActionText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "700",
  },
});
