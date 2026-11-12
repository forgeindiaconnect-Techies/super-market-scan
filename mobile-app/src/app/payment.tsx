import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCart } from "../context/CartContext";
import { Theme } from "../constants/colors";
import { API_URL, safeFetch } from "../constants/api";

// High-fidelity rendered QR pattern representing the UPI QR Code (Screen 6)
function RenderUpiQrCode({ value }: { value: string }) {
  const size = 15;
  const grid: boolean[][] = [];
  for (let r = 0; r < size; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < size; c++) {
      const isCornerTL = r < 5 && c < 5;
      const isCornerTR = r < 5 && c >= size - 5;
      const isCornerBL = r >= size - 5 && c < 5;

      if (isCornerTL || isCornerTR || isCornerBL) {
        const border =
          r === 0 ||
          r === 4 ||
          c === 0 ||
          c === 4 ||
          r === size - 1 ||
          r === size - 5 ||
          c === size - 1 ||
          c === size - 5;
        const center = (r === 2 && c === 2) || (r === 2 && c === size - 3) || (r === size - 3 && c === 2);
        row.push(border || center);
      } else {
        const hash = (r * 13 + c * 7 + (value.charCodeAt((r + c) % value.length) || 0)) % 10;
        row.push(hash > 4);
      }
    }
    grid.push(row);
  }

  const cellSize = 10;

  return (
    <View style={styles.qrWhiteBox}>
      {grid.map((row, rIdx) => (
        <View key={rIdx} style={{ flexDirection: "row" }}>
          {row.map((cell, cIdx) => (
            <View
              key={cIdx}
              style={{
                width: cellSize,
                height: cellSize,
                backgroundColor: cell ? "#0F172A" : "#FFFFFF",
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

export default function SecurePaymentScreen() {
  const router = useRouter();
  const {
    method = "UPI",
    customerName,
    customerPhone,
    customerAddress,
  } = useLocalSearchParams<{
    method?: string;
    customerName?: string;
    customerPhone?: string;
    customerAddress?: string;
  }>();
  const { cart, totalAmount, clearCart, addRecentOrder, customerInfo } = useCart();

  // Resolved Customer Details (checking route params and CartContext)
  const effectiveName = (customerName || customerInfo?.name || "").trim();
  const effectivePhone = (customerPhone || customerInfo?.phone || "").replace(/\D/g, "");
  const effectiveAddress = (customerAddress || customerInfo?.address || "").trim();

  const [secondsLeft, setSecondsLeft] = useState(300); // 5 minutes countdown
  const [processing, setProcessing] = useState(false);

  // Card form state
  const [cardHolder, setCardHolder] = useState(effectiveName || "");
  const [cardNumber, setCardNumber] = useState("4532 •••• •••• 8821");
  const [expiry, setExpiry] = useState("08/28");
  const [cvv, setCvv] = useState("•••");

  // Constant Rule: Payment page MUST NOT open until Name & 10-digit Phone are provided
  useEffect(() => {
    if (!effectiveName || effectivePhone.length !== 10) {
      Alert.alert(
        "Customer Details Required",
        "Please fill in your Customer Name and a valid 10-digit Mobile Number before opening the payment page.",
        [
          {
            text: "Enter Details",
            onPress: () =>
              router.replace({
                pathname: "/customer-details",
                params: { method },
              }),
          },
        ]
      );
      router.replace({
        pathname: "/customer-details",
        params: { method },
      });
    }
  }, [effectiveName, effectivePhone]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? "0" + m : m}:${s < 10 ? "0" + s : s}`;
  };

  const handleConfirmPayment = async () => {
    if (cart.length === 0) {
      Alert.alert("Empty Cart", "No items to checkout.");
      return;
    }

    if (!effectiveName || effectivePhone.length !== 10) {
      Alert.alert(
        "Customer Details Required",
        "Customer Name and 10-digit Mobile Number must be filled before proceeding."
      );
      router.replace({
        pathname: "/customer-details",
        params: { method },
      });
      return;
    }

    setProcessing(true);

    try {
      if (!API_URL) throw new Error("API URL missing in configuration.");

      const payload = {
        items: cart.map((it) => ({
          productId: it._id,
          quantity: it.quantity,
          name: it.name,
        })),
        paymentMethod: method === "Card" ? "Card" : "UPI",
        customer: {
          name: effectiveName,
          phone: effectivePhone,
          address: effectiveAddress,
        },
      };

      const res = await safeFetch(`${API_URL}/orders/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }, 8000);

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Payment verification failed.");
      }

      // Add to recent orders & clear cart
      addRecentOrder(data.order);
      clearCart();

      // Navigate to Payment Successful screen (Screen 7)
      router.replace({
        pathname: "/payment-success",
        params: { orderId: data.order._id },
      });
    } catch (err: any) {
      Alert.alert("Payment Error", err.message || "Transaction failed.");
    } finally {
      setProcessing(false);
    }
  };

  // Guard: if customer details are incomplete, block opening payment page
  if (!effectiveName || effectivePhone.length !== 10) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center", padding: 24 }]}>
        <ActivityIndicator size="large" color="#3B0764" />
        <Text style={{ marginTop: 14, fontSize: 15, fontWeight: "700", color: "#1E1B4B", textAlign: "center" }}>
          Checking customer details...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Purple Top Header matching Screen 6 */}
      <View style={styles.purpleHeader}>
        <SafeAreaView edges={["top"]} style={styles.headerSafe}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={styles.headerBackArrow}>‹</Text>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>
              {method === "Card" ? "Card Payment" : "Secure Payment"}
            </Text>

            <View style={{ width: 38 }} />
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Verified Customer Summary Banner */}
        <View style={styles.customerPillBox}>
          <View style={styles.customerPillLeft}>
            <View style={styles.customerAvatarCircle}>
              <Text style={{ fontSize: 14 }}>👤</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={styles.customerPillName}>{effectiveName}</Text>
                <View style={styles.verifiedCheckBadge}>
                  <Text style={styles.verifiedCheckText}>✓ Verified</Text>
                </View>
              </View>
              <Text style={styles.customerPillPhone}>📱 +91 {effectivePhone}</Text>
              {effectiveAddress ? (
                <Text style={styles.customerPillAddress} numberOfLines={1}>
                  📍 {effectiveAddress}
                </Text>
              ) : null}
            </View>
          </View>
          <TouchableOpacity
            style={styles.customerPillChangeBtn}
            onPress={() =>
              router.push({
                pathname: "/customer-details",
                params: { method },
              })
            }
            activeOpacity={0.7}
          >
            <Text style={styles.customerPillChangeText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {method === "Card" ? (
          /* Card Payment Layout */
          <View style={styles.cardSection}>
            {/* Virtual Credit/Debit Card Mockup */}
            <View style={styles.creditCardBox}>
              <View style={styles.cardTopRow}>
                <Text style={styles.cardBankTitle}>Smart Supermarket Card</Text>
                <Text style={styles.cardTypeBadge}>VISA</Text>
              </View>

              <View style={styles.cardChip} />

              <Text style={styles.cardDigits}>{cardNumber}</Text>

              <View style={styles.cardBottomRow}>
                <View>
                  <Text style={styles.cardMiniLabel}>CARD HOLDER</Text>
                  <Text style={styles.cardMiniValue}>{cardHolder || "NAME ON CARD"}</Text>
                </View>
                <View>
                  <Text style={styles.cardMiniLabel}>EXPIRES</Text>
                  <Text style={styles.cardMiniValue}>{expiry || "MM/YY"}</Text>
                </View>
              </View>
            </View>

            {/* Input Form */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Cardholder Name</Text>
              <TextInput
                style={styles.textInput}
                value={cardHolder}
                onChangeText={setCardHolder}
                placeholder="Name on card"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Card Number</Text>
              <TextInput
                style={styles.textInput}
                value={cardNumber}
                onChangeText={setCardNumber}
                keyboardType="numeric"
                maxLength={19}
                placeholder="4532 0000 0000 0000"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.formRowTwo}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Expiry</Text>
                <TextInput
                  style={styles.textInput}
                  value={expiry}
                  onChangeText={setExpiry}
                  maxLength={5}
                  placeholder="MM/YY"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>CVV</Text>
                <TextInput
                  style={styles.textInput}
                  value={cvv}
                  onChangeText={setCvv}
                  secureTextEntry
                  maxLength={4}
                  placeholder="•••"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>
          </View>
        ) : (
          /* Purple UPI Payment Card matching Screen 6 */
          <View style={styles.upiCard}>
            <Text style={styles.upiCardTitle}>UPI Payment</Text>
            <Text style={styles.upiCardSub}>Scan & Pay with any UPI app</Text>

            {/* QR Code */}
            <RenderUpiQrCode value={`upi://pay?pa=smartsupermarket@upi&pn=SmartSupermarket&am=${totalAmount}`} />

            <Text style={styles.scanQrText}>Scan QR Code</Text>
          </View>
        )}

        {/* 'or' Divider matching Screen 6 */}
        <View style={styles.orDividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.orText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Pay to Smart Supermarket Box matching Screen 6 */}
        <View style={styles.payToBox}>
          <Text style={styles.payToLabel}>Pay to</Text>
          <Text style={styles.payToName}>Smart Supermarket</Text>
          <Text style={styles.payToAmount}>₹{totalAmount}</Text>
        </View>

        {/* Countdown Timer Pill matching Screen 6 */}
        <View style={styles.timerPill}>
          <Text style={styles.timerText}>
            ⏱ Time Left: {formatTimer(secondsLeft)}
          </Text>
        </View>

        {/* Safe & Secure Badge matching Screen 6 */}
        <View style={styles.securityBadge}>
          <Text style={styles.securityCheckIcon}>✔</Text>
          <Text style={styles.securityBadgeText}>
            256-bit Encrypted • Safe & Secure Payment
          </Text>
        </View>

        {/* Action Button: Confirm Payment */}
        <TouchableOpacity
          style={[styles.confirmBtn, processing && styles.btnDisabled]}
          onPress={handleConfirmPayment}
          disabled={processing}
          activeOpacity={0.88}
        >
          {processing ? (
            <ActivityIndicator color={Theme.white} />
          ) : (
            <Text style={styles.confirmBtnText}>
              {method === "Card"
                ? `Pay ₹${totalAmount} via Card ➔`
                : "Simulate / Confirm Payment ➔"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.white,
  },
  purpleHeader: {
    backgroundColor: Theme.primary,
    paddingBottom: 14,
  },
  headerSafe: {
    backgroundColor: Theme.primary,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBackArrow: {
    color: Theme.white,
    fontSize: 28,
    fontWeight: "300",
  },
  headerTitle: {
    color: Theme.white,
    fontSize: 18,
    fontWeight: "800",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 36,
    alignItems: "center",
  },
  upiCard: {
    width: "100%",
    backgroundColor: Theme.primary,
    borderRadius: 24,
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: "center",
    shadowColor: Theme.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  upiCardTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: Theme.white,
  },
  upiCardSub: {
    fontSize: 12,
    color: "#E2CEFE",
    marginTop: 2,
    marginBottom: 16,
  },
  qrWhiteBox: {
    backgroundColor: Theme.white,
    padding: 12,
    borderRadius: 14,
  },
  scanQrText: {
    color: Theme.white,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 14,
    letterSpacing: 0.5,
  },
  cardSection: {
    width: "100%",
  },
  creditCardBox: {
    backgroundColor: Theme.primary,
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    shadowColor: Theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardBankTitle: {
    color: "#E2CEFE",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  cardTypeBadge: {
    color: Theme.white,
    fontSize: 14,
    fontWeight: "900",
    fontStyle: "italic",
  },
  cardChip: {
    width: 38,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#F6BC45",
    marginVertical: 18,
  },
  cardDigits: {
    color: Theme.white,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 3,
    marginBottom: 18,
  },
  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardMiniLabel: {
    color: "#D8B4FE",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  cardMiniValue: {
    color: Theme.white,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
  },
  formGroup: {
    marginBottom: 14,
  },
  formRowTwo: {
    flexDirection: "row",
    gap: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Theme.dark,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: "600",
    color: Theme.dark,
    backgroundColor: "#F8FAFC",
  },
  orDividerRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: 18,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  orText: {
    fontSize: 13,
    color: Theme.gray,
    fontWeight: "600",
  },
  payToBox: {
    alignItems: "center",
    marginBottom: 16,
  },
  payToLabel: {
    fontSize: 12,
    color: Theme.gray,
    fontWeight: "500",
  },
  payToName: {
    fontSize: 14,
    color: Theme.dark,
    fontWeight: "800",
    marginTop: 2,
    marginBottom: 4,
  },
  payToAmount: {
    fontSize: 28,
    fontWeight: "900",
    color: Theme.dark,
  },
  timerPill: {
    backgroundColor: "#FEF2F2",
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginBottom: 16,
  },
  timerText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "800",
  },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 24,
  },
  securityCheckIcon: {
    color: Theme.success,
    fontSize: 12,
    fontWeight: "900",
  },
  securityBadgeText: {
    color: Theme.success,
    fontSize: 12,
    fontWeight: "700",
  },
  confirmBtn: {
    width: "100%",
    backgroundColor: Theme.primary,
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: "center",
    shadowColor: Theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnText: {
    color: Theme.white,
    fontSize: 15,
    fontWeight: "800",
  },
  btnDisabled: {
    opacity: 0.7,
  },
  customerPillBox: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FAF5FF",
    borderWidth: 1.5,
    borderColor: "#E9D8FD",
    borderRadius: 16,
    padding: 12,
    marginBottom: 18,
  },
  customerPillLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  customerAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E9D8FD",
  },
  customerPillName: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#1E1B4B",
  },
  verifiedCheckBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  verifiedCheckText: {
    color: "#166534",
    fontSize: 9.5,
    fontWeight: "800",
  },
  customerPillPhone: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
    marginTop: 1,
  },
  customerPillAddress: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
    marginTop: 1,
  },
  customerPillChangeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  customerPillChangeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#3B0764",
  },
});
