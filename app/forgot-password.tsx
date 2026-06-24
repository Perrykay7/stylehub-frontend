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

import { forgotPassword, resetPassword } from "./api/client";

export default function ForgotPasswordScreen() {
  const [stage, setStage] = useState<"request" | "reset">("request");

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

 const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleRequestCode() {
    if (!phone) {
      setError("Please enter your phone number.");
      return;
    }
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      await forgotPassword(phone);
      setInfo("A reset code has been sent to your phone.");
      setStage("reset");
    } catch (err: any) {
      setError(err.message || "Could not request a reset code.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword() {
    if (!code || !newPassword) {
      setError("Please enter the code and your new password.");
      return;
    }
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      await resetPassword(phone, code, newPassword);
      setInfo("Password updated! You can now log in.");
      setTimeout(() => router.replace("/login"), 1200);
    } catch (err: any) {
      setError(err.message || "Could not reset password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Reset Password" }} />
      <View style={styles.content}>
        <Text style={styles.eyebrow}>STYLEHUB</Text>
        <Text style={styles.title}>
          {stage === "request" ? "Forgot password?" : "Enter your code"}
        </Text>
        <Text style={styles.subtitle}>
          {stage === "request"
            ? "Enter your phone number and we'll send you a 4-digit code."
            : `We sent a code to ${phone}. Enter it below with your new password.`}
        </Text>

        {error && <Text style={styles.errorText}>{error}</Text>}
        {info && <Text style={styles.infoText}>{info}</Text>}

        {stage === "request" ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Phone number"
              placeholderTextColor="#A89D8F"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              autoCapitalize="none"
            />
            <Pressable
              style={[styles.button, submitting && styles.buttonDisabled]}
              onPress={handleRequestCode}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send Code</Text>
              )}
            </Pressable>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="4-digit code"
              placeholderTextColor="#A89D8F"
              keyboardType="number-pad"
              maxLength={4}
              value={code}
              onChangeText={setCode}
            />
            <View style={styles.passwordWrapper}>
              <TextInput
                style={styles.passwordInput}
                placeholder="New password"
                placeholderTextColor="#A89D8F"
                secureTextEntry={!showPassword}
                value={newPassword}
                onChangeText={setNewPassword}
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
              style={[styles.button, submitting && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Reset Password</Text>
              )}
            </Pressable>
            <Pressable onPress={() => setStage("request")}>
              <Text style={styles.linkText}>
                Didn't get a code? <Text style={styles.linkBold}>Try again</Text>
              </Text>
            </Pressable>
          </>
        )}

        <Pressable onPress={() => router.replace("/login")}>
          <Text style={styles.linkText}>
            <Text style={styles.linkBold}>Back to login</Text>
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const CLAY = "#C1683C";
const RUST = "#A8442B";
const GREEN = "#3D8B5F";
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
    fontSize: 28,
    color: INK,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    color: MUTED,
    marginBottom: 24,
  },
  errorText: {
    fontFamily: "Manrope_600SemiBold",
    color: RUST,
    fontSize: 13,
    marginBottom: 14,
  },
  infoText: {
    fontFamily: "Manrope_600SemiBold",
    color: GREEN,
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
    marginTop: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: "Manrope_700Bold",
    color: "#fff",
    fontSize: 16,
  },
  linkText: {
    fontFamily: "Manrope_500Medium",
    textAlign: "center",
    marginTop: 20,
    fontSize: 14,
    color: MUTED,
  },
  linkBold: {
    fontFamily: "Manrope_700Bold",
    color: INK,
  },
});