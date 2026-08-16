import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, Stack } from "expo-router";
import { Fragment, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../data/authContext";
import { useTheme } from "../data/themeContext";
import { fetchMyLoyaltyOverview, SalonLoyaltyOverview } from "../api/client";

const TIERS = [
  { label: "Iron", emoji: "🔩", color: "#6B7280", gradient: ["#9CA3AF", "#4B5563"] as const },
  { label: "Copper", emoji: "🟠", color: "#B87333", gradient: ["#E0A672", "#8B4513"] as const },
  { label: "Bronze", emoji: "🥉", color: "#A9673B", gradient: ["#D2A679", "#7A4A24"] as const },
  { label: "Silver", emoji: "🥈", color: "#9CA3AF", gradient: ["#F1F3F5", "#9CA3AF"] as const },
  { label: "Gold", emoji: "🥇", color: "#B8860B", gradient: ["#FBE28A", "#B8860B"] as const },
  { label: "Platinum", emoji: "🔘", color: "#8FA6AD", gradient: ["#E4EEF0", "#7E97A0"] as const },
  { label: "Titanium", emoji: "🛡️", color: "#4A5568", gradient: ["#8A98A8", "#2D3748"] as const },
  { label: "Diamond", emoji: "💎", color: "#5AC8E8", gradient: ["#C7F3FF", "#38BDF8"] as const },
];

const NODE_WIDTH = 84;
const CONNECTOR_WIDTH = 28;
const CIRCLE_SIZE = 62;
const HALO_SIZE = 80;
const SCREEN_WIDTH = Dimensions.get("window").width;

function getRewardsEarned(currentVisitCount: number, visitsRequired: number) {
  return Math.floor(currentVisitCount / visitsRequired);
}

function getTierInfoText(
  index: number,
  rewardsEarned: number,
  visitsRequired: number,
  visitsUntilNextReward: number
) {
  const currentIndex = Math.min(rewardsEarned, TIERS.length - 1);
  const tier = TIERS[index];
  const requiredVisits = index * visitsRequired;

  if (index === 0) return "Every member starts here — no visits required.";

  const alreadyPassed = index < currentIndex || (index === currentIndex && rewardsEarned > currentIndex);
  if (alreadyPassed) {
    return `${tier.label} reached after your ${requiredVisits}th visit.`;
  }
  if (index === currentIndex) {
    const isMaxTier = index === TIERS.length - 1;
    if (isMaxTier) {
      return `You're at the top tier! Keep booking to keep earning rewards.`;
    }
    return `You're here now — ${visitsUntilNextReward} more visit${visitsUntilNextReward === 1 ? "" : "s"} to reach ${TIERS[index + 1].label}.`;
  }
  return `Reach ${requiredVisits} total visits to unlock ${tier.label}.`;
}

function TierLadder({
  rewardsEarned,
  visitsRequired,
  visitsUntilNextReward,
  colors,
}: {
  rewardsEarned: number;
  visitsRequired: number;
  visitsUntilNextReward: number;
  colors: any;
}) {
  const currentIndex = Math.min(rewardsEarned, TIERS.length - 1);
  const [selectedIndex, setSelectedIndex] = useState(currentIndex);
  const scrollRef = useRef<ScrollView>(null);

  // Keep the selection in sync with the customer's real tier whenever it changes
  // (e.g. after a refresh where they've earned a new one).
  useEffect(() => {
    setSelectedIndex(currentIndex);
  }, [currentIndex]);

  useEffect(() => {
    const stepWidth = NODE_WIDTH + CONNECTOR_WIDTH;
    const targetX = Math.max(0, currentIndex * stepWidth - SCREEN_WIDTH / 2 + stepWidth);
    // Give the ScrollView a beat to lay out before jumping to the current tier.
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ x: targetX, animated: false });
    }, 50);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={true}
        directionalLockEnabled
        nestedScrollEnabled
        style={styles.ladderScroll}
        contentContainerStyle={styles.ladderRow}
      >
        {TIERS.map((tier, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isLocked = index > currentIndex;
          const isSelected = index === selectedIndex;

          return (
            <Fragment key={tier.label}>
              {index > 0 && (
                <View
                  style={[
                    styles.connector,
                    { backgroundColor: index <= currentIndex ? TIERS[index - 1].color : colors.border },
                  ]}
                />
              )}
              <Pressable
                style={styles.ladderNode}
                onPress={() => setSelectedIndex(index)}
                hitSlop={4}
              >
                <View
                  style={[
                    styles.tierHalo,
                    isCurrent && [styles.tierHaloCurrent, { shadowColor: tier.color }],
                    isSelected && !isCurrent && { borderWidth: 2, borderColor: tier.color },
                  ]}
                >
                  {isLocked ? (
                    <View
                      style={[
                        styles.tierCircle,
                        styles.tierCircleLocked,
                        { backgroundColor: colors.card, borderColor: colors.border },
                      ]}
                    >
                      <Text style={[styles.tierEmoji, styles.tierEmojiLocked]}>{tier.emoji}</Text>
                    </View>
                  ) : (
                    <LinearGradient
                      colors={tier.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.tierCircle, isCurrent && styles.tierCircleCurrent]}
                    >
                      <LinearGradient
                        colors={["rgba(255,255,255,0.55)", "rgba(255,255,255,0)"]}
                        style={styles.tierShine}
                        pointerEvents="none"
                      />
                      <Text style={[styles.tierEmoji, isCurrent && styles.tierEmojiCurrent]}>
                        {tier.emoji}
                      </Text>
                      {isDone && (
                        <View style={styles.checkBadge}>
                          <Ionicons name="checkmark-circle" size={20} color="#3D8B5F" />
                        </View>
                      )}
                    </LinearGradient>
                  )}
                </View>
                <Text
                  style={[
                    styles.tierLabel,
                    { color: isLocked ? colors.muted : colors.text },
                    (isCurrent || isSelected) && [styles.tierLabelCurrent, { color: tier.color }],
                  ]}
                >
                  {tier.label}
                </Text>
              </Pressable>
            </Fragment>
          );
        })}
      </ScrollView>

      <Text style={[styles.tierInfoText, { color: colors.muted }]}>
        {getTierInfoText(selectedIndex, rewardsEarned, visitsRequired, visitsUntilNextReward)}
      </Text>
    </View>
  );
}

function LoyaltyCard({ item, colors }: { item: SalonLoyaltyOverview; colors: any }) {
  const rewardsEarned = getRewardsEarned(item.currentVisitCount, item.visitsRequired);
  const currentTier = TIERS[Math.min(rewardsEarned, TIERS.length - 1)];
  const justEarned = item.visitsUntilNextReward === item.visitsRequired && item.currentVisitCount > 0;
  const hasDiscount = item.discountPercent > 0;

  const visitsIntoCycle = justEarned ? 0 : item.visitsRequired - item.visitsUntilNextReward;
  const progressFraction = Math.max(0, Math.min(1, visitsIntoCycle / item.visitsRequired));

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <Pressable
        style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
        onPress={() => router.push({ pathname: "/salon/[id]", params: { id: item.salonId } })}
      >
        <Text style={styles.emoji}>{currentTier.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.salonName, { color: colors.text }]}>{item.salonName}</Text>
          <View style={[styles.tierBadge, { backgroundColor: currentTier.color }]}>
            <Text style={styles.tierBadgeText}>{currentTier.label} Member</Text>
          </View>
        </View>
      </Pressable>

      {/* Kept outside the Pressable above so its horizontal swipe isn't
          swallowed by the card's own tap responder. */}
      <TierLadder
        rewardsEarned={rewardsEarned}
        visitsRequired={item.visitsRequired}
        visitsUntilNextReward={item.visitsUntilNextReward}
        colors={colors}
      />

      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.progressFill,
            { width: `${progressFraction * 100}%`, backgroundColor: currentTier.color },
          ]}
        />
      </View>

      {justEarned ? (
        <Text style={[styles.progressText, { color: colors.muted }]}>
          {hasDiscount
            ? `You just earned ${item.discountPercent}% off! `
            : "You just reached a new tier! "}
          Book {item.visitsRequired} more times for your next reward.
        </Text>
      ) : (
        <Text style={[styles.progressText, { color: colors.muted }]}>
          {visitsIntoCycle} of {item.visitsRequired} visits · {item.visitsUntilNextReward} more{" "}
          until {hasDiscount ? `${item.discountPercent}% off.` : "your next tier."}
        </Text>
      )}
    </View>
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
  ladderScroll: {
    marginTop: 20,
  },
  ladderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 4,
    paddingBottom: 6,
  },
  connector: {
    width: CONNECTOR_WIDTH,
    height: 3,
    borderRadius: 1.5,
    marginTop: HALO_SIZE / 2 - 1.5,
  },
  ladderNode: {
    alignItems: "center",
    width: NODE_WIDTH,
  },
  tierHalo: {
    width: HALO_SIZE,
    height: HALO_SIZE,
    borderRadius: HALO_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  tierHaloCurrent: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 6,
  },
  tierCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE * 0.32,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  tierCircleLocked: {
    borderWidth: 2,
    shadowOpacity: 0,
    elevation: 0,
  },
  tierCircleCurrent: {
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 5,
  },
  tierShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "55%",
    borderTopLeftRadius: CIRCLE_SIZE * 0.32,
    borderTopRightRadius: CIRCLE_SIZE * 0.32,
  },
  tierEmoji: {
    fontSize: 26,
  },
  tierEmojiCurrent: {
    fontSize: 30,
  },
  tierEmojiLocked: {
    opacity: 0.35,
  },
  checkBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#fff",
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  tierLabel: {
    fontFamily: "Manrope_700Bold",
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  tierLabelCurrent: {
    fontSize: 13,
  },
  tierInfoText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 8,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    marginTop: 16,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
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
