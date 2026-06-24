import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../data/authContext";

export default function LoginScreen() {
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin() {
    if (!phone || !password) {
      setError("Please enter your phone number and password.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await login(phone, password);
      router.replace("/");
    } catch (err: any) {
      setError(err.message || "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Log In", headerShown: false }} />
      <View style={styles.content}>
        <Text style={styles.eyebrow}>STYLEHUB</Text>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Log in to book your next appointment</Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TextInput
          style={styles.input}
          placeholder="Phone number"
          placeholderTextColor="#A89D8F"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          autoCapitalize="none"
        />
        <View style={styles.passwordWrapper}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            placeholderTextColor="#A89D8F"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
          />
          <Pressable
            style={styles.eyeButton}
            onPress={() => setShowPassword((prev) => !prev)}
          >
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={20}
              color="#8C8378"
            />
          </Pressable>
        </View>

        <Pressable
          onPress={() => router.push("/forgot-password")}
          style={styles.forgotLink}
        >
          <Text style={styles.forgotLinkText}>Forgot password?</Text>
        </Pressable>

        <Pressable
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Log In</Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.push("/register")}>
          <Text style={styles.linkText}>
            Don't have an account? <Text style={styles.linkBold}>Sign up</Text>
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const CLAY = "#C1683C";
const RUST = "#A8442B";
const INK = "#2B2622";
const PAPER = "#FBF7F2";
const MUTED = "#8C8378";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PAPER,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  eyebrow: {
    fontFamily: "Manrope_700Bold",
    fontSize: 11,
    letterSpacing: 2,
    color: CLAY,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  title: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 30,
    color: INK,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    color: MUTED,
    marginBottom: 28,
  },
  errorText: {
    fontFamily: "Manrope_600SemiBold",
    color: RUST,
    fontSize: 13,
    marginBottom: 14,
  },
  input: {
    fontFamily: "Manrope_500Medium",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    marginBottom: 12,
    color: INK,
    borderWidth: 1,
    borderColor: "#EFE6D9",
  },
  passwordWrapper: {
    position: "relative",
    marginBottom: 12,
  },
  passwordInput: {
    fontFamily: "Manrope_500Medium",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingRight: 46,
    paddingVertical: 13,
    fontSize: 15,
    color: INK,
    borderWidth: 1,
    borderColor: "#EFE6D9",
  },
  eyeButton: {
    position: "absolute",
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  button: {
    backgroundColor: CLAY,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  forgotLink: {
    alignSelf: "flex-end",
    marginBottom: 4,
  },
  forgotLinkText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13,
    color: "#C1683C",
  },
  buttonText: {
    fontFamily: "Manrope_700Bold",
    color: "#fff",
    fontSize: 16,
  },
  linkText: {
    fontFamily: "Manrope_500Medium",
    textAlign: "center",
    marginTop: 22,
    fontSize: 14,
    color: MUTED,
  },
  linkBold: {
    fontFamily: "Manrope_700Bold",
    color: INK,
  },
});