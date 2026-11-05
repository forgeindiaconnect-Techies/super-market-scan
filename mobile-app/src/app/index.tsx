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

      {/* Radiant ambient glow curves matching Screen 1 */}
      <View style={styles.ambientGlowTop} />
      <View style={styles.ambientGlowCenter} />
      <View style={styles.ambientGlowBottom} />

      <SafeAreaView style={styles.content}>
        {/* Top Branding Section matching Screen 1 */}
        <View style={styles.brandSection}>
          {/* Golden Cart Outline with Sprout Leaf */}
          <View style={styles.cartIconWrapper}>
            <View style={styles.sproutBadge}>
              <Text style={styles.sproutEmoji}>🍃</Text>
            </View>
            <Text style={styles.cartSymbol}>🛒</Text>
          </View>

          <Text style={styles.titlePrimary}>Smart</Text>
          <Text style={styles.titleSecondary}>Supermarket</Text>
          <Text style={styles.tagline}>Scan • Shop • Pay</Text>
        </View>

        {/* Centerpiece Hero Grocery Bag matching Screen 1 */}
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
  ambientGlowTop: {
    position: "absolute",
    top: -90,
    left: -40,
    right: -40,
    height: 340,
    borderRadius: 200,
    backgroundColor: "#5B16A6",
    opacity: 0.55,
  },
  ambientGlowCenter: {
    position: "absolute",
    top: height * 0.38,
    left: 20,
    right: 20,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#7C22DE",
    opacity: 0.22,
  },
  ambientGlowBottom: {
    position: "absolute",
    bottom: -60,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: "#1F0438",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 28,
  },
  brandSection: {
    alignItems: "center",
    marginTop: 8,
  },
  cartIconWrapper: {
    position: "relative",
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  sproutBadge: {
    position: "absolute",
    top: 2,
    right: 8,
    zIndex: 2,
  },
  sproutEmoji: {
    fontSize: 18,
  },
  cartSymbol: {
    fontSize: 52,
    color: "#F6BC45",
  },
  titlePrimary: {
    fontSize: 32,
    fontWeight: "900",
    color: Theme.white,
    letterSpacing: -0.5,
    lineHeight: 36,
    textAlign: "center",
  },
  titleSecondary: {
    fontSize: 32,
    fontWeight: "900",
    color: Theme.white,
    letterSpacing: -0.5,
    lineHeight: 36,
    textAlign: "center",
  },
  tagline: {
    fontSize: 14,
    color: "#E2CEFE",
    fontWeight: "600",
    marginTop: 6,
    letterSpacing: 0.5,
  },
  heroSection: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
  },
  heroImageContainer: {
    width: width * 0.88,
    height: height * 0.42,
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
    gap: 14,
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
    shadowOpacity: 0.4,
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
