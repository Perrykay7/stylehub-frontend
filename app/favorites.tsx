import { Image } from "expo-image";
import { router, Stack } from "expo-router";
import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../data/authContext";
import { isSalonOpenNow } from "../data/salonStatus";
import { useTheme } from "../data/themeContext";
import { fetchMyFavorites, fetchSalons, removeFavorite, Salon } from "../api/client";

function FavoriteCard({
  salon,
  onRemove,
}: {
  salon: Salon;
  onRemove: (salonId: string) => void;
}) {
  const { colors } = useTheme();
  const isOpen = isSalonOpenNow(salon.openTime, salon.closeTime);

  return (
    <Pressable
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={() => router.push({ pathname: "/salon/[id]", params: { id: salon.id } })}
    >
      <View style={styles.imageWrap}>
        <Image source={{ uri: salon.imageUrl }} style={styles.image} contentFit="cover" />
        <Pressable style={styles.heartButton} onPress={() => onRemove(salon.id)} hitSlop={8}>
          <Text style={styles.heartIcon}>♥</Text>
        </Pressable>
        <View style={[styles.openBadge, { backgroundColor: isOpen ? "#E4F3EA" : "#F3E4E4" }]}>
          <View style={[styles.openDot, { backgroundColor: isOpen ? "#3D8B5F" : "#A8442B" }]} />
          <Text style={[styles.openBadgeText, { color: isOpen ? "#3D8B5F" : "#A8442B" }]}>
            {isOpen ? "Open Now" : "Closed"}
          </Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.name, { color: colors.text }]}>{salon.name}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.category}>{salon.category}</Text>
          <Text style={[styles.dot, { color: colors.muted }]}>·</Text>
          <Text style={[styles.rating, { color: colors.muted }]}>
            ★ {salon.rating.toFixed(1)} ({salon.reviewCount})
          </Text>
        </View>
        {!!salon.address && (
          <Text style={[styles.address, { color: colors.muted }]} numberOfLines={1}>
            {salon.address}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

export default function FavoritesScreen() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const [salons, setSalons] = useState<Salon[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  function loadData() {
    if (!token) return;
    Promise.all([fetchSalons(), fetchMyFavorites(token)])
      .then(([allSalons, ids]) => {
        setSalons(allSalons);
        setFavoriteIds(ids);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [token])
  );

  function handleRemove(salonId: string) {
    if (!token) return;
    setFavoriteIds((prev) => prev.filter((id) => id !== salonId));
    removeFavorite(salonId, token).catch(() => {
      setFavoriteIds((prev) => [...prev, salonId]);
    });
  }

  const favoriteSalons = salons.filter((s) => favoriteIds.includes(s.id));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: "My Favorites" }} />
      {loading ? (
        <ActivityIndicator style={styles.loading} size="large" color={colors.clay} />
      ) : (
        <FlatList
          data={favoriteSalons}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <FavoriteCard salon={item} onRemove={handleRemove} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No favorites yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                Tap the heart on a salon to save it here for quick access.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const CLAY = "#C1683C";
const INK = "#2B2622";
const SAGE = "#8A9A7E";
const MUTED = "#8C8378";

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { marginTop: 60 },
  listContent: { padding: 16, paddingBottom: 40 },
  card: {
    marginBottom: 20,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: INK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  imageWrap: { position: "relative" },
  image: { width: "100%", height: 170 },
  heartButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(43,38,34,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  heartIcon: { fontSize: 15, color: "#E0567A" },
  openBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  openDot: { width: 6, height: 6, borderRadius: 3 },
  openBadgeText: {
    fontFamily: "Manrope_700Bold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  cardBody: { padding: 14 },
  name: { fontFamily: "PlayfairDisplay_700Bold", fontSize: 19 },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 6 },
  category: { fontFamily: "Manrope_600SemiBold", fontSize: 13, color: SAGE },
  dot: { fontSize: 13 },
  rating: { fontFamily: "Manrope_500Medium", fontSize: 13 },
  address: { fontFamily: "Manrope_500Medium", fontSize: 13, marginTop: 6 },
  emptyState: { alignItems: "center", marginTop: 80, paddingHorizontal: 30 },
  emptyTitle: { fontFamily: "Manrope_700Bold", fontSize: 16, marginBottom: 6 },
  emptySubtitle: { fontFamily: "Manrope_500Medium", fontSize: 13, textAlign: "center" },
});
