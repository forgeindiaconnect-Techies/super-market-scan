import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCart } from "../context/CartContext";
import { Theme } from "../constants/colors";
import { API_URL, safeFetch } from "../constants/api";

export default function CustomerDetailsScreen() {
  const router = useRouter();
  const { method = "UPI" } = useLocalSearchParams<{ method?: string }>();
  const { cart, totalAmount, totalCount, customerInfo, setCustomerInfo } = useCart();

  // Fresh empty form inputs for every customer registering
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Error validation states
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [touched, setTouched] = useState(false);

  // Clean numeric phone input (only digits, max 10)
  const handlePhoneChange = (text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 10);
    setPhone(cleaned);
    if (touched) {
      if (!cleaned) {
        setPhoneError("Mobile number is mandatory");
      } else if (cleaned.length < 10) {
        setPhoneError("Please enter a valid 10-digit mobile number");
      } else {
        setPhoneError("");
      }
    }
  };

  const handleNameChange = (text: string) => {
    setName(text);
    if (touched) {
      if (!text.trim()) {
        setNameError("Customer name is mandatory");
      } else if (text.trim().length < 2) {
        setNameError("Name must be at least 2 characters");
      } else {
        setNameError("");
      }
    }
  };

  // Constant Rule: Customer Name & 10-digit Mobile Number are STRICTLY MANDATORY
  const validateForm = (): boolean => {
    let isValid = true;
    setTouched(true);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Customer name is mandatory");
      isValid = false;
    } else if (trimmedName.length < 2) {
      setNameError("Name must be at least 2 characters");
      isValid = false;
    } else {
      setNameError("");
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone) {
      setPhoneError("Mobile number is mandatory");
      isValid = false;
    } else if (cleanPhone.length !== 10) {
      setPhoneError("Please enter a valid 10-digit mobile number");
      isValid = false;
    } else {
      setPhoneError("");
    }

    return isValid;
  };

  const handleProceedToPayment = () => {
    if (cart.length === 0) {
      Alert.alert("Empty Cart", "Please scan items before proceeding to payment.");
      return;
    }

    // STRICT VALIDATION: Until details are properly filled, DO NOT open payment page
    const isValid = validateForm();
    if (!isValid) {
      Alert.alert(
        "Mandatory Details Required",
        "Please fill in your Customer Name and a valid 10-digit Mobile Number before proceeding to payment. The payment page cannot be opened without these details."
      );
      return;
    }

    const trimmedName = name.trim();
    const cleanPhone = phone.replace(/\D/g, "");
    const trimmedAddress = address.trim();

    // Save details to CartContext for global persistence across the session
    setCustomerInfo({
      name: trimmedName,
      phone: cleanPhone,
      address: trimmedAddress,
    });

    // Notify backend and Admin Dashboard immediately about registered customer info
    if (API_URL) {
      safeFetch(`${API_URL}/orders/cart-activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: cleanPhone,
          customerName: trimmedName,
          productName: `Registered Customer Details (${cleanPhone})`,
          quantity: totalCount,
          price: Number(totalAmount || 0),
          action: "updated",
          totalCartItems: totalCount,
          totalCartAmount: Number(totalAmount || 0),
        }),
      }).catch(() => {});
    }

    // Navigate to Payment Screen ONLY after successful validation
    router.push({
      pathname: "/payment",
      params: {
        method,
        customerName: trimmedName,
        customerPhone: cleanPhone,
        customerAddress: trimmedAddress,
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <StatusBar style="light" />

        {/* Deep Purple Top Header matching App Design & Screen 5 */}
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

              <Text style={styles.headerTitle}>Customer Details</Text>

              <TouchableOpacity style={styles.headerBtn} activeOpacity={0.7}>
                <Text style={styles.scissorIcon}>✂</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        {/* Main Curved White Container Sheet matching App Design */}
        <View style={styles.whiteSheet}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Order Quick Summary Card */}
            <View style={styles.orderSummaryCard}>
              <View style={styles.summaryTopRow}>
                <View>
                  <Text style={styles.summaryLabel}>PAYABLE AMOUNT</Text>
                  <Text style={styles.summaryAmount}>₹{Number(totalAmount || 0).toFixed(2)}</Text>
                </View>
                <View style={styles.methodBadge}>
                  <Text style={styles.methodBadgeText}>
                    {method === "Card" ? "💳 Card" : "⚡ UPI"}
                  </Text>
                </View>
              </View>
              <Text style={styles.summarySub}>
                {totalCount} {totalCount === 1 ? "item" : "items"} in cart • Fast checkout
              </Text>
            </View>

            {/* Instruction banner */}
            <View style={styles.infoBanner}>
              <Text style={styles.infoIcon}>ℹ️</Text>
              <Text style={styles.infoText}>
                Please enter customer information. Name and Mobile Number are required to open the payment page and generate your exit pass.
              </Text>
            </View>

            {/* FORM CONTAINER */}
            <View style={styles.formContainer}>
              {/* Field 1: Customer Name (MANDATORY) */}
              <View style={styles.fieldGroup}>
                <View style={styles.fieldHeader}>
                  <Text style={styles.fieldLabel}>
                    Customer Name <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <View style={styles.mandatoryBadge}>
                    <Text style={styles.mandatoryBadgeText}>MANDATORY</Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.inputContainer,
                    nameError ? styles.inputErrorBorder : null,
                  ]}
                >
                  <Text style={styles.inputPrefixIcon}>👤</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your full name"
                    placeholderTextColor="#94A3B8"
                    value={name}
                    onChangeText={handleNameChange}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                  {name.trim().length >= 2 && (
                    <Text style={styles.checkIcon}>✓</Text>
                  )}
                </View>
                {nameError ? (
                  <Text style={styles.errorText}>{nameError}</Text>
                ) : (
                  <Text style={styles.helperText}>Used for billing and invoice records</Text>
                )}
              </View>

              {/* Field 2: Mobile Number (MANDATORY) */}
              <View style={styles.fieldGroup}>
                <View style={styles.fieldHeader}>
                  <Text style={styles.fieldLabel}>
                    Mobile Number <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <View style={styles.mandatoryBadge}>
                    <Text style={styles.mandatoryBadgeText}>MANDATORY</Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.inputContainer,
                    phoneError ? styles.inputErrorBorder : null,
                  ]}
                >
                  <View style={styles.countryCodeBox}>
                    <Text style={styles.flagIcon}>🇮🇳</Text>
                    <Text style={styles.countryCodeText}>+91</Text>
                  </View>
                  <TextInput
                    style={[styles.textInput, { marginLeft: 8 }]}
                    placeholder="10-digit mobile number"
                    placeholderTextColor="#94A3B8"
                    value={phone}
                    onChangeText={handlePhoneChange}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                  {phone.length === 10 && (
                    <Text style={styles.checkIcon}>✓</Text>
                  )}
                </View>
                {phoneError ? (
                  <Text style={styles.errorText}>{phoneError}</Text>
                ) : (
                  <Text style={styles.helperText}>
                    {phone.length}/10 digits • Digital invoice will be linked to this number
                  </Text>
                )}
              </View>

              {/* Field 3: Address (OPTIONAL) */}
              <View style={styles.fieldGroup}>
                <View style={styles.fieldHeader}>
                  <Text style={styles.fieldLabel}>Address</Text>
                  <View style={styles.optionalBadge}>
                    <Text style={styles.optionalBadgeText}>OPTIONAL</Text>
                  </View>
                </View>

                <View style={[styles.inputContainer, styles.textAreaContainer]}>
                  <Text style={[styles.inputPrefixIcon, { marginTop: 4 }]}>📍</Text>
                  <TextInput
                    style={[styles.textInput, styles.textAreaInput]}
                    placeholder="Door / Flat No, Street, Landmark, City (Optional)"
                    placeholderTextColor="#94A3B8"
                    value={address}
                    onChangeText={setAddress}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
                <Text style={styles.helperText}>
                  Optional • Leave blank if not required for in-store pickup
                </Text>
              </View>
            </View>

            {/* Security Guarantee Pill */}
            <View style={styles.securityBox}>
              <Text style={styles.securityShieldIcon}>🔒</Text>
              <Text style={styles.securityText}>
                Your details are secure & strictly used for supermarket verification.
              </Text>
            </View>

            {/* Action Button: Proceed to Payment */}
            <TouchableOpacity
              style={styles.proceedBtn}
              onPress={handleProceedToPayment}
              activeOpacity={0.88}
            >
              <View style={styles.btnContent}>
                <Text style={styles.lockIcon}>🔒</Text>
                <Text style={styles.proceedBtnText}>
                  Proceed to Payment (₹{Number(totalAmount || 0).toFixed(2)}) ➔
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Back to Checkout</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2E0854", // Deep rich purple matching reference
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
  scissorIcon: {
    color: "#FFFFFF",
    fontSize: 18,
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
    paddingBottom: 40,
  },
  orderSummaryCard: {
    backgroundColor: "#FAF5FF", // Soft lavender matching app design
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#E9D8FD",
    padding: 16,
    marginBottom: 16,
  },
  summaryTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#7C3AED",
    letterSpacing: 0.8,
  },
  summaryAmount: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1E1B4B",
    marginTop: 2,
  },
  methodBadge: {
    backgroundColor: "#3B0764",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  methodBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  summarySub: {
    fontSize: 12.5,
    color: "#64748B",
    fontWeight: "600",
  },
  infoBanner: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
    alignItems: "center",
    gap: 8,
  },
  infoIcon: {
    fontSize: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: "#475569",
    lineHeight: 17,
    fontWeight: "500",
  },
  formContainer: {
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  fieldHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1E293B",
  },
  requiredStar: {
    color: "#DC2626",
    fontSize: 15,
    fontWeight: "900",
  },
  mandatoryBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  mandatoryBadgeText: {
    color: "#B91C1C",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  optionalBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  optionalBadgeText: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    minHeight: 52,
  },
  inputErrorBorder: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  inputPrefixIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  countryCodeBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 4,
    gap: 4,
  },
  flagIcon: {
    fontSize: 13,
  },
  countryCodeText: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#1E293B",
  },
  textInput: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: "600",
    color: "#1E293B",
    paddingVertical: 10,
  },
  checkIcon: {
    color: "#16A34A",
    fontSize: 16,
    fontWeight: "900",
    marginLeft: 6,
  },
  textAreaContainer: {
    alignItems: "flex-start",
    paddingVertical: 10,
    minHeight: 88,
  },
  textAreaInput: {
    height: 70,
    paddingVertical: 0,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 5,
    marginLeft: 4,
  },
  helperText: {
    color: "#64748B",
    fontSize: 11.5,
    marginTop: 5,
    marginLeft: 4,
    fontWeight: "500",
  },
  securityBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  securityShieldIcon: {
    fontSize: 14,
  },
  securityText: {
    fontSize: 11.5,
    color: "#64748B",
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  proceedBtn: {
    backgroundColor: "#3B0764", // Deep rich purple from reference
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3B0764",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 12,
  },
  btnContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  lockIcon: {
    fontSize: 15,
  },
  proceedBtnText: {
    color: "#FFFFFF",
    fontSize: 15.5,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    color: "#64748B",
    fontSize: 13.5,
    fontWeight: "700",
  },
});

