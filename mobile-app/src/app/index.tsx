import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Theme } from "../constants/colors";

const { width, height } = Dimensions.get("window");

export default function WelcomeHomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Elegant atmospheric background gradients matching Screen 1 */}
      <View style={styles.radialAuraTop} />
      <View style={styles.radialAuraRight} />
      <View style={styles.ambientBottomShade} />

      <SafeAreaView style={styles.content}>
        {/* Top Branding Section matching Screen 1 */}
        <View style={styles.brandSection}>
          {/* Golden Vector Cart with Sprout Leaf */}
          <View style={styles.cartIconWrapper}>
            <Image
              source={require("@/assets/images/gold-cart-logo.png")}
              style={styles.cartLogoImage}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.titlePrimary}>Smart</Text>
          <Text style={styles.titleSecondary}>Supermarket</Text>
          <Text style={styles.tagline}>Scan • Shop • Pay</Text>
        </View>

        {/* Centerpiece Hero Grocery Bag with Vegetables & Gold Ribbon */}
        <View style={styles.heroSection}>
          <View style={styles.heroImageContainer}>
            <Image
              source={require("@/assets/images/grocery-hero.png")}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Bottom Call To Action matching Screen 1 */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={() => router.push("/scanner")}
            activeOpacity={0.88}
          >
            <Text style={styles.getStartedText}>Get Started →</Text>
          </TouchableOpacity>

          <Text style={styles.welcomeFooter}>
            Welcome to Smart Supermarket
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2E0854", // Deep rich purple from reference
    position: "relative",
  },
  radialAuraTop: {
    position: "absolute",
    top: -100,
    left: -60,
    right: -60,
    height: 380,
    borderRadius: 220,
    backgroundColor: "#5B16A6",
    opacity: 0.55,
  },
  radialAuraRight: {
    position: "absolute",
    top: height * 0.28,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#7C22DE",
    opacity: 0.25,
  },
  ambientBottomShade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 160,
    backgroundColor: "#1F0438",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 26,
    paddingTop: 10,
    paddingBottom: 24,
  },
  brandSection: {
    alignItems: "center",
    marginTop: 6,
  },
  cartIconWrapper: {
    width: 82,
    height: 82,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  cartLogoImage: {
    width: 80,
    height: 80,
  },
  titlePrimary: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    lineHeight: 36,
    textAlign: "center",
  },
  titleSecondary: {
    fontSize: 32,
    fontWeight: "900",
    color: "#F6BC45", // Metallic golden champagne matching reference
    letterSpacing: -0.5,
    lineHeight: 36,
    textAlign: "center",
  },
  tagline: {
    fontSize: 14,
    color: "#FDE68A",
    fontWeight: "700",
    marginTop: 6,
    letterSpacing: 0.8,
  },
  heroSection: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 4,
  },
  heroImageContainer: {
    width: width * 0.92,
    height: height * 0.44,
    alignItems: "center",
    justifyContent: "center",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  bottomSection: {
    width: "100%",
    alignItems: "center",
    gap: 12,
  },
  getStartedButton: {
    width: "100%",
    backgroundColor: "#F6BC45", // Golden champagne button
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#F6BC45",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  getStartedText: {
    color: "#2E0854", // Deep purple contrasting text
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  welcomeFooter: {
    color: "#CBB2FE",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
});
