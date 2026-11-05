import React from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCart } from "../context/CartContext";
import { Theme } from "../constants/colors";
import CustomerBottomNav from "../components/CustomerBottomNav";

export default function MyCartScreen() {
  const router = useRouter();
  const {
    cart,
    updateQuantity,
    clearCart,
    grossAmount,
    totalSavings,
    totalAmount,
    totalCount,
  } = useCart();

  const handleClearCart = () => {
    if (cart.length === 0) return;
    Alert.alert("Clear Cart", "Are you sure you want to remove all items from your cart?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear All", style: "destructive", onPress: clearCart },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Clean White Top Header matching Screen 4 of reference image */}
      <SafeAreaView edges={["top"]} style={styles.headerSafe}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.headerBackArrow}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>My Cart</Text>

          <TouchableOpacity
            style={styles.headerBtn}
            onPress={handleClearCart}
            activeOpacity={0.7}
          >
            <Text style={styles.trashIcon}>🗑</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {cart.length === 0 ? (
          <View style={styles.emptyCartBox}>
            <Text style={{ fontSize: 48, marginBottom: 14 }}>🛍️</Text>
            <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
            <Text style={styles.emptyCartSub}>
              Scan product barcodes in the supermarket to add items to your basket.
            </Text>
            <TouchableOpacity
              style={styles.scanBtn}
              onPress={() => router.push("/scanner")}
              activeOpacity={0.88}
            >
              <Text style={styles.scanBtnText}>Open Barcode Scanner</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Cart Items List matching Screen 4 */}
            <View style={styles.itemsList}>
              {cart.map((item) => (
                <View key={item._id} style={styles.itemCard}>
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
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemUnitPrice}>
                      ₹{item.effectivePrice}
                    </Text>

                    {/* Stepper matching Screen 4 */}
                    <View style={styles.stepperContainer}>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => updateQuantity(item._id, -1)}
                      >
                        <Text style={styles.stepperBtnText}>−</Text>
                      </TouchableOpacity>

                      <Text style={styles.stepperQty}>{item.quantity}</Text>

                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => updateQuantity(item._id, 1)}
                        disabled={item.quantity >= item.stock}
                      >
                        <Text style={styles.stepperBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Row Total on far right matching Screen 4 */}
                  <View style={styles.itemRight}>
                    <Text style={styles.itemRowTotal}>
                      ₹{item.effectivePrice * item.quantity}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Bill Summary matching Screen 4 */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>₹{grossAmount}</Text>
              </View>

              {totalSavings > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.discountLabel}>Discount</Text>
                  <Text style={styles.discountValue}>−₹{totalSavings}</Text>
                </View>
              )}

              <View style={styles.summaryRowTotal}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>₹{totalAmount}</Text>
              </View>
            </View>

            {/* Proceed to Checkout Button matching Screen 4 */}
            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={() => router.push("/checkout")}
              activeOpacity={0.88}
            >
              <Text style={styles.checkoutBtnText}>
                Proceed to Checkout →
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* 5-Tab Customer Bottom Navigation */}
      <CustomerBottomNav activeTab="cart" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.white,
  },
  headerSafe: {
    backgroundColor: Theme.white,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  headerBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBackArrow: {
    color: "#1E293B",
    fontSize: 28,
    fontWeight: "300",
  },
  headerTitle: {
    color: "#1E293B",
    fontSize: 17,
    fontWeight: "800",
  },
  trashIcon: {
    fontSize: 18,
    color: "#64748B",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
  },
  emptyCartBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 70,
  },
  emptyCartTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Theme.dark,
    marginBottom: 6,
  },
  emptyCartSub: {
    fontSize: 13,
    color: Theme.gray,
    textAlign: "center",
    marginBottom: 20,
    maxWidth: 240,
    lineHeight: 18,
  },
  scanBtn: {
    backgroundColor: Theme.primary,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 22,
  },
  scanBtnText: {
    color: Theme.white,
    fontWeight: "800",
    fontSize: 14,
  },
  itemsList: {
    gap: 12,
    marginBottom: 20,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.white,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
    gap: 14,
  },
  itemThumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "800",
    color: Theme.dark,
    lineHeight: 18,
  },
  itemUnitPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: Theme.dark,
    marginTop: 2,
    marginBottom: 6,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignSelf: "flex-start",
    gap: 12,
  },
  stepperBtn: {
    padding: 3,
  },
  stepperBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: Theme.dark,
  },
  stepperQty: {
    fontSize: 13,
    fontWeight: "800",
    color: Theme.dark,
  },
  itemRight: {
    alignItems: "flex-end",
  },
  itemRowTotal: {
    fontSize: 15,
    fontWeight: "900",
    color: Theme.dark,
  },
  summaryCard: {
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 22,
    gap: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 14,
    color: Theme.gray,
    fontWeight: "600",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "700",
    color: Theme.dark,
  },
  discountLabel: {
    fontSize: 14,
    color: Theme.success,
    fontWeight: "700",
  },
  discountValue: {
    fontSize: 14,
    fontWeight: "800",
    color: Theme.success,
  },
  summaryRowTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "900",
    color: Theme.dark,
  },
  totalValue: {
    fontSize: 19,
    fontWeight: "900",
    color: Theme.dark,
  },
  checkoutBtn: {
    backgroundColor: Theme.primary,
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: "center",
    shadowColor: Theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  checkoutBtnText: {
    color: Theme.white,
    fontSize: 15,
    fontWeight: "800",
  },
});
