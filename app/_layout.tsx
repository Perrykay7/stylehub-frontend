import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from "@expo-google-fonts/manrope";
import { PlayfairDisplay_700Bold } from "@expo-google-fonts/playfair-display";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SecureStore from "expo-secure-store";
import * as Notifications from "expo-notifications";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { AuthProvider, useAuth } from "../data/authContext";
import { ThemeProvider, useTheme } from "../data/themeContext";

const WELCOME_SPLASH_DURATION_MS = 1800;

function WelcomeSplash({ name }: { name?: string | null }) {
  const { colors } = useTheme();
  const firstName = name?.trim().split(" ")[0];

  return (
    <View style={[welcomeStyles.container, { backgroundColor: colors.background }]}>
      <Text style={[welcomeStyles.emoji]}>✂️</Text>
      <Text style={[welcomeStyles.title, { color: colors.text }]}>StyleHub</Text>
      <Text style={[welcomeStyles.greeting, { color: colors.clay }]}>
        {firstName ? `Welcome back, ${firstName}!` : "Welcome to StyleHub"}
      </Text>
      <Text style={[welcomeStyles.subtitle, { color: colors.muted }]}>
        Your next great look starts here.
      </Text>
    </View>
  );
}

const welcomeStyles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emoji: { fontSize: 64, marginBottom: 20 },
  title: { fontFamily: "PlayfairDisplay_700Bold", fontSize: 32, marginBottom: 12 },
  greeting: { fontFamily: "Manrope_700Bold", fontSize: 18, marginBottom: 8, textAlign: "center" },
  subtitle: { fontFamily: "Manrope_500Medium", fontSize: 14, textAlign: "center" },
});

function RootNavigator() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [showWelcome, setShowWelcome] = useState(false);
  const hasShownWelcome = useRef(false);

  // Reset so logging out and back in (without restarting the app) shows the
  // welcome overlay again on the next successful login.
  useEffect(() => {
    if (!user) hasShownWelcome.current = false;
  }, [user]);

  useEffect(() => {
    if (loading) return;

    SecureStore.getItemAsync("stylehub_onboarded").then((val) => {
      const isOnboarded = val === "true";
      const inOnboarding = segments[0] === "onboarding";
      const inAuthGroup =
        segments[0] === "login" ||
        segments[0] === "register" ||
        segments[0] === "forgot-password";

      if (!isOnboarded && !inOnboarding) {
        router.replace("/onboarding" as any);
        return;
      }

      if (isOnboarded) {
        if (!user && !inAuthGroup) {
          router.replace("/login");
        } else if (user && inAuthGroup) {
          router.replace("/(tabs)" as any);
        }

        // Show the welcome overlay the first time we land on Home each app
        // session — right after a fresh login, or on open if already signed in.
        if (user && !hasShownWelcome.current) {
          hasShownWelcome.current = true;
          setShowWelcome(true);
          setTimeout(() => setShowWelcome(false), WELCOME_SPLASH_DURATION_MS);
        }
      }
    });
  }, [user, loading, segments]);

  useEffect(() => {
    function handleReverifyData(data: any) {
      if (!user) return;
      if (data?.type === "reverify" && (data.role === "owner" || data.role === "professional")) {
        router.replace({ pathname: "/reverify", params: { role: data.role } } as any);
      }
    }

    let receivedSub: { remove: () => void } | undefined;
    let responseSub: { remove: () => void } | undefined;
    try {
      receivedSub = Notifications.addNotificationReceivedListener((notification) => {
        handleReverifyData(notification.request.content.data);
      });
      responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
        handleReverifyData(response.notification.request.content.data);
      });

      // Cold start via a tapped notification can be missed by the listener above
      // if it fires before this effect registers, so check explicitly too.
      // Not supported in Expo Go on some platforms — fails silently there.
      Notifications.getLastNotificationResponseAsync()
        .then((response) => {
          if (response) handleReverifyData(response.notification.request.content.data);
        })
        .catch(() => {});
    } catch {
      // Native notification module unavailable (e.g. some Expo Go builds) — no-op.
    }

    return () => {
      receivedSub?.remove();
      responseSub?.remove();
    };
  }, [user, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="salon/[id]" options={{ title: "Salon Details" }} />
        <Stack.Screen name="booking" options={{ title: "Book Appointment" }} />
        <Stack.Screen name="my-salon" options={{ title: "My Salon" }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ title: "Settings" }} />
        <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
        <Stack.Screen name="reverify" options={{ headerShown: false }} />
        <Stack.Screen name="owner-dashboard" options={{ title: "Dashboard" }} />
        <Stack.Screen name="professional-dashboard" options={{ title: "My Schedule" }} />
        <Stack.Screen name="booking-confirmation" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack>
      {showWelcome && (
        <View style={StyleSheet.absoluteFillObject}>
          <WelcomeSplash name={user?.name} />
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <RootNavigator />
        <StatusBar style="auto" />
      </AuthProvider>
    </ThemeProvider>
  );
}