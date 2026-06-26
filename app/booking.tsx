import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../data/authContext";
import {
    createBooking,
    fetchBookedSlots,
    fetchProfessionalsForService,
    fetchSalonById,
    Professional,
    Salon,
    validatePromoCode,
} from "./api/client";

function getNextDays(count: number) {
  const days = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

function formatDayLabel(date: Date) {
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  const day = date.getDate();
  return { weekday, day };
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function generateTimeSlots(openTime: string, closeTime: string) {
  const [openH] = openTime.split(":").map(Number);
  const [closeH] = closeTime.split(":").map(Number);
  const slots: string[] = [];
  for (let h = openH; h < closeH; h++) {
    slots.push(`${h.toString().padStart(2, "0")}:00`);
    slots.push(`${h.toString().padStart(2, "0")}:30`);
  }
  return slots;
}

export default function BookingScreen() {
  const { salonId, serviceId } = useLocalSearchParams<{
    salonId: string;
    serviceId: string;
  }>();
  const { token } = useAuth();

  const [salon, setSalon] = useState<Salon | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const days = useMemo(() => getNextDays(7), []);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountPercent: number;
  } | null>(null);
 const [promoError, setPromoError] = useState<string | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);

  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<
    string | "no_preference"
  >("no_preference");

 useEffect(() => {
    fetchSalonById(salonId)
      .then((data) => setSalon(data))
      .catch(() => setSalon(null))
      .finally(() => setLoading(false));
  }, [salonId]);

  useEffect(() => {
    if (!salonId || !serviceId) return;
    fetchProfessionalsForService(salonId, serviceId)
      .then((data) => setProfessionals(data))
      .catch(() => setProfessionals([]));
  }, [salonId, serviceId]);

  const selectedDate = days[selectedDayIndex];
  const isoDate = toIsoDate(selectedDate);

  useEffect(() => {
    if (!salonId) return;
    setLoadingSlots(true);
    fetchBookedSlots(salonId, isoDate)
      .then((slots) => setBookedSlots(slots))
      .catch(() => setBookedSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [salonId, isoDate]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={styles.loading} size="large" color="#C1683C" />
      </SafeAreaView>
    );
  }

  const service = salon?.services.find((s) => s.id === serviceId);

  if (!salon || !service) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>Service not found.</Text>
      </SafeAreaView>
    );
  }

  const timeSlots = generateTimeSlots(salon.openTime, salon.closeTime);

 const handleConfirm = async () => {
    if (!selectedTime) {
      Alert.alert("Pick a time", "Please select a time slot to continue.");
      return;
    }
    if (!token) {
      Alert.alert("Not logged in", "Please log in again.");
      return;
    }
    const dateLabel = selectedDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });

    setSubmitting(true);
    try {
      await createBooking(
        {
          salonId: salon.id,
          serviceId: service.id,
          salonName: salon.name,
          serviceName: service.name,
          date: isoDate,
          dateLabel,
          time: selectedTime,
          price: service.price,
          promoCode: appliedPromo?.code,
          professionalId:
            selectedProfessionalId === "no_preference"
              ? undefined
              : selectedProfessionalId,
        },
        token
      );

      Alert.alert(
        "Booking Confirmed",
        `${service.name} at ${salon.name}\n${dateLabel}, ${selectedTime}\nGHS ${discountedPrice}`,
        [
         {
            text: "Done",
            onPress: () => router.push("/(tabs)" as any),
          },
        ]
      );
    } catch (err: any) {
      const message =
        err?.message?.includes("just booked") ||
        err?.message?.includes("409")
          ? "That time slot was just booked by someone else. Please pick another."
          : "Could not reach the server. Make sure the backend is running.";

      // Refresh booked slots so the picker reflects reality
      fetchBookedSlots(salonId, isoDate)
        .then((slots) => setBookedSlots(slots))
        .catch(() => {});
      setSelectedTime(null);

      Alert.alert("Booking Failed", message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    if (!token) return;
    setApplyingPromo(true);
    setPromoError(null);
    try {
      const result = await validatePromoCode(salon.id, promoInput.trim(), token);
      setAppliedPromo(result);
    } catch (err: any) {
      setAppliedPromo(null);
      setPromoError(err?.message || "Invalid promo code");
    } finally {
      setApplyingPromo(false);
    }
  };

  const discountedPrice = appliedPromo
    ? Math.round(service.price * (1 - appliedPromo.discountPercent / 100) * 100) / 100
    : service.price;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Book Appointment" }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.summaryCard}>
          <Text style={styles.salonName}>{salon.name}</Text>
          <Text style={styles.serviceName}>{service.name}</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryMeta}>
              {service.durationMins} min
            </Text>
            {appliedPromo ? (
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.originalPriceStrike}>GHS {service.price}</Text>
                <Text style={styles.summaryPrice}>GHS {discountedPrice}</Text>
              </View>
            ) : (
              <Text style={styles.summaryPrice}>GHS {service.price}</Text>
            )}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Promo Code</Text>
        <View style={styles.promoRow}>
          <TextInput
            style={[styles.promoInput, appliedPromo && styles.promoInputApplied]}
            placeholder="Enter promo code"
            placeholderTextColor="#A89D8F"
            autoCapitalize="characters"
            value={promoInput}
            onChangeText={(text) => {
              setPromoInput(text);
              if (appliedPromo) setAppliedPromo(null);
              if (promoError) setPromoError(null);
            }}
            editable={!appliedPromo}
          />
          <Pressable
            style={[
              styles.promoButton,
              (applyingPromo || !!appliedPromo) && styles.confirmButtonDisabled,
            ]}
            onPress={appliedPromo ? () => setAppliedPromo(null) : handleApplyPromo}
            disabled={applyingPromo}
          >
            <Text style={styles.promoButtonText}>
              {applyingPromo ? "..." : appliedPromo ? "Remove" : "Apply"}
            </Text>
          </Pressable>
        </View>
        {appliedPromo && (
          <Text style={styles.promoSuccess}>
            "{appliedPromo.code}" applied — {appliedPromo.discountPercent}% off
          </Text>
        )}
       {promoError && <Text style={styles.promoErrorText}>{promoError}</Text>}

        {professionals.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Select Professional</Text>
            <Pressable
              style={[
                styles.proCard,
                selectedProfessionalId === "no_preference" && styles.proCardSelected,
              ]}
              onPress={() => setSelectedProfessionalId("no_preference")}
            >
              <View style={styles.proAvatarPlaceholder}>
                <Text style={styles.proShuffleIcon}>⇄</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.proName}>No Preference</Text>
                <Text style={styles.proMeta}>Maximum availability</Text>
              </View>
              {selectedProfessionalId === "no_preference" && (
                <View style={styles.proCheckCircle}>
                  <Text style={styles.proCheckmark}>✓</Text>
                </View>
              )}
            </Pressable>

            {professionals.map((pro) => {
              const isSelected = selectedProfessionalId === pro.id;
              return (
                <Pressable
                  key={pro.id}
                  style={[styles.proCard, isSelected && styles.proCardSelected]}
                  onPress={() => setSelectedProfessionalId(pro.id)}
                >
                  {pro.photoUrl ? (
                    <Image source={{ uri: pro.photoUrl }} style={styles.proAvatar} />
                  ) : (
                    <View style={styles.proAvatarPlaceholder}>
                      <Text style={styles.proInitial}>
                        {pro.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.proName}>{pro.name}</Text>
                    {pro.avgRating ? (
                      <Text style={styles.proMeta}>
                        ★ {pro.avgRating} ({pro.ratingCount})
                      </Text>
                    ) : (
                      <Text style={styles.proMeta}>No ratings yet</Text>
                    )}
                  </View>
                  {isSelected && (
                    <View style={styles.proCheckCircle}>
                      <Text style={styles.proCheckmark}>✓</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </>
        )}

        <Text style={styles.sectionTitle}>Select Date</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayList}
        >
          {days.map((date, index) => {
            const { weekday, day } = formatDayLabel(date);
            const isSelected = index === selectedDayIndex;
            return (
              <Pressable
                key={index}
                style={[styles.dayItem, isSelected && styles.dayItemSelected]}
                onPress={() => {
                  setSelectedDayIndex(index);
                  setSelectedTime(null);
                }}
              >
                <Text
                  style={[
                    styles.dayWeekday,
                    isSelected && styles.dayTextSelected,
                  ]}
                >
                  {weekday}
                </Text>
                <Text
                  style={[styles.dayNumber, isSelected && styles.dayTextSelected]}
                >
                  {day}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.sectionTitle}>Select Time</Text>
        {loadingSlots ? (
          <ActivityIndicator style={{ marginBottom: 20 }} color="#C1683C" />
        ) : (
          <View style={styles.timeGrid}>
            {timeSlots.map((time) => {
              const isBooked = bookedSlots.includes(time);
              const isSelected = time === selectedTime;
              return (
                <Pressable
                  key={time}
                  style={[
                    styles.timeSlot,
                    isSelected && styles.timeSlotSelected,
                    isBooked && styles.timeSlotBooked,
                  ]}
                  onPress={() => !isBooked && setSelectedTime(time)}
                  disabled={isBooked}
                >
                  <Text
                    style={[
                      styles.timeText,
                      isSelected && styles.timeTextSelected,
                      isBooked && styles.timeTextBooked,
                    ]}
                  >
                    {time}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.confirmButton, submitting && styles.confirmButtonDisabled]}
          onPress={handleConfirm}
          disabled={submitting}
        >
          <Text style={styles.confirmButtonText}>
            {submitting ? "Booking..." : "Confirm Booking"}
          </Text>
        </Pressable>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 8,
  },
  loading: {
    marginTop: 60,
  },
  notFound: {
    fontFamily: "Manrope_500Medium",
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
    color: MUTED,
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
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
    fontSize: 20,
    color: INK,
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  summaryMeta: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    color: MUTED,
  },
  summaryPrice: {
    fontFamily: "Manrope_700Bold",
    fontSize: 15,
    color: CLAY,
  },
  originalPriceStrike: {
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    color: MUTED,
    textDecorationLine: "line-through",
  },
  promoRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  promoInput: {
    flex: 1,
    fontFamily: "Manrope_500Medium",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: INK,
    borderWidth: 1,
    borderColor: "#EFE6D9",
  },
  promoInputApplied: {
    backgroundColor: "#F3ECE2",
    color: MUTED,
  },
  promoButton: {
    backgroundColor: CLAY,
    borderRadius: 10,
    paddingHorizontal: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  promoButtonText: {
    fontFamily: "Manrope_700Bold",
    color: "#fff",
    fontSize: 14,
  },
  promoSuccess: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13,
    color: "#3D8B5F",
    marginBottom: 16,
  },
  promoErrorText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    color: "#C1432B",
    marginBottom: 16,
  },
  proCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: "#EFE6D9",
  },
  proCardSelected: {
    borderColor: CLAY,
    backgroundColor: "#FBF1E9",
  },
  proAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  proAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F3ECE2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  proInitial: {
    fontFamily: "Manrope_700Bold",
    fontSize: 16,
    color: CLAY,
  },
  proShuffleIcon: {
    fontSize: 18,
    color: CLAY,
  },
  proName: {
    fontFamily: "Manrope_700Bold",
    fontSize: 15,
    color: INK,
  },
  proMeta: {
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    color: MUTED,
    marginTop: 2,
  },
  proCheckCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: CLAY,
    alignItems: "center",
    justifyContent: "center",
  },
  proCheckmark: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
  },
  sectionTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 17,
    color: INK,
    marginBottom: 10,
  },
  dayList: {
    gap: 10,
    paddingBottom: 22,
  },
  dayItem: {
    width: 56,
    height: 68,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EFE6D9",
  },
  dayItemSelected: {
    backgroundColor: CLAY,
    borderColor: CLAY,
  },
  dayWeekday: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 12,
    color: MUTED,
  },
  dayNumber: {
    fontFamily: "Manrope_700Bold",
    fontSize: 18,
    marginTop: 2,
    color: INK,
  },
  dayTextSelected: {
    color: "#fff",
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingBottom: 20,
  },
  timeSlot: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EFE6D9",
  },
  timeSlotSelected: {
    backgroundColor: CLAY,
    borderColor: CLAY,
  },
  timeSlotBooked: {
    backgroundColor: "#F3ECE2",
    borderColor: "#F3ECE2",
    opacity: 0.6,
  },
  timeText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
    color: INK,
  },
  timeTextSelected: {
    color: "#fff",
  },
  timeTextBooked: {
    color: "#B5AB9C",
    textDecorationLine: "line-through",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#EFE6D9",
    backgroundColor: PAPER,
  },
  confirmButton: {
    backgroundColor: CLAY,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontFamily: "Manrope_700Bold",
    color: "#fff",
    fontSize: 16,
  },
});