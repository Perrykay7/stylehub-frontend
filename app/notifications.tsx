import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../data/authContext";
import { useTheme } from "../data/themeContext";
import { AppNotification, fetchNotifications, markAllNotificationsRead } from "../api/client";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function NotificationRow({ item, colors }: { item: AppNotification; colors: any }) {
  return (
    <View
      style={[
        styles.row,
        { backgroundColor: colors.card, borderColor: colors.border },
        !item.read && { borderLeftColor: colors.clay, borderLeftWidth: 3 },
      ]}
    >
      <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
      <Text style={[styles.body, { color: colors.muted }]}>{item.body}</Text>
      <Text style={[styles.time, { color: colors.muted }]}>{timeAgo(item.createdAt)}</Text>
    </View>
  );
}

export default function NotificationsScreen() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  function load(markRead: boolean) {
    if (!token) return Promise.resolve();
    return fetchNotifications(token).then((data) => {
      setNotifications(data);
      if (markRead && data.some((n) => !n.read)) {
        markAllNotificationsRead(token).catch(() => {});
      }
    });
  }

  useEffect(() => {
    load(true).finally(() => setLoading(false));
  }, [token]);

  function handleRefresh() {
    setRefreshing(true);
    load(true).finally(() => setRefreshing(false));
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: "Notifications",
          headerRight: () => (
            <Pressable onPress={() => router.push("/notification-settings" as any)} hitSlop={10}>
              <Text style={{ fontSize: 20 }}>⚙️</Text>
            </Pressable>
          ),
        }}
      />
      {loading ? (
        <ActivityIndicator style={styles.loading} size="large" color={colors.clay} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <NotificationRow item={item} colors={colors} />}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.clay} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No notifications yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                Booking updates and reminders will show up here.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { marginTop: 60 },
  listContent: { padding: 16, paddingBottom: 32 },
  row: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  title: { fontFamily: "Manrope_700Bold", fontSize: 14, marginBottom: 3 },
  body: { fontFamily: "Manrope_500Medium", fontSize: 13, lineHeight: 18 },
  time: { fontFamily: "Manrope_500Medium", fontSize: 11, marginTop: 6 },
  emptyState: { alignItems: "center", marginTop: 80, paddingHorizontal: 30 },
  emptyTitle: { fontFamily: "Manrope_700Bold", fontSize: 16, marginBottom: 6 },
  emptySubtitle: { fontFamily: "Manrope_500Medium", fontSize: 13, textAlign: "center" },
});
