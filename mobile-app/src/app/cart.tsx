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

  // Exact real-time price & savings from database (NEVER fake 15% discount)
  const displayDiscount = totalSavings;
  const displayTotal = totalAmount;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Deep Purple Header matching Screen 4 of reference image */}
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
      </View>

      {/* Main Curved White Container Sheet matching Screen 4 */}
      <View style={styles.whiteSheet}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {cart.length === 0 ? (
            <View style={styles.emptyCartBox}>
              <Text style={{ fontSize: 52, marginBottom: 14 }}>🛍️</Text>
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
                    {/* Rounded Product Thumbnail Card */}
                    <View style={styles.thumbWrapper}>
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

                    {/* Middle Details: Name, Unit Price, Stepper */}
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginVertical: 2 }}>
                        <Text style={styles.itemUnitPrice}>
                          ₹{Number(item.effectivePrice || 0).toFixed(2)}
                        </Text>
                        {Number(item.price || 0) > Number(item.effectivePrice || 0) && (
                          <Text style={{ fontSize: 12, color: "#94A3B8", textDecorationLine: "line-through", fontWeight: "600" }}>
                            ₹{Number(item.price || 0).toFixed(2)}
                          </Text>
                        )}
                      </View>

                      {/* Stepper Capsule matching Screen 4 */}
                      <View style={styles.stepperContainer}>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => updateQuantity(item._id, -1)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.stepperBtnText}>−</Text>
                        </TouchableOpacity>

                        <Text style={styles.stepperQty}>{item.quantity}</Text>

                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => updateQuantity(item._id, 1)}
                          disabled={item.quantity >= item.stock}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.stepperBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Row Total on Far Right matching Screen 4 */}
                    <View style={styles.itemRight}>
                      <Text style={styles.itemRowTotal}>
                        ₹{Number(item.effectivePrice * item.quantity || 0).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Bill Summary Card matching Screen 4 */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>₹{Number(grossAmount || 0).toFixed(2)}</Text>
                </View>

                {displayDiscount > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.discountLabel}>Discount</Text>
                    <Text style={styles.discountValue}>−₹{Number(displayDiscount || 0).toFixed(2)}</Text>
                  </View>
                )}

                <View style={styles.summaryRowTotal}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>₹{Number(displayTotal || 0).toFixed(2)}</Text>
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
      </View>

      {/* 5-Tab Customer Bottom Navigation matching Screen 4 */}
      <CustomerBottomNav activeTab="cart" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2E0854", // Deep rich purple top matching reference
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
  trashIcon: {
    fontSize: 20,
    color: "#FFFFFF",
  },
  whiteSheet: {
    flex: 1,
    backgroundColor: "#F8FAFC", // Soft neutral background for cards
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -16,
    overflow: "hidden",
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 30,
  },
  emptyCartBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyCartTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1E1B4B",
    marginBottom: 8,
  },
  emptyCartSub: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 24,
    maxWidth: 260,
    lineHeight: 19,
  },
  scanBtn: {
    backgroundColor: "#3B0764",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
  },
  scanBtnText: {
    color: "#FFFFFF",
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
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  thumbWrapper: {
    width: 60,
    height: 60,
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  itemThumb: {
    width: 50,
    height: 50,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: "center",
  },
  itemName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 4,
  },
  itemUnitPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    width: 100,
  },
  stepperBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#64748B",
  },
  stepperQty: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1E293B",
  },
  itemRight: {
    alignItems: "flex-end",
    paddingRight: 6,
  },
  itemRowTotal: {
    fontSize: 15,
    fontWeight: "900",
    color: "#1E293B",
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1E293B",
  },
  discountLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#16A34A", // Vibrant green matching reference
  },
  discountValue: {
    fontSize: 15,
    fontWeight: "800",
    color: "#16A34A", // Vibrant green matching reference
  },
  summaryRowTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: "#F1F5F9",
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1E293B",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1E293B",
  },
  checkoutBtn: {
    backgroundColor: "#3B0764", // Deep rich purple from reference
    paddingVertical: 16,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3B0764",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  checkoutBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});
