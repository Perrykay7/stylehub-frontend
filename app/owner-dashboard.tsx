import { Stack, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../data/authContext";
import { useTheme } from "../data/themeContext";
import {
  fetchOwnerBookings,
  fetchOwnerSalons,
  fetchOwnerStats,
  fetchSalonAnalytics,
  markBookingNoShow,
  OwnerBooking,
  OwnerSalon,
  OwnerStats,
  SalonAnalytics,
} from "../api/ownerClient";

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

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getWeekDates(offset: number) {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1 + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function toIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function OwnerDashboardScreen() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [allBookings, setAllBookings] = useState<OwnerBooking[]>([]);
  const [activeTab, setActiveTab] = useState<"stats" | "calendar" | "revenue" | "analytics">("stats");
  const [weekOffset, setWeekOffset] = useState(0);
  const [revenueFrom, setRevenueFrom] = useState("");
  const [revenueTo, setRevenueTo] = useState("");

  const [salons, setSalons] = useState<OwnerSalon[]>([]);
  const [selectedSalonId, setSelectedSalonId] = useState<string | null>(null);
  const [analyticsRange, setAnalyticsRange] = useState<"week" | "month" | "all">("month");
  const [analytics, setAnalytics] = useState<SalonAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    Promise.all([fetchOwnerStats(token), fetchOwnerBookings(token), fetchOwnerSalons(token)])
      .then(([s, b, sal]) => {
        setStats(s);
        setAllBookings(b);
        setSalons(sal);
        if (sal.length > 0) setSelectedSalonId(sal[0].id);
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!token || !selectedSalonId || activeTab !== "analytics") return;
    setAnalyticsLoading(true);
    fetchSalonAnalytics(selectedSalonId, analyticsRange, token)
      .then(setAnalytics)
      .catch(() => setAnalytics(null))
      .finally(() => setAnalyticsLoading(false));
  }, [token, selectedSalonId, analyticsRange, activeTab]);

  function handleToggleNoShow(booking: OwnerBooking) {
    if (!token) return;
    const nextNoShow = booking.status !== "no_show";
    setAllBookings((prev) =>
      prev.map((b) => (b.id === booking.id ? { ...b, status: nextNoShow ? "no_show" : null } : b))
    );
    markBookingNoShow(booking.id, nextNoShow, token).catch(() => {
      setAllBookings((prev) =>
        prev.map((b) => (b.id === booking.id ? { ...b, status: booking.status } : b))
      );
    });
  }

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const calendarBookings = useMemo(() => {
    const isoDates = weekDates.map(toIso);
    return allBookings.filter((b) => isoDates.includes(b.dateLabel?.slice(0, 10) || "") || isoDates.includes(b.dateLabel || ""));
  }, [allBookings, weekDates]);

  const revenueReport = useMemo(() => {
    if (!revenueFrom || !revenueTo) return null;
    const filtered = allBookings.filter((b) => {
      const d = b.dateLabel?.slice(0, 10) || b.dateLabel || "";
      return d >= revenueFrom && d <= revenueTo;
    });
    const total = filtered.reduce((sum, b) => sum + b.price, 0);
    const byService: Record<string, { count: number; revenue: number }> = {};
    filtered.forEach((b) => {
      if (!byService[b.serviceName]) byService[b.serviceName] = { count: 0, revenue: 0 };
      byService[b.serviceName].count++;
      byService[b.serviceName].revenue += b.price;
    });
    return { total, count: filtered.length, byService };
  }, [allBookings, revenueFrom, revenueTo]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: "Dashboard" }} />
      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} size="large" color="#C1683C" />
      ) : !stats ? (
        <Text style={[styles.emptyText, { color: colors.muted }]}>Could not load stats.</Text>
      ) : (
        <>
          {/* Tab bar */}
          <View style={[styles.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            {(["stats", "calendar", "revenue", "analytics"] as const).map((tab) => (
              <Pressable key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
                <Text style={[styles.tabText, { color: activeTab === tab ? "#C1683C" : colors.muted }]}>
                  {tab === "stats" ? "Stats" : tab === "calendar" ? "Calendar" : tab === "revenue" ? "Revenue" : "Analytics"}
                </Text>
              </Pressable>
            ))}
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {activeTab === "stats" && (
              <>
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
              </>
            )}

            {activeTab === "calendar" && (
              <>
                <View style={styles.calendarNav}>
                  <Pressable onPress={() => setWeekOffset((w) => w - 1)} style={styles.calNavBtn}>
                    <Text style={[styles.calNavText, { color: colors.text }]}>‹ Prev</Text>
                  </Pressable>
                  <Text style={[styles.calWeekLabel, { color: colors.text }]}>
                    {weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </Text>
                  <Pressable onPress={() => setWeekOffset((w) => w + 1)} style={styles.calNavBtn}>
                    <Text style={[styles.calNavText, { color: colors.text }]}>Next ›</Text>
                  </Pressable>
                </View>

                {weekDates.map((day, i) => {
                  const iso = toIso(day);
                  const dayBookings = calendarBookings.filter(
                    (b) => (b.dateLabel?.slice(0, 10) || b.dateLabel) === iso
                  );
                  return (
                    <View key={i} style={[styles.calDay, { backgroundColor: colors.card }]}>
                      <View style={styles.calDayHeader}>
                        <Text style={[styles.calDayName, { color: colors.clay }]}>{DAYS[day.getDay()]}</Text>
                        <Text style={[styles.calDayDate, { color: colors.muted }]}>{day.getDate()}</Text>
                        {dayBookings.length > 0 && (
                          <View style={styles.calBadge}>
                            <Text style={styles.calBadgeText}>{dayBookings.length}</Text>
                          </View>
                        )}
                      </View>
                      {dayBookings.length === 0 ? (
                        <Text style={[styles.calEmpty, { color: colors.muted }]}>No bookings</Text>
                      ) : (
                        dayBookings
                          .sort((a, b) => a.time.localeCompare(b.time))
                          .map((b, j) => {
                            const isPast = new Date(`${b.date}T${b.time}:00`).getTime() < Date.now();
                            const isNoShow = b.status === "no_show";
                            return (
                              <View key={j} style={[styles.calBooking, { borderLeftColor: isNoShow ? "#B33A3A" : "#C1683C" }]}>
                                <Text style={[styles.calBookingTime, { color: colors.clay }]}>{b.time}</Text>
                                <View style={{ flex: 1 }}>
                                  <Text style={[styles.calBookingService, { color: colors.text }]}>{b.serviceName}</Text>
                                  <Text style={[styles.calBookingCustomer, { color: colors.muted }]}>{b.customerName}</Text>
                                  {isNoShow && <Text style={styles.noShowLabel}>No-show</Text>}
                                </View>
                                <Text style={[styles.calBookingPrice, { color: colors.clay }]}>GHS {b.price}</Text>
                                {isPast && (
                                  <Pressable onPress={() => handleToggleNoShow(b)} hitSlop={8} style={styles.noShowBtn}>
                                    <Text style={[styles.noShowBtnText, isNoShow && { color: "#B33A3A" }]}>
                                      {isNoShow ? "Undo" : "No-show"}
                                    </Text>
                                  </Pressable>
                                )}
                              </View>
                            );
                          })
                      )}
                    </View>
                  );
                })}
              </>
            )}

            {activeTab === "revenue" && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Revenue Report</Text>
                <View style={[styles.listCard, { backgroundColor: colors.card, padding: 16 }]}>
                  <Text style={[styles.listSub, { color: colors.muted, marginBottom: 8 }]}>Filter by date range</Text>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <TextInput
                      style={[styles.dateInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border, flex: 1 }]}
                      placeholder="From (YYYY-MM-DD)"
                      placeholderTextColor={colors.muted}
                      value={revenueFrom}
                      onChangeText={setRevenueFrom}
                    />
                    <TextInput
                      style={[styles.dateInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border, flex: 1 }]}
                      placeholder="To (YYYY-MM-DD)"
                      placeholderTextColor={colors.muted}
                      value={revenueTo}
                      onChangeText={setRevenueTo}
                    />
                  </View>
                </View>

                {revenueReport && (
                  <>
                    <View style={styles.statsGrid}>
                      <StatCard label="Bookings" value={String(revenueReport.count)} />
                      <StatCard label="Revenue" value={`GHS ${revenueReport.total.toFixed(2)}`} />
                    </View>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>By Service</Text>
                    <View style={[styles.listCard, { backgroundColor: colors.card }]}>
                      {Object.entries(revenueReport.byService)
                        .sort((a, b) => b[1].revenue - a[1].revenue)
                        .map(([name, data], i) => (
                          <View key={i} style={[styles.listRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                            <View>
                              <Text style={[styles.listMain, { color: colors.text }]}>{name}</Text>
                              <Text style={[styles.listSub, { color: colors.muted }]}>{data.count} bookings</Text>
                            </View>
                            <Text style={[styles.listValue, { color: colors.clay }]}>GHS {data.revenue.toFixed(2)}</Text>
                          </View>
                        ))}
                    </View>
                  </>
                )}

                {!revenueReport && (
                  <Text style={[styles.emptyText, { color: colors.muted, marginTop: 20 }]}>Enter a date range above to see the report.</Text>
                )}
              </>
            )}

            {activeTab === "analytics" && (
              <>
                {salons.length > 1 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      {salons.map((s) => (
                        <Pressable
                          key={s.id}
                          style={[styles.pill, selectedSalonId === s.id && styles.pillActive]}
                          onPress={() => setSelectedSalonId(s.id)}
                        >
                          <Text style={[styles.pillText, selectedSalonId === s.id && styles.pillTextActive]}>{s.name}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                )}

                <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
                  {(["week", "month", "all"] as const).map((r) => (
                    <Pressable
                      key={r}
                      style={[styles.pill, analyticsRange === r && styles.pillActive]}
                      onPress={() => setAnalyticsRange(r)}
                    >
                      <Text style={[styles.pillText, analyticsRange === r && styles.pillTextActive]}>
                        {r === "week" ? "Last 7 days" : r === "month" ? "Last 30 days" : "All time"}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {salons.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.muted }]}>Add a salon to see analytics.</Text>
                ) : analyticsLoading || !analytics ? (
                  <ActivityIndicator style={{ marginTop: 20 }} size="large" color="#C1683C" />
                ) : (
                  <>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Revenue &amp; Bookings</Text>
                    {analytics.revenueOverTime.length === 0 ? (
                      <Text style={[styles.emptyText, { color: colors.muted, marginBottom: 16 }]}>No bookings in this range.</Text>
                    ) : (
                      <View style={[styles.listCard, { backgroundColor: colors.card, padding: 16 }]}>
                        {(() => {
                          const maxRevenue = Math.max(...analytics.revenueOverTime.map((d) => d.revenue), 1);
                          return analytics.revenueOverTime.map((d, i) => (
                            <View key={i} style={{ marginBottom: i < analytics.revenueOverTime.length - 1 ? 10 : 0 }}>
                              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                                <Text style={[styles.listSub, { color: colors.muted }]}>{d.date} · {d.bookingCount} bookings</Text>
                                <Text style={[styles.listValue, { color: colors.clay }]}>GHS {d.revenue.toFixed(0)}</Text>
                              </View>
                              <View style={styles.barTrack}>
                                <View style={[styles.barFill, { width: `${(d.revenue / maxRevenue) * 100}%` }]} />
                              </View>
                            </View>
                          ));
                        })()}
                      </View>
                    )}

                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Reliability</Text>
                    <View style={styles.statsGrid}>
                      <StatCard label="Cancellation Rate" value={`${Math.round(analytics.cancellationRate * 100)}%`} sub={`${analytics.cancelledCount} cancelled`} />
                      <StatCard label="No-show Rate" value={`${Math.round(analytics.noShowRate * 100)}%`} sub={`${analytics.noShowCount} no-shows`} />
                    </View>

                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Per Professional</Text>
                    {analytics.perProfessional.length === 0 ? (
                      <Text style={[styles.emptyText, { color: colors.muted, marginBottom: 16 }]}>No professionals added yet.</Text>
                    ) : (
                      <View style={[styles.listCard, { backgroundColor: colors.card }]}>
                        {analytics.perProfessional.map((p, i) => (
                          <View key={p.professionalId} style={[styles.listRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                            <View>
                              <Text style={[styles.listMain, { color: colors.text }]}>{p.name}</Text>
                              <Text style={[styles.listSub, { color: colors.muted }]}>
                                {p.bookingCount} bookings{p.avgRating > 0 ? ` · ★ ${p.avgRating}` : ""}
                              </Text>
                            </View>
                            <Text style={[styles.listValue, { color: colors.clay }]}>GHS {p.revenue.toFixed(0)}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Services</Text>
                    {analytics.topServices.length === 0 ? (
                      <Text style={[styles.emptyText, { color: colors.muted }]}>No bookings in this range.</Text>
                    ) : (
                      <View style={[styles.listCard, { backgroundColor: colors.card }]}>
                        {analytics.topServices.map((s, i) => (
                          <View key={i} style={[styles.listRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                            <View>
                              <Text style={[styles.listMain, { color: colors.text }]}>{s.serviceName}</Text>
                              <Text style={[styles.listSub, { color: colors.muted }]}>{s.bookingCount} bookings</Text>
                            </View>
                            <Text style={[styles.listValue, { color: colors.clay }]}>GHS {s.revenue.toFixed(0)}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </>
                )}
              </>
            )}

            <Pressable style={[styles.button, { marginTop: 24 }]} onPress={() => router.push("/my-salon" as any)}>
              <Text style={styles.buttonText}>Manage My Salon</Text>
            </Pressable>
          </ScrollView>
        </>
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
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#C1683C",
  },
  tabText: { fontFamily: "Manrope_600SemiBold", fontSize: 13 },
  calendarNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  calNavBtn: { padding: 8 },
  calNavText: { fontFamily: "Manrope_600SemiBold", fontSize: 14 },
  calWeekLabel: { fontFamily: "Manrope_700Bold", fontSize: 14 },
  calDay: {
    borderRadius: 14,
    marginBottom: 10,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  calDayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  calDayName: { fontFamily: "Manrope_700Bold", fontSize: 14, width: 34 },
  calDayDate: { fontFamily: "Manrope_500Medium", fontSize: 13 },
  calBadge: {
    backgroundColor: "#C1683C",
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginLeft: "auto",
  },
  calBadgeText: { fontFamily: "Manrope_700Bold", color: "#fff", fontSize: 11 },
  calEmpty: { fontFamily: "Manrope_500Medium", fontSize: 12, paddingLeft: 42 },
  calBooking: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingLeft: 10,
    paddingVertical: 6,
    borderLeftWidth: 3,
    marginBottom: 4,
    marginLeft: 34,
  },
  calBookingTime: { fontFamily: "Manrope_700Bold", fontSize: 12, width: 40 },
  calBookingService: { fontFamily: "Manrope_600SemiBold", fontSize: 13 },
  calBookingCustomer: { fontFamily: "Manrope_500Medium", fontSize: 11 },
  calBookingPrice: { fontFamily: "Manrope_700Bold", fontSize: 12 },
  noShowLabel: { fontFamily: "Manrope_700Bold", fontSize: 10, color: "#B33A3A", marginTop: 2 },
  noShowBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  noShowBtnText: { fontFamily: "Manrope_700Bold", fontSize: 10, color: "#8C8378" },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F0E9E1",
  },
  pillActive: { backgroundColor: "#C1683C" },
  pillText: { fontFamily: "Manrope_600SemiBold", fontSize: 13, color: "#8C8378" },
  pillTextActive: { color: "#fff" },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F0E9E1",
    overflow: "hidden",
  },
  barFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#C1683C",
  },
  dateInput: {
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
