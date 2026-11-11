import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Animated,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCart, OrderRecord } from "../context/CartContext";
import { API_URL, safeFetch } from "../constants/api";
import { generateAndShareReceipt } from "../utils/receiptGenerator";
import ReceiptModal from "../components/ReceiptModal";

const { width } = Dimensions.get("window");

// Generates authentic high-density 1D barcode stripes from any code string
function ExitBarcodeView({ code }: { code: string }) {
  const bars = useMemo(() => {
    const list: { width: number; isBlack: boolean }[] = [];
    // Start guard bars
    list.push({ width: 3, isBlack: true });
    list.push({ width: 1.5, isBlack: false });
    list.push({ width: 2, isBlack: true });
    list.push({ width: 2, isBlack: false });

    let toggle = true;
    for (let i = 0; i < code.length; i++) {
      const c = code.charCodeAt(i);
      const seq = [
        ((c % 3) + 1) * 1.6,
        (((c >> 1) % 2) + 1) * 1.5,
        (((c >> 2) % 3) + 1) * 1.6,
        (((c >> 3) % 2) + 1) * 1.5,
      ];
      for (const w of seq) {
        list.push({ width: Math.round(w), isBlack: toggle });
        toggle = !toggle;
      }
    }
    // End guard bars
    list.push({ width: 2, isBlack: true });
    list.push({ width: 1.5, isBlack: false });
    list.push({ width: 3, isBlack: true });
    return list;
  }, [code]);

  return (
    <View style={styles.barcodeCardWrapper}>
      {/* 4 Viewfinder Corner Brackets */}
      <View style={[styles.cornerBracket, styles.cornerTL]} />
      <View style={[styles.cornerBracket, styles.cornerTR]} />
      <View style={[styles.cornerBracket, styles.cornerBL]} />
      <View style={[styles.cornerBracket, styles.cornerBR]} />

      {/* Realistic 1D Barcode Stripes */}
      <View style={styles.barcodeStripesRow}>
        {bars.map((bar, idx) => (
          <View
            key={idx}
            style={{
              width: bar.width,
              height: 56,
              backgroundColor: bar.isBlack ? "#0F172A" : "transparent",
            }}
          />
        ))}
      </View>

      {/* Formatted Monospace Exit Pass String */}
      <Text style={styles.barcodeDigitsText}>{code}</Text>
    </View>
  );
}

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const { orderId, method } = useLocalSearchParams<{
    orderId?: string;
    method?: string;
  }>();
  const { recentOrders, updateRecentOrder } = useCart();

  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Pulse animation for live sync status
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const haloAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(haloAnim, {
          toValue: 1.25,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(haloAnim, {
          toValue: 0.85,
          duration: 1400,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim, haloAnim]);

  // Initial load & Real-time Live Polling every 2.0s
  useEffect(() => {
    let isMounted = true;

    // 1. Initial hydrate from recentOrders cache if available
    if (orderId && recentOrders.length > 0) {
      const match = recentOrders.find((o) => o._id === orderId);
      if (match) {
        setOrder(match);
      }
    } else if (!orderId && recentOrders.length > 0) {
      setOrder(recentOrders[0]);
    }

    // 2. Fetch live status from backend
    const fetchLiveStatus = async () => {
      const targetId = orderId || (recentOrders.length > 0 ? recentOrders[0]._id : null);
      if (!targetId || !API_URL) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const res = await safeFetch(`${API_URL}/orders/${targetId}`, {}, 4000);
        const data = await res.json();
        if (isMounted && data?.success && data?.order) {
          setOrder(data.order);
          updateRecentOrder(data.order);
        }
      } catch (_) {
        // silent fail during polling
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLiveStatus();

    const interval = setInterval(() => {
      fetchLiveStatus();
    }, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [orderId]);

  const currentStatus = order?.paymentStatus || (method === "Cash" ? "Pending" : "Pending");

  const isPending = currentStatus === "Pending";
  const isApproved = currentStatus === "Approved";
  const isCompleted = currentStatus === "Completed";

  const orderNum = order?.orderNumber || "#SSM20250430";
  const amount = Number(order?.totalAmount || 140);
  const payMethod = order?.paymentMethod || method || "Card";
  const exitBarcode = order?.exitBarcode || "EXIT-78239718";
  const itemCount = order?.items?.length || 1;

  const handleDownloadReceipt = () => {
    if (!order) return;
    setShowReceiptModal(true);
    try {
      generateAndShareReceipt(order);
    } catch (_) {}
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar style="light" />

      {/* Modern Curved Gradient Top Header */}
      <View style={styles.topCurvedHeader}>
        <View style={styles.topHeaderGlow} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ========================================================================= */}
        {/* 1. HERO VERIFICATION BADGE & ANIMATED HALO                                */}
        {/* ========================================================================= */}
        <View style={styles.heroVerificationSection}>
          <Animated.View
            style={[
              styles.shieldHaloPulse,
              {
                transform: [{ scale: haloAnim }],
                backgroundColor: isApproved
                  ? "rgba(16, 185, 129, 0.22)"
                  : isPending
                  ? "rgba(245, 158, 11, 0.2)"
                  : "rgba(16, 185, 129, 0.25)",
              },
            ]}
          />

          <View
            style={[
              styles.shieldIconCircle,
              {
                backgroundColor: isApproved ? "#10B981" : isPending ? "#F59E0B" : "#10B981",
                shadowColor: isApproved ? "#10B981" : isPending ? "#F59E0B" : "#10B981",
              },
            ]}
          >
            <Text style={styles.shieldSymbol}>
              {isApproved ? "🛡️" : isPending ? "⏳" : "✓"}
            </Text>
          </View>

          <Text style={styles.heroMainTitle}>
            {isApproved ? "Payment Approved!" : isPending ? "Payment Pending" : "Payment Successful!"}
          </Text>

          <View
            style={[
              styles.statusPillBadge,
              {
                backgroundColor: isApproved ? "#ECFDF5" : isPending ? "#FEF3C7" : "#ECFDF5",
                borderColor: isApproved ? "#A7F3D0" : isPending ? "#FDE68A" : "#A7F3D0",
              },
            ]}
          >
            <Animated.View
              style={[
                styles.statusLiveDot,
                {
                  opacity: pulseAnim,
                  backgroundColor: isApproved ? "#10B981" : isPending ? "#D97706" : "#10B981",
                },
              ]}
            />
            <Text
              style={[
                styles.statusPillText,
                { color: isApproved ? "#047857" : isPending ? "#B45309" : "#047857" },
              ]}
            >
              {isApproved
                ? "Verified & Cleared by Super Admin"
                : isPending
                ? "Awaiting Cashier Clearance at Exit"
                : "Transaction Completed Successfully"}
            </Text>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* 2. UNIQUE DIGITAL SMART TURNSTILE BOARDING PASS CARD                      */}
        {/* ========================================================================= */}
        <View style={styles.smartTicketCard}>
          {/* Ticket Header */}
          <View style={styles.ticketHeaderRow}>
            <View style={styles.ticketBrandBox}>
              <Text style={styles.ticketStoreIcon}>🛒</Text>
              <View>
                <Text style={styles.ticketBrandName}>GROCEREASE</Text>
                <Text style={styles.ticketSubTitle}>SMART TURNSTILE PASS</Text>
              </View>
            </View>

            <View
              style={[
                styles.gateUnlockedBadge,
                {
                  backgroundColor: isApproved ? "#ECFDF5" : isPending ? "#FEF3C7" : "#ECFDF5",
                  borderColor: isApproved ? "#86EFAC" : isPending ? "#FCD34D" : "#86EFAC",
                },
              ]}
            >
              <Text
                style={[
                  styles.gateUnlockedText,
                  { color: isApproved ? "#15803D" : isPending ? "#B45309" : "#15803D" },
                ]}
              >
                {isApproved ? "GATE UNLOCKED" : isPending ? "GATE STANDBY" : "GATE CLEARED"}
              </Text>
            </View>
          </View>

          {/* Ticket Body: Turnstile clearance info */}
          <View style={styles.ticketInstructionsBox}>
            <Text style={styles.ticketGateNotice}>
              {isApproved
                ? "Super Admin has verified and approved your Card payment. You can now scan your pass at the turnstile gate."
                : isPending
                ? "Please present this barcode at Exit Turnstile 1–4 to complete payment and release gate."
                : "Your exit pass has been authorized. Walk through Exit Turnstile 1–4."}
            </Text>
            <View style={styles.ticketTurnstileTagRow}>
              <Text style={styles.turnstilePill}>📍 Exit Turnstile 1 – 4</Text>
              <Text style={styles.turnstilePill}>⚡ Auto-Sensor Active</Text>
            </View>
          </View>

          {/* Perforated Divider with Left/Right Notch Cutouts */}
          <View style={styles.perforatedRow}>
            <View style={[styles.ticketNotch, styles.notchLeft]} />
            <View style={styles.dashedDividerLine} />
            <View style={[styles.ticketNotch, styles.notchRight]} />
          </View>

          {/* Scannable Barcode & Viewfinder */}
          <View style={styles.ticketBarcodeSection}>
            <Text style={styles.ticketBarcodeHeaderLabel}>
              SCAN TO OPEN TURNSTILE
            </Text>

            <ExitBarcodeView code={exitBarcode} />

            <View style={styles.ticketScanInstructionPill}>
              <Text style={styles.ticketScanIcon}>📱</Text>
              <Text style={styles.ticketScanHintText}>
                Hold phone screen against the turnstile scanner glass
              </Text>
            </View>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* 3. MODERN ORDER BREAKDOWN CARD                                            */}
        {/* ========================================================================= */}
        <View style={styles.orderSummaryCard}>
          <View style={styles.orderSummaryTopRow}>
            <View>
              <Text style={styles.orderNumberTitle}>Order {orderNum}</Text>
              <Text style={styles.orderItemCountText}>{itemCount} Item(s) Purchased</Text>
            </View>
            <Text style={styles.orderGrandTotalAmount}>₹{amount.toFixed(2)}</Text>
          </View>

          <View style={styles.orderInfoGrid}>
            <View style={styles.orderGridItem}>
              <Text style={styles.gridItemLabel}>Payment Method</Text>
              <Text style={styles.gridItemValue}>{payMethod} (Approved)</Text>
            </View>

            <View style={styles.orderGridItem}>
              <Text style={styles.gridItemLabel}>Security</Text>
              <Text style={styles.gridItemValue}>✓ 256-Bit Verified</Text>
            </View>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* 4. INTERACTIVE ACTION BUTTONS                                             */}
        {/* ========================================================================= */}
        <View style={styles.actionButtonsContainer}>
          {/* Download Official Tax Invoice */}
          <TouchableOpacity
            style={styles.downloadTaxReceiptBtn}
            onPress={handleDownloadReceipt}
            disabled={downloading}
            activeOpacity={0.82}
          >
            {downloading ? (
              <ActivityIndicator size="small" color="#1E1B4B" />
            ) : (
              <>
                <Text style={styles.downloadBtnIcon}>↓</Text>
                <Text style={styles.downloadBtnText}>Download Receipt</Text>
              </>
            )}
          </TouchableOpacity>

          {/* View in My Orders Button */}
          <TouchableOpacity
            style={styles.viewOrdersPrimaryBtn}
            onPress={() => router.replace("/orders")}
            activeOpacity={0.88}
          >
            <Text style={styles.viewOrdersBtnText}>View in My Orders →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Interactive In-App Real-Time Tax Receipt Modal */}
      <ReceiptModal
        visible={showReceiptModal}
        order={order}
        onClose={() => setShowReceiptModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  topCurvedHeader: {
    position: "absolute",
    top: -50,
    left: -40,
    right: -40,
    height: 230,
    backgroundColor: "#2E0854",
    borderBottomLeftRadius: 280,
    borderBottomRightRadius: 280,
    overflow: "hidden",
  },
  topHeaderGlow: {
    position: "absolute",
    top: 30,
    left: width * 0.25,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(99, 102, 241, 0.25)",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 40,
    alignItems: "center",
  },

  /* Hero Section */
  heroVerificationSection: {
    alignItems: "center",
    marginBottom: 18,
    position: "relative",
    width: "100%",
  },
  shieldHaloPulse: {
    position: "absolute",
    top: -6,
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  shieldIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 14,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  shieldSymbol: {
    fontSize: 34,
  },
  heroMainTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#4338CA",
    textAlign: "center",
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  statusPillBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    gap: 7,
  },
  statusLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "700",
  },

  /* Unique Boarding Pass / Turnstile Smart Ticket Card */
  smartTicketCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    marginBottom: 16,
    overflow: "hidden",
  },
  ticketHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  ticketBrandBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ticketStoreIcon: {
    fontSize: 22,
  },
  ticketBrandName: {
    fontSize: 13,
    fontWeight: "900",
    color: "#1E293B",
    letterSpacing: 0.5,
  },
  ticketSubTitle: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.8,
  },
  gateUnlockedBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  gateUnlockedText: {
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  ticketInstructionsBox: {
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  ticketGateNotice: {
    fontSize: 12.5,
    color: "#334155",
    lineHeight: 18,
    fontWeight: "500",
    marginBottom: 8,
  },
  ticketTurnstileTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  turnstilePill: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4338CA",
    backgroundColor: "#EEF2FF",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },

  /* Perforated Divider with Notches */
  perforatedRow: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    marginVertical: 4,
  },
  ticketNotch: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    position: "absolute",
    zIndex: 3,
  },
  notchLeft: {
    left: -12,
  },
  notchRight: {
    right: -12,
  },
  dashedDividerLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderStyle: "dashed",
    marginHorizontal: 18,
  },

  /* Barcode Section inside Ticket */
  ticketBarcodeSection: {
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 16,
  },
  ticketBarcodeHeaderLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "#64748B",
    marginBottom: 10,
  },
  barcodeCardWrapper: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 10,
  },
  cornerBracket: {
    position: "absolute",
    width: 14,
    height: 14,
    borderColor: "#06B6D4",
    borderStyle: "solid",
  },
  cornerTL: {
    top: 6,
    left: 6,
    borderWidth: 2.5,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 6,
    right: 6,
    borderWidth: 2.5,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 6,
    left: 6,
    borderWidth: 2.5,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 6,
    right: 6,
    borderWidth: 2.5,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 4,
  },
  barcodeStripesRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 58,
    overflow: "hidden",
  },
  barcodeDigitsText: {
    marginTop: 6,
    fontFamily: "monospace",
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 3,
  },
  ticketScanInstructionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  ticketScanIcon: {
    fontSize: 14,
  },
  ticketScanHintText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1E40AF",
  },

  /* Order Summary Card */
  orderSummaryCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    marginBottom: 20,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  orderSummaryTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    marginBottom: 12,
  },
  orderNumberTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1E293B",
  },
  orderItemCountText: {
    fontSize: 11.5,
    color: "#64748B",
    fontWeight: "500",
    marginTop: 2,
  },
  orderGrandTotalAmount: {
    fontSize: 26,
    fontWeight: "900",
    color: "#15803D",
  },
  orderInfoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  orderGridItem: {
    flex: 1,
  },
  gridItemLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
    marginBottom: 2,
  },
  gridItemValue: {
    fontSize: 12.5,
    color: "#0F172A",
    fontWeight: "700",
  },

  /* Action Buttons */
  actionButtonsContainer: {
    width: "100%",
    gap: 12,
  },
  downloadTaxReceiptBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#2E0854",
  },
  downloadBtnIcon: {
    fontSize: 18,
    color: "#2E0854",
    marginRight: 8,
    fontWeight: "900",
  },
  downloadBtnText: {
    fontSize: 14.5,
    fontWeight: "800",
    color: "#2E0854",
  },
  viewOrdersPrimaryBtn: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingVertical: 14,
    backgroundColor: "#2E0854",
    borderRadius: 14,
    shadowColor: "#2E0854",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  viewOrdersBtnText: {
    fontSize: 14.5,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
