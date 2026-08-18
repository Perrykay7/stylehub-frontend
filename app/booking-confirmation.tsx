import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as StoreReview from "expo-store-review";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../data/themeContext";

const BOOKING_COUNT_KEY = "stylehub_booking_count";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatIcsLocal(d: Date) {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(
    d.getHours()
  )}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function formatIcsUtc(d: Date) {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(
    d.getUTCHours()
  )}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function escapeIcsText(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function buildIcsContent(event: {
  uid: string;
  start: Date;
  end: Date;
  summary: string;
  location: string;
  description: string;
}) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//StyleHub//Booking//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${formatIcsUtc(new Date())}`,
    `DTSTART:${formatIcsLocal(event.start)}`,
    `DTEND:${formatIcsLocal(event.end)}`,
    `SUMMARY:${escapeIcsText(event.summary)}`,
    `LOCATION:${escapeIcsText(event.location)}`,
    `DESCRIPTION:${escapeIcsText(event.description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

export default function BookingConfirmationScreen() {
  const { colors } = useTheme();
  const [addingToCalendar, setAddingToCalendar] = useState(false);

  useEffect(() => {
    (async () => {
      const raw = await SecureStore.getItemAsync(BOOKING_COUNT_KEY);
      const count = parseInt(raw || "0", 10) + 1;
      await SecureStore.setItemAsync(BOOKING_COUNT_KEY, String(count));
      // Ask for a rating after the 3rd booking and every 10 after that
      if (count === 3 || (count > 3 && (count - 3) % 10 === 0)) {
        const isAvailable = await StoreReview.isAvailableAsync();
        if (isAvailable) {
          await StoreReview.requestReview();
        }
      }
    })();
  }, []);
  const { salonName, salonAddress, serviceName, date, dateLabel, time, durationMins, price, tipAmount, professionalName, notes } =
    useLocalSearchParams<{
      salonName: string;
      salonAddress: string;
      serviceName: string;
      date: string;
      dateLabel: string;
      time: string;
      durationMins: string;
      price: string;
      tipAmount?: string;
      professionalName?: string;
      notes?: string;
    }>();

  const parsedTip = parseFloat(tipAmount || "0") || 0;
  const total = Math.round((parseFloat(price || "0") + parsedTip) * 100) / 100;
  const hasNotes = !!notes && notes.trim().length > 0;

  async function handleAddToCalendar() {
    if (!date || !time) return;
    setAddingToCalendar(true);
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert("Not available", "Sharing isn't available on this device.");
        return;
      }

      const start = new Date(`${date}T${time}:00`);
      const minutes = parseInt(durationMins || "30", 10) || 30;
      const end = new Date(start.getTime() + minutes * 60000);

      const icsContent = buildIcsContent({
        uid: `${Date.now()}-stylehub@stylehub.app`,
        start,
        end,
        summary: `${serviceName || "Appointment"} at ${salonName || "StyleHub"}`,
        location: salonAddress || salonName || "",
        description: `Booked via StyleHub. ${serviceName || ""} at ${salonName || ""}.`,
      });

      const file = new File(Paths.cache, `stylehub-${Date.now()}.ics`);
      file.create();
      file.write(icsContent);

      await Sharing.shareAsync(file.uri, {
        mimeType: "text/calendar",
        dialogTitle: "Add to Calendar",
        UTI: "com.apple.ical.ics",
      });
    } catch (err) {
      Alert.alert("Couldn't add to calendar", "Please try again.");
    } finally {
      setAddingToCalendar(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.inner}>
        <View style={[styles.iconCircle, { backgroundColor: colors.card }]}>
          <Ionicons name="checkmark-circle" size={72} color="#C1683C" />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Thank You!</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          We truly appreciate you choosing {salonName || "us"}. Your appointment has been
          confirmed, and we look forward to giving you a wonderful experience.
        </Text>

        <View style={[styles.detailCard, { backgroundColor: colors.card }]}>
          <Row label="Salon" value={salonName} colors={colors} />
          <Row label="Service" value={serviceName} colors={colors} />
          {!!professionalName && <Row label="Professional" value={professionalName} colors={colors} />}
          <Row label="Date" value={dateLabel} colors={colors} />
          <Row label="Time" value={time} colors={colors} />
          <Row label="Price" value={`GHS ${price}`} colors={colors} last={parsedTip <= 0} />
          {parsedTip > 0 && <Row label="Tip" value={`GHS ${parsedTip.toFixed(2)}`} colors={colors} />}
          {parsedTip > 0 && <Row label="Total" value={`GHS ${total.toFixed(2)}`} colors={colors} last />}
        </View>

        {hasNotes && (
          <View style={[styles.notesCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.notesLabel, { color: colors.muted }]}>Your note to the salon</Text>
            <Text style={[styles.notesText, { color: colors.text }]}>{notes}</Text>
          </View>
        )}

        <Pressable
          style={[styles.calendarButton, { borderColor: colors.border }]}
          onPress={handleAddToCalendar}
          disabled={addingToCalendar}
        >
          <Ionicons name="calendar-outline" size={18} color="#C1683C" />
          <Text style={styles.calendarButtonText}>
            {addingToCalendar ? "Preparing…" : "Add to Calendar"}
          </Text>
        </Pressable>

        <Pressable
          style={styles.primaryButton}
          onPress={() => router.replace("/(tabs)/my-bookings" as any)}
        >
          <Text style={styles.primaryButtonText}>View My Bookings</Text>
        </Pressable>

        <Pressable
          style={[styles.secondaryButton, { borderColor: colors.border }]}
          onPress={() => router.replace("/(tabs)" as any)}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Back to Home</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Row({
  label,
  value,
  colors,
  last,
}: {
  label: string;
  value: string;
  colors: any;
  last?: boolean;
}) {
  return (
    <View style={[styles.detailRow, !last && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <Text style={[styles.detailLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  title: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 26,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 20,
  },
  detailCard: {
    width: "100%",
    borderRadius: 18,
    marginBottom: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  detailLabel: { fontFamily: "Manrope_500Medium", fontSize: 14 },
  detailValue: { fontFamily: "Manrope_700Bold", fontSize: 14 },
  notesCard: {
    width: "100%",
    borderRadius: 18,
    padding: 16,
    marginBottom: 24,
    marginTop: -8,
  },
  notesLabel: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 12,
    marginBottom: 4,
  },
  notesText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    lineHeight: 20,
  },
  calendarButton: {
    flexDirection: "row",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: 12,
    borderWidth: 1.5,
  },
  calendarButtonText: {
    fontFamily: "Manrope_700Bold",
    color: "#C1683C",
    fontSize: 15,
  },
  primaryButton: {
    backgroundColor: "#C1683C",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    width: "100%",
    marginBottom: 12,
  },
  primaryButtonText: { fontFamily: "Manrope_700Bold", color: "#fff", fontSize: 15 },
  secondaryButton: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    width: "100%",
    borderWidth: 1.5,
  },
  secondaryButtonText: { fontFamily: "Manrope_700Bold", fontSize: 15 },
});
