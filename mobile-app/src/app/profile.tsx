import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Theme } from "../constants/colors";
import CustomerBottomNav from "../components/CustomerBottomNav";

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.replace("/")}
          activeOpacity={0.7}
        >
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>My Profile</Text>

        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={{ fontSize: 32 }}>👤</Text>
          </View>
          <Text style={styles.userName}>Smart Shopper</Text>
          <Text style={styles.userPhone}>+91 98765 43210</Text>

          <View style={styles.loyaltyBadge}>
            <Text style={styles.loyaltyBadgeText}>★ GOLD EXPRESS MEMBER</Text>
          </View>
        </View>

        {/* Supermarket Features & Information */}
        <View style={styles.menuCard}>
          <Text style={styles.menuSectionTitle}>Self-Checkout Services</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/orders")}
            activeOpacity={0.7}
          >
            <Text style={styles.menuIcon}>📋</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Order Receipts & Invoices</Text>
              <Text style={styles.menuSub}>View past gate exit passes</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/scanner")}
            activeOpacity={0.7}
          >
            <Text style={styles.menuIcon}>📷</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Barcode Scanner</Text>
              <Text style={styles.menuSub}>Scan product barcodes on shelves</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/cart")}
            activeOpacity={0.7}
          >
            <Text style={styles.menuIcon}>🛍️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>My Shopping Cart</Text>
              <Text style={styles.menuSub}>Review selected items</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Supermarket Support & Safety */}
        <View style={styles.menuCard}>
          <Text style={styles.menuSectionTitle}>Store Help & Assistance</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              Alert.alert(
                "Store Assistance",
                "Store staff has been notified. An associate will assist you at your aisle shortly."
              )
            }
            activeOpacity={0.7}
          >
            <Text style={styles.menuIcon}>🛎️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Call Store Associate</Text>
              <Text style={styles.menuSub}>Get assistance in the store aisle</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              Alert.alert(
                "Gate Exit Turnstile",
                "After payment, hold your digital exit pass barcode under the optical turnstile scanner to open the exit barrier."
              )
            }
            activeOpacity={0.7}
          >
            <Text style={styles.menuIcon}>🚪</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>How to Exit the Supermarket</Text>
              <Text style={styles.menuSub}>Contactless turnstile guide</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.appVersionText}>
          Smart Supermarket Mobile App • v2.0 (Purple Edition)
        </Text>
      </ScrollView>

      <CustomerBottomNav activeTab="profile" />
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
    borderBottomWidth: 1,
    borderColor: Theme.cardBorder,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Theme.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: {
    fontSize: 26,
    color: Theme.primary,
    fontWeight: "300",
    lineHeight: 28,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: Theme.dark,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  profileCard: {
    backgroundColor: Theme.secondaryLight,
    borderWidth: 1.5,
    borderColor: Theme.cardBorder,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Theme.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: Theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  userName: {
    fontSize: 18,
    fontWeight: "900",
    color: Theme.dark,
  },
  userPhone: {
    fontSize: 13,
    color: Theme.gray,
    marginTop: 2,
  },
  loyaltyBadge: {
    backgroundColor: Theme.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 12,
  },
  loyaltyBadgeText: {
    color: Theme.gold,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  menuCard: {
    backgroundColor: Theme.white,
    borderWidth: 1,
    borderColor: Theme.cardBorder,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  menuSectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: Theme.dark,
    marginBottom: 10,
    paddingLeft: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: Theme.cardBorder,
    gap: 12,
  },
  menuIcon: {
    fontSize: 22,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Theme.dark,
  },
  menuSub: {
    fontSize: 11,
    color: Theme.gray,
    marginTop: 2,
  },
  menuArrow: {
    fontSize: 22,
    color: Theme.gray,
    fontWeight: "300",
  },
  appVersionText: {
    textAlign: "center",
    fontSize: 11,
    color: Theme.gray,
    marginTop: 12,
    marginBottom: 8,
  },
});

