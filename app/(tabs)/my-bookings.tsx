import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../data/authContext";
import { useTheme } from "../../data/themeContext";
import { Booking, cancelBooking, fetchBookings, rateProfessional } from "../api/client";
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
  onRate,
}: {
  booking: Booking;
  isUpcoming: boolean;
  onCancel: (id: string) => void;
  onRate: (booking: Booking) => void;
}) {
  const { colors } = useTheme();
  const hoursUntil = getHoursUntil(booking);
  const canCancel = isUpcoming && hoursUntil >= 2;

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <Text style={[styles.salonName, { color: colors.muted }]}>{booking.salonName}</Text>
      <Text style={[styles.serviceName, { color: colors.text }]}>{booking.serviceName}</Text>
      {booking.professionalName && (
        <Text style={[styles.meta, { color: colors.muted }]}>With {booking.professionalName}</Text>
      )}
      <View style={styles.row}>
        <Text style={[styles.meta, { color: colors.muted }]}>
          {booking.dateLabel} · {booking.time}
        </Text>
        <Text style={styles.price}>GHS {booking.price}</Text>
      </View>

      {isUpcoming &&
        (canCancel ? (
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
        ))}

      {!isUpcoming && booking.professionalId && !booking.hasRating && (
        <Pressable style={styles.rateButton} onPress={() => onRate(booking)}>
          <Text style={styles.rateButtonText}>
            Rate {booking.professionalName}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export default function MyBookingsScreen() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [ratingBooking, setRatingBooking] = useState<Booking | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

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

  async function handleSubmitRating() {
    if (!token || !ratingBooking) return;
    if (ratingValue === 0) {
      Alert.alert("Select a rating", "Please tap a star to rate.");
      return;
    }
    setSubmittingRating(true);
    try {
      await rateProfessional(
        ratingBooking.professionalId!,
        {
          bookingId: ratingBooking.id,
          rating: ratingValue,
          comment: ratingComment || undefined,
        },
        token
      );
      setBookings((prev) =>
        prev.map((b) =>
          b.id === ratingBooking.id ? { ...b, hasRating: 1 } : b
        )
      );
      setRatingBooking(null);
      setRatingValue(0);
      setRatingComment("");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not submit rating.");
    } finally {
      setSubmittingRating(false);
    }
  }
  
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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
              onRate={(booking) => {
                setRatingBooking(booking);
                setRatingValue(0);
                setRatingComment("");
              }}
            />
          )}
          renderSectionHeader={({ section }) => (
            <Text style={[styles.sectionHeader, { color: colors.text }]}>{section.title}</Text>
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

      <Modal
        visible={!!ratingBooking}
        transparent
        animationType="fade"
        onRequestClose={() => setRatingBooking(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Rate {ratingBooking?.professionalName}
            </Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable key={star} onPress={() => setRatingValue(star)}>
                  <Text
                    style={[
                      styles.starText,
                      star <= ratingValue && styles.starTextFilled,
                    ]}
                  >
                    ★
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              style={styles.commentInput}
              placeholder="Leave a comment (optional)"
              placeholderTextColor="#A89D8F"
              value={ratingComment}
              onChangeText={setRatingComment}
              multiline
            />
            <Pressable
              style={[styles.submitRatingButton, submittingRating && styles.cancelDisabledText]}
              onPress={handleSubmitRating}
              disabled={submittingRating}
            >
              <Text style={styles.submitRatingButtonText}>
                {submittingRating ? "Submitting..." : "Submit Rating"}
              </Text>
            </Pressable>
            <Pressable onPress={() => setRatingBooking(null)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  rateButton: {
    marginTop: 14,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: CLAY,
  },
  rateButtonText: {
    fontFamily: "Manrope_700Bold",
    color: "#fff",
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(43,38,34,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
  },
  modalTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 20,
    color: INK,
    marginBottom: 16,
    textAlign: "center",
  },
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  starText: {
    fontSize: 36,
    color: "#E5DDD0",
  },
  starTextFilled: {
    color: "#E0A35C",
  },
  commentInput: {
    fontFamily: "Manrope_500Medium",
    backgroundColor: PAPER,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: INK,
    borderWidth: 1,
    borderColor: "#EFE6D9",
    minHeight: 70,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  submitRatingButton: {
    backgroundColor: CLAY,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  submitRatingButtonText: {
    fontFamily: "Manrope_700Bold",
    color: "#fff",
    fontSize: 15,
  },
  modalCancelText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
    color: MUTED,
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