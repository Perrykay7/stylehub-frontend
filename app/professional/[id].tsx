import { Image } from "expo-image";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "../../data/themeContext";
import { fetchProfessionalById, ProfessionalDetail } from "../../api/client";

export default function ProfessionalProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [pro, setPro] = useState<ProfessionalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchProfessionalById(id)
      .then(setPro)
      .catch(() => setError("Could not load this professional's profile."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator style={styles.loading} size="large" color={colors.clay} />
      </SafeAreaView>
    );
  }

  if (error || !pro) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.muted }]}>{error ?? "Professional not found."}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: pro.name }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          {pro.photoUrl ? (
            <Image source={{ uri: pro.photoUrl }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.cardAlt }]}>
              <Text style={[styles.avatarInitial, { color: colors.clay }]}>
                {pro.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={[styles.name, { color: colors.text }]}>{pro.name}</Text>
          {pro.salonName && (
            <Text
              style={[styles.salonLink, { color: colors.clay }]}
              onPress={() => router.push({ pathname: "/salon/[id]", params: { id: pro.salonId } } as any)}
            >
              {pro.salonName}
            </Text>
          )}
          {pro.ratingCount > 0 ? (
            <Text style={[styles.rating, { color: colors.muted }]}>
              ★ {pro.avgRating} · {pro.ratingCount} {pro.ratingCount === 1 ? "review" : "reviews"}
            </Text>
          ) : (
            <Text style={[styles.rating, { color: colors.muted }]}>No reviews yet</Text>
          )}
        </View>

        {pro.images.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Portfolio</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photosRow}>
              {pro.images.map((image) => (
                <Image key={image.id} source={{ uri: image.url }} style={styles.photo} contentFit="cover" />
              ))}
            </ScrollView>
          </View>
        )}

        <View style={[styles.section, styles.lastSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Reviews</Text>
          {pro.reviews.length === 0 ? (
            <Text style={[styles.noReviews, { color: colors.muted }]}>No written reviews yet.</Text>
          ) : (
            pro.reviews.map((review, i) => (
              <View key={i} style={[styles.reviewItem, { borderBottomColor: colors.border }]}>
                <Text style={[styles.reviewRating, { color: colors.clay }]}>{"★".repeat(review.rating)}</Text>
                <Text style={[styles.reviewComment, { color: colors.text }]}>{review.comment}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  loading: { marginTop: 60 },
  notFound: {
    fontFamily: "Manrope_500Medium",
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 36,
  },
  name: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 22,
  },
  salonLink: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
    marginTop: 4,
  },
  rating: {
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    marginTop: 8,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  lastSection: { marginBottom: 8 },
  sectionTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 18,
    marginBottom: 12,
  },
  photosRow: { gap: 10 },
  photo: {
    width: 200,
    height: 150,
    borderRadius: 14,
  },
  noReviews: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    textAlign: "center",
    marginVertical: 8,
  },
  reviewItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  reviewRating: {
    fontFamily: "Manrope_700Bold",
    fontSize: 13,
    marginBottom: 4,
  },
  reviewComment: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    lineHeight: 20,
  },
});
