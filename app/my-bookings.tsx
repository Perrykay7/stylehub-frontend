import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../data/authContext";
import { Booking, cancelBooking, fetchBookings } from "./api/client";

function BookingItem({
  booking,
  onCancel,
}: {
  booking: Booking;
  onCancel: (id: string) => void;
}) {
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
      <Pressable
        style={styles.cancelButton}
        onPress={() => onCancel(booking.id)}
      >
        <Text style={styles.cancelButtonText}>Cancel Booking</Text>
      </Pressable>
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
            } catch {
              Alert.alert("Error", "Could not cancel booking. Please try again.");
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "My Bookings" }} />
      {loading ? (
        <ActivityIndicator style={styles.loading} size="large" color="#C1683C" />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BookingItem booking={item} onCancel={handleCancel} />
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