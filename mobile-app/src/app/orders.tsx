import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCart, OrderRecord } from "../context/CartContext";
import { Theme } from "../constants/colors";
import CustomerBottomNav from "../components/CustomerBottomNav";
import { API_URL, safeFetch } from "../constants/api";

export default function MyOrdersScreen() {
  const router = useRouter();
  const { recentOrders } = useCart();

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [activeFilter, setActiveFilter] = useState<"All" | "Pending" | "Completed">("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);

  const fetchOrders = async () => {
    try {
      if (API_URL) {
        const res = await safeFetch(`${API_URL}/orders`, {}, 5000);
        const data = await res.json();
        if (data.success && Array.isArray(data.orders) && data.orders.length > 0) {
          setOrders(data.orders);
          return;
        }
      }

      if (recentOrders.length > 0) {
        setOrders(recentOrders);
      } else {
        setOrders([]);
      }
    } catch (_) {
      setOrders(recentOrders.length > 0 ? recentOrders : []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [recentOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const filteredOrders = orders.filter((o) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Completed") return o.paymentStatus === "Completed";
    if (activeFilter === "Pending") return o.paymentStatus === "Pending";
    return true;
  });

  const formatDate = (isoString?: string) => {
    if (!isoString) return "30 Apr 2025 • 09:45 AM";
    try {
      const d = new Date(isoString);
      return (
        d.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }) +
        " • " +
        d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    } catch {
      return isoString;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Purple Top Header matching Screen 8 */}
      <View style={styles.purpleHeader}>
        <SafeAreaView edges={["top"]} style={styles.headerSafe}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => router.replace("/")}
              activeOpacity={0.7}
            >
              <Text style={styles.headerBackArrow}>‹</Text>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>My Orders</Text>

            <TouchableOpacity style={styles.headerBtn} activeOpacity={0.7}>
              <Text style={{ fontSize: 18, color: Theme.white }}>🔍</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Theme.primary]} />
        }
      >
        {/* Filter Pills Row matching Screen 8 */}
        <View style={styles.filterRow}>
          {(["All", "Pending", "Completed"] as const).map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setActiveFilter(filter)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isActive && styles.filterPillTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={Theme.primary} />
          </View>
        ) : filteredOrders.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>📋</Text>
            <Text style={styles.emptyTitle}>No orders in {activeFilter}</Text>
          </View>
        ) : (
          <View style={styles.ordersList}>
            {filteredOrders.map((ord) => {
              const isCompleted = ord.paymentStatus === "Completed";

              return (
                <View key={ord._id} style={styles.orderCard}>
                  {/* Top Line: Order # and Status Pill matching Screen 8 */}
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderNumberText}>
                      #{ord.orderNumber}
                    </Text>

                    <View
                      style={[
                        styles.statusBadge,
                        isCompleted ? styles.statusCompleted : styles.statusPending,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          isCompleted
                            ? styles.statusCompletedText
                            : styles.statusPendingText,
                        ]}
                      >
                        {ord.paymentStatus || "Completed"}
                      </Text>
                    </View>
                  </View>

                  {/* Price & Items Count matching Screen 8 */}
                  <Text style={styles.priceItemsText}>
                    ₹{ord.totalAmount} • {ord.totalItems} {ord.totalItems === 1 ? "Item" : "Items"}
                  </Text>

                  {/* Date and Time matching Screen 8 */}
                  <Text style={styles.dateText}>{formatDate(ord.createdAt)}</Text>

                  {/* Thumbnails Row matching Screen 8 */}
                  <View style={styles.thumbsRow}>
                    {ord.items?.slice(0, 4).map((it, idx) => (
                      <Image
                        key={idx}
                        source={
                          it.imageUrl
                            ? { uri: it.imageUrl }
                            : require("@/assets/images/react-logo.png")
                        }
                        style={styles.thumbMini as any}
                        resizeMode="contain"
                      />
                    ))}
                  </View>

                  {/* View Details Link on Bottom Right matching Screen 8 */}
                  <TouchableOpacity
                    style={styles.viewDetailsBtn}
                    onPress={() => setSelectedOrder(ord)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.viewDetailsText}>View Details ➔</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Order Details & Gate Pass Modal */}
      <Modal visible={!!selectedOrder} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Order #{selectedOrder?.orderNumber}</Text>
            <Text style={styles.modalSub}>{formatDate(selectedOrder?.createdAt)}</Text>

            <View style={styles.gateCodeBox}>
              <Text style={styles.gateCodeLabel}>Gate Exit Barcode:</Text>
              <Text style={styles.gateCodeValue}>{selectedOrder?.exitBarcode}</Text>
            </View>

            <ScrollView style={{ maxHeight: 200, marginVertical: 12 }}>
              {selectedOrder?.items?.map((it, idx) => (
                <View key={idx} style={styles.modalItemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalItemName}>{it.name}</Text>
                    <Text style={styles.modalItemSub}>
                      {it.quantity} × ₹{Number(it.price).toFixed(2)}
                    </Text>
                  </View>
                  <Text style={styles.modalItemPrice}>
                    ₹{(Number(it.price) * it.quantity).toFixed(2)}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalTotalRow}>
              <Text style={styles.modalTotalLabel}>
                {selectedOrder?.paymentStatus === "Pending"
                  ? "Total Due (Pay Cash at Exit)"
                  : "Total Paid"}
              </Text>
              <Text style={styles.modalTotalAmount}>
                ₹{selectedOrder?.totalAmount?.toFixed(2)}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setSelectedOrder(null)}
            >
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 5-Tab Customer Bottom Navigation */}
      <CustomerBottomNav activeTab="orders" />
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
    paddingTop: 16,
    paddingBottom: 24,
  },
  filterRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  filterPill: {
    paddingVertical: 7,
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
  },
  filterPillActive: {
    backgroundColor: Theme.primary,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: Theme.gray,
  },
  filterPillTextActive: {
    color: Theme.white,
  },
  centerLoading: {
    paddingTop: 60,
    alignItems: "center",
  },
  emptyBox: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Theme.gray,
  },
  ordersList: {
    gap: 16,
  },
  orderCard: {
    backgroundColor: Theme.white,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderNumberText: {
    fontSize: 15,
    fontWeight: "900",
    color: Theme.dark,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusCompleted: {
    backgroundColor: Theme.successBg,
  },
  statusPending: {
    backgroundColor: "#EFF6FF",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  statusCompletedText: {
    color: Theme.success,
  },
  statusPendingText: {
    color: "#2563EB",
  },
  priceItemsText: {
    fontSize: 14,
    fontWeight: "800",
    color: Theme.dark,
    marginTop: 6,
  },
  dateText: {
    fontSize: 11,
    color: Theme.gray,
    marginTop: 2,
    marginBottom: 12,
  },
  thumbsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  thumbMini: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  viewDetailsBtn: {
    alignSelf: "flex-end",
    paddingTop: 4,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: "800",
    color: Theme.primary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: Theme.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: Theme.dark,
  },
  modalSub: {
    fontSize: 12,
    color: Theme.gray,
    marginTop: 2,
  },
  gateCodeBox: {
    backgroundColor: "#FAF5FF",
    borderWidth: 1,
    borderColor: "#E9D8FD",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 8,
  },
  gateCodeLabel: {
    fontSize: 11,
    color: Theme.primary,
    fontWeight: "700",
  },
  gateCodeValue: {
    fontSize: 12,
    color: Theme.dark,
    fontFamily: "monospace",
    fontWeight: "800",
  },
  modalItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
  },
  modalItemName: {
    fontSize: 13,
    fontWeight: "700",
    color: Theme.dark,
  },
  modalItemSub: {
    fontSize: 11,
    color: Theme.gray,
    marginTop: 2,
  },
  modalItemPrice: {
    fontSize: 13,
    fontWeight: "800",
    color: Theme.primary,
  },
  modalTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  modalTotalLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: Theme.dark,
  },
  modalTotalAmount: {
    fontSize: 18,
    fontWeight: "900",
    color: Theme.primary,
  },
  modalCloseBtn: {
    backgroundColor: Theme.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
  },
  modalCloseBtnText: {
    color: Theme.white,
    fontSize: 14,
    fontWeight: "800",
  },
});
