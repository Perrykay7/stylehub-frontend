import * as SecureStore from "expo-secure-store";
import { router, Stack } from "expo-router";
import { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../data/themeContext";

const { width } = Dimensions.get("window");

const slides = [
  {
    emoji: "✂️",
    title: "Discover Top Salons",
    subtitle: "Browse the best salons and spas near you, all in one place.",
  },
  {
    emoji: "📅",
    title: "Book in Seconds",
    subtitle: "Pick your service, choose a time slot, and confirm your appointment instantly.",
  },
  {
    emoji: "⭐",
    title: "Track & Review",
    subtitle: "Manage your bookings, rate professionals, and share your experience.",
  },
];

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);

  async function finish() {
    await SecureStore.setItemAsync("stylehub_onboarded", "true");
    router.replace("/login");
  }

  function next() {
    if (activeIndex < slides.length - 1) {
      const nextIndex = activeIndex + 1;
      flatRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setActiveIndex(nextIndex);
    } else {
      finish();
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <Pressable style={styles.skipBtn} onPress={finish}>
        <Text style={[styles.skipText, { color: colors.muted }]}>Skip</Text>
      </Pressable>

      <FlatList
        ref={flatRef}
        data={slides}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>{item.subtitle}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === activeIndex ? colors.clay : colors.border },
              ]}
            />
          ))}
        </View>

        <Pressable style={[styles.button, { backgroundColor: colors.clay }]} onPress={next}>
          <Text style={styles.buttonText}>
            {activeIndex === slides.length - 1 ? "Get Started" : "Next"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skipBtn: { alignSelf: "flex-end", padding: 20 },
  skipText: { fontFamily: "Manrope_600SemiBold", fontSize: 14 },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  emoji: { fontSize: 80, marginBottom: 32 },
  title: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 28,
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontFamily: "Manrope_500Medium",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  footer: { paddingHorizontal: 28, paddingBottom: 36 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  button: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: { fontFamily: "Manrope_700Bold", color: "#fff", fontSize: 16 },
});
