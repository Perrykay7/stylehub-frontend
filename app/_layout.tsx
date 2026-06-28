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
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import { AuthProvider, useAuth } from "../data/authContext";
import { ThemeProvider } from "../data/themeContext";

function RootNavigator() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

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
      }
    });
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="salon/[id]" options={{ title: "Salon Details" }} />
      <Stack.Screen name="booking" options={{ title: "Book Appointment" }} />
      <Stack.Screen name="my-salon" options={{ title: "My Salon" }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ title: "Settings" }} />
      <Stack.Screen name="reverify-owner" options={{ title: "Re-verify Owner Access" }} />
      <Stack.Screen name="owner-dashboard" options={{ title: "Dashboard" }} />
      <Stack.Screen name="booking-confirmation" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
    </Stack>
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