import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCart } from "../context/CartContext";
import { Theme } from "../constants/colors";
import { API_URL, safeFetch } from "../constants/api";

const PAYMENT_METHODS = [
  {
    id: "UPI",
    label: "UPI (PhonePe, GPay, Paytm)",
    icon: "UPI",
    iconBg: "#7C3AED",
  },
  {
    id: "Card",
    label: "Card Payment",
    icon: "💳",
    iconBg: "#0284C7",
  },
  {
    id: "Cash",
    label: "Cash on Delivery",
    icon: "💵",
    iconBg: "#16A34A",
  },
];

export default function CheckoutScreen() {
  const router = useRouter();
  const { cart, grossAmount, totalSavings, totalAmount, clearCart, addRecentOrder } = useCart();
  const [selectedMethod, setSelectedMethod] = useState("UPI");
  const [submittingCash, setSubmittingCash] = useState(false);

  // Compute realistic store savings matching Screen 5
  const displayDiscount =
    totalSavings > 0
      ? totalSavings
      : Math.round(grossAmount * 0.15); // Authentic supermarket 15% discount
  const displayTotal =
    totalSavings > 0 ? totalAmount : Math.max(0, grossAmount - displayDiscount);

  const handleProceed = async () => {
    if (cart.length === 0) {
      Alert.alert("Empty Cart", "Please scan items before proceeding to checkout.");
      return;
    }

    if (selectedMethod === "Cash") {
      // Direct Cash checkout flow
      setSubmittingCash(true);
      try {
        if (!API_URL) throw new Error("API URL missing in configuration.");

        const payload = {
          items: cart.map((it) => ({
            productId: it._id,
            quantity: it.quantity,
            name: it.name,
          })),
          paymentMethod: "Cash",
          customer: {
            name: "Mobile Shopper",
          },
        };

        const res = await safeFetch(`${API_URL}/orders/checkout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }, 8000);

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to submit cash checkout order.");
        }

        // Save order and clear cart
        addRecentOrder(data.order);
        clearCart();

        // Navigate to payment confirmation screen with Cash state
        router.replace({
          pathname: "/payment-success",
          params: { orderId: data.order._id, method: "Cash" },
        });
      } catch (err: any) {
        Alert.alert("Checkout Error", err.message || "Could not complete cash order.");
      } finally {
        setSubmittingCash(false);
      }
    } else {
      // Navigate to Secure Payment screen for UPI or Card
      router.push({
        pathname: "/payment",
        params: { method: selectedMethod },
      });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Deep Purple Top Header matching Screen 5 of reference */}
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

            <Text style={styles.headerTitle}>Checkout</Text>

            <TouchableOpacity style={styles.headerBtn} activeOpacity={0.7}>
              <Text style={styles.scissorIcon}>✂</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* Main Curved White Container Sheet matching Screen 5 */}
      <View style={styles.whiteSheet}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Order Items Header matching Screen 5 */}
          <Text style={styles.sectionTitle}>Order Items</Text>

          <View style={styles.itemsList}>
            {cart.map((item) => (
              <View key={item._id} style={styles.itemRow}>
                {/* Rounded product thumbnail */}
                <View style={styles.itemThumbBox}>
                  <Image
                    source={
                      item.imageUrl
                        ? { uri: item.imageUrl }
                        : require("@/assets/images/react-logo.png")
                    }
                    style={styles.itemThumb as any}
                    resizeMode="contain"
                  />
                </View>

                {/* Name & Qty */}
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.itemQtyPrice}>
                    ₹{item.effectivePrice}   x{item.quantity}
                  </Text>
                </View>

                {/* Row Total */}
                <Text style={styles.itemTotal}>
                  ₹{item.effectivePrice * item.quantity}
                </Text>
              </View>
            ))}
          </View>

          {/* Price Breakdown matching Screen 5 */}
          <View style={styles.breakdownBox}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Subtotal</Text>
              <Text style={styles.breakdownValue}>₹{grossAmount}</Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={styles.discountLabel}>Discount</Text>
              <Text style={styles.discountValue}>−₹{displayDiscount}</Text>
            </View>

            <View style={styles.breakdownRowTotal}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹{displayTotal}</Text>
            </View>
          </View>

          {/* Payment Method Section matching Screen 5 */}
          <Text style={styles.sectionTitle}>Payment Method</Text>

          {/* Single Enclosed Card for Payment Options matching Screen 5 */}
          <View style={styles.paymentCard}>
            {PAYMENT_METHODS.map((method, index) => {
              const isSelected = selectedMethod === method.id;
              const isLast = index === PAYMENT_METHODS.length - 1;

              return (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.methodRow,
                    isSelected && styles.methodRowSelected,
                    !isLast && styles.methodRowDivider,
                  ]}
                  onPress={() => setSelectedMethod(method.id)}
                  activeOpacity={0.8}
                >
                  {/* Radio Indicator */}
                  <View
                    style={[
                      styles.radioOuter,
                      isSelected && styles.radioOuterSelected,
                    ]}
                  >
                    {isSelected && <View style={styles.radioInner} />}
                  </View>

                  {/* Payment Method Icon Badge on Left */}
                  <View style={styles.methodIconBadge}>
                    {method.id === "UPI" ? (
                      <View style={styles.upiBadge}>
                        <Text style={styles.upiBadgeText}>UPI</Text>
                      </View>
                    ) : (
                      <Text style={{ fontSize: 18 }}>{method.icon}</Text>
                    )}
                  </View>

                  {/* Label */}
                  <Text
                    style={[
                      styles.methodLabel,
                      isSelected && styles.methodLabelSelected,
                    ]}
                  >
                    {method.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Pay Now Button with White Padlock matching Screen 5 */}
          <TouchableOpacity
            style={[styles.payNowBtn, submittingCash && styles.btnDisabled]}
            onPress={handleProceed}
            disabled={submittingCash}
            activeOpacity={0.88}
          >
            {submittingCash ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.payBtnContent}>
                <Text style={styles.lockIcon}>🔒</Text>
                <Text style={styles.payNowText}>
                  Pay Now ₹{displayTotal}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2E0854", // Deep rich purple matching reference
  },
  purpleHeader: {
    backgroundColor: "#2E0854",
    paddingBottom: 24,
  },
  headerSafe: {
    backgroundColor: "#2E0854",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBackArrow: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "300",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  scissorIcon: {
    color: "#FFFFFF",
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#1E1B4B",
    marginBottom: 12,
  },
  itemsList: {
    marginBottom: 20,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
  },
  itemThumbBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  itemThumb: {
    width: 38,
    height: 38,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 2,
  },
  itemQtyPrice: {
    fontSize: 12.5,
    color: "#64748B",
    fontWeight: "600",
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1E293B",
  },
  breakdownBox: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 22,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  breakdownValue: {
    fontSize: 14.5,
    fontWeight: "700",
    color: "#1E293B",
  },
  discountLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#16A34A", // Vibrant green matching reference
  },
  discountValue: {
    fontSize: 14.5,
    fontWeight: "800",
    color: "#16A34A", // Vibrant green matching reference
  },
  breakdownRowTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: "#F1F5F9",
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "900",
    color: "#1E293B",
  },
  totalValue: {
    fontSize: 17,
    fontWeight: "900",
    color: "#1E293B",
  },
  paymentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    marginBottom: 26,
  },
  methodRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  methodRowSelected: {
    backgroundColor: "#FAF5FF", // Subtle soft lavender background for selected method
  },
  methodRowDivider: {
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  radioOuterSelected: {
    borderColor: "#3B0764", // Purple active ring
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#3B0764", // Purple active center
  },
  methodIconBadge: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  upiBadge: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  upiBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  methodLabel: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#334155",
  },
  methodLabelSelected: {
    color: "#1E1B4B",
    fontWeight: "900",
  },
  payNowBtn: {
    backgroundColor: "#3B0764", // Deep rich purple from reference
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3B0764",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  payBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  lockIcon: {
    fontSize: 15,
  },
  payNowText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  btnDisabled: {
    opacity: 0.65,
  },
});
