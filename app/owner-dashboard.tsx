import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../data/authContext";
import { useTheme } from "../data/themeContext";
import { fetchOwnerStats, OwnerStats } from "./api/ownerClient";

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

export default function OwnerDashboardScreen() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetchOwnerStats(token)
      .then(setStats)
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: "Dashboard" }} />
      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} size="large" color="#C1683C" />
      ) : !stats ? (
        <Text style={[styles.emptyText, { color: colors.muted }]}>Could not load stats.</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>All Time</Text>
          <View style={styles.statsGrid}>
            <StatCard label="Total Bookings" value={String(stats.totalBookings)} />
            <StatCard label="Total Revenue" value={`GHS ${stats.totalRevenue.toFixed(2)}`} />
            <StatCard label="Unique Customers" value={String(stats.totalCustomers)} />
            <StatCard label="Avg Rating" value={stats.totalReviews > 0 ? `★ ${stats.avgRating}` : "No reviews"} sub={stats.totalReviews > 0 ? `${stats.totalReviews} reviews` : undefined} />
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>This Month</Text>
          <View style={styles.statsGrid}>
            <StatCard label="Bookings" value={String(stats.monthlyBookings)} />
            <StatCard label="Revenue" value={`GHS ${stats.monthlyRevenue.toFixed(2)}`} />
          </View>

          {stats.topServices.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Services</Text>
              <View style={[styles.listCard, { backgroundColor: colors.card }]}>
                {stats.topServices.map((s, i) => (
                  <View key={i} style={[styles.listRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                    <View>
                      <Text style={[styles.listMain, { color: colors.text }]}>{s.serviceName}</Text>
                      <Text style={[styles.listSub, { color: colors.muted }]}>{s.bookingCount} bookings</Text>
                    </View>
                    <Text style={[styles.listValue, { color: colors.clay }]}>GHS {s.revenue.toFixed(0)}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {stats.recentBookings.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Bookings</Text>
              <View style={[styles.listCard, { backgroundColor: colors.card }]}>
                {stats.recentBookings.map((b, i) => (
                  <View key={i} style={[styles.listRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.listMain, { color: colors.text }]}>{b.serviceName}</Text>
                      <Text style={[styles.listSub, { color: colors.muted }]}>{b.customerName} · {b.dateLabel} {b.time}</Text>
                    </View>
                    <Text style={[styles.listValue, { color: colors.clay }]}>GHS {b.price}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {stats.recentReviews.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Reviews</Text>
              <View style={[styles.listCard, { backgroundColor: colors.card }]}>
                {stats.recentReviews.map((r, i) => (
                  <View key={i} style={[styles.listRow, { alignItems: "flex-start" }, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text style={[styles.listMain, { color: colors.text }]}>{r.customerName}</Text>
                        <Text style={{ color: "#E0A35C", fontFamily: "Manrope_700Bold", fontSize: 13 }}>{"★".repeat(r.rating)}</Text>
                      </View>
                      <Text style={[styles.listSub, { color: colors.muted }]}>{r.salonName} · {r.date}</Text>
                      <Text style={[styles.listMain, { color: colors.text, fontFamily: "Manrope_500Medium", fontSize: 13, marginTop: 4 }]}>{r.comment}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          <Pressable style={styles.button} onPress={() => router.push("/my-salon" as any)}>
            <Text style={styles.buttonText}>Manage My Salon</Text>
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  sectionTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 18,
    marginBottom: 12,
    marginTop: 8,
  },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 8 },
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
  emptyText: { textAlign: "center", marginTop: 60, fontFamily: "Manrope_500Medium", fontSize: 14 },
  button: {
    backgroundColor: "#C1683C",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: { fontFamily: "Manrope_700Bold", color: "#fff", fontSize: 15 },
});
