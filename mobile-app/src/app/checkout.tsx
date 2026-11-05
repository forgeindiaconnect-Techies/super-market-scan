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
    icon: "📱",
    subtext: "Scan dynamic UPI QR code",
  },
  {
    id: "Card",
    label: "Card / Net Banking",
    icon: "💳",
    subtext: "Debit / Credit Card & Net Banking",
  },
  {
    id: "Cash",
    label: "Cash at Exit",
    icon: "💵",
    subtext: "Pay cash at exit gate turnstile counter",
  },
];

export default function CheckoutScreen() {
  const router = useRouter();
  const { cart, grossAmount, totalSavings, totalAmount, clearCart, addRecentOrder } = useCart();
  const [selectedMethod, setSelectedMethod] = useState("UPI");
  const [submittingCash, setSubmittingCash] = useState(false);

  const handleProceed = async () => {
    if (cart.length === 0) {
      Alert.alert("Empty Cart", "Please scan items before proceeding to checkout.");
      return;
    }

    if (selectedMethod === "Cash") {
      // Direct Cash at Exit flow
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

      {/* Purple Top Header matching Screen 5 */}
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
              <Text style={{ fontSize: 18, color: Theme.white }}>✂</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Order Items Header matching Screen 5 */}
        <Text style={styles.sectionTitle}>Order Items</Text>

        <View style={styles.itemsList}>
          {cart.map((item) => (
            <View key={item._id} style={styles.itemRow}>
              <Image
                source={
                  item.imageUrl
                    ? { uri: item.imageUrl }
                    : require("@/assets/images/react-logo.png")
                }
                style={styles.itemThumb as any}
                resizeMode="contain"
              />

              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.itemQtyPrice}>
                  ₹{item.effectivePrice}   x{item.quantity}
                </Text>
              </View>

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

          {totalSavings > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={styles.discountLabel}>Discount</Text>
              <Text style={styles.discountValue}>−₹{totalSavings}</Text>
            </View>
          )}

          <View style={styles.breakdownRowTotal}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{totalAmount}</Text>
          </View>
        </View>

        {/* Payment Method Section matching Screen 5 */}
        <Text style={styles.sectionTitle}>Payment Method</Text>

        <View style={styles.methodsList}>
          {PAYMENT_METHODS.map((method) => {
            const isSelected = selectedMethod === method.id;
            return (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.methodOption,
                  isSelected && styles.methodOptionSelected,
                ]}
                onPress={() => setSelectedMethod(method.id)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.radioOuter,
                    isSelected && styles.radioOuterSelected,
                  ]}
                >
                  {isSelected && <View style={styles.radioInner} />}
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.methodLabel,
                      isSelected && styles.methodLabelSelected,
                    ]}
                  >
                    {method.label}
                  </Text>
                  <Text style={styles.methodSubtext}>{method.subtext}</Text>
                </View>

                <Text style={{ fontSize: 18 }}>{method.icon}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Pay Now Button matching Screen 5 */}
        <TouchableOpacity
          style={[styles.payNowBtn, submittingCash && styles.btnDisabled]}
          onPress={handleProceed}
          disabled={submittingCash}
          activeOpacity={0.88}
        >
          {submittingCash ? (
            <ActivityIndicator color={Theme.white} />
          ) : (
            <Text style={styles.payNowText}>
              {selectedMethod === "Cash"
                ? `Confirm Order (Pay ₹${totalAmount} at Exit)`
                : `Pay ₹${totalAmount}`}
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
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 36,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Theme.dark,
    marginBottom: 12,
  },
  itemsList: {
    gap: 12,
    marginBottom: 20,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
    gap: 12,
  },
  itemThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: "800",
    color: Theme.dark,
  },
  itemQtyPrice: {
    fontSize: 12,
    color: Theme.gray,
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: "800",
    color: Theme.dark,
  },
  breakdownBox: {
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 22,
    gap: 8,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breakdownLabel: {
    fontSize: 13,
    color: Theme.gray,
    fontWeight: "600",
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: "700",
    color: Theme.dark,
  },
  discountLabel: {
    fontSize: 13,
    color: Theme.success,
    fontWeight: "700",
  },
  discountValue: {
    fontSize: 13,
    fontWeight: "800",
    color: Theme.success,
  },
  breakdownRowTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 6,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "900",
    color: Theme.dark,
  },
  totalValue: {
    fontSize: 17,
    fontWeight: "900",
    color: Theme.dark,
  },
  methodsList: {
    gap: 10,
    marginBottom: 28,
  },
  methodOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: Theme.white,
    gap: 12,
  },
  methodOptionSelected: {
    borderColor: Theme.primary,
    backgroundColor: "#FAF5FF",
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: Theme.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Theme.primary,
  },
  methodLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Theme.dark,
  },
  methodLabelSelected: {
    fontWeight: "800",
    color: Theme.primary,
  },
  methodSubtext: {
    fontSize: 11,
    color: Theme.gray,
    marginTop: 2,
  },
  payNowBtn: {
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
  btnDisabled: {
    opacity: 0.7,
  },
  payNowText: {
    color: Theme.white,
    fontSize: 15,
    fontWeight: "800",
  },
});
