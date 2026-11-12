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
import { generateAndShareReceipt } from "../utils/receiptGenerator";
import ReceiptModal from "../components/ReceiptModal";

export default function MyOrdersScreen() {
  const router = useRouter();
  const { recentOrders } = useCart();

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [activeFilter, setActiveFilter] = useState<"All" | "Pending" | "Completed">("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<OrderRecord | null>(null);

  const fetchOrders = async () => {
    try {
      let dbOrders: OrderRecord[] = [];
      if (API_URL) {
        const res = await safeFetch(`${API_URL}/orders`, {}, 5000);
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          dbOrders = data.orders;
        }
      }

      // Combine real orders from DB and local context (no fake mock orders)
      const combined = [...recentOrders, ...dbOrders];
      const uniqueOrders = Array.from(
        new Map(combined.map((o) => [o._id || o.orderNumber, o])).values()
      );

      setOrders(uniqueOrders);
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
    if (activeFilter === "Pending") return o.paymentStatus === "Pending" || o.paymentStatus === "Approved";
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

      {/* Deep Purple Top Header matching Screen 8 of reference */}
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
              <Text style={styles.searchIcon}>🔍</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* Main Curved White Sheet Container matching Screen 8 */}
      <View style={styles.whiteSheet}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#3B0764"]}
            />
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
              <ActivityIndicator size="large" color="#3B0764" />
            </View>
          ) : filteredOrders.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={{ fontSize: 44, marginBottom: 12 }}>📋</Text>
              <Text style={styles.emptyTitle}>No orders in {activeFilter}</Text>
            </View>
          ) : (
            <View style={styles.ordersList}>
              {filteredOrders.map((ord) => {
                const isCompleted = ord.paymentStatus === "Completed";

                return (
                  <View key={ord._id || ord.orderNumber} style={styles.orderCard}>
                    {/* Header: Order Number and Status Badge matching Screen 8 */}
                    <View style={styles.orderHeader}>
                      <Text style={styles.orderNumberText}>
                        #{ord.orderNumber}
                      </Text>

                      <View
                        style={[
                          styles.statusBadge,
                          ord.paymentStatus === "Completed"
                            ? styles.statusCompleted
                            : ord.paymentStatus === "Approved"
                            ? styles.statusApproved
                            : styles.statusPending,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            ord.paymentStatus === "Completed"
                              ? styles.statusCompletedText
                              : ord.paymentStatus === "Approved"
                              ? styles.statusApprovedText
                              : styles.statusPendingText,
                          ]}
                        >
                          {ord.paymentStatus || "Completed"}
                        </Text>
                      </View>
                    </View>

                    {/* Price & Items Count matching Screen 8 */}
                    <Text style={styles.priceItemsText}>
                      ₹{ord.totalAmount} • {ord.totalItems}{" "}
                      {ord.totalItems === 1 ? "item" : "items"}
                    </Text>

                    {/* Date and Time matching Screen 8 */}
                    <Text style={styles.dateText}>
                      {formatDate(ord.createdAt)}
                    </Text>

                    {/* Product Thumbnails Preview Row matching Screen 8 */}
                    <View style={styles.thumbsRow}>
                      {ord.items && ord.items.length > 0 ? (
                        ord.items.slice(0, 4).map((it, idx) => (
                          <View key={idx} style={styles.thumbWrapper}>
                            <Image
                              source={
                                it.imageUrl
                                  ? { uri: it.imageUrl }
                                  : require("@/assets/images/react-logo.png")
                              }
                              style={styles.thumbMini as any}
                              resizeMode="contain"
                            />
                          </View>
                        ))
                      ) : (
                        <View style={styles.thumbWrapper}>
                          <Image
                            source={require("@/assets/images/react-logo.png")}
                            style={styles.thumbMini}
                            resizeMode="contain"
                          />
                        </View>
                      )}
                    </View>

                    {/* View Details Link on Bottom Right matching Screen 8 */}
                    <TouchableOpacity
                      style={styles.viewDetailsBtn}
                      onPress={() => setSelectedOrder(ord)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.viewDetailsText}>
                        View Details →
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>

      {/* 5-Tab Customer Bottom Navigation matching Screen 8 */}
      <CustomerBottomNav activeTab="orders" />

      {/* Order Details & Gate Pass Modal Sheet */}
      <Modal visible={!!selectedOrder} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Order #{selectedOrder?.orderNumber}</Text>
            <Text style={styles.modalSub}>{formatDate(selectedOrder?.createdAt)}</Text>

            <View style={styles.gateCodeBox}>
              <Text style={styles.gateCodeLabel}>Transaction Ref & Status:</Text>
              <Text style={styles.gateCodeValue}>
                {(selectedOrder as any)?.paymentId || `TXN-${(selectedOrder?.orderNumber || "").replace(/^ORD-/, "")}`} ({selectedOrder?.paymentStatus})
              </Text>
            </View>

            <ScrollView style={{ maxHeight: 180, marginVertical: 12 }}>
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
                  ? "Total Due (Pay at Exit)"
                  : "Total Paid"}
              </Text>
              <Text style={styles.modalTotalAmount}>
                ₹{selectedOrder?.totalAmount}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.modalReceiptBtn}
              onPress={() => {
                if (selectedOrder) {
                  setReceiptOrder(selectedOrder);
                  try {
                    generateAndShareReceipt(selectedOrder);
                  } catch (_) {}
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.modalReceiptBtnText}>⤓ Open & Download PDF Receipt</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setSelectedOrder(null)}
              activeOpacity={0.88}
            >
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Interactive In-App Real-time Supermarket Tax Invoice Modal */}
      <ReceiptModal
        visible={!!receiptOrder}
        order={receiptOrder}
        onClose={() => setReceiptOrder(null)}
      />
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
  searchIcon: {
    color: "#FFFFFF",
    fontSize: 18,
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
  filterRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  filterPill: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: "#EDE9FE", // Soft lavender-grey for inactive tabs
  },
  filterPillActive: {
    backgroundColor: "#3B0764", // Deep rich purple for active tab matching reference
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },
  filterPillTextActive: {
    color: "#FFFFFF",
    fontWeight: "900",
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
    fontSize: 16,
    fontWeight: "800",
    color: "#64748B",
  },
  ordersList: {
    gap: 14,
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
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
    marginBottom: 4,
  },
  orderNumberText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#1E293B",
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusCompleted: {
    backgroundColor: "#DCFCE7", // Light green background matching reference
  },
  statusCompletedText: {
    color: "#16A34A", // Vibrant green text matching reference
    fontSize: 12,
    fontWeight: "800",
  },
  statusApproved: {
    backgroundColor: "#EEF2FF", // Light purple/indigo background
  },
  statusApprovedText: {
    color: "#4F46E5", // Indigo text
    fontSize: 12,
    fontWeight: "800",
  },
  statusPending: {
    backgroundColor: "#DBEAFE", // Light blue background matching reference
  },
  statusPendingText: {
    color: "#2563EB", // Blue text matching reference
    fontSize: 12,
    fontWeight: "800",
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "800",
  },
  priceItemsText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 3,
  },
  dateText: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
    marginBottom: 12,
  },
  thumbsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  thumbWrapper: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  thumbMini: {
    width: 40,
    height: 40,
  },
  viewDetailsBtn: {
    alignSelf: "flex-end",
    paddingVertical: 4,
  },
  viewDetailsText: {
    color: "#3B0764", // Purple link text matching reference
    fontSize: 13,
    fontWeight: "800",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
  },
  modalHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1E1B4B",
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 16,
  },
  gateCodeBox: {
    backgroundColor: "#FAF5FF",
    borderWidth: 1,
    borderColor: "#E9D5FF",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    marginBottom: 14,
  },
  gateCodeLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#3B0764",
    letterSpacing: 0.5,
  },
  gateCodeValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1E1B4B",
    letterSpacing: 2,
    marginTop: 4,
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
    fontSize: 13.5,
    fontWeight: "700",
    color: "#1E293B",
  },
  modalItemSub: {
    fontSize: 12,
    color: "#64748B",
  },
  modalItemPrice: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#1E293B",
  },
  modalTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: "#F1F5F9",
    marginTop: 4,
  },
  modalTotalLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1E293B",
  },
  modalTotalAmount: {
    fontSize: 20,
    fontWeight: "900",
    color: "#166534",
  },
  modalReceiptBtn: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#3B0764",
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 6,
  },
  modalReceiptBtnText: {
    color: "#3B0764",
    fontSize: 14,
    fontWeight: "800",
  },
  modalCloseBtn: {
    backgroundColor: "#3B0764",
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: "center",
    marginTop: 10,
  },
  modalCloseBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});
