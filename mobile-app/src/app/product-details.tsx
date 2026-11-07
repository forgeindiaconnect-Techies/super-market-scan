import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCart } from "../context/CartContext";
import { Theme } from "../constants/colors";
import { API_URL, safeFetch } from "../constants/api";

const { width } = Dimensions.get("window");

export default function ProductDetailsScreen() {
  const router = useRouter();
  const { productId, barcode } = useLocalSearchParams<{
    productId?: string;
    barcode?: string;
  }>();

  const { addToCart, totalCount } = useCart();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isWishlist, setIsWishlist] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Refresh product details on mount and every time screen receives focus
  useFocusEffect(
    useCallback(() => {
      fetchProduct();
    }, [productId, barcode])
  );

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError("");

      if (!API_URL) throw new Error("API URL missing in configuration.");

      let endpoint = "";
      if (productId) {
        endpoint = `${API_URL}/products/${productId}?_t=${Date.now()}`;
      } else if (barcode) {
        endpoint = `${API_URL}/products/barcode/${encodeURIComponent(barcode)}?_t=${Date.now()}`;
      } else {
        throw new Error("No product ID or barcode provided.");
      }

      const res = await safeFetch(endpoint, {}, 6000);
      const data = await res.json();

      if (res.ok && data.success && data.product) {
        setProduct(data.product);
      } else {
        setProduct(null);
        setError(data.message || "Product not found in store database.");
      }
    } catch (err: any) {
      setProduct(null);
      setError(err.message || "Failed to load product details.");
    } finally {
      setLoading(false);
    }
  };

  const rawPrice = Number(product?.price || 0);
  const dbDiscount = Number(product?.discount || 0);

  // Use ONLY exact real-time data entered in Admin Dashboard
  const hasDiscount = dbDiscount > 0;
  const finalPrice = hasDiscount ? Math.max(0, rawPrice - dbDiscount) : rawPrice;
  const originalMrp = rawPrice;
  const discountPercent =
    hasDiscount && originalMrp > 0
      ? Math.round((dbDiscount / originalMrp) * 100)
      : 0;

  const inStock = (product?.stock || 0) > 0;

  const handleAddToCart = () => {
    if (!product || !inStock) return;
    const ok = addToCart(product, quantity);
    if (ok) {
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2000);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Deep Purple Curved Header matching Screen 3 */}
      <View style={styles.purpleHeader}>
        <SafeAreaView edges={["top"]} style={styles.headerSafe}>
          <View style={styles.headerRow}>
            {/* Circular Back Button with crisp white arrow */}
            <TouchableOpacity
              style={styles.backCircleBtn}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>

            {/* Shopping Cart Button with Red Notification Badge */}
            <TouchableOpacity
              style={styles.cartIconBtn}
              onPress={() => router.push("/cart")}
              activeOpacity={0.7}
            >
              <Text style={styles.cartIconWhite}>🛒</Text>
              {totalCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{totalCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* Main Curved White Sheet Container matching Screen 3 */}
      <View style={styles.whiteSheet}>
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#3B0764" />
            <Text style={styles.loadingText}>Fetching product details...</Text>
          </View>
        ) : error || !product ? (
          <View style={styles.notFoundContainer}>
            <View style={styles.notFoundCircle}>
              <Text style={{ fontSize: 44 }}>🔍</Text>
            </View>
            <Text style={styles.notFoundTitle}>Product Not Found</Text>
            <Text style={styles.notFoundSubtitle}>
              {error || "The scanned barcode is not registered in our inventory."}
            </Text>

            {barcode && (
              <View style={styles.barcodePill}>
                <Text style={styles.barcodePillLabel}>Scanned Barcode</Text>
                <Text style={styles.barcodePillValue}>{barcode}</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.scanAgainBtn}
              onPress={() => router.replace("/scanner")}
              activeOpacity={0.88}
            >
              <Text style={styles.scanAgainBtnText}>Scan Another Product ➔</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.viewCartSecondaryBtn}
              onPress={() => router.push("/cart")}
              activeOpacity={0.7}
            >
              <Text style={styles.viewCartSecondaryText}>Go to Cart ({totalCount})</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Centered Large Product Image Card matching Screen 3 */}
            <View style={styles.imageCard}>
              <Image
                source={
                  product.imageUrl
                    ? { uri: product.imageUrl }
                    : require("@/assets/images/react-logo.png")
                }
                style={styles.productImage as any}
                resizeMode="contain"
              />
            </View>

            {/* Product Title matching Screen 3 */}
            <Text style={styles.productTitle}>{product.name}</Text>

            {/* Meta Pill Row: Brand | Category matching Screen 3 */}
            <View style={styles.metaPill}>
              <Text style={styles.metaText}>
                Brand: <Text style={styles.metaValue}>{product.brand || "Supermarket"}</Text>
                {"   |   "}
                Category: <Text style={styles.metaValue}>{product.category || "General"}</Text>
              </Text>
            </View>

            {/* Exact Price matching Super Admin (strikethrough & discount shown ONLY if real discount exists) */}
            <View style={styles.priceRow}>
              <Text style={styles.finalPrice}>₹{finalPrice}</Text>
              {hasDiscount && (
                <>
                  <Text style={styles.originalPrice}>₹{originalMrp}</Text>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountBadgeText}>{discountPercent}% OFF</Text>
                  </View>
                </>
              )}
            </View>

            {/* Product Description */}
            <Text style={styles.description}>
              {product.description ||
                "Rich and creamy authentic quality product from our supermarket shelves."}
            </Text>

            {/* Stock Availability Badge matching Screen 3 */}
            <View style={styles.stockRow}>
              <View
                style={[
                  styles.stockIndicatorCircle,
                  inStock ? styles.stockInCircle : styles.stockOutCircle,
                ]}
              >
                <Text style={styles.stockIndicatorText}>{inStock ? "✓" : "✕"}</Text>
              </View>
              <Text
                style={[
                  styles.stockText,
                  !inStock && { color: "#EF4444" },
                ]}
              >
                {inStock
                  ? `In Stock (${product.stock} available)`
                  : "Out of Stock"}
              </Text>
            </View>

            {/* Quantity Stepper matching Screen 3 */}
            {inStock && (
              <View style={styles.stepperContainer}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                  activeOpacity={0.7}
                >
                  <Text style={styles.stepperBtnText}>−</Text>
                </TouchableOpacity>

                <Text style={styles.stepperValue}>{quantity}</Text>

                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() =>
                    setQuantity((q) => Math.min(product.stock, q + 1))
                  }
                  activeOpacity={0.7}
                >
                  <Text style={styles.stepperBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Bottom Action Row: Add to Cart + Wishlist Heart matching Screen 3 */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[
                  styles.addToCartBtn,
                  !inStock && styles.btnDisabled,
                  addedSuccess && styles.addToCartBtnSuccess,
                ]}
                onPress={handleAddToCart}
                disabled={!inStock}
                activeOpacity={0.88}
              >
                <Text style={styles.addToCartIcon}>🛒</Text>
                <Text style={styles.addToCartText}>
                  {!inStock
                    ? "Out of Stock"
                    : addedSuccess
                    ? "Added to Cart ✓"
                    : "Add to Cart"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.wishlistBtn, isWishlist && styles.wishlistBtnActive]}
                onPress={() => setIsWishlist((p) => !p)}
                activeOpacity={0.7}
              >
                <Text style={[styles.wishlistHeart, isWishlist && { color: "#EF4444" }]}>
                  {isWishlist ? "♥" : "♡"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>
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
    paddingBottom: 26,
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
  backCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: -2,
  },
  cartIconBtn: {
    position: "relative",
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  cartIconWhite: {
    fontSize: 22,
    color: "#FFFFFF",
  },
  cartBadge: {
    position: "absolute",
    top: -2,
    right: -4,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
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
  centerLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#3B0764",
    fontWeight: "700",
  },
  imageCard: {
    width: "100%",
    height: 230,
    backgroundColor: "#F8FAFC",
    borderRadius: 22,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  productTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: "#1E1B4B", // Rich dark purple
    lineHeight: 28,
    marginBottom: 8,
  },
  metaPill: {
    alignSelf: "flex-start",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  metaText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  metaValue: {
    color: "#1E293B",
    fontWeight: "800",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
    marginBottom: 12,
  },
  finalPrice: {
    fontSize: 28,
    fontWeight: "900",
    color: "#D90429", // Vivid red from reference
  },
  originalPrice: {
    fontSize: 17,
    fontWeight: "700",
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
  discountBadge: {
    backgroundColor: "#22C55E", // Vivid green badge from reference
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "center",
  },
  discountBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 13.5,
    color: "#64748B",
    lineHeight: 20,
    marginBottom: 16,
  },
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 18,
  },
  stockIndicatorCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  stockInCircle: {
    backgroundColor: "#16A34A",
  },
  stockOutCircle: {
    backgroundColor: "#EF4444",
  },
  stockIndicatorText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    marginTop: -1,
  },
  stockText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#16A34A",
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
    width: 140,
    marginBottom: 22,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
  },
  stepperValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1E293B",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  addToCartBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B0764", // Deep rich purple button from reference
    paddingVertical: 16,
    borderRadius: 24,
    gap: 8,
    shadowColor: "#3B0764",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addToCartBtnSuccess: {
    backgroundColor: "#16A34A",
  },
  btnDisabled: {
    backgroundColor: "#94A3B8",
    opacity: 0.6,
  },
  addToCartIcon: {
    fontSize: 17,
  },
  addToCartText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  wishlistBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  wishlistBtnActive: {
    borderColor: "#FCA5A5",
    backgroundColor: "#FEF2F2",
  },
  wishlistHeart: {
    fontSize: 22,
    color: "#64748B",
  },
  notFoundContainer: {
    alignItems: "center",
    paddingTop: 40,
    paddingHorizontal: 24,
  },
  notFoundCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  notFoundTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1E1B4B",
    marginBottom: 6,
  },
  notFoundSubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 20,
  },
  barcodePill: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    marginBottom: 24,
  },
  barcodePillLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  barcodePillValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1E293B",
    letterSpacing: 1.5,
    marginTop: 2,
  },
  scanAgainBtn: {
    width: "100%",
    backgroundColor: "#3B0764",
    paddingVertical: 15,
    borderRadius: 24,
    alignItems: "center",
    marginBottom: 12,
  },
  scanAgainBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  viewCartSecondaryBtn: {
    paddingVertical: 10,
  },
  viewCartSecondaryText: {
    color: "#3B0764",
    fontSize: 14,
    fontWeight: "700",
  },
});
