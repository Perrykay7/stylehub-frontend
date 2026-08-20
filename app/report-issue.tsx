import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../data/authContext";
import { useTheme } from "../data/themeContext";
import { submitSupportTicket } from "../api/client";

const CATEGORIES = ["Bug", "Booking Problem", "Payment Question", "Account Issue", "Feedback", "Other"];

export default function ReportIssueScreen() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const [category, setCategory] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!token) return;
    if (!category) {
      Alert.alert("Pick a category", "Let us know what this is about first.");
      return;
    }
    if (!message.trim()) {
      Alert.alert("Add a message", "Please describe the issue.");
      return;
    }
    setSubmitting(true);
    try {
      await submitSupportTicket(category, message.trim(), token);
      Alert.alert("Thanks for letting us know", "We've received your report and will look into it.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not submit your report.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: colors.text }]}>Report an Issue</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Tell us what's wrong or share feedback — this goes straight to the StyleHub team.
          </Text>

          <Text style={[styles.label, { color: colors.muted }]}>Category</Text>
          <View style={styles.chipsWrap}>
            {CATEGORIES.map((c) => {
              const isSelected = category === c;
              return (
                <Pressable
                  key={c}
                  style={[
                    styles.chip,
                    { borderColor: colors.border, backgroundColor: colors.card },
                    isSelected && styles.chipSelected,
                  ]}
                  onPress={() => setCategory(c)}
                >
                  <Text style={[styles.chipText, { color: colors.text }, isSelected && styles.chipTextSelected]}>
                    {c}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.label, { color: colors.muted }]}>What's going on?</Text>
          <TextInput
            style={[
              styles.textArea,
              { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border },
            ]}
            value={message}
            onChangeText={setMessage}
            placeholder="Describe the issue in a few sentences..."
            placeholderTextColor={colors.muted}
            multiline
            maxLength={1000}
          />

          <Pressable
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.buttonText}>{submitting ? "Sending..." : "Send Report"}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { padding: 24 },
  title: { fontFamily: "Manrope_700Bold", fontSize: 22, marginBottom: 6 },
  subtitle: { fontFamily: "Manrope_400Regular", fontSize: 13, marginBottom: 24, lineHeight: 19 },
  label: { fontFamily: "Manrope_600SemiBold", fontSize: 13, marginBottom: 8 },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  chipSelected: {
    backgroundColor: "#C1683C",
    borderColor: "#C1683C",
  },
  chipText: { fontFamily: "Manrope_600SemiBold", fontSize: 13 },
  chipTextSelected: { color: "#fff" },
  textArea: {
    fontFamily: "Manrope_400Regular",
    fontSize: 15,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 140,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#C1683C",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontFamily: "Manrope_700Bold", color: "#fff", fontSize: 15 },
});
