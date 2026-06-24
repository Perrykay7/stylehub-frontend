import { Image } from "expo-image";
import { router, Stack, useLocalSearchParams } from "expo-router";
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

import { fetchSalonById, Salon } from "../api/client";

export default function SalonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSalonById(id)
      .then((data) => {
        setSalon(data);
        setError(null);
      })
      .catch(() => setError("Could not load salon details."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={styles.loading} size="large" color="#C1683C" />
      </SafeAreaView>
    );
  }

  if (error || !salon) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>{error ?? "Salon not found."}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: salon.name }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: salon.imageUrl }}
            style={styles.heroImage}
            contentFit="cover"
          />
          <View style={styles.sealOverlay}>
            <View style={styles.seal}>
              <Text style={styles.sealRating}>{salon.rating.toFixed(1)}</Text>
              <Text style={styles.sealStar}>★</Text>
              <Text style={styles.sealCount}>{salon.reviewCount}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.name}>{salon.name}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.category}>{salon.category}</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.distance}>{salon.distanceKm} km away</Text>
          </View>
          <Text style={styles.address}>{salon.address}</Text>
          <Text style={styles.hours}>
            Open {salon.openTime} – {salon.closeTime}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          <Text style={styles.sectionHint}>Tap a service to book it</Text>
          {salon.services.map((service) => (
            <Pressable
              key={service.id}
              style={styles.serviceRow}
              onPress={() =>
                router.push({
                  pathname: "/booking",
                  params: {
                    salonId: salon.id,
                    serviceId: service.id,
                  },
                })
              }
            >
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceDuration}>
                  {service.durationMins} min
                </Text>
              </View>
              <Text style={styles.servicePrice}>GHS {service.price}</Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.section, styles.lastSection]}>
          <Text style={styles.sectionTitle}>Reviews</Text>
          {salon.reviews.map((review) => (
            <View key={review.id} style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewerName}>
                  {review.customerName}
                </Text>
                <View style={styles.reviewRatingPill}>
                  <Text style={styles.reviewRatingText}>★ {review.rating}</Text>
                </View>
              </View>
              <Text style={styles.reviewComment}>{review.comment}</Text>
              <Text style={styles.reviewDate}>{review.date}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
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
  scrollContent: {
    paddingBottom: 32,
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
    paddingHorizontal: 24,
  },
  imageWrap: {
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: 240,
  },
  sealOverlay: {
    position: "absolute",
    bottom: 14,
    right: 14,
  },
  seal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(43,38,34,0.85)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  sealRating: {
    fontFamily: "Manrope_700Bold",
    fontSize: 14,
    color: "#fff",
  },
  sealStar: {
    fontSize: 12,
    color: "#E0A35C",
  },
  sealCount: {
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    color: "#D8D0C5",
  },
  section: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 18,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  lastSection: {
    marginBottom: 8,
  },
  name: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 24,
    color: INK,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 6,
  },
  category: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
    color: SAGE,
  },
  dot: {
    color: MUTED,
    fontSize: 14,
  },
  distance: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    color: MUTED,
  },
  address: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    color: MUTED,
    marginTop: 10,
  },
  hours: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    color: MUTED,
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 19,
    color: INK,
    marginBottom: 4,
  },
  sectionHint: {
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    color: MUTED,
    marginBottom: 10,
  },
  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3ECE2",
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontFamily: "Manrope_700Bold",
    fontSize: 15,
    color: INK,
  },
  serviceDuration: {
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    color: MUTED,
    marginTop: 2,
  },
  servicePrice: {
    fontFamily: "Manrope_700Bold",
    fontSize: 15,
    color: CLAY,
  },
  reviewItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3ECE2",
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewerName: {
    fontFamily: "Manrope_700Bold",
    fontSize: 14,
    color: INK,
  },
  reviewRatingPill: {
    backgroundColor: "#F3ECE2",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  reviewRatingText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 12,
    color: CLAY,
  },
  reviewComment: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    color: "#4A4339",
    marginTop: 6,
  },
  reviewDate: {
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    color: "#A89D8F",
    marginTop: 4,
  },
});