import React, { useEffect, useState } from "react";
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
import { useRouter, useLocalSearchParams } from "expo-router";
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

  useEffect(() => {
    fetchProduct();
  }, [productId, barcode]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError("");

      if (!API_URL) throw new Error("API URL missing in configuration.");

      let endpoint = "";
      if (productId) {
        endpoint = `${API_URL}/products/${productId}`;
      } else if (barcode) {
        endpoint = `${API_URL}/products/barcode/${encodeURIComponent(barcode)}`;
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
  const discount = Number(product?.discount || 0);
  const finalPrice = Math.max(0, rawPrice - discount);
  const discountPercent =
    rawPrice > 0 ? Math.round((discount / rawPrice) * 100) : 0;
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Top Header matching Screen 3 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cartIconBtn}
          onPress={() => router.push("/cart")}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 22 }}>🛒</Text>
          {totalCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{totalCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={Theme.primary} />
          <Text style={styles.loadingText}>Fetching product details...</Text>
        </View>
      ) : error || !product ? (
        <View style={styles.notFoundContainer}>
          <View style={styles.notFoundCircle}>
            <Text style={{ fontSize: 44 }}>🔍</Text>
          </View>
          <Text style={styles.notFoundTitle}>Product Not Found</Text>
          <Text style={styles.notFoundSubtitle}>
            {error || "The scanned barcode is not registered in our supermarket inventory."}
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
          {/* Centered Large Product Image matching Screen 3 */}
          <View style={styles.imageContainer}>
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

          {/* Product Title */}
          <Text style={styles.productTitle}>{product.name}</Text>

          {/* Meta Pill Row: Brand | Category matching Screen 3 */}
          <View style={styles.metaPill}>
            <Text style={styles.metaText}>
              Brand: <Text style={styles.metaValue}>{product.brand || "Supermarket"}</Text>
              {"   |   "}
              Category: <Text style={styles.metaValue}>{product.category || "General"}</Text>
            </Text>
          </View>

          {/* Price, Strikethrough & Discount Tag matching Screen 3 */}
          <View style={styles.priceRow}>
            <Text style={styles.finalPrice}>₹{finalPrice}</Text>
            {discount > 0 && (
              <Text style={styles.originalPrice}>₹{rawPrice}</Text>
            )}
            {discountPercent > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountBadgeText}>{discountPercent}% OFF</Text>
              </View>
            )}
          </View>

          {/* Description */}
          <Text style={styles.description}>
            {product.description || "Authentic quality product from our supermarket shelves."}
          </Text>

          {/* Availability Badge matching Screen 3 */}
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
              >
                <Text style={styles.stepperBtnText}>−</Text>
              </TouchableOpacity>

              <Text style={styles.stepperValue}>{quantity}</Text>

              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() =>
                  setQuantity((q) => Math.min(product.stock, q + 1))
                }
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: {
    fontSize: 28,
    color: Theme.primary,
    fontWeight: "300",
  },
  cartIconBtn: {
    position: "relative",
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#EF4444",
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: Theme.white,
    fontSize: 10,
    fontWeight: "bold",
  },
  centerLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: Theme.gray,
    fontWeight: "600",
  },
  notFoundContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  notFoundCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  notFoundTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Theme.dark,
    marginBottom: 8,
    textAlign: "center",
  },
  notFoundSubtitle: {
    fontSize: 14,
    color: Theme.gray,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  barcodePill: {
    backgroundColor: "#F1F5F9",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 26,
    alignItems: "center",
  },
  barcodePillLabel: {
    fontSize: 11,
    color: Theme.gray,
    fontWeight: "600",
  },
  barcodePillValue: {
    fontSize: 15,
    color: Theme.dark,
    fontWeight: "800",
    marginTop: 2,
    letterSpacing: 1,
  },
  scanAgainBtn: {
    backgroundColor: Theme.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 24,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
  },
  scanAgainBtnText: {
    color: Theme.white,
    fontSize: 15,
    fontWeight: "800",
  },
  viewCartSecondaryBtn: {
    paddingVertical: 12,
  },
  viewCartSecondaryText: {
    color: Theme.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 36,
  },
  imageContainer: {
    width: "100%",
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  productImage: {
    width: width * 0.75,
    height: 200,
  },
  productTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: Theme.dark,
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  metaPill: {
    backgroundColor: "#F8FAFC",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  metaText: {
    fontSize: 12,
    color: Theme.gray,
    fontWeight: "500",
  },
  metaValue: {
    color: Theme.dark,
    fontWeight: "700",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  finalPrice: {
    fontSize: 26,
    fontWeight: "900",
    color: "#D90429",
  },
  originalPrice: {
    fontSize: 16,
    color: Theme.grayLight,
    textDecorationLine: "line-through",
  },
  discountBadge: {
    backgroundColor: Theme.successBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountBadgeText: {
    color: Theme.success,
    fontSize: 12,
    fontWeight: "800",
  },
  description: {
    fontSize: 13,
    color: Theme.gray,
    lineHeight: 19,
    marginBottom: 14,
  },
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  stockIndicatorCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  stockInCircle: {
    backgroundColor: Theme.success,
  },
  stockOutCircle: {
    backgroundColor: "#EF4444",
  },
  stockIndicatorText: {
    color: Theme.white,
    fontSize: 11,
    fontWeight: "900",
  },
  stockText: {
    color: Theme.success,
    fontSize: 13,
    fontWeight: "700",
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    width: 130,
    marginBottom: 24,
  },
  stepperBtn: {
    padding: 6,
  },
  stepperBtnText: {
    fontSize: 18,
    fontWeight: "800",
    color: Theme.dark,
  },
  stepperValue: {
    fontSize: 15,
    fontWeight: "800",
    color: Theme.dark,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  addToCartBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.primary,
    paddingVertical: 15,
    borderRadius: 24,
    gap: 8,
    shadowColor: Theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  addToCartBtnSuccess: {
    backgroundColor: Theme.success,
  },
  btnDisabled: {
    backgroundColor: Theme.grayLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  addToCartIcon: {
    fontSize: 17,
  },
  addToCartText: {
    color: Theme.white,
    fontSize: 15,
    fontWeight: "800",
  },
  wishlistBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.white,
  },
  wishlistBtnActive: {
    borderColor: "#FCA5A5",
    backgroundColor: "#FEF2F2",
  },
  wishlistHeart: {
    fontSize: 22,
    color: Theme.gray,
  },
});
