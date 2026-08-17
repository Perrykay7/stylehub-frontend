import { router, Stack } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../data/authContext";
import { useTheme } from "../data/themeContext";
import {
  acceptBooking,
  AvailableBooking,
  fetchAvailableBookings,
  fetchMyProfessionalBookings,
  fetchMyProfessionalProfile,
  fetchMyProfessionalRatings,
  MyProfessionalBooking,
  MyProfessionalProfile,
  MyProfessionalRatings,
} from "../api/professionalClient";

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.statValue, { color: colors.clay }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.text }]}>{label}</Text>
      {sub && <Text style={[styles.statSub, { color: colors.muted }]}>{sub}</Text>}
    </View>
  );
}

export default function ProfessionalDashboardScreen() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const [profile, setProfile] = useState<MyProfessionalProfile | null>(null);
  const [bookings, setBookings] = useState<MyProfessionalBooking[]>([]);
  const [ratings, setRatings] = useState<MyProfessionalRatings | null>(null);
  const [availableBookings, setAvailableBookings] = useState<AvailableBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  function loadAll() {
    if (!token) return Promise.resolve();
    return Promise.all([
      fetchMyProfessionalProfile(token),
      fetchMyProfessionalBookings(token),
      fetchMyProfessionalRatings(token),
      fetchAvailableBookings(token),
    ]).then(([p, b, r, a]) => {
      setProfile(p);
      setBookings(b);
      setRatings(r);
      setAvailableBookings(a);
    });
  }

  useEffect(() => {
    if (!token) return;
    loadAll()
      .catch((err: any) => {
        if (err?.status === 403) {
          router.replace({ pathname: "/reverify", params: { role: "professional" } } as any);
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function handleAccept(booking: AvailableBooking) {
    if (!token) return;
    setAcceptingId(booking.id);
    try {
      await acceptBooking(booking.id, token);
      await loadAll();
    } catch (err: any) {
      Alert.alert("Could not accept", err.message || "Please try again.");
      fetchAvailableBookings(token)
        .then(setAvailableBookings)
        .catch(() => {});
    } finally {
      setAcceptingId(null);
    }
  }

  const upcomingBookings = useMemo(
    () =>
      [...bookings].sort((a, b) =>
        `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`)
      ),
    [bookings]
  );

  const totalTips = useMemo(
    () => Math.round(bookings.reduce((sum, b) => sum + (b.tipAmount || 0), 0) * 100) / 100,
    [bookings]
  );
  const tippedBookingsCount = bookings.filter((b) => b.tipAmount > 0).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: "My Schedule" }} />
      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} size="large" color="#C1683C" />
      ) : !profile ? (
        <Text style={[styles.emptyText, { color: colors.muted }]}>
          Could not load your professional profile.
        </Text>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.eyebrow, { color: colors.clay }]}>PROFESSIONAL</Text>
          <Text style={[styles.title, { color: colors.text }]}>{profile.name}</Text>
          {profile.salonName && (
            <Text style={[styles.subtitle, { color: colors.muted }]}>{profile.salonName}</Text>
          )}

          <View style={styles.statsGrid}>
            <StatCard label="Bookings" value={String(bookings.length)} />
            <StatCard
              label="Avg Rating"
              value={ratings && ratings.count > 0 ? `★ ${ratings.average}` : "No ratings yet"}
              sub={ratings && ratings.count > 0 ? `${ratings.count} review${ratings.count > 1 ? "s" : ""}` : undefined}
            />
            <StatCard
              label="Tips Earned"
              value={`GHS ${totalTips.toFixed(2)}`}
              sub={tippedBookingsCount > 0 ? `from ${tippedBookingsCount} booking${tippedBookingsCount > 1 ? "s" : ""}` : undefined}
            />
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Open Jobs</Text>
          {availableBookings.length === 0 ? (
            <Text style={[styles.emptyInline, { color: colors.muted }]}>
              No open bookings to claim right now.
            </Text>
          ) : (
            <View style={[styles.listCard, { backgroundColor: colors.card }]}>
              {availableBookings.map((b, i) => (
                <View
                  key={b.id}
                  style={[
                    styles.listRow,
                    { alignItems: "center" },
                    i > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listMain, { color: colors.text }]}>{b.serviceName}</Text>
                    <Text style={[styles.listSub, { color: colors.muted }]}>
                      {b.dateLabel} {b.time} · GHS {b.price}
                    </Text>
                  </View>
                  <Pressable
                    style={[styles.acceptButton, { backgroundColor: colors.clay }]}
                    onPress={() => handleAccept(b)}
                    disabled={acceptingId === b.id}
                  >
                    {acceptingId === b.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.acceptButtonText}>Accept</Text>
                    )}
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Bookings</Text>
          {upcomingBookings.length === 0 ? (
            <Text style={[styles.emptyInline, { color: colors.muted }]}>
              No bookings assigned to you yet.
            </Text>
          ) : (
            <View style={[styles.listCard, { backgroundColor: colors.card }]}>
              {upcomingBookings.map((b, i) => (
                <View
                  key={b.id}
                  style={[
                    styles.listRow,
                    i > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listMain, { color: colors.text }]}>{b.serviceName}</Text>
                    <Text style={[styles.listSub, { color: colors.muted }]}>
                      {b.customerName} · {b.dateLabel} {b.time}
                    </Text>
                    {b.customerPhone && (
                      <Text style={[styles.listSub, { color: colors.muted }]}>
                        {b.customerPhone}
                      </Text>
                    )}
                    {b.tipAmount > 0 && (
                      <Text style={styles.tipBadgeText}>+GHS {b.tipAmount.toFixed(2)} tip 💸</Text>
                    )}
                  </View>
                  <Text style={[styles.listValue, { color: colors.clay }]}>GHS {b.price}</Text>
                </View>
              ))}
            </View>
          )}

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Ratings & Comments</Text>
          {!ratings || ratings.ratings.length === 0 ? (
            <Text style={[styles.emptyInline, { color: colors.muted }]}>
              No ratings yet.
            </Text>
          ) : (
            <View style={[styles.listCard, { backgroundColor: colors.card }]}>
              {ratings.ratings.map((r, i) => (
                <View
                  key={i}
                  style={[
                    styles.listRow,
                    { alignItems: "flex-start" },
                    i > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ color: "#E0A35C", fontFamily: "Manrope_700Bold", fontSize: 13 }}>
                        {"★".repeat(r.rating)}
                      </Text>
                      <Text style={[styles.listSub, { color: colors.muted, marginTop: 0 }]}>
                        {new Date(r.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    {r.comment && (
                      <Text
                        style={[
                          styles.listMain,
                          { color: colors.text, fontFamily: "Manrope_500Medium", fontSize: 13, marginTop: 4 },
                        ]}
                      >
                        {r.comment}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  eyebrow: {
    fontFamily: "Manrope_700Bold",
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  title: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 26,
  },
  subtitle: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    marginTop: 2,
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 18,
    marginBottom: 12,
    marginTop: 20,
  },
  emptyText: { textAlign: "center", marginTop: 60, fontFamily: "Manrope_500Medium", fontSize: 14 },
  emptyInline: { fontFamily: "Manrope_500Medium", fontSize: 13 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 4 },
  statCard: {
    flex: 1,
    minWidth: "40%",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  statValue: { fontFamily: "Manrope_700Bold", fontSize: 22, marginBottom: 4 },
  statLabel: { fontFamily: "Manrope_600SemiBold", fontSize: 12 },
  statSub: { fontFamily: "Manrope_500Medium", fontSize: 11, marginTop: 2 },
  listCard: {
    borderRadius: 16,
    marginBottom: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  listRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },
  listMain: { fontFamily: "Manrope_600SemiBold", fontSize: 14 },
  listSub: { fontFamily: "Manrope_500Medium", fontSize: 12, marginTop: 2 },
  listValue: { fontFamily: "Manrope_700Bold", fontSize: 14 },
  tipBadgeText: {
    fontFamily: "Manrope_700Bold",
    fontSize: 12,
    color: "#3D8B5F",
    marginTop: 4,
  },
  acceptButton: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 76,
    alignItems: "center",
  },
  acceptButtonText: {
    color: "#fff",
    fontFamily: "Manrope_700Bold",
    fontSize: 13,
  },
});
