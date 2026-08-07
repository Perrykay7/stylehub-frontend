import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../data/authContext";
import { useTheme } from "../data/themeContext";
import { fetchMyConversations, fetchSalons, Salon, SalonConversation } from "../api/client";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function MessagesScreen() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [conversations, setConversations] = useState<SalonConversation[]>([]);
  const [loading, setLoading] = useState(true);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [allSalons, setAllSalons] = useState<Salon[]>([]);
  const [salonsLoading, setSalonsLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!token) return;
    fetchMyConversations(token)
      .then(setConversations)
      .finally(() => setLoading(false));
  }, [token]);

  function openPicker() {
    setSearch("");
    setPickerVisible(true);
    if (allSalons.length === 0) {
      setSalonsLoading(true);
      fetchSalons()
        .then(setAllSalons)
        .finally(() => setSalonsLoading(false));
    }
  }

  function goToChat(salonId: string, salonName: string) {
    setPickerVisible(false);
    // Wait for the modal to finish its close animation before navigating —
    // closing it and pushing a new screen in the same tick can leave the
    // modal's native presentation half-torn-down, breaking this screen
    // underneath when the user comes back to it.
    setTimeout(() => {
      router.push({ pathname: "/chat/[salonId]", params: { salonId, salonName } } as any);
    }, 300);
  }

  const filteredSalons = allSalons.filter((s) =>
    s.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: "Messages" }} />
      <Pressable style={[styles.newBtn, { borderColor: colors.clay }]} onPress={openPicker}>
        <Text style={[styles.newBtnText, { color: colors.clay }]}>+ New Message</Text>
      </Pressable>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} size="large" color={colors.clay} />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(c) => c.salonId}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No messages yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                Tap "+ New Message" above to message a salon.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.row, { backgroundColor: colors.card }]}
              onPress={() => goToChat(item.salonId, item.salonName)}
            >
              <View style={{ flex: 1 }}>
                <View style={styles.rowTop}>
                  <Text style={[styles.salonName, { color: colors.text }]}>{item.salonName}</Text>
                  <Text style={[styles.time, { color: colors.muted }]}>{timeAgo(item.lastMessageAt)}</Text>
                </View>
                <Text style={[styles.lastMessage, { color: colors.muted }]} numberOfLines={1}>
                  {item.lastMessage}
                </Text>
              </View>
              {item.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
                </View>
              )}
            </Pressable>
          )}
        />
      )}

      <Modal visible={pickerVisible} animationType="slide" onRequestClose={() => setPickerVisible(false)}>
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={styles.pickerHeader}>
            <Text style={[styles.pickerTitle, { color: colors.text }]}>Message a Salon</Text>
            <Pressable onPress={() => setPickerVisible(false)}>
              <Text style={[styles.pickerCancel, { color: colors.clay }]}>Cancel</Text>
            </Pressable>
          </View>
          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            placeholder="Search salons..."
            placeholderTextColor={colors.muted}
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
          {salonsLoading ? (
            <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.clay} />
          ) : (
            <FlatList
              data={filteredSalons}
              keyExtractor={(s) => s.id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <Text style={[styles.emptySubtitle, { color: colors.muted, marginTop: 30 }]}>
                  No salons found.
                </Text>
              }
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.row, { backgroundColor: colors.card }]}
                  onPress={() => goToChat(item.id, item.name)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.salonName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.lastMessage, { color: colors.muted }]}>{item.category}</Text>
                  </View>
                </Pressable>
              )}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  newBtn: {
    alignSelf: "flex-start",
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  newBtnText: { fontFamily: "Manrope_700Bold", fontSize: 13 },
  listContent: { padding: 16, paddingBottom: 32 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  rowTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  salonName: { fontFamily: "Manrope_700Bold", fontSize: 15 },
  time: { fontFamily: "Manrope_500Medium", fontSize: 12 },
  lastMessage: { fontFamily: "Manrope_500Medium", fontSize: 13 },
  unreadBadge: {
    backgroundColor: "#C1683C",
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadBadgeText: { fontFamily: "Manrope_700Bold", fontSize: 11, color: "#fff" },
  emptyState: { alignItems: "center", marginTop: 80, paddingHorizontal: 30 },
  emptyTitle: { fontFamily: "Manrope_700Bold", fontSize: 16, marginBottom: 6 },
  emptySubtitle: { fontFamily: "Manrope_500Medium", fontSize: 13, textAlign: "center" },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  pickerTitle: { fontFamily: "PlayfairDisplay_700Bold", fontSize: 20 },
  pickerCancel: { fontFamily: "Manrope_700Bold", fontSize: 14 },
  searchInput: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
  },
});
