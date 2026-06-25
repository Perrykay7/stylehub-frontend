import { router, Stack } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../data/authContext";
import { deleteAccount } from "./api/client";

const SUPPORT_PHONE = "0552213828";
const SUPPORT_EMAIL = "supportstylehub5@gmail.com";

const TERMS_OF_SERVICE = `Terms of Service

Last updated: June 2026

1. Acceptance of Terms
By creating an account and using StyleHub, you agree to these Terms of Service. If you do not agree, please do not use the app.

2. What StyleHub Does
StyleHub connects customers with salons and spas to browse services, book appointments, and manage bookings. Salon owners can list their business, manage services, and run promotional offers through the app.

3. Accounts
You are responsible for keeping your phone number and password secure. You must provide accurate information when registering. You may delete your account at any time from Settings.

4. Bookings and Cancellations
Bookings are subject to availability. Cancellations must be made at least 2 hours before the scheduled appointment time. Cancellations within this window are not permitted through the app.

5. Promo Codes
Promo codes are offered at the discretion of individual salon owners. Codes may be limited to specific customers, have expiry dates, or be withdrawn at any time without notice.

6. Salon Owner Responsibilities
Salon owners are responsible for the accuracy of their listed services, pricing, and availability. StyleHub is not responsible for disputes between customers and salon owners regarding service quality.

7. Account Deletion
Deleting your account is permanent. If you are a salon owner, deleting your account will also permanently delete your salons, services, promo codes, and associated booking records.

8. Limitation of Liability
StyleHub is provided "as is." We are not liable for any indirect, incidental, or consequential damages arising from use of the app.

9. Changes to These Terms
We may update these terms from time to time. Continued use of the app after changes constitutes acceptance of the new terms.

10. Contact
For questions about these terms, contact us through the Customer Service option in Settings.`;

export default function SettingsScreen() {
  const { user, token, logout } = useAuth();
  const [showTerms, setShowTerms] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function handleLogout() {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(
      "Delete Account",
      user?.role === "owner"
        ? "This will permanently delete your account, including any salons, services, promo codes, and bookings you own. This cannot be undone."
        : "This will permanently delete your account and booking history. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: async () => {
            if (!token) return;
            setDeleting(true);
            try {
              await deleteAccount(token);
              await logout();
              router.replace("/login");
            } catch (err: any) {
              Alert.alert("Error", err.message || "Could not delete account.");
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Settings" }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Pressable
            style={styles.row}
            onPress={() => setShowSupport((prev) => !prev)}
          >
            <Text style={styles.rowText}>Customer Service</Text>
            <Text style={styles.chevron}>{showSupport ? "−" : "+"}</Text>
          </Pressable>
          {showSupport && (
            <View style={styles.expandedContent}>
              <Text style={styles.supportText}>
                Need help? Reach out to us directly:
              </Text>
              <Pressable
                onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)}
              >
                <Text style={styles.supportLink}>📞 {SUPPORT_PHONE}</Text>
              </Pressable>
              <Pressable
                onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
              >
                <Text style={styles.supportLink}>✉️ {SUPPORT_EMAIL}</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Pressable
            style={styles.row}
            onPress={() => setShowTerms((prev) => !prev)}
          >
            <Text style={styles.rowText}>Terms of Service</Text>
            <Text style={styles.chevron}>{showTerms ? "−" : "+"}</Text>
          </Pressable>
          {showTerms && (
            <View style={styles.expandedContent}>
              <Text style={styles.termsText}>{TERMS_OF_SERVICE}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Pressable style={styles.row} onPress={handleLogout}>
            <Text style={styles.rowText}>Log Out</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Pressable
            style={styles.row}
            onPress={handleDeleteAccount}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator color="#A8442B" />
            ) : (
              <Text style={styles.deleteText}>Delete Account</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const CLAY = "#C1683C";
const RUST = "#A8442B";
const INK = "#2B2622";
const PAPER = "#FBF7F2";
const MUTED = "#8C8378";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PAPER,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 14,
    overflow: "hidden",
    shadowColor: INK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  rowText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 15,
    color: INK,
  },
  chevron: {
    fontFamily: "Manrope_700Bold",
    fontSize: 18,
    color: MUTED,
  },
  deleteText: {
    fontFamily: "Manrope_700Bold",
    fontSize: 15,
    color: RUST,
  },
  expandedContent: {
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  supportText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    color: MUTED,
    marginBottom: 10,
  },
  supportLink: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
    color: CLAY,
    marginBottom: 8,
  },
  termsText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    color: MUTED,
    lineHeight: 19,
  },
});