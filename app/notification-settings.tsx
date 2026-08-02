import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../data/authContext";
import { useTheme } from "../data/themeContext";
import {
  fetchNotificationPreferences,
  NotificationPreferences,
  updateNotificationPreferences,
} from "../api/client";

type PrefKey = keyof NotificationPreferences;

function PrefRow({
  label,
  value,
  onChange,
  saving,
  disabled,
  comingSoon,
  colors,
}: {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
  saving: boolean;
  disabled?: boolean;
  comingSoon?: boolean;
  colors: any;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
        {comingSoon && (
          <View style={[styles.badge, { backgroundColor: colors.border }]}>
            <Text style={[styles.badgeText, { color: colors.muted }]}>Coming soon</Text>
          </View>
        )}
      </View>
      {saving ? (
        <ActivityIndicator size="small" color={colors.clay} />
      ) : (
        <Switch
          value={value}
          onValueChange={onChange}
          disabled={disabled}
          trackColor={{ false: colors.border, true: colors.clay }}
          thumbColor="#fff"
        />
      )}
    </View>
  );
}

export default function NotificationSettingsScreen() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<PrefKey | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchNotificationPreferences(token)
      .then(setPrefs)
      .finally(() => setLoading(false));
  }, [token]);

  async function handleToggle(key: PrefKey, next: boolean) {
    if (!token || !prefs) return;
    const updated = { ...prefs, [key]: next };
    setPrefs(updated);
    setSavingKey(key);
    try {
      await updateNotificationPreferences(updated, token);
    } catch {
      setPrefs(prefs);
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: "Notification settings" }} />
      {loading || !prefs ? (
        <ActivityIndicator style={{ marginTop: 60 }} size="large" color={colors.clay} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appointment notifications</Text>
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <PrefRow
              label="Text message"
              value={prefs.smsAppointmentNotifications}
              onChange={(v) => handleToggle("smsAppointmentNotifications", v)}
              saving={savingKey === "smsAppointmentNotifications"}
              colors={colors}
            />
            <PrefRow
              label="WhatsApp"
              value={prefs.whatsappAppointmentNotifications}
              onChange={(v) => handleToggle("whatsappAppointmentNotifications", v)}
              saving={savingKey === "whatsappAppointmentNotifications"}
              disabled
              comingSoon
              colors={colors}
            />
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>
            Marketing notifications
          </Text>
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <PrefRow
              label="Text message"
              value={prefs.smsMarketingNotifications}
              onChange={(v) => handleToggle("smsMarketingNotifications", v)}
              saving={savingKey === "smsMarketingNotifications"}
              colors={colors}
            />
            <PrefRow
              label="WhatsApp"
              value={prefs.whatsappMarketingNotifications}
              onChange={(v) => handleToggle("whatsappMarketingNotifications", v)}
              saving={savingKey === "whatsappMarketingNotifications"}
              disabled
              comingSoon
              colors={colors}
            />
          </View>

          <Text style={[styles.hint, { color: colors.muted }]}>
            Standard messaging rates may apply. You'll always get push notifications for
            appointment updates regardless of these settings.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  sectionTitle: {
    fontFamily: "Manrope_700Bold",
    fontSize: 15,
    marginBottom: 10,
  },
  section: {
    borderRadius: 14,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowLabel: {
    fontFamily: "Manrope_500Medium",
    fontSize: 15,
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 10,
  },
  hint: {
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 20,
  },
});
