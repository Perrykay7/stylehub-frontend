import { router, Stack } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../data/authContext";
import { useTheme } from "../data/themeContext";
import { deleteAccount, fetchSalonById, fetchSalons, Salon } from "../api/client";
import {
  addCustomerServiceContact,
  CustomerServiceContact,
  deleteCustomerServiceContact,
  fetchOwnerSalons,
  OwnerSalon,
  updateCustomerServiceContact,
} from "../api/ownerClient";

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

const ABOUT_TEXT = `StyleHub was built to make booking your next haircut, braid, facial, or spa day as easy as a few taps. Browse trusted salons and spas near you, compare services and prices, and book an appointment in seconds — no phone tag, no waiting on hold.

Whether you're a customer looking for your next great look, a salon owner managing bookings and staff, or a professional building your own client base, StyleHub brings everyone together in one place.

Thank you for being part of our community — we're glad you're here.

Version 1.0.0`;

export default function SettingsScreen() {
  const { user, token, logout } = useAuth();
  const { theme, colors, toggleTheme } = useTheme();
  const [showTerms, setShowTerms] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Salon Contacts state (owner: manage their own; everyone else: browse)
  const [showSalonContacts, setShowSalonContacts] = useState(false);
  const [ownerSalons, setOwnerSalons] = useState<OwnerSalon[]>([]);
  const [selectedOwnerSalonId, setSelectedOwnerSalonId] = useState<string | null>(null);
  const [loadingOwnerSalons, setLoadingOwnerSalons] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [csLabel, setCsLabel] = useState("");
  const [csPhone, setCsPhone] = useState("");
  const [csEmail, setCsEmail] = useState("");
  const [savingCs, setSavingCs] = useState(false);

  const [browseSalons, setBrowseSalons] = useState<Salon[]>([]);
  const [browseSearch, setBrowseSearch] = useState("");
  const [loadingBrowseSalons, setLoadingBrowseSalons] = useState(false);
  const [selectedBrowseSalon, setSelectedBrowseSalon] = useState<Salon | null>(null);
  const [loadingBrowseContacts, setLoadingBrowseContacts] = useState(false);

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
    Alert.prompt(
      "Confirm Password",
      "Enter your password to permanently delete your account. This cannot be undone.",
      async (password) => {
        if (!password || !token) return;
        setDeleting(true);
        try {
          await deleteAccount(token, password);
          await logout();
          router.replace("/login");
        } catch (err: any) {
          Alert.alert("Error", err.message || "Could not delete account.");
        } finally {
          setDeleting(false);
        }
      },
      "secure-text"
    );
  }

  function resetContactForm() {
    setEditingContactId(null);
    setCsLabel("");
    setCsPhone("");
    setCsEmail("");
  }

  async function loadOwnerSalons() {
    if (!token) return;
    setLoadingOwnerSalons(true);
    try {
      const salons = await fetchOwnerSalons(token);
      setOwnerSalons(salons);
      setSelectedOwnerSalonId((prev) => prev || (salons.length > 0 ? salons[0].id : null));
    } catch {
      Alert.alert("Error", "Could not load your salons.");
    } finally {
      setLoadingOwnerSalons(false);
    }
  }

  async function loadBrowseSalons() {
    setLoadingBrowseSalons(true);
    try {
      const salons = await fetchSalons();
      setBrowseSalons(salons);
    } catch {
      // ignore — the search list just stays empty
    } finally {
      setLoadingBrowseSalons(false);
    }
  }

  function handleToggleSalonContacts() {
    const opening = !showSalonContacts;
    setShowSalonContacts(opening);
    if (opening) {
      if (user?.role === "owner") {
        if (ownerSalons.length === 0) loadOwnerSalons();
      } else if (browseSalons.length === 0) {
        loadBrowseSalons();
      }
    }
  }

  async function handleSelectBrowseSalon(salonId: string) {
    setLoadingBrowseContacts(true);
    setSelectedBrowseSalon(null);
    try {
      const salon = await fetchSalonById(salonId);
      setSelectedBrowseSalon(salon);
    } catch {
      Alert.alert("Error", "Could not load this salon's contacts.");
    } finally {
      setLoadingBrowseContacts(false);
    }
  }

  function handleStartEditContact(contact: CustomerServiceContact) {
    setEditingContactId(contact.id);
    setCsLabel(contact.label || "");
    setCsPhone(contact.phone || "");
    setCsEmail(contact.email || "");
  }

  async function handleSaveContact() {
    if (!token || !selectedOwnerSalonId) return;
    if (!csPhone.trim() && !csEmail.trim()) {
      Alert.alert("Missing info", "Enter a phone number or email for this contact.");
      return;
    }
    setSavingCs(true);
    try {
      const payload = { label: csLabel.trim(), phone: csPhone.trim(), email: csEmail.trim() };
      if (editingContactId) {
        await updateCustomerServiceContact(selectedOwnerSalonId, editingContactId, payload, token);
      } else {
        await addCustomerServiceContact(selectedOwnerSalonId, payload, token);
      }
      resetContactForm();
      await loadOwnerSalons();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not save this contact.");
    } finally {
      setSavingCs(false);
    }
  }

  function handleDeleteContact(contactId: string) {
    Alert.alert("Remove contact", "Remove this customer service contact?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          if (!token || !selectedOwnerSalonId) return;
          try {
            await deleteCustomerServiceContact(selectedOwnerSalonId, contactId, token);
            if (editingContactId === contactId) resetContactForm();
            await loadOwnerSalons();
          } catch {
            Alert.alert("Error", "Could not remove this contact.");
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: "Settings" }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.section, { backgroundColor: colors.sectionBg }]}>
          <View style={styles.row}>
            <Text style={[styles.rowText, { color: colors.text }]}>Dark Mode</Text>
            <Switch
              value={theme === "dark"}
              onValueChange={toggleTheme}
              trackColor={{ false: "#EFE6D9", true: "#C1683C" }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.sectionBg }]}>
          <Pressable style={styles.row} onPress={() => router.push("/loyalty" as any)}>
            <Text style={[styles.rowText, { color: colors.text }]}>🎁 Loyalty Rewards</Text>
            <Text style={[styles.chevron, { color: colors.muted }]}>›</Text>
          </Pressable>
        </View>

        <View style={[styles.section, { backgroundColor: colors.sectionBg }]}>
          <Pressable
            style={styles.row}
            onPress={() => setShowSupport((prev) => !prev)}
          >
            <Text style={[styles.rowText, { color: colors.text }]}>Customer Service</Text>
            <Text style={[styles.chevron, { color: colors.muted }]}>{showSupport ? "−" : "+"}</Text>
          </Pressable>
          {showSupport && (
            <View style={styles.expandedContent}>
              <Text style={[styles.supportText, { color: colors.muted }]}>
                Need help? Reach out to us directly:
              </Text>
              <Pressable onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)}>
                <Text style={styles.supportLink}>📞 {SUPPORT_PHONE}</Text>
              </Pressable>
              <Pressable onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>
                <Text style={styles.supportLink}>✉️ {SUPPORT_EMAIL}</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: colors.sectionBg }]}>
          <Pressable style={styles.row} onPress={handleToggleSalonContacts}>
            <Text style={[styles.rowText, { color: colors.text }]}>🏪 Salon Contacts</Text>
            <Text style={[styles.chevron, { color: colors.muted }]}>{showSalonContacts ? "−" : "+"}</Text>
          </Pressable>
          {showSalonContacts && (
            <View style={styles.expandedContent}>
              {user?.role === "owner" ? (
                loadingOwnerSalons ? (
                  <ActivityIndicator color={colors.clay} />
                ) : ownerSalons.length === 0 ? (
                  <Text style={[styles.supportText, { color: colors.muted }]}>
                    Add a salon first to manage its contacts.
                  </Text>
                ) : (
                  <>
                    {ownerSalons.length > 1 && (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                        <View style={{ flexDirection: "row", gap: 8 }}>
                          {ownerSalons.map((s) => (
                            <Pressable
                              key={s.id}
                              style={[styles.pill, selectedOwnerSalonId === s.id && styles.pillActive]}
                              onPress={() => {
                                setSelectedOwnerSalonId(s.id);
                                resetContactForm();
                              }}
                            >
                              <Text
                                style={[styles.pillText, selectedOwnerSalonId === s.id && styles.pillTextActive]}
                              >
                                {s.name}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      </ScrollView>
                    )}

                    {(() => {
                      const salon = ownerSalons.find((s) => s.id === selectedOwnerSalonId);
                      if (!salon) return null;
                      const contacts = salon.customerServiceContacts || [];
                      return (
                        <>
                          {contacts.length === 0 ? (
                            <Text style={[styles.supportText, { color: colors.muted }]}>No contacts added yet.</Text>
                          ) : (
                            contacts.map((contact) => (
                              <View key={contact.id} style={[styles.contactRow, { borderBottomColor: colors.border }]}>
                                <View style={{ flex: 1 }}>
                                  {contact.label ? (
                                    <Text style={[styles.contactLabel, { color: colors.text }]}>{contact.label}</Text>
                                  ) : null}
                                  {contact.phone ? (
                                    <Text style={[styles.supportText, { color: colors.muted, marginBottom: 2 }]}>
                                      📞 {contact.phone}
                                    </Text>
                                  ) : null}
                                  {contact.email ? (
                                    <Text style={[styles.supportText, { color: colors.muted, marginBottom: 0 }]}>
                                      ✉️ {contact.email}
                                    </Text>
                                  ) : null}
                                </View>
                                <View style={{ flexDirection: "row", gap: 14 }}>
                                  <Pressable onPress={() => handleStartEditContact(contact)}>
                                    <Text style={[styles.editText, { color: colors.clay }]}>Edit</Text>
                                  </Pressable>
                                  <Pressable onPress={() => handleDeleteContact(contact.id)}>
                                    <Text style={styles.deleteText}>Remove</Text>
                                  </Pressable>
                                </View>
                              </View>
                            ))
                          )}

                          <Text style={[styles.contactFormLabel, { color: colors.text }]}>
                            {editingContactId ? "Edit contact" : "Add a contact"}
                          </Text>
                          <TextInput
                            style={[styles.contactInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                            placeholder="Label (e.g. Bookings, Front Desk) — optional"
                            placeholderTextColor={colors.muted}
                            value={csLabel}
                            onChangeText={setCsLabel}
                          />
                          <TextInput
                            style={[styles.contactInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                            placeholder="Phone number"
                            placeholderTextColor={colors.muted}
                            keyboardType="phone-pad"
                            value={csPhone}
                            onChangeText={setCsPhone}
                          />
                          <TextInput
                            style={[styles.contactInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                            placeholder="Email address"
                            placeholderTextColor={colors.muted}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={csEmail}
                            onChangeText={setCsEmail}
                          />
                          <View style={{ flexDirection: "row", gap: 8 }}>
                            <Pressable
                              style={[styles.smallBtn, savingCs && { opacity: 0.6 }]}
                              onPress={handleSaveContact}
                              disabled={savingCs}
                            >
                              <Text style={styles.smallBtnText}>
                                {savingCs ? "Saving..." : editingContactId ? "Save Changes" : "Add Contact"}
                              </Text>
                            </Pressable>
                            {editingContactId && (
                              <Pressable style={styles.smallBtnCancel} onPress={resetContactForm}>
                                <Text style={[styles.smallBtnCancelText, { color: colors.muted }]}>Cancel</Text>
                              </Pressable>
                            )}
                          </View>
                          <Text style={[styles.supportText, { color: colors.muted, marginTop: 8, marginBottom: 0 }]}>
                            Add up to 5 contacts. Only you can edit your own salon's contacts.
                          </Text>
                        </>
                      );
                    })()}
                  </>
                )
              ) : (
                <>
                  <TextInput
                    style={[styles.contactInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    placeholder="Search salons..."
                    placeholderTextColor={colors.muted}
                    value={browseSearch}
                    onChangeText={setBrowseSearch}
                  />
                  {loadingBrowseSalons ? (
                    <ActivityIndicator color={colors.clay} />
                  ) : (
                    browseSalons
                      .filter((s) => s.name.toLowerCase().includes(browseSearch.trim().toLowerCase()))
                      .slice(0, 20)
                      .map((s) => (
                        <View key={s.id}>
                          <Pressable
                            style={styles.browseSalonRow}
                            onPress={() => {
                              if (selectedBrowseSalon?.id === s.id) {
                                setSelectedBrowseSalon(null);
                              } else {
                                handleSelectBrowseSalon(s.id);
                              }
                            }}
                          >
                            <Text style={[styles.supportText, { color: colors.text, marginBottom: 0 }]}>{s.name}</Text>
                            <Text style={[styles.chevron, { color: colors.muted }]}>
                              {selectedBrowseSalon?.id === s.id ? "−" : "+"}
                            </Text>
                          </Pressable>
                          {selectedBrowseSalon?.id === s.id &&
                            (loadingBrowseContacts ? (
                              <ActivityIndicator color={colors.clay} />
                            ) : (selectedBrowseSalon.customerServiceContacts || []).length === 0 ? (
                              <Text style={[styles.supportText, { color: colors.muted }]}>No contacts listed.</Text>
                            ) : (
                              selectedBrowseSalon.customerServiceContacts.map((contact) => (
                                <View key={contact.id} style={{ marginBottom: 8, marginLeft: 8 }}>
                                  {contact.label ? (
                                    <Text style={[styles.contactLabel, { color: colors.text }]}>{contact.label}</Text>
                                  ) : null}
                                  {contact.phone && (
                                    <Pressable onPress={() => Linking.openURL(`tel:${contact.phone}`)}>
                                      <Text style={styles.supportLink}>📞 {contact.phone}</Text>
                                    </Pressable>
                                  )}
                                  {contact.email && (
                                    <Pressable onPress={() => Linking.openURL(`mailto:${contact.email}`)}>
                                      <Text style={styles.supportLink}>✉️ {contact.email}</Text>
                                    </Pressable>
                                  )}
                                </View>
                              ))
                            ))}
                        </View>
                      ))
                  )}
                </>
              )}
            </View>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: colors.sectionBg }]}>
          <Pressable
            style={styles.row}
            onPress={() => setShowTerms((prev) => !prev)}
          >
            <Text style={[styles.rowText, { color: colors.text }]}>Terms of Service</Text>
            <Text style={[styles.chevron, { color: colors.muted }]}>{showTerms ? "−" : "+"}</Text>
          </Pressable>
          {showTerms && (
            <View style={styles.expandedContent}>
              <Text style={[styles.termsText, { color: colors.muted }]}>{TERMS_OF_SERVICE}</Text>
            </View>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: colors.sectionBg }]}>
          <Pressable
            style={styles.row}
            onPress={() => setShowAbout((prev) => !prev)}
          >
            <Text style={[styles.rowText, { color: colors.text }]}>About</Text>
            <Text style={[styles.chevron, { color: colors.muted }]}>{showAbout ? "−" : "+"}</Text>
          </Pressable>
          {showAbout && (
            <View style={styles.expandedContent}>
              <Text style={[styles.termsText, { color: colors.muted }]}>{ABOUT_TEXT}</Text>
            </View>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: colors.sectionBg }]}>
          <Pressable style={styles.row} onPress={handleLogout}>
            <Text style={[styles.rowText, { color: colors.text }]}>Log Out</Text>
          </Pressable>
        </View>

        <View style={[styles.section, { backgroundColor: colors.sectionBg }]}>
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
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F0E9E1",
  },
  pillActive: { backgroundColor: CLAY },
  pillText: { fontFamily: "Manrope_600SemiBold", fontSize: 13, color: MUTED },
  pillTextActive: { color: "#fff" },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  contactLabel: {
    fontFamily: "Manrope_700Bold",
    fontSize: 13,
    marginBottom: 2,
  },
  editText: {
    fontFamily: "Manrope_700Bold",
    fontSize: 13,
  },
  contactFormLabel: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13,
    marginTop: 12,
    marginBottom: 8,
  },
  contactInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    marginBottom: 10,
  },
  smallBtn: {
    flex: 1,
    backgroundColor: CLAY,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  smallBtnText: {
    fontFamily: "Manrope_700Bold",
    fontSize: 14,
    color: "#fff",
  },
  smallBtnCancel: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  smallBtnCancelText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
  },
  browseSalonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
});