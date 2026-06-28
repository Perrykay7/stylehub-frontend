import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../data/themeContext";

export default function BookingConfirmationScreen() {
  const { colors } = useTheme();
  const { salonName, serviceName, dateLabel, time, price } =
    useLocalSearchParams<{
      salonName: string;
      serviceName: string;
      dateLabel: string;
      time: string;
      price: string;
    }>();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.inner}>
        <View style={[styles.iconCircle, { backgroundColor: colors.card }]}>
          <Ionicons name="checkmark-circle" size={72} color="#C1683C" />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Booking Confirmed!</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Your appointment has been booked successfully.
        </Text>

        <View style={[styles.detailCard, { backgroundColor: colors.card }]}>
          <Row label="Salon" value={salonName} colors={colors} />
          <Row label="Service" value={serviceName} colors={colors} />
          <Row label="Date" value={dateLabel} colors={colors} />
          <Row label="Time" value={time} colors={colors} />
          <Row label="Price" value={`GHS ${price}`} colors={colors} last />
        </View>

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
