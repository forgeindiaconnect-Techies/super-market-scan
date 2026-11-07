import React, { useEffect, useState, useRef } from "react";
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
  }, [pulseAnim]);

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

    // First fetch
    fetchLiveStatus();

    // Polling interval: poll every 2 seconds
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
  const amount = order?.totalAmount || 280;
  const payMethod = order?.paymentMethod || method || "UPI";
  const exitBarcode = order?.exitBarcode || "EXIT-" + Date.now().toString().slice(-8);

  const handleDownloadReceipt = () => {
    if (!order) return;
    // Instantly open the authentic in-app supermarket tax receipt modal
    setShowReceiptModal(true);
    // Seamlessly launch native print / PDF dialog without any unhandled crashes
    try {
      generateAndShareReceipt(order);
    } catch (_) {}
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar style="light" />

      {/* Top Purple Arch Background matching Screen 7 reference */}
      <View style={styles.topPurpleBackdrop} />

      {/* Festive Falling Party Confetti when Payment is Completed */}
      {isCompleted && (
        <View style={styles.confettiContainer} pointerEvents="none">
          <Text style={[styles.confettiParticle, { top: 16, left: 28, color: "#FBBF24" }]}>✦</Text>
          <Text style={[styles.confettiParticle, { top: 32, left: 65, color: "#34D399" }]}>■</Text>
          <Text style={[styles.confettiParticle, { top: 18, left: 130, color: "#F472B6" }]}>▲</Text>
          <Text style={[styles.confettiParticle, { top: 44, left: 175, color: "#FBBF24" }]}>●</Text>
          <Text style={[styles.confettiParticle, { top: 14, right: 120, color: "#60A5FA" }]}>✦</Text>
          <Text style={[styles.confettiParticle, { top: 38, right: 75, color: "#FB7185" }]}>■</Text>
          <Text style={[styles.confettiParticle, { top: 22, right: 28, color: "#A78BFA" }]}>▲</Text>
          <Text style={[styles.confettiParticle, { top: 60, left: 45, color: "#F59E0B" }]}>●</Text>
          <Text style={[styles.confettiParticle, { top: 68, right: 55, color: "#10B981" }]}>✦</Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {isPending ? (
          /* ========================================================================= */
          /* STAGE 1: PAYMENT PENDING (Awaiting Admin Approval / Cash at Exit)          */
          /* Matching user attached screenshot media_1793870169070_915dcb14.jpg        */
          /* ========================================================================= */
          <View style={styles.centerAlignBox}>
            <View style={styles.pendingIconCircle}>
              <Text style={{ fontSize: 36 }}>💵</Text>
            </View>

            <Text style={styles.headingTitle}>Order Registered</Text>

            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>
                {payMethod === "Cash"
                  ? "Payment Pending – Cash at Exit"
                  : "Payment Pending – Awaiting Admin Approval"}
              </Text>
            </View>

            {/* Turnstile Exit Procedure Card */}
            <View style={styles.cashInstructionCard}>
              <Text style={styles.cashInstructionHeader}>Turnstile Exit Procedure:</Text>
              <Text style={styles.cashInstructionBody}>
                1. Please take your selected items to Exit Turnstile 1–4.{"\n"}
                2. Show your Exit Barcode below to the store cashier or terminal.{"\n"}
                3. Total Amount: ₹{amount}. Once cashier approves payment, your exit gate will open automatically!
              </Text>

              <View style={styles.exitBarcodeBox}>
                <Text style={styles.exitBarcodeLabel}>EXIT GATE PASS BARCODE</Text>
                <Text style={styles.exitBarcodeCode}>{exitBarcode}</Text>
              </View>
            </View>

            {/* Order Card with live sync status */}
            <View style={styles.orderCard}>
              <Text style={styles.orderNumberLabel}>Order {orderNum}</Text>
              <Text style={styles.orderAmountText}>₹{amount}</Text>

              <View style={styles.liveSyncRow}>
                <Animated.View
                  style={[styles.liveDot, { opacity: pulseAnim, backgroundColor: "#D97706" }]}
                />
                <Text style={[styles.paymentMethodText, { color: "#D97706" }]}>
                  Status: Payment Pending ({payMethod})
                </Text>
              </View>

              <Text style={styles.waitingNoteText}>
                ⚡ Real-time Sync Active: Waiting for Super Admin approval in dashboard...
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.downloadReceiptBtn}
                onPress={handleDownloadReceipt}
                disabled={downloading}
                activeOpacity={0.8}
              >
                {downloading ? (
                  <ActivityIndicator size="small" color="#2E0854" />
                ) : (
                  <>
                    <Text style={styles.downloadIcon}>⤓</Text>
                    <Text style={styles.downloadReceiptText}>Download Receipt</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.continueShoppingBtn}
                onPress={() => router.replace("/orders")}
                activeOpacity={0.88}
              >
                <Text style={styles.continueShoppingText}>View in My Orders →</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : isApproved ? (
          /* ========================================================================= */
          /* STAGE 2: PAYMENT APPROVED (Super Admin Approved, Final Verification)      */
          /* ========================================================================= */
          <View style={styles.centerAlignBox}>
            <View style={styles.approvedIconCircle}>
              <Text style={{ fontSize: 36 }}>🛡️</Text>
            </View>

            <Text style={[styles.headingTitle, { color: "#4F46E5" }]}>
              Payment Approved!
            </Text>

            <View style={styles.approvedBadge}>
              <Text style={styles.approvedBadgeText}>
                ✓ Payment Approved by Super Admin
              </Text>
            </View>

            {/* Approval Notice Card */}
            <View style={[styles.cashInstructionCard, { borderColor: "#C7D2FE", backgroundColor: "#EEF2FF" }]}>
              <Text style={[styles.cashInstructionHeader, { color: "#3730A3" }]}>
                Turnstile Gate Unlocked:
              </Text>
              <Text style={[styles.cashInstructionBody, { color: "#312E81" }]}>
                Super Admin has verified and approved your {payMethod} payment. You can now scan your pass at the turnstile gate.
              </Text>

              <View style={[styles.exitBarcodeBox, { backgroundColor: "#FFFFFF", borderColor: "#A5B4FC" }]}>
                <Text style={[styles.exitBarcodeLabel, { color: "#4F46E5" }]}>EXIT GATE PASS BARCODE</Text>
                <Text style={[styles.exitBarcodeCode, { color: "#312E81" }]}>{exitBarcode}</Text>
              </View>
            </View>

            {/* Order Card */}
            <View style={styles.orderCard}>
              <Text style={styles.orderNumberLabel}>Order {orderNum}</Text>
              <Text style={styles.orderAmountText}>₹{amount}</Text>

              <View style={styles.liveSyncRow}>
                <Animated.View
                  style={[styles.liveDot, { opacity: pulseAnim, backgroundColor: "#4F46E5" }]}
                />
                <Text style={[styles.paymentMethodText, { color: "#4F46E5" }]}>
                  Status: Payment Approved ({payMethod})
                </Text>
              </View>

              <Text style={[styles.waitingNoteText, { color: "#4F46E5" }]}>
                ⚡ Payment Approved! Ready for exit turnstile clearance.
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.downloadReceiptBtn}
                onPress={handleDownloadReceipt}
                disabled={downloading}
                activeOpacity={0.8}
              >
                {downloading ? (
                  <ActivityIndicator size="small" color="#2E0854" />
                ) : (
                  <>
                    <Text style={styles.downloadIcon}>⤓</Text>
                    <Text style={styles.downloadReceiptText}>Download Receipt</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.continueShoppingBtn}
                onPress={() => router.replace("/orders")}
                activeOpacity={0.88}
              >
                <Text style={styles.continueShoppingText}>View in My Orders →</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* ========================================================================= */
          /* STAGE 3: PAYMENT COMPLETED (Success State matching Screen 7 reference)     */
          /* ========================================================================= */
          <View style={styles.centerAlignBox}>
            {/* Bright Green Circular Checkmark with Halo Glow */}
            <View style={styles.checkmarkOuterCircle}>
              <View style={styles.checkmarkCircle}>
                <Text style={styles.checkmarkIcon}>✔</Text>
              </View>
            </View>

            {/* Headings matching Screen 7 */}
            <Text style={styles.headingTitle}>Payment Successful!</Text>
            <Text style={styles.headingSubtitle}>
              Your order has been placed successfully
            </Text>

            {/* Order Details Card matching Screen 7 */}
            <View style={styles.orderCard}>
              <Text style={styles.orderNumberLabel}>Order {orderNum}</Text>
              <Text style={styles.orderAmountText}>₹{amount}</Text>
              <Text style={styles.paymentMethodText}>Paid via {payMethod}</Text>
            </View>

            {/* Action Buttons matching Screen 7 */}
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.downloadReceiptBtn}
                onPress={handleDownloadReceipt}
                disabled={downloading}
                activeOpacity={0.8}
              >
                {downloading ? (
                  <ActivityIndicator size="small" color="#2E0854" />
                ) : (
                  <>
                    <Text style={styles.downloadIcon}>⤓</Text>
                    <Text style={styles.downloadReceiptText}>Download Receipt</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.continueShoppingBtn}
                onPress={() => router.replace("/")}
                activeOpacity={0.88}
              >
                <Text style={styles.continueShoppingText}>Continue Shopping →</Text>
              </TouchableOpacity>
            </View>

            {/* Cute Smiling Yellow Paper Bag Mascot matching Screen 7 */}
            <View style={styles.mascotContainer}>
              <Image
                source={require("@/assets/images/mascot-success.png")}
                style={styles.mascotImage}
                resizeMode="contain"
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Interactive In-App Real-time Supermarket Tax Invoice Modal */}
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
    backgroundColor: "#FFFFFF",
    position: "relative",
  },
  topPurpleBackdrop: {
    position: "absolute",
    top: -40,
    left: -40,
    right: -40,
    height: 220,
    backgroundColor: "#2E0854", // Deep rich purple top matching reference
    borderBottomLeftRadius: 260,
    borderBottomRightRadius: 260,
  },
  confettiContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 150,
    zIndex: 2,
  },
  confettiParticle: {
    position: "absolute",
    fontSize: 20,
    fontWeight: "900",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 58,
    paddingBottom: 24,
    alignItems: "center",
  },
  centerAlignBox: {
    width: "100%",
    alignItems: "center",
  },
  pendingIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#FDE68A",
  },
  approvedIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#C7D2FE",
  },
  pendingBadge: {
    backgroundColor: "#FEF3C7",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginTop: 6,
    marginBottom: 16,
  },
  pendingBadgeText: {
    color: "#B45309",
    fontWeight: "800",
    fontSize: 13,
  },
  approvedBadge: {
    backgroundColor: "#EEF2FF",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginTop: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  approvedBadgeText: {
    color: "#4F46E5",
    fontWeight: "800",
    fontSize: 13,
  },
  cashInstructionCard: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  cashInstructionHeader: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 6,
  },
  cashInstructionBody: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 20,
    marginBottom: 12,
  },
  exitBarcodeBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingVertical: 12,
    alignItems: "center",
  },
  exitBarcodeLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#64748B",
    marginBottom: 4,
  },
  exitBarcodeCode: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 2,
    color: "#1E293B",
  },
  checkmarkOuterCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(16, 185, 129, 0.16)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  checkmarkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  checkmarkIcon: {
    color: "#FFFFFF",
    fontSize: 42,
    fontWeight: "900",
    lineHeight: 46,
  },
  headingTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#10B981",
    textAlign: "center",
    marginBottom: 6,
  },
  headingSubtitle: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    marginBottom: 20,
  },
  orderCard: {
    width: "100%",
    backgroundColor: "#F3E8FF",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E9D5FF",
  },
  orderNumberLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3B0764",
    marginBottom: 4,
  },
  orderAmountText: {
    fontSize: 32,
    fontWeight: "900",
    color: "#15803D",
    marginBottom: 4,
  },
  paymentMethodText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  liveSyncRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  waitingNoteText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#B45309",
    marginTop: 6,
    textAlign: "center",
  },
  buttonGroup: {
    width: "100%",
    gap: 12,
    marginBottom: 20,
  },
  downloadReceiptBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#2E0854",
  },
  downloadIcon: {
    fontSize: 18,
    color: "#2E0854",
    marginRight: 8,
    fontWeight: "800",
  },
  downloadReceiptText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2E0854",
  },
  continueShoppingBtn: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingVertical: 14,
    backgroundColor: "#2E0854",
    borderRadius: 24,
    shadowColor: "#2E0854",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  continueShoppingText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  mascotContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 10,
  },
  mascotImage: {
    width: width * 0.72,
    height: 170,
  },
});
