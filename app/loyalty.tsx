import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../data/authContext";
import { useTheme } from "../data/themeContext";
import { fetchMyLoyaltyOverview, SalonLoyaltyOverview } from "../api/client";

function getLoyaltyTier(currentVisitCount: number, visitsRequired: number) {
  const rewardsEarned = Math.floor(currentVisitCount / visitsRequired);
  if (rewardsEarned >= 2) return { label: "Gold Member", emoji: "🥇", color: "#B8860B" };
  if (rewardsEarned >= 1) return { label: "Silver Member", emoji: "🥈", color: "#8A8A8A" };
  return { label: "Bronze Member", emoji: "🥉", color: "#A9673B" };
}

function LoyaltyCard({ item, colors }: { item: SalonLoyaltyOverview; colors: any }) {
  const tier = getLoyaltyTier(item.currentVisitCount, item.visitsRequired);
  const justEarned = item.visitsUntilNextReward === item.visitsRequired && item.currentVisitCount > 0;

  return (
    <Pressable
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={() => router.push({ pathname: "/salon/[id]", params: { id: item.salonId } })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Text style={styles.emoji}>{tier.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.salonName, { color: colors.text }]}>{item.salonName}</Text>
          <View style={[styles.tierBadge, { backgroundColor: tier.color }]}>
            <Text style={styles.tierBadgeText}>{tier.label}</Text>
          </View>
        </View>
      </View>
      {justEarned ? (
        <Text style={[styles.progressText, { color: colors.muted }]}>
          You just earned {item.discountPercent}% off! Book {item.visitsRequired} more times for
          your next reward.
        </Text>
      ) : (
        <Text style={[styles.progressText, { color: colors.muted }]}>
          {item.visitsUntilNextReward} more {item.visitsUntilNextReward === 1 ? "visit" : "visits"}{" "}
          until {item.discountPercent}% off.
        </Text>
      )}
    </Pressable>
  );
}

export default function LoyaltyOverviewScreen() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const [items, setItems] = useState<SalonLoyaltyOverview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetchMyLoyaltyOverview(token)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: "Loyalty Rewards" }} />
      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} size="large" color={colors.clay} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.salonId}
          renderItem={({ item }) => <LoyaltyCard item={item} colors={colors} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No loyalty rewards yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                Book with a salon that runs a loyalty program to start earning rewards here.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 32 },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  emoji: { fontSize: 28 },
  salonName: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 17,
    marginBottom: 4,
  },
  tierBadge: {
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tierBadgeText: {
    fontFamily: "Manrope_700Bold",
    fontSize: 11,
    color: "#fff",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  progressText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
  },
  emptyState: { alignItems: "center", marginTop: 80, paddingHorizontal: 30 },
  emptyTitle: { fontFamily: "Manrope_700Bold", fontSize: 16, marginBottom: 6 },
  emptySubtitle: { fontFamily: "Manrope_500Medium", fontSize: 13, textAlign: "center" },
});
