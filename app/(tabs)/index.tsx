import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
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

import { fetchSalons, Salon } from "../api/client";

function RatingSeal({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  return (
    <View style={styles.seal}>
      <Text style={styles.sealRating}>{rating.toFixed(1)}</Text>
      <Text style={styles.sealStar}>★</Text>
      <Text style={styles.sealCount}>{reviewCount}</Text>
    </View>
  );
}

function SalonCard({ salon }: { salon: Salon }) {
  return (
    <Pressable
      style={styles.card}
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
        <View style={styles.sealOverlay}>
          <RatingSeal rating={salon.rating} reviewCount={salon.reviewCount} />
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.name}>{salon.name}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.category}>{salon.category}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.distance}>{salon.distanceKm} km</Text>
        </View>
        <Text style={styles.address}>{salon.address}</Text>
      </View>
    </Pressable>
  );
}

export default function BrowseScreen() {
  const { logout, user } = useAuth();
  const { focusSearch } = useLocalSearchParams<{ focusSearch?: string }>();
  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (focusSearch) {
      searchInputRef.current?.focus();
    }
  }, [focusSearch]);
  const [salons, setSalons] = useState<Salon[]>([]);
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

 const ListHeader = (
    <>
      <View style={styles.headerContainer}>
        <Text style={styles.eyebrow}>StyleHub</Text>
        <Text style={styles.header}>Welcome, {user?.name?.split(" ")[0]}</Text>
        <Text style={styles.subheader}>Nearby Salons & Spas</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={() => router.push("/my-bookings")}>
            <Text style={styles.myBookingsLink}>My Bookings</Text>
          </Pressable>
          {user?.role === "owner" && (
            <Pressable onPress={() => router.push("/my-salon")}>
              <Text style={styles.myBookingsLink}>My Salon</Text>
            </Pressable>
          )}
          <Pressable onPress={() => router.push("/settings")}>
            <Text style={styles.myBookingsLink}>Settings</Text>
          </Pressable>
        </View>
      </View>
      <TextInput
        ref={searchInputRef}
        style={styles.searchInput}
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
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => setActiveCategory(isSelected ? null : item)}
              >
                <Text
                  style={[
                    styles.chipText,
                    isSelected && styles.chipTextSelected,
                  ]}
                >
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
      ) : (
        <FlatList
          data={filteredSalons}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <SalonCard salon={item} />}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No salons match your search.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const CLAY = "#C1683C";
const INK = "#2B2622";
const PAPER = "#FBF7F2";
const SAGE = "#8A9A7E";
const MUTED = "#8C8378";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PAPER,
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
    color: "#A8442B",
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
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
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
    color: "#A8442B",
    paddingHorizontal: 24,
  },
  card: {
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