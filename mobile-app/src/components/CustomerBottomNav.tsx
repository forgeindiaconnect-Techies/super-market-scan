import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useCart } from "../context/CartContext";
import { Theme } from "../constants/colors";

type TabName = "home" | "scan" | "cart" | "orders" | "profile";

export default function CustomerBottomNav({ activeTab }: { activeTab: TabName }) {
  const router = useRouter();
  const { totalCount } = useCart();

  const tabs: {
    id: TabName;
    label: string;
    icon: string;
    route: "/" | "/scanner" | "/cart" | "/orders" | "/profile";
  }[] = [
    { id: "home", label: "Home", icon: "⌂", route: "/" },
    { id: "scan", label: "Scan", icon: "⚲", route: "/scanner" },
    { id: "cart", label: "Cart", icon: "🛒", route: "/cart" },
    { id: "orders", label: "Orders", icon: "📋", route: "/orders" },
    { id: "profile", label: "Profile", icon: "👤", route: "/profile" },
  ];

  return (
    <View style={styles.navBar}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const isCart = tab.id === "cart";

        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabItem}
            onPress={() => {
              if (activeTab !== tab.id) {
                router.replace(tab.route as any);
              }
            }}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrapper}>
              <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>
                {tab.icon}
              </Text>
              {isCart && totalCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{totalCount}</Text>
                </View>
              )}
            </View>

            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  navBar: {
    flexDirection: "row",
    height: 64,
    backgroundColor: Theme.white,
    borderTopWidth: 1,
    borderColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "space-around",
    paddingBottom: 4,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  iconWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  tabIcon: {
    fontSize: 21,
    color: "#94A3B8",
  },
  tabIconActive: {
    color: Theme.primary,
    fontWeight: "bold",
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94A3B8",
    marginTop: 2,
  },
  tabLabelActive: {
    color: Theme.primary,
    fontWeight: "800",
  },
  cartBadge: {
    position: "absolute",
    top: -5,
    right: -10,
    backgroundColor: "#EF4444",
    borderRadius: 9,
    minWidth: 17,
    height: 17,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: Theme.white,
    fontSize: 10,
    fontWeight: "bold",
  },
});
