import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCart, OrderRecord } from "../context/CartContext";
import { Theme } from "../constants/colors";
import { API_URL, safeFetch } from "../constants/api";

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const { orderId, method } = useLocalSearchParams<{
    orderId?: string;
    method?: string;
  }>();
  const { recentOrders } = useCart();

  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId && recentOrders.length > 0) {
      const match = recentOrders.find((o) => o._id === orderId);
      if (match) {
        setOrder(match);
        setLoading(false);
        return;
      }
    }

    if (!orderId && recentOrders.length > 0) {
      setOrder(recentOrders[0]);
      setLoading(false);
      return;
    }

    if (orderId && API_URL) {
      safeFetch(`${API_URL}/orders/${orderId}`, {}, 5000)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.order) {
            setOrder(data.order);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [orderId, recentOrders]);

  const isCashAtExit =
    method === "Cash" ||
    order?.paymentMethod === "Cash" ||
    order?.paymentStatus === "Pending";

  const handleDownloadShare = async () => {
    try {
      await Share.share({
        message: `Smart Supermarket Digital Receipt\nOrder: ${
          order?.orderNumber || "#SSM20250430"
        }\nTotal Amount: ₹${order?.totalAmount || 280}\nPayment: ${
          isCashAtExit ? "Pending - Cash at Exit" : `Paid via ${order?.paymentMethod || "UPI"}`
        }\nExit Gate Code: ${order?.exitBarcode || "EXIT-9281-4401"}`,
      });
    } catch (_) {}
  };

  const orderNum = order?.orderNumber || "#SSM20250430";
  const amount = order?.totalAmount || 280;
  const payMethod = order?.paymentMethod || (isCashAtExit ? "Cash" : "UPI");

  return (
    <View style={styles.safeArea}>
      <StatusBar style="light" />

      {/* Top purple ambient header curve matching Screen 7 */}
      <View style={styles.topPurpleBackdrop} />

      {/* Confetti particles background for successful payments */}
      {!isCashAtExit && (
        <View style={styles.confettiTop}>
          <Text style={[styles.confettiParticle, { top: 22, left: 24, color: "#FBBF24" }]}>✦</Text>
          <Text style={[styles.confettiParticle, { top: 40, left: 70, color: "#34D399" }]}>■</Text>
          <Text style={[styles.confettiParticle, { top: 26, left: 140, color: "#F472B6" }]}>▲</Text>
          <Text style={[styles.confettiParticle, { top: 50, right: 130, color: "#FBBF24" }]}>●</Text>
          <Text style={[styles.confettiParticle, { top: 20, right: 70, color: "#60A5FA" }]}>✦</Text>
          <Text style={[styles.confettiParticle, { top: 44, right: 28, color: "#FB7185" }]}>■</Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {isCashAtExit ? (
          /* Cash at Exit Confirmation View */
          <View style={styles.centerAlignBox}>
            <View style={styles.cashIconCircle}>
              <Text style={{ fontSize: 36 }}>💵</Text>
            </View>

            <Text style={styles.headingTitle}>Order Registered</Text>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>
                Payment Pending – Cash at Exit
              </Text>
            </View>

            {/* Instruction Card */}
            <View style={styles.cashInstructionCard}>
              <Text style={styles.cashInstructionHeader}>Turnstile Exit Procedure:</Text>
              <Text style={styles.cashInstructionBody}>
                1. Please take your selected items to Exit Turnstile 1–4.{"\n"}
                2. Show your Exit Barcode below to the cashier.{"\n"}
                3. Pay cash amount: ₹{amount}. Once cashier confirms, your exit gate will open automatically!
              </Text>

              <View style={styles.exitBarcodeBox}>
                <Text style={styles.exitBarcodeLabel}>EXIT GATE PASS BARCODE</Text>
                <Text style={styles.exitBarcodeCode}>
                  {order?.exitBarcode || "EXIT-" + Date.now().toString().slice(-8)}
                </Text>
              </View>
            </View>

            {/* Order Card */}
            <View style={styles.orderCard}>
              <Text style={styles.orderNumberLabel}>Order {orderNum}</Text>
              <Text style={styles.orderAmountText}>₹{amount}</Text>
              <Text style={[styles.paymentMethodText, { color: "#D97706" }]}>
                Status: Payment Pending (Cash)
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.downloadReceiptBtn}
                onPress={handleDownloadShare}
                activeOpacity={0.8}
              >
                <Text style={styles.downloadIcon}>📋</Text>
                <Text style={styles.downloadReceiptText}>Share Order Slip</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.continueShoppingBtn}
                onPress={() => router.replace("/orders")}
                activeOpacity={0.88}
              >
                <Text style={styles.continueShoppingText}>
                  View in My Orders ➔
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Payment Successful View matching Screen 7 */
          <View style={styles.centerAlignBox}>
            {/* Large Green Checkmark Circle */}
            <View style={styles.checkmarkOuterCircle}>
              <View style={styles.checkmarkCircle}>
                <Text style={styles.checkmarkIcon}>✔</Text>
              </View>
            </View>

            {/* Headings */}
            <Text style={styles.headingTitle}>Payment Successful!</Text>
            <Text style={styles.headingSubtitle}>
              Your order has been placed successfully
            </Text>

            {/* Order Details Card */}
            <View style={styles.orderCard}>
              <Text style={styles.orderNumberLabel}>Order {orderNum}</Text>
              <Text style={styles.orderAmountText}>₹{amount}</Text>
              <Text style={styles.paymentMethodText}>Paid via {payMethod}</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.downloadReceiptBtn}
                onPress={handleDownloadShare}
                activeOpacity={0.8}
              >
                <Text style={styles.downloadIcon}>📥</Text>
                <Text style={styles.downloadReceiptText}>Download Receipt</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.continueShoppingBtn}
                onPress={() => router.replace("/orders")}
                activeOpacity={0.88}
              >
                <Text style={styles.continueShoppingText}>
                  Continue Shopping ➔
                </Text>
              </TouchableOpacity>
            </View>

            {/* Cute Smiling Yellow Grocery Bag Mascot matching Screen 7 */}
            <View style={styles.mascotContainer}>
              <View style={styles.mascotBag}>
                {/* Mascot Bag Handles */}
                <View style={styles.mascotHandle} />
                {/* Cute Face: Eyes & Happy Smile */}
                <View style={styles.mascotFace}>
                  <View style={styles.mascotEyesRow}>
                    <View style={styles.mascotEye} />
                    <View style={styles.mascotEye} />
                  </View>
                  <View style={styles.mascotSmile} />
                </View>
              </View>
              {/* Leaves/Grass underneath */}
              <View style={styles.grassCluster}>
                <Text style={{ fontSize: 24 }}>🌿</Text>
                <Text style={{ fontSize: 26, marginHorizontal: -4 }}>🌱</Text>
                <Text style={{ fontSize: 22 }}>🍃</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.white,
    position: "relative",
  },
  topPurpleBackdrop: {
    position: "absolute",
    top: 0,
    left: -30,
    right: -30,
    height: 180,
    backgroundColor: "#3B0764",
    borderBottomLeftRadius: 220,
    borderBottomRightRadius: 220,
  },
  confettiTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 140,
    zIndex: 2,
  },
  confettiParticle: {
    position: "absolute",
    fontSize: 18,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 54,
    paddingBottom: 40,
    alignItems: "center",
  },
  centerAlignBox: {
    width: "100%",
    alignItems: "center",
  },
  cashIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
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
  cashInstructionCard: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
  },
  cashInstructionHeader: {
    fontSize: 13,
    fontWeight: "800",
    color: Theme.dark,
    marginBottom: 6,
  },
  cashInstructionBody: {
    fontSize: 12,
    color: Theme.gray,
    lineHeight: 18,
  },
  exitBarcodeBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#FAF5FF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E9D5FF",
    alignItems: "center",
  },
  exitBarcodeLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: Theme.primary,
    letterSpacing: 1,
  },
  exitBarcodeCode: {
    fontSize: 16,
    fontWeight: "900",
    color: Theme.dark,
    marginTop: 4,
    letterSpacing: 2,
  },
  checkmarkOuterCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  checkmarkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  checkmarkIcon: {
    color: Theme.white,
    fontSize: 34,
    fontWeight: "900",
  },
  headingTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#16A34A", // Green heading matching Screen 7
    marginBottom: 4,
    textAlign: "center",
  },
  headingSubtitle: {
    fontSize: 13,
    color: Theme.gray,
    marginBottom: 20,
    textAlign: "center",
  },
  orderCard: {
    width: "100%",
    backgroundColor: "#FAF5FF",
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E9D5FF",
    marginBottom: 24,
  },
  orderNumberLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Theme.gray,
    marginBottom: 4,
  },
  orderAmountText: {
    fontSize: 32,
    fontWeight: "900",
    color: "#166534",
    marginBottom: 4,
  },
  paymentMethodText: {
    fontSize: 12,
    fontWeight: "600",
    color: Theme.gray,
  },
  buttonGroup: {
    width: "100%",
    gap: 12,
  },
  downloadReceiptBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: Theme.white,
    gap: 8,
  },
  downloadIcon: {
    fontSize: 16,
  },
  downloadReceiptText: {
    color: Theme.dark,
    fontSize: 14,
    fontWeight: "700",
  },
  continueShoppingBtn: {
    width: "100%",
    backgroundColor: Theme.primary,
    paddingVertical: 15,
    borderRadius: 24,
    alignItems: "center",
    shadowColor: Theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  continueShoppingText: {
    color: Theme.white,
    fontSize: 14,
    fontWeight: "800",
  },
  mascotContainer: {
    alignItems: "center",
    marginTop: 28,
  },
  mascotBag: {
    width: 86,
    height: 74,
    backgroundColor: "#FBBF24",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  mascotHandle: {
    position: "absolute",
    top: -14,
    width: 36,
    height: 22,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 4,
    borderColor: "#D97706",
    backgroundColor: "transparent",
  },
  mascotFace: {
    alignItems: "center",
    marginTop: 4,
  },
  mascotEyesRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 6,
  },
  mascotEye: {
    width: 6,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1F2937",
  },
  mascotSmile: {
    width: 18,
    height: 9,
    borderBottomLeftRadius: 9,
    borderBottomRightRadius: 9,
    backgroundColor: "#1F2937",
  },
  grassCluster: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: -8,
  },
});
