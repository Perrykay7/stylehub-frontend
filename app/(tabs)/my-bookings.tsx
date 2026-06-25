import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../data/authContext";
import { Booking, cancelBooking, fetchBookings } from "../api/client";

function getAppointmentDateTime(booking: Booking) {
  return new Date(`${booking.date}T${booking.time}:00`);
}

function getHoursUntil(booking: Booking) {
  const appointmentDateTime = getAppointmentDateTime(booking);
  return (appointmentDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
}

function BookingItem({
  booking,
  isUpcoming,
  onCancel,
}: {
  booking: Booking;
  isUpcoming: boolean;
  onCancel: (id: string) => void;
}) {
  const hoursUntil = getHoursUntil(booking);
  const canCancel = isUpcoming && hoursUntil >= 2;

  return (
    <View style={styles.card}>
      <Text style={styles.salonName}>{booking.salonName}</Text>
      <Text style={styles.serviceName}>{booking.serviceName}</Text>
      <View style={styles.row}>
        <Text style={styles.meta}>
          {booking.dateLabel} · {booking.time}
        </Text>
        <Text style={styles.price}>GHS {booking.price}</Text>
      </View>

      {isUpcoming && (
        canCancel ? (
          <Pressable
            style={styles.cancelButton}
            onPress={() => onCancel(booking.id)}
          >
            <Text style={styles.cancelButtonText}>Cancel Booking</Text>
          </Pressable>
        ) : (
          <Text style={styles.cancelDisabledText}>
            Cancellations must be made at least 2 hours before your appointment.
          </Text>
        )
      )}
    </View>
  );
}

export default function MyBookingsScreen() {
  const { token } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function loadBookings() {
    if (!token) return;
    fetchBookings(token)
      .then((data) => {
        setBookings(data);
        setError(null);
      })
      .catch(() => setError("Could not load bookings."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadBookings();
  }, [token]);

  function handleCancel(bookingId: string) {
    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this booking? This cannot be undone.",
      [
        { text: "Keep Booking", style: "cancel" },
        {
          text: "Cancel Booking",
          style: "destructive",
          onPress: async () => {
            if (!token) return;
            try {
              await cancelBooking(bookingId, token);
              setBookings((prev) => prev.filter((b) => b.id !== bookingId));
            } catch (err: any) {
              Alert.alert(
                "Error",
                err.message || "Could not cancel booking. Please try again."
              );
            }
          },
        },
      ]
    );
  }

  const now = Date.now();
  const upcoming = bookings
    .filter((b) => getAppointmentDateTime(b).getTime() >= now)
    .sort(
      (a, b) =>
        getAppointmentDateTime(a).getTime() - getAppointmentDateTime(b).getTime()
    );
  const past = bookings
    .filter((b) => getAppointmentDateTime(b).getTime() < now)
    .sort(
      (a, b) =>
        getAppointmentDateTime(b).getTime() - getAppointmentDateTime(a).getTime()
    );

  const sections = [
    { title: "Upcoming", data: upcoming, isUpcoming: true },
    { title: "Past", data: past, isUpcoming: false },
  ].filter((section) => section.data.length > 0);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "My Bookings" }} />
      {loading ? (
        <ActivityIndicator style={styles.loading} size="large" color="#C1683C" />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item, section }) => (
            <BookingItem
              booking={item}
              isUpcoming={section.isUpcoming}
              onCancel={handleCancel}
            />
          )}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No bookings yet</Text>
              <Text style={styles.emptySubtitle}>
                Book a service from a salon to see it here.
              </Text>
            </View>
          }
        />
      )}
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
  loading: {
    marginTop: 60,
  },
  errorText: {
    fontFamily: "Manrope_500Medium",
    textAlign: "center",
    marginTop: 40,
    fontSize: 14,
    color: RUST,
    paddingHorizontal: 24,
  },
  listContent: {
    padding: 16,
  },
  sectionHeader: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 18,
    color: INK,
    marginTop: 12,
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  salonName: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13,
    color: MUTED,
  },
  serviceName: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 19,
    color: INK,
    marginTop: 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  meta: {
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    color: MUTED,
  },
  price: {
    fontFamily: "Manrope_700Bold",
    fontSize: 14,
    color: CLAY,
  },
  cancelButton: {
    marginTop: 14,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: RUST,
  },
  cancelButtonText: {
    fontFamily: "Manrope_700Bold",
    color: RUST,
    fontSize: 13,
  },
  cancelDisabledText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    color: MUTED,
    marginTop: 14,
    textAlign: "center",
  },
  emptyState: {
    alignItems: "center",
    marginTop: 80,
  },
  emptyTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 19,
    color: INK,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    color: MUTED,
    textAlign: "center",
    paddingHorizontal: 32,
  },
});