import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../data/authContext";
import { useTheme } from "../../data/themeContext";
import {
  addFavorite,
  Booking,
  fetchBookings,
  fetchMyFavorites,
  fetchSalons,
  removeFavorite,
  Salon,
} from "../../api/client";

const REC_CARD_WIDTH = 260;
const REC_IMAGE_HEIGHT = 160;
const REC_CARD_HEIGHT = 240;
const REC_ROW_GAP = 16;

function HeartButton({
  favorited,
  onPress,
}: {
  favorited: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.heartButton} onPress={onPress} hitSlop={8}>
      <Text style={[styles.heartIcon, favorited && styles.heartIconActive]}>
        {favorited ? "♥" : "♡"}
      </Text>
    </Pressable>
  );
}

function SalonCard({
  salon,
  favorited,
  onToggleFavorite,
}: {
  salon: Salon;
  favorited: boolean;
  onToggleFavorite: (salonId: string) => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={() =>
        router.push({ pathname: "/salon/[id]", params: { id: salon.id } })
      }
    >
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: salon.imageUrl }}
          style={styles.image}
          contentFit="cover"
        />
        <HeartButton favorited={favorited} onPress={() => onToggleFavorite(salon.id)} />
        <View style={styles.sealOverlay}>
          <View style={styles.seal}>
            <Text style={styles.sealRating}>{salon.rating.toFixed(1)}</Text>
            <Text style={styles.sealStar}>★</Text>
            <Text style={styles.sealCount}>{salon.reviewCount}</Text>
          </View>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.name, { color: colors.text }]}>{salon.name}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.category}>{salon.category}</Text>
          <Text style={[styles.dot, { color: colors.muted }]}>·</Text>
          <Text style={[styles.distance, { color: colors.muted }]}>{salon.distanceKm} km</Text>
        </View>
        <Text style={[styles.address, { color: colors.muted }]}>{salon.address}</Text>
      </View>
    </Pressable>
  );
}

function RecommendedCard({
  salon,
  favorited,
  onToggleFavorite,
}: {
  salon: Salon;
  favorited: boolean;
  onToggleFavorite: (salonId: string) => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      style={[styles.recCard, { backgroundColor: colors.card }]}
      onPress={() =>
        router.push({ pathname: "/salon/[id]", params: { id: salon.id } })
      }
    >
      <View style={styles.recImageWrap}>
        <Image source={{ uri: salon.imageUrl }} style={styles.recImage} contentFit="cover" />
        <HeartButton favorited={favorited} onPress={() => onToggleFavorite(salon.id)} />
      </View>
      <View style={styles.recBody}>
        <Text style={[styles.recName, { color: colors.text }]} numberOfLines={1}>
          {salon.name}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.sealStar}>★</Text>
          <Text style={[styles.recMeta, { color: colors.muted }]}>
            {salon.rating.toFixed(1)} · {salon.distanceKm} km
          </Text>
        </View>
        <Text style={[styles.recMeta, { color: colors.muted }]} numberOfLines={1}>
          {salon.address}
        </Text>
      </View>
    </Pressable>
  );
}

type BookAgainItem = {
  key: string;
  salonId: string;
  serviceId: string;
  salonName: string;
  serviceName: string;
  price: number;
  imageUrl: string | null;
};

function BookAgainCard({ item }: { item: BookAgainItem }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.bookAgainCard, { backgroundColor: colors.card }]}>
      <View style={styles.bookAgainImageWrap}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.bookAgainImage} contentFit="cover" />
        ) : (
          <View style={[styles.bookAgainImage, styles.bookAgainImagePlaceholder]} />
        )}
      </View>
      <View style={styles.bookAgainBody}>
        <Text style={[styles.bookAgainName, { color: colors.text }]} numberOfLines={1}>
          {item.salonName}
        </Text>
        <Text style={[styles.bookAgainMeta, { color: colors.muted }]} numberOfLines={1}>
          GH₵{item.price} · {item.serviceName}
        </Text>
        <Pressable
          style={styles.rebookButton}
          onPress={() =>
            router.push({
              pathname: "/booking",
              params: { salonId: item.salonId, serviceId: item.serviceId },
            } as any)
          }
        >
          <Text style={styles.rebookIcon}>↻</Text>
          <Text style={styles.rebookText}>Rebook</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function BrowseScreen() {
  const { logout, user, token } = useAuth();
  const { colors } = useTheme();
  const { focusSearch } = useLocalSearchParams<{ focusSearch?: string }>();
  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (focusSearch) {
      searchInputRef.current?.focus();
    }
  }, [focusSearch]);
  const [salons, setSalons] = useState<Salon[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchSalons()
      .then((data) => {
        setSalons(data);
        setError(null);
      })
      .catch(() => {
        setError(
          "Could not reach the server. Make sure the backend is running and your phone is on the same Wi-Fi."
        );
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!token) return;
    fetchBookings(token)
      .then(setBookings)
      .catch(() => setBookings([]));
    fetchMyFavorites(token)
      .then((ids) => setFavoriteIds(new Set(ids)))
      .catch(() => setFavoriteIds(new Set()));
  }, [token]);

  function toggleFavorite(salonId: string) {
    if (!token) return;
    const isFavorited = favoriteIds.has(salonId);
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (isFavorited) next.delete(salonId);
      else next.add(salonId);
      return next;
    });
    const action = isFavorited ? removeFavorite(salonId, token) : addFavorite(salonId, token);
    action.catch(() => {
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (isFavorited) next.add(salonId);
        else next.delete(salonId);
        return next;
      });
      Alert.alert("Error", "Could not update your favorite. Please try again.");
    });
  }

 const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const unique = new Set(salons.map((s) => s.category));
    const timer = setTimeout(() => setCategories(Array.from(unique)), 50);
    return () => clearTimeout(timer);
  }, [salons]);

  const filteredSalons = useMemo(() => {
    return salons.filter((salon) => {
      const matchesQuery =
        query.trim().length === 0 ||
        salon.name.toLowerCase().includes(query.trim().toLowerCase()) ||
        salon.category.toLowerCase().includes(query.trim().toLowerCase());
      const matchesCategory =
        !activeCategory || salon.category === activeCategory;
      return matchesQuery && matchesCategory;
    });
  }, [salons, query, activeCategory]);

  const isBrowsing = query.trim().length === 0 && !activeCategory;

  const bookAgainItems = useMemo<BookAgainItem[]>(() => {
    const seen = new Set<string>();
    const items: BookAgainItem[] = [];
    for (const b of bookings) {
      const key = `${b.salonId}-${b.serviceId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const salon = salons.find((s) => s.id === b.salonId);
      items.push({
        key,
        salonId: b.salonId,
        serviceId: b.serviceId,
        salonName: b.salonName,
        serviceName: b.serviceName,
        price: b.price,
        imageUrl: salon?.imageUrl ?? null,
      });
      if (items.length >= 10) break;
    }
    return items;
  }, [bookings, salons]);

  const recommendedGroups = useMemo(() => {
    const groups: Salon[][] = [];
    for (let i = 0; i < filteredSalons.length; i += 4) {
      groups.push(filteredSalons.slice(i, i + 4));
    }
    return groups;
  }, [filteredSalons]);

 const ListHeader = (
    <>
      <View style={styles.headerContainer}>
        <Text style={styles.eyebrow}>StyleHub</Text>
        <Text style={[styles.header, { color: colors.text }]}>Welcome, {user?.name?.split(" ")[0]}</Text>
        <Text style={[styles.subheader, { color: colors.muted }]}>Nearby Salons & Spas</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={() => router.push("/my-bookings")}>
            <Text style={[styles.myBookingsLink, { color: colors.text }]}>My Bookings</Text>
          </Pressable>
          {user?.role === "owner" && (
            <Pressable onPress={() => router.push("/my-salon")}>
              <Text style={[styles.myBookingsLink, { color: colors.text }]}>My Salon</Text>
            </Pressable>
          )}
        </View>
      </View>
      <TextInput
        ref={searchInputRef}
        style={[styles.searchInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
        placeholder="Search by name or category"
        placeholderTextColor="#A89D8F"
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        clearButtonMode="while-editing"
      />

      {categories.length > 0 && (
        <ScrollView
          key={categories.join(",")}
          horizontal
          style={styles.chipsList}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipList}
        >
          {categories.map((item) => {
            const isSelected = item === activeCategory;
            return (
              <Pressable
                key={item}
                style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }, isSelected && styles.chipSelected]}
                onPress={() => setActiveCategory(isSelected ? null : item)}
              >
                <Text style={[styles.chipText, { color: colors.text }, isSelected && styles.chipTextSelected]}>
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </>
  );

  return (
    <LinearGradient colors={colors.backgroundGradient} style={styles.gradient}>
    <SafeAreaView style={styles.container}>
      {loading ? (
        <>
          {ListHeader}
          <ActivityIndicator style={styles.loading} size="large" color="#C1683C" />
        </>
      ) : error ? (
        <>
          {ListHeader}
          <Text style={styles.errorText}>{error}</Text>
        </>
      ) : isBrowsing ? (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {ListHeader}

          {bookAgainItems.length > 0 && (
            <>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Book again</Text>
                <Pressable onPress={() => router.push("/my-bookings")}>
                  <Text style={[styles.seeAll, { color: colors.muted }]}>See all</Text>
                </Pressable>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.bookAgainList}
              >
                {bookAgainItems.map((item) => (
                  <BookAgainCard key={item.key} item={item} />
                ))}
              </ScrollView>
            </>
          )}

          {filteredSalons.length > 0 && (
            <>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Recommended</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recGrid}
              >
                {recommendedGroups.map((group, groupIndex) => (
                  <View key={groupIndex} style={styles.recGroupBlock}>
                    {group.map((salon) => (
                      <RecommendedCard
                        key={salon.id}
                        salon={salon}
                        favorited={favoriteIds.has(salon.id)}
                        onToggleFavorite={toggleFavorite}
                      />
                    ))}
                  </View>
                ))}
              </ScrollView>
            </>
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={filteredSalons}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SalonCard
              salon={item}
              favorited={favoriteIds.has(item.id)}
              onToggleFavorite={toggleFavorite}
            />
          )}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No salons match your search.</Text>
          }
        />
      )}
    </SafeAreaView>
    </LinearGradient>
  );
}

const CLAY = "#C1683C";
const INK = "#2B2622";
const PAPER = "#FBF7F2";
const SAGE = "#8A9A7E";
const MUTED = "#8C8378";
const RUST = "#A8442B";

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  eyebrow: {
    fontFamily: "Manrope_700Bold",
    fontSize: 11,
    letterSpacing: 2,
    color: CLAY,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  header: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 28,
    color: INK,
  },
  subheader: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    color: MUTED,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: "row",
    gap: 16,
    marginTop: 10,
  },
  myBookingsLink: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13,
    color: INK,
  },
  logoutLink: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13,
    color: RUST,
  },
  searchInput: {
    fontFamily: "Manrope_500Medium",
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
    color: INK,
    borderWidth: 1,
    borderColor: "#EFE6D9",
  },
  chipsList: {
    flexGrow: 0,
    marginBottom: 6,
  },
  chipList: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 16,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EFE6D9",
  },
  chipSelected: {
    backgroundColor: CLAY,
    borderColor: CLAY,
  },
 chipText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13,
    color: INK,
  },
  chipTextSelected: {
    color: "#fff",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 20,
    color: INK,
  },
  seeAll: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13,
  },
  bookAgainList: {
    paddingHorizontal: 20,
    gap: 14,
    paddingBottom: 8,
  },
  bookAgainCard: {
    width: 190,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: INK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  bookAgainImageWrap: {
    width: "100%",
    height: 110,
  },
  bookAgainImage: {
    width: "100%",
    height: "100%",
  },
  bookAgainImagePlaceholder: {
    backgroundColor: "#EFE6D9",
  },
  bookAgainBody: {
    padding: 12,
  },
  bookAgainName: {
    fontFamily: "Manrope_700Bold",
    fontSize: 14,
  },
  bookAgainMeta: {
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    marginTop: 2,
    marginBottom: 10,
  },
  rebookButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: PAPER,
    borderRadius: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#EFE6D9",
  },
  rebookIcon: {
    fontSize: 13,
    color: CLAY,
  },
  rebookText: {
    fontFamily: "Manrope_700Bold",
    fontSize: 13,
    color: CLAY,
  },
  recGrid: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 20,
  },
  recGroupBlock: {
    width: REC_CARD_WIDTH * 2 + 14,
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 14,
    rowGap: REC_ROW_GAP,
  },
  recCard: {
    width: REC_CARD_WIDTH,
    height: REC_CARD_HEIGHT,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: INK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  recImageWrap: {
    position: "relative",
    width: "100%",
    height: REC_IMAGE_HEIGHT,
  },
  recImage: {
    width: "100%",
    height: "100%",
  },
  recBody: {
    padding: 12,
  },
  recName: {
    fontFamily: "Manrope_700Bold",
    fontSize: 16,
  },
  recMeta: {
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    marginTop: 3,
  },
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
  heartIcon: {
    fontSize: 15,
    color: "#fff",
  },
  heartIconActive: {
    color: "#E0567A",
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyText: {
    fontFamily: "Manrope_500Medium",
    textAlign: "center",
    marginTop: 40,
    fontSize: 14,
    color: MUTED,
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
  card: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: INK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  imageWrap: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: 170,
  },
  sealOverlay: {
    position: "absolute",
    bottom: 10,
    right: 10,
  },
  seal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(43,38,34,0.85)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sealRating: {
    fontFamily: "Manrope_700Bold",
    fontSize: 13,
    color: "#fff",
  },
  sealStar: {
    fontSize: 11,
    color: "#E0A35C",
  },
  sealCount: {
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    color: "#D8D0C5",
  },
  cardBody: {
    padding: 14,
  },
  name: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 19,
    color: INK,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 6,
  },
  category: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13,
    color: SAGE,
  },
  dot: {
    color: MUTED,
    fontSize: 13,
  },
  distance: {
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    color: MUTED,
  },
  address: {
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    color: MUTED,
    marginTop: 6,
  },
});
