import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../data/authContext";
import { useTheme } from "../data/themeContext";
import { fetchMyConversations, SalonConversation } from "../api/client";

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
  const [conversations, setConversations] = useState<SalonConversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetchMyConversations(token)
      .then(setConversations)
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: "Messages" }} />
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
                Message a salon from their page to start a conversation.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.row, { backgroundColor: colors.card }]}
              onPress={() =>
                router.push({
                  pathname: "/chat/[salonId]",
                  params: { salonId: item.salonId, salonName: item.salonName },
                } as any)
              }
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
});
