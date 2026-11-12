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
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useCart, OrderRecord } from "../context/CartContext";
import { API_URL, safeFetch } from "../constants/api";
import { generateAndShareReceipt } from "../utils/receiptGenerator";
import ReceiptModal from "../components/ReceiptModal";

const { width } = Dimensions.get("window");

const PENDING_IMG = require("@/assets/images/payment-pending.jpg");
const APPROVED_IMG = require("@/assets/images/payment-approved.jpg");

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const { orderId, method } = useLocalSearchParams<{
    orderId?: string;
    method?: string;
  }>();
  const { recentOrders, updateRecentOrder, customerInfo } = useCart();

  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [manualRefreshing, setManualRefreshing] = useState(false);

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
        const res = await safeFetch(`${API_URL}/orders/${targetId}?_t=${Date.now()}`, {}, 4000);
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

  const handleManualRefresh = async () => {
    const targetId = orderId || (recentOrders.length > 0 ? recentOrders[0]._id : null);
    if (!targetId || !API_URL) return;
    setManualRefreshing(true);
    try {
      const res = await safeFetch(`${API_URL}/orders/${targetId}?_t=${Date.now()}`, {}, 4000);
      const data = await res.json();
      if (data?.success && data?.order) {
        setOrder(data.order);
        updateRecentOrder(data.order);
      }
    } catch (_) {
    } finally {
      setTimeout(() => setManualRefreshing(false), 500);
    }
  };

  const currentStatus = order?.paymentStatus || (method === "Cash" ? "Pending" : "Pending");

  const isPending = currentStatus === "Pending";
  const isApproved = currentStatus === "Approved" || currentStatus === "Completed";

  const orderNum = order?.orderNumber || (orderId ? `ORD-${orderId.slice(-6)}` : "#SSM20250430");
  const amount = Number(order?.totalAmount || 140);
  const payMethod = order?.paymentMethod || method || "Card";
  const exitBarcode = order?.exitBarcode || "EXIT-78239718";
  const itemCount = order?.items?.length || 1;
  const customerName = (order as any)?.customer?.name || customerInfo?.name || "";
  const customerPhone = (order as any)?.customer?.phone || customerInfo?.phone || "";
  const customerAddress = (order as any)?.customer?.address || customerInfo?.address || "";

  const handleDownloadReceipt = () => {
    if (!order) return;
    setShowReceiptModal(true);
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar style="light" />

      {/* Top Header matching App Design */}
      <View style={styles.purpleHeader}>
        <SafeAreaView edges={["top"]} style={styles.purpleHeaderSafe}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => router.replace("/orders")}
              activeOpacity={0.7}
            >
              <Text style={styles.headerBackArrow}>‹</Text>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>
              {isPending ? "Payment Verification" : "Payment Successful"}
            </Text>

            <TouchableOpacity
              style={styles.headerBtn}
              onPress={handleDownloadReceipt}
              activeOpacity={0.7}
            >
              <Text style={styles.receiptIcon}>🧾</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* Main Curved White Container Sheet matching App Theme */}
      <View style={styles.whiteSheet}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
        {isPending ? (
          /* ========================================================================= */
          /* 1. PAYMENT PENDING STATE: HARMONIZED MOBILE APP PURPLE THEME             */
          /* ========================================================================= */
          <>
            {/* Hero Card */}
            <View style={styles.heroCard}>
              <View style={styles.heroImageContainerPending}>
                <Image
                  source={PENDING_IMG}
                  style={styles.hero3DImage}
                  resizeMode="contain"
                />
              </View>

              <Text style={styles.heroTitlePending}>Payment Under Verification</Text>

              <View style={styles.statusPillPending}>
                <Animated.View
                  style={[styles.statusLiveDotPurple, { opacity: pulseAnim }]}
                />
                <Text style={styles.statusPillTextPending}>
                  Awaiting Super Admin Clearance
                </Text>
              </View>
            </View>

            {/* Step-by-Step Verification Stepper Card */}
            <View style={styles.stepperCard}>
              <Text style={styles.stepperCardTitle}>Verification Progress</Text>
              <View style={styles.stepperRow}>
                {/* Step 1: Placed */}
                <View style={styles.stepItem}>
                  <View style={[styles.stepCircle, styles.stepCircleDone]}>
                    <Text style={styles.stepDoneCheck}>✓</Text>
                  </View>
                  <Text style={styles.stepLabelDone}>Order Placed</Text>
                </View>

                {/* Line 1 */}
                <View style={[styles.stepLine, styles.stepLineActive]} />

                {/* Step 2: Store Approval */}
                <View style={styles.stepItem}>
                  <Animated.View
                    style={[
                      styles.stepCircle,
                      styles.stepCirclePending,
                      { opacity: pulseAnim },
                    ]}
                  >
                    <Text style={styles.stepPendingIcon}>⏳</Text>
                  </Animated.View>
                  <Text style={styles.stepLabelPending}>Admin Approval</Text>
                </View>

                {/* Line 2 */}
                <View style={[styles.stepLine, styles.stepLineInactive]} />

                {/* Step 3: Turnstile Exit */}
                <View style={styles.stepItem}>
                  <View style={[styles.stepCircle, styles.stepCircleInactive]}>
                    <Text style={styles.stepInactiveIcon}>🚪</Text>
                  </View>
                  <Text style={styles.stepLabelInactive}>Gate Unlocks</Text>
                </View>
              </View>
            </View>

            {/* Store Clearance Instructions Card (Purple & Soft Lavender Theme) */}
            <View style={styles.noticeCardPending}>
              <View style={styles.noticeHeaderRow}>
                <Text style={styles.noticeIcon}>🔔</Text>
                <Text style={styles.noticeTitle}>Store Clearance Notice</Text>
              </View>
              <Text style={styles.noticeBody}>
                {payMethod === "Cash"
                  ? `Please present ₹${amount.toFixed(2)} in Cash at the supermarket cashier counter. Staff will approve your order and release your turnstile pass in real-time.`
                  : `Your ${payMethod} payment of ₹${amount.toFixed(2)} is pending approval. Super Admin is verifying the transaction.`}
              </Text>
              <View style={styles.autoUpdatePill}>
                <Text style={styles.autoUpdateFlash}>⚡</Text>
                <Text style={styles.autoUpdateText}>
                  This screen updates automatically once approved
                </Text>
              </View>
            </View>

            {/* Order Details Breakdown Card */}
            <View style={styles.orderSummaryCard}>
              <View style={styles.orderSummaryTopRow}>
                <View>
                  <Text style={styles.orderNumberTitle}>Order {orderNum}</Text>
                  <Text style={styles.orderItemCountText}>{itemCount} Item(s) in Cart</Text>
                </View>
                <Text style={styles.orderGrandTotalAmountPending}>
                  ₹{amount.toFixed(2)}
                </Text>
              </View>
              <View style={styles.orderInfoGrid}>
                <View style={styles.orderGridItem}>
                  <Text style={styles.gridItemLabel}>Payment Method</Text>
                  <Text style={styles.gridItemValue}>
                    {payMethod === "Cash" ? "💵 Cash at Exit" : (payMethod === "Card" ? "💳 Card" : "⚡ UPI")} (Pending)
                  </Text>
                </View>
                <View style={styles.orderGridItem}>
                  <Text style={styles.gridItemLabel}>Live Verification</Text>
                  <Text style={styles.gridItemValue}>⏳ Checking with Admin...</Text>
                </View>
              </View>

              {customerName ? (
                <View style={styles.customerDetailCard}>
                  <View style={styles.customerDetailHeader}>
                    <Text style={styles.customerDetailLabel}>REGISTERED SHOPPER</Text>
                    <View style={styles.verifiedShopperBadge}>
                      <Text style={styles.verifiedShopperText}>✓ Verified</Text>
                    </View>
                  </View>
                  <View style={styles.customerDetailRow}>
                    <View style={styles.customerAvatarSmall}>
                      <Text style={{ fontSize: 13 }}>👤</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.customerNameBold}>{customerName}</Text>
                      {customerPhone ? (
                        <Text style={styles.customerPhoneBold}>📱 +91 {customerPhone}</Text>
                      ) : null}
                      {customerAddress ? (
                        <Text style={styles.customerAddressText} numberOfLines={2}>
                          📍 {customerAddress}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </View>
              ) : null}
            </View>

            {/* Action Buttons in Mobile App Purple Theme */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={styles.refreshStatusBtn}
                onPress={handleManualRefresh}
                disabled={manualRefreshing}
                activeOpacity={0.82}
              >
                {manualRefreshing ? (
                  <ActivityIndicator size="small" color="#3B0764" />
                ) : (
                  <>
                    <Text style={styles.refreshIcon}>🔄</Text>
                    <Text style={styles.refreshBtnText}>Check Status Now</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.viewOrdersSecondaryBtn}
                onPress={() => router.replace("/orders")}
                activeOpacity={0.88}
              >
                <Text style={styles.viewOrdersSecondaryBtnText}>View in My Orders →</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          /* ========================================================================= */
          /* 2. PAYMENT APPROVED STATE: PROPER, COMPLETE & APP-BRANDED DESIGN         */
          /* ========================================================================= */
          <>
            {/* Celebratory Hero Card */}
            <View style={styles.heroSuccessCard}>
              <View style={styles.heroImageContainerApproved}>
                <Image
                  source={APPROVED_IMG}
                  style={styles.hero3DImage}
                  resizeMode="contain"
                />
              </View>

              <Text style={styles.heroTitleApproved}>Turnstile Gate Unlocked!</Text>

              <View style={styles.statusPillApproved}>
                <Text style={styles.statusLiveDotGreen}>✓</Text>
                <Text style={styles.statusPillTextApproved}>
                  Payment Approved by Super Admin
                </Text>
              </View>
            </View>

            {/* Amount Paid Showcase Card */}
            <View style={styles.paidAmountCard}>
              <Text style={styles.paidAmountLabel}>TOTAL AMOUNT PAID</Text>
              <Text style={styles.paidAmountValue}>₹{amount.toFixed(2)}</Text>
              {Number(order?.discountAmount || 0) > 0 && (
                <View style={styles.savingsTagSuccess}>
                  <Text style={styles.savingsTagText}>
                    ★ You Saved ₹{Number(order?.discountAmount).toFixed(2)} on this order
                  </Text>
                </View>
              )}
              {customerName ? (
                <Text style={styles.paidByText}>
                  Paid by {customerName} • {payMethod === "Cash" ? "Cash at Exit" : payMethod}
                </Text>
              ) : (
                <Text style={styles.paidByText}>
                  Paid via {payMethod === "Cash" ? "Cash at Exit" : payMethod}
                </Text>
              )}
            </View>

            {/* Smart Turnstile Exit Pass Card */}
            <View style={styles.smartPassCard}>
              <View style={styles.passHeaderRow}>
                <View style={styles.passBrandGroup}>
                  <Text style={styles.passBrandIcon}>🛒</Text>
                  <View>
                    <Text style={styles.passStoreName}>GROCEREASE SUPERMARKET</Text>
                    <Text style={styles.passSubtitle}>SMART TURNSTILE EXIT PASS</Text>
                  </View>
                </View>
                <View style={styles.gateUnlockedBadge}>
                  <Text style={styles.gateUnlockedText}>GATE 1–4 UNLOCKED</Text>
                </View>
              </View>

              <View style={styles.passBody}>
                <Text style={styles.passInstructions}>
                  Super Admin has verified and approved your {payMethod} payment. You can now walk to Exit Turnstiles 1–4 to complete your exit.
                </Text>

                <View style={styles.passBadgesRow}>
                  <View style={styles.passTag}>
                    <Text style={styles.passTagText}>📍 Exit Turnstile 1–4</Text>
                  </View>
                  <View style={styles.passTag}>
                    <Text style={styles.passTagText}>⚡ Auto-Sensor Active</Text>
                  </View>
                </View>

                {customerName ? (
                  <View style={styles.passCustomerCard}>
                    <View style={styles.passCustomerHeader}>
                      <Text style={styles.passCustomerLabel}>VERIFIED SHOPPER</Text>
                      <View style={styles.verifiedShopperBadge}>
                        <Text style={styles.verifiedShopperText}>✓ Exit Authorized</Text>
                      </View>
                    </View>
                    <View style={styles.customerDetailRow}>
                      <View style={styles.customerAvatarSmall}>
                        <Text style={{ fontSize: 13 }}>👤</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.customerNameBold}>{customerName}</Text>
                        {customerPhone ? (
                          <Text style={styles.customerPhoneBold}>📱 +91 {customerPhone}</Text>
                        ) : null}
                      </View>
                    </View>
                  </View>
                ) : null}

                <View style={styles.passOrderMetaRow}>
                  <Text style={styles.passMetaText}>Order: {orderNum}</Text>
                  <Text style={styles.passMetaText}>
                    {(order as any)?.paymentId || (order as any)?.transactionId || `TXN-${orderNum.replace(/^ORD-/, "")}`}
                  </Text>
                </View>
              </View>
            </View>

            {/* Warm Supermarket Closing Message */}
            <View style={styles.thankYouCard}>
              <Text style={styles.thankYouIcon}>🛍️</Text>
              <Text style={styles.thankYouTitle}>Thank You! Visit Again</Text>
              <Text style={styles.thankYouSubText}>
                We hope you enjoyed autonomous shopping at GrocerEase Supermarket.
              </Text>
              <Text style={styles.thankYouPolicyText}>
                Original tax invoice is available in your orders anytime.
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.successActionsContainer}>
              <TouchableOpacity
                style={styles.viewTaxInvoicePrimaryBtn}
                onPress={handleDownloadReceipt}
                activeOpacity={0.88}
              >
                <Text style={styles.receiptActionIcon}>🧾</Text>
                <Text style={styles.viewTaxInvoiceBtnText}>View / Print Tax Receipt</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.continueShoppingBtn}
                onPress={() => router.replace("/scanner")}
                activeOpacity={0.85}
              >
                <Text style={styles.continueShoppingBtnText}>Continue Shopping 🛒</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.viewMyOrdersBtn}
                onPress={() => router.replace("/orders")}
                activeOpacity={0.8}
              >
                <Text style={styles.viewMyOrdersBtnText}>View in My Orders →</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>

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
    backgroundColor: "#2E0854", // Consistent deep purple matching all screens
  },
  purpleHeader: {
    backgroundColor: "#2E0854",
    paddingBottom: 22,
  },
  purpleHeaderSafe: {
    backgroundColor: "#2E0854",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 10 : 6,
  },
  headerBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  headerBackArrow: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "400",
    marginTop: -2,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  receiptIcon: {
    fontSize: 18,
  },
  whiteSheet: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -16,
    overflow: "hidden",
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: "center",
  },

  /* ========================================================================= */
  /* PAYMENT VERIFICATION (PENDING) STYLES - APP PURPLE THEME                  */
  /* ========================================================================= */
  heroCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingTop: 22,
    paddingBottom: 20,
    paddingHorizontal: 18,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#2E0854",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E9D8FD",
  },
  heroImageContainerPending: {
    width: 175,
    height: 175,
    borderRadius: 24,
    backgroundColor: "#FAF5FF", // Soft lavender matching app design
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#E9D8FD",
    overflow: "hidden",
    shadowColor: "#3B0764",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  hero3DImage: {
    width: "100%",
    height: "100%",
  },
  heroTitlePending: {
    fontSize: 22,
    fontWeight: "900",
    color: "#2E0854", // App brand deep purple
    textAlign: "center",
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  statusPillPending: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#FAF5FF",
    borderWidth: 1.5,
    borderColor: "#E9D8FD",
    gap: 7,
  },
  statusLiveDotPurple: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#7C3AED",
  },
  statusPillTextPending: {
    fontSize: 12,
    fontWeight: "800",
    color: "#581C87",
  },

  /* Stepper Card */
  stepperCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E9D8FD",
    shadowColor: "#2E0854",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  stepperCardTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#7C3AED",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 14,
    textAlign: "center",
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  stepItem: {
    alignItems: "center",
    width: 78,
  },
  stepCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  stepCircleDone: {
    backgroundColor: "#ECFDF5",
    borderWidth: 2,
    borderColor: "#10B981",
  },
  stepDoneCheck: {
    fontSize: 16,
    fontWeight: "900",
    color: "#059669",
  },
  stepCirclePending: {
    backgroundColor: "#FAF5FF",
    borderWidth: 2,
    borderColor: "#7C3AED",
  },
  stepPendingIcon: {
    fontSize: 15,
  },
  stepCircleInactive: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  stepInactiveIcon: {
    fontSize: 15,
  },
  stepLine: {
    flex: 1,
    height: 2.5,
    marginBottom: 20,
  },
  stepLineActive: {
    backgroundColor: "#10B981",
  },
  stepLineInactive: {
    backgroundColor: "#E2E8F0",
  },
  stepLabelDone: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#059669",
    textAlign: "center",
  },
  stepLabelPending: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#581C87",
    textAlign: "center",
  },
  stepLabelInactive: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "#94A3B8",
    textAlign: "center",
  },

  /* Notice Card (Pending) - Lavender Theme */
  noticeCardPending: {
    width: "100%",
    backgroundColor: "#FAF5FF",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#E9D8FD",
    padding: 16,
    marginBottom: 16,
  },
  noticeHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 8,
  },
  noticeIcon: {
    fontSize: 16,
  },
  noticeTitle: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#3B0764",
  },
  noticeBody: {
    fontSize: 12.5,
    color: "#334155",
    lineHeight: 18,
    marginBottom: 12,
  },
  autoUpdatePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F3E8FF",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  autoUpdateFlash: {
    fontSize: 12,
    color: "#7C3AED",
  },
  autoUpdateText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#581C87",
  },

  /* Order Summary Card */
  orderSummaryCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#E9D8FD",
    padding: 16,
    marginBottom: 20,
    shadowColor: "#2E0854",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
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
  orderGrandTotalAmountPending: {
    fontSize: 26,
    fontWeight: "900",
    color: "#3B0764", // App brand deep purple
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

  /* Registered Shopper Detail Card */
  customerDetailCard: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E9D8FD",
    backgroundColor: "#FAF5FF",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E9D8FD",
  },
  customerDetailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  customerDetailLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#7C3AED",
    letterSpacing: 0.8,
  },
  verifiedShopperBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  verifiedShopperText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#059669",
  },
  customerDetailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  customerAvatarSmall: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  customerNameBold: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1E1B4B",
    letterSpacing: -0.2,
  },
  customerPhoneBold: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#475569",
    marginTop: 2,
  },
  customerAddressText: {
    fontSize: 11.5,
    fontWeight: "500",
    color: "#64748B",
    marginTop: 3,
    lineHeight: 16,
  },

  /* Action Buttons (Pending) */
  actionButtonsContainer: {
    width: "100%",
    gap: 12,
  },
  refreshStatusBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingVertical: 14,
    backgroundColor: "#FAF5FF",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#3B0764",
    shadowColor: "#3B0764",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  refreshIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  refreshBtnText: {
    fontSize: 14.5,
    fontWeight: "800",
    color: "#3B0764",
  },
  viewOrdersSecondaryBtn: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingVertical: 14,
    backgroundColor: "#3B0764",
    borderRadius: 14,
    shadowColor: "#3B0764",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  viewOrdersSecondaryBtnText: {
    fontSize: 14.5,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  /* ========================================================================= */
  /* PAYMENT SUCCESSFUL (APPROVED) STYLES - PROPER & COMPLETE DESIGN          */
  /* ========================================================================= */
  heroSuccessCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingTop: 22,
    paddingBottom: 20,
    paddingHorizontal: 18,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#2E0854",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E9D8FD",
  },
  heroImageContainerApproved: {
    width: 185,
    height: 185,
    borderRadius: 24,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#86EFAC",
    overflow: "hidden",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  heroTitleApproved: {
    fontSize: 24,
    fontWeight: "900",
    color: "#2E0854",
    textAlign: "center",
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  statusPillApproved: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#DCFCE7",
    borderWidth: 1,
    borderColor: "#86EFAC",
    gap: 6,
  },
  statusLiveDotGreen: {
    fontSize: 12,
    fontWeight: "900",
    color: "#059669",
  },
  statusPillTextApproved: {
    fontSize: 12,
    fontWeight: "800",
    color: "#047857",
  },

  /* Paid Amount Card */
  paidAmountCard: {
    width: "100%",
    backgroundColor: "#FAF5FF",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#E9D8FD",
    paddingVertical: 18,
    paddingHorizontal: 18,
    alignItems: "center",
    marginBottom: 16,
  },
  paidAmountLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#7C3AED",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  paidAmountValue: {
    fontSize: 34,
    fontWeight: "900",
    color: "#15803D",
    letterSpacing: -0.5,
  },
  savingsTagSuccess: {
    backgroundColor: "#DCFCE7",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  savingsTagText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#15803D",
  },
  paidByText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    marginTop: 6,
  },

  /* Smart Turnstile Pass Card */
  smartPassCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#86EFAC",
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  passHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F0FDF4",
    borderBottomWidth: 1,
    borderBottomColor: "#DCFCE7",
  },
  passBrandGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  passBrandIcon: {
    fontSize: 20,
  },
  passStoreName: {
    fontSize: 12,
    fontWeight: "900",
    color: "#14532D",
    letterSpacing: 0.5,
  },
  passSubtitle: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#16A34A",
    letterSpacing: 0.6,
  },
  gateUnlockedBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  gateUnlockedText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#15803D",
  },
  passBody: {
    padding: 16,
  },
  passInstructions: {
    fontSize: 12.5,
    color: "#334155",
    lineHeight: 18,
    marginBottom: 12,
  },
  passBadgesRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  passTag: {
    backgroundColor: "#DCFCE7",
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 6,
  },
  passTagText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#15803D",
  },
  passCustomerCard: {
    backgroundColor: "#FAF5FF",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E9D8FD",
    marginBottom: 10,
  },
  passCustomerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  passCustomerLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#7C3AED",
    letterSpacing: 0.8,
  },
  passOrderMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 8,
    marginTop: 4,
  },
  passMetaText: {
    fontSize: 11.5,
    color: "#475569",
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  /* Thank You Card */
  thankYouCard: {
    width: "100%",
    backgroundColor: "#FAF5FF",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#E9D8FD",
    padding: 18,
    alignItems: "center",
    marginBottom: 20,
  },
  thankYouIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  thankYouTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#2E0854",
    marginBottom: 4,
    textAlign: "center",
  },
  thankYouSubText: {
    fontSize: 12.5,
    color: "#475569",
    textAlign: "center",
    marginBottom: 4,
  },
  thankYouPolicyText: {
    fontSize: 11,
    color: "#7C3AED",
    fontWeight: "600",
    textAlign: "center",
  },

  /* Success Action Buttons */
  successActionsContainer: {
    width: "100%",
    gap: 12,
    marginBottom: 10,
  },
  viewTaxInvoicePrimaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingVertical: 15,
    backgroundColor: "#3B0764",
    borderRadius: 16,
    shadowColor: "#3B0764",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    gap: 8,
  },
  receiptActionIcon: {
    fontSize: 18,
  },
  viewTaxInvoiceBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  continueShoppingBtn: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingVertical: 14,
    backgroundColor: "#FAF5FF",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#3B0764",
  },
  continueShoppingBtnText: {
    fontSize: 14.5,
    fontWeight: "800",
    color: "#3B0764",
  },
  viewMyOrdersBtn: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
  },
  viewMyOrdersBtnText: {
    fontSize: 14.5,
    fontWeight: "700",
    color: "#475569",
  },
});
