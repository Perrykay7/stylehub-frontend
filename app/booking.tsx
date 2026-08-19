import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";

import { useAuth } from "../data/authContext";
import {
    createBooking,
    fetchBookedSlots,
    fetchMyPromo,
    fetchProfessionalsForService,
    fetchSalonById,
    joinWaitlist,
    MyPromo,
    Professional,
    rescheduleBooking,
    Salon,
} from "../api/client";

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
  const { salonId, serviceId, rescheduleId, professionalId } = useLocalSearchParams<{
    salonId: string;
    serviceId: string;
    rescheduleId?: string;
    professionalId?: string;
  }>();
  const { token } = useAuth();
  const isRescheduling = !!rescheduleId;

  const [salon, setSalon] = useState<Salon | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const days = useMemo(() => getNextDays(30), []);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<MyPromo | null>(null);

  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<
    string | "no_preference"
  >(professionalId || "no_preference");

  const [tipOption, setTipOption] = useState<"none" | "10" | "15" | "20" | "custom">("none");
  const [customTipInput, setCustomTipInput] = useState("");
  const [notes, setNotes] = useState("");

 useEffect(() => {
    fetchSalonById(salonId)
      .then((data) => setSalon(data))
      .catch(() => setSalon(null))
      .finally(() => setLoading(false));
  }, [salonId]);

  useEffect(() => {
    if (!salonId || !token) return;
    fetchMyPromo(salonId, token)
      .then((promo) => setAppliedPromo(promo))
      .catch(() => setAppliedPromo(null));
  }, [salonId, token]);

  const selectedDate = days[selectedDayIndex];
  const isoDate = toIsoDate(selectedDate);

  useEffect(() => {
    if (!salonId || !serviceId) return;
    fetchProfessionalsForService(salonId, serviceId, isoDate)
      .then((data) => setProfessionals(data))
      .catch(() => setProfessionals([]));
  }, [salonId, serviceId, isoDate]);

  useEffect(() => {
    if (!salonId) return;
    setLoadingSlots(true);
    const professionalId =
      selectedProfessionalId === "no_preference" ? undefined : selectedProfessionalId;
    fetchBookedSlots(salonId, isoDate, serviceId, professionalId)
      .then((slots) => setBookedSlots(slots))
      .catch(() => setBookedSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [salonId, isoDate, selectedProfessionalId]);

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
      if (rescheduleId) {
        await rescheduleBooking(
          rescheduleId,
          {
            date: isoDate,
            dateLabel,
            time: selectedTime,
            professionalId:
              selectedProfessionalId === "no_preference"
                ? undefined
                : selectedProfessionalId,
          },
          token
        );

        Alert.alert(
          "Booking Rescheduled",
          `Your ${service.name} appointment is now on ${dateLabel} at ${selectedTime}.`
        );
        router.replace("/(tabs)/my-bookings" as any);
        return;
      }

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
          tipAmount: tipAmount > 0 ? tipAmount : undefined,
          notes: notes.trim() || undefined,
        },
        token
      );

      router.replace({
        pathname: "/booking-confirmation",
        params: {
          salonName: salon.name,
          salonAddress: salon.address || "",
          serviceName: service.name,
          date: isoDate,
          dateLabel,
          time: selectedTime,
          durationMins: String(service.durationMins),
          price: String(discountedPrice),
          tipAmount: String(tipAmount),
          professionalName: selectedProfessional?.name ?? "",
          notes: notes.trim(),
        },
      } as any);
    } catch (err: any) {
      const message =
        err?.message?.includes("just booked") ||
        err?.message?.includes("409") ||
        err?.message?.includes("already booked") ||
        err?.message?.includes("fully booked") ||
        err?.message?.includes("not available")
          ? err.message
          : isRescheduling
          ? err?.message || "Could not reschedule this booking. Please try again."
          : "Could not reach the server. Make sure the backend is running.";

      // Refresh booked slots so the picker reflects reality
      fetchBookedSlots(
        salonId,
        isoDate,
        serviceId,
        selectedProfessionalId === "no_preference" ? undefined : selectedProfessionalId
      )
        .then((slots) => setBookedSlots(slots))
        .catch(() => {});
      setSelectedTime(null);

      Alert.alert(isRescheduling ? "Reschedule Failed" : "Booking Failed", message);
    } finally {
      setSubmitting(false);
    }
  };

  async function handleJoinWaitlist(time: string) {
    if (!token || !salon || !service) return;
    const dateLabel = selectedDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    try {
      await joinWaitlist(
        {
          salonId: salon.id,
          serviceId: service.id,
          professionalId:
            selectedProfessionalId === "no_preference" ? undefined : selectedProfessionalId,
          date: isoDate,
          time,
          dateLabel,
          salonName: salon.name,
          serviceName: service.name,
        },
        token
      );
      Alert.alert("You're on the waitlist", "We'll notify you if this slot opens up.");
    } catch (err: any) {
      Alert.alert("Could not join waitlist", err.message || "Please try again.");
    }
  }

  const discountedPrice = appliedPromo
    ? Math.round(service.price * (1 - appliedPromo.discountPercent / 100) * 100) / 100
    : service.price;

  const selectedProfessional =
    selectedProfessionalId === "no_preference"
      ? null
      : professionals.find((p) => p.id === selectedProfessionalId) || null;
  const selectedProfessionalUnavailable = !!selectedProfessional?.unavailableAllDay;

  const showTipOption = !isRescheduling && !!selectedProfessional;
  const tipAmount = !showTipOption
    ? 0
    : tipOption === "none"
    ? 0
    : tipOption === "custom"
    ? Math.max(0, Math.round((parseFloat(customTipInput) || 0) * 100) / 100)
    : Math.round(discountedPrice * (parseInt(tipOption, 10) / 100) * 100) / 100;
  const totalWithTip = Math.round((discountedPrice + tipAmount) * 100) / 100;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: isRescheduling ? "Reschedule Appointment" : "Book Appointment" }} />
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

        {isRescheduling && (
          <Text style={styles.rescheduleNotice}>
            Pick a new date and time below. Your price stays the same.
          </Text>
        )}

        {appliedPromo && (
          <Text style={styles.promoSuccess}>
            🎁 Your salon gave you {appliedPromo.discountPercent}% off this booking
          </Text>
        )}

        {professionals.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Select Professional</Text>
            <Pressable
              style={[
                styles.proCard,
                selectedProfessionalId === "no_preference" && styles.proCardSelected,
              ]}
              onPress={() => {
                setSelectedProfessionalId("no_preference");
                setSelectedTime(null);
                setTipOption("none");
              }}
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
              const isUnavailable = !!pro.unavailableAllDay;
              return (
                <Pressable
                  key={pro.id}
                  style={[
                    styles.proCard,
                    isSelected && styles.proCardSelected,
                    isUnavailable && styles.proCardDisabled,
                  ]}
                  onPress={() => {
                    if (isUnavailable) return;
                    setSelectedProfessionalId(pro.id);
                    setSelectedTime(null);
                  }}
                >
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      router.push({ pathname: "/professional/[id]", params: { id: pro.id } } as any);
                    }}
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
                  </Pressable>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.proName}>{pro.name}</Text>
                    {isUnavailable ? (
                      <Text style={styles.proUnavailableText}>
                        Not available on this day
                      </Text>
                    ) : pro.avgRating ? (
                      <Text style={styles.proMeta}>
                        ★ {pro.avgRating} ({pro.ratingCount})
                      </Text>
                    ) : (
                      <Text style={styles.proMeta}>No ratings yet</Text>
                    )}
                    <Text
                      style={styles.proViewProfile}
                      onPress={(e) => {
                        e.stopPropagation();
                        router.push({ pathname: "/professional/[id]", params: { id: pro.id } } as any);
                      }}
                    >
                      View profile
                    </Text>
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

        {showTipOption && (
          <>
            <Text style={styles.sectionTitle}>Add a Tip for {selectedProfessional!.name}?</Text>
            <View style={styles.tipRow}>
              {(
                [
                  { key: "none", label: "No tip" },
                  { key: "10", label: "10%" },
                  { key: "15", label: "15%" },
                  { key: "20", label: "20%" },
                  { key: "custom", label: "Custom" },
                ] as const
              ).map((opt) => {
                const isSelected = tipOption === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    style={[styles.tipChip, isSelected && styles.tipChipSelected]}
                    onPress={() => setTipOption(opt.key)}
                  >
                    <Text style={[styles.tipChipText, isSelected && styles.tipChipTextSelected]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {tipOption === "custom" && (
              <View style={styles.customTipRow}>
                <Text style={styles.customTipPrefix}>GHS</Text>
                <TextInput
                  style={styles.customTipInput}
                  placeholder="0.00"
                  placeholderTextColor="#B5AB9C"
                  keyboardType="decimal-pad"
                  value={customTipInput}
                  onChangeText={setCustomTipInput}
                />
              </View>
            )}

            {tipAmount > 0 && (
              <Text style={styles.tipSummary}>
                +GHS {tipAmount.toFixed(2)} tip for {selectedProfessional!.name} · Total GHS{" "}
                {totalWithTip.toFixed(2)}
              </Text>
            )}
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
        ) : bookedSlots.includes("CLOSED") ? (
          <Text style={styles.closedText}>This salon is closed on this day.</Text>
        ) : selectedProfessionalUnavailable ? (
          <Text style={styles.closedText}>
            {selectedProfessional?.name} is not available at this time or day. Please choose
            another professional or date.
          </Text>
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
                  onPress={() => {
                    if (!isBooked) {
                      setSelectedTime(time);
                      return;
                    }
                    Alert.alert(
                      "This time is fully booked",
                      "Want us to notify you if it opens up?",
                      [
                        { text: "Cancel", style: "cancel" },
                        { text: "Notify Me", onPress: () => handleJoinWaitlist(time) },
                      ]
                    );
                  }}
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

        {!isRescheduling && (
          <>
            <Text style={styles.sectionTitle}>Notes for the Salon (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="e.g. allergic to certain products, prefer scissors over clippers..."
              placeholderTextColor="#B5AB9C"
              value={notes}
              onChangeText={setNotes}
              multiline
              maxLength={300}
            />
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.confirmButton, submitting && styles.confirmButtonDisabled]}
          onPress={handleConfirm}
          disabled={submitting}
        >
          <Text style={styles.confirmButtonText}>
            {submitting
              ? isRescheduling
                ? "Rescheduling..."
                : "Booking..."
              : isRescheduling
              ? "Confirm New Time"
              : "Confirm Booking"}
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
  promoSuccess: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13,
    color: "#3D8B5F",
    marginBottom: 16,
  },
  rescheduleNotice: {
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    color: MUTED,
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
  proCardDisabled: {
    opacity: 0.5,
  },
  proUnavailableText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13,
    color: "#A8442B",
    marginTop: 2,
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
  proViewProfile: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 12,
    color: CLAY,
    marginTop: 4,
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
  tipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  tipChip: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EFE6D9",
  },
  tipChipSelected: {
    backgroundColor: CLAY,
    borderColor: CLAY,
  },
  tipChipText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13,
    color: INK,
  },
  tipChipTextSelected: {
    color: "#fff",
  },
  customTipRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EFE6D9",
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  customTipPrefix: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
    color: MUTED,
    marginRight: 8,
  },
  customTipInput: {
    flex: 1,
    fontFamily: "Manrope_500Medium",
    fontSize: 15,
    color: INK,
    paddingVertical: 12,
  },
  tipSummary: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13,
    color: "#3D8B5F",
    marginBottom: 20,
  },
  notesInput: {
    fontFamily: "Manrope_500Medium",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EFE6D9",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: INK,
    minHeight: 70,
    textAlignVertical: "top",
    marginBottom: 8,
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
  closedText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
    color: "#C1683C",
    textAlign: "center",
    marginVertical: 20,
    paddingHorizontal: 20,
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