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

export default function RegisterScreen() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<"customer" | "owner">("customer");
  const [inviteCode, setInviteCode] = useState("");
 const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleRegister() {
    if (!name || !phone || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (role === "owner" && !inviteCode) {
      setError("Please enter the salon owner invite code.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
     await register(name, phone, password, role, inviteCode);
      router.replace("/(tabs)" as any);
    } catch (err: any) {
      setError(err.message || "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Sign Up", headerShown: false }} />
      <View style={styles.content}>
        <Text style={styles.eyebrow}>STYLEHUB</Text>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>
          Sign up to start booking appointments
        </Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Text style={styles.label}>I am a...</Text>
        <View style={styles.roleRow}>
          <Pressable
            style={[
              styles.roleOption,
              role === "customer" && styles.roleOptionSelected,
            ]}
            onPress={() => setRole("customer")}
          >
            <Text
              style={[
                styles.roleText,
                role === "customer" && styles.roleTextSelected,
              ]}
            >
              Customer
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.roleOption,
              role === "owner" && styles.roleOptionSelected,
            ]}
            onPress={() => setRole("owner")}
          >
            <Text
              style={[
                styles.roleText,
                role === "owner" && styles.roleTextSelected,
              ]}
            >
              Salon Owner
            </Text>
          </Pressable>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Full name"
          placeholderTextColor="#A89D8F"
          value={name}
          onChangeText={setName}
        />
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
            placeholder="Password (min. 6 characters)"
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
        <View style={styles.passwordWrapper}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirm password"
            placeholderTextColor="#A89D8F"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            autoCapitalize="none"
          />
          <Pressable
            style={styles.eyeButton}
            onPress={() => setShowConfirmPassword((prev) => !prev)}
          >
            <Ionicons
              name={showConfirmPassword ? "eye-off" : "eye"}
              size={20}
              color="#8C8378"
            />
          </Pressable>
        </View>

        {role === "owner" && (
          <TextInput
            style={styles.input}
            placeholder="Salon owner invite code"
            placeholderTextColor="#A89D8F"
            value={inviteCode}
            onChangeText={setInviteCode}
            autoCapitalize="none"
          />
        )}

        <Pressable
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign Up</Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.push("/login")}>
          <Text style={styles.linkText}>
            Already have an account? <Text style={styles.linkBold}>Log in</Text>
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
    marginBottom: 12,
  },
  label: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13,
    color: MUTED,
    marginBottom: 8,
  },
  roleRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EFE6D9",
  },
  roleOptionSelected: {
    backgroundColor: CLAY,
    borderColor: CLAY,
  },
  roleText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
    color: INK,
  },
  roleTextSelected: {
    color: "#fff",
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