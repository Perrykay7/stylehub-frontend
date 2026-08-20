import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../data/authContext";
import { useTheme } from "../../data/themeContext";
import { fetchMyConversations, fetchNotifications } from "../../api/client";
import { fetchAllOwnerConversations } from "../../api/ownerClient";

export default function ProfileScreen() {
  const { user, token } = useAuth();
  const { colors } = useTheme();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const isOwner = user?.role === "owner";

  useEffect(() => {
    if (!token) return;
    fetchNotifications(token)
      .then((data) => setUnreadNotifications(data.filter((n) => !n.read).length))
      .catch(() => {});
    const fetchConversations = isOwner ? fetchAllOwnerConversations : fetchMyConversations;
    fetchConversations(token)
      .then((data) => setUnreadMessages(data.reduce((sum, c) => sum + c.unreadCount, 0)))
      .catch(() => {});
  }, [token, isOwner]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>STYLEHUB</Text>
        <Text style={[styles.name, { color: colors.text }]}>{user?.name}</Text>
        <Text style={[styles.phone, { color: colors.muted }]}>{user?.phone}</Text>

        <View style={[styles.section, { backgroundColor: colors.sectionBg }]}>
          <Pressable
            style={styles.row}
            onPress={() => {
              setUnreadNotifications(0);
              router.push("/notifications" as any);
            }}
          >
            <View style={styles.rowLeft}>
              <Text style={[styles.rowText, { color: colors.text }]}>🔔 Notifications</Text>
              {unreadNotifications > 0 && (
                <View style={styles.notificationsBadge}>
                  <Text style={styles.notificationsBadgeText}>
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.rowArrow, { color: colors.muted }]}>›</Text>
          </Pressable>
          <Pressable
            style={styles.row}
            onPress={() => router.push((isOwner ? "/owner-messages" : "/messages") as any)}
          >
            <View style={styles.rowLeft}>
              <Text style={[styles.rowText, { color: colors.text }]}>💬 Messages</Text>
              {unreadMessages > 0 && (
                <View style={styles.notificationsBadge}>
                  <Text style={styles.notificationsBadgeText}>
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.rowArrow, { color: colors.muted }]}>›</Text>
          </Pressable>
          <Pressable style={styles.row} onPress={() => router.push("/edit-profile" as any)}>
            <Text style={[styles.rowText, { color: colors.text }]}>📝 Edit Profile</Text>
            <Text style={[styles.rowArrow, { color: colors.muted }]}>›</Text>
          </Pressable>
          <Pressable style={styles.row} onPress={() => router.push("/favorites" as any)}>
            <Text style={[styles.rowText, { color: colors.text }]}>❤️ My Favorites</Text>
            <Text style={[styles.rowArrow, { color: colors.muted }]}>›</Text>
          </Pressable>
          {user?.role === "owner" && (
            <Pressable style={styles.row} onPress={() => router.push("/owner-dashboard" as any)}>
              <Text style={[styles.rowText, { color: colors.text }]}>📊 Dashboard</Text>
              <Text style={[styles.rowArrow, { color: colors.muted }]}>›</Text>
            </Pressable>
          )}
          {user?.role === "professional" && (
            <Pressable style={styles.row} onPress={() => router.push("/professional-dashboard" as any)}>
              <Text style={[styles.rowText, { color: colors.text }]}>📅 My Schedule</Text>
              <Text style={[styles.rowArrow, { color: colors.muted }]}>›</Text>
            </Pressable>
          )}
          {user?.role === "owner" && (
            <Pressable style={styles.row} onPress={() => router.push("/my-salon")}>
              <Text style={[styles.rowText, { color: colors.text }]}>💈 My Salon</Text>
              <Text style={[styles.rowArrow, { color: colors.muted }]}>›</Text>
            </Pressable>
          )}
          <Pressable style={styles.row} onPress={() => router.push("/report-issue" as any)}>
            <Text style={[styles.rowText, { color: colors.text }]}>🐞 Report an Issue</Text>
            <Text style={[styles.rowArrow, { color: colors.muted }]}>›</Text>
          </Pressable>
          <Pressable
            style={styles.row}
            onPress={() => router.push("/settings")}
          >
            <Text style={[styles.rowText, { color: colors.text }]}>⚙️ Settings</Text>
            <Text style={[styles.rowArrow, { color: colors.muted }]}>›</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const CLAY = "#C1683C";
const INK = "#2B2622";
const PAPER = "#FBF7F2";
const MUTED = "#8C8378";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PAPER,
  },
  content: {
    padding: 20,
  },
  eyebrow: {
    fontFamily: "Manrope_700Bold",
    fontSize: 11,
    letterSpacing: 2,
    color: CLAY,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  name: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 26,
    color: INK,
  },
  phone: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    color: MUTED,
    marginTop: 4,
    marginBottom: 24,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: INK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  row: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#F3ECE2",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 15,
    color: INK,
  },
  rowArrow: {
    fontFamily: "Manrope_400Regular",
    fontSize: 20,
    color: MUTED,
  },
  notificationsBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#A8442B",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  notificationsBadgeText: {
    fontFamily: "Manrope_700Bold",
    fontSize: 10,
    color: "#fff",
  },
});