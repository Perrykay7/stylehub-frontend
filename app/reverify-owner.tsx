import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../data/authContext";

export default function ReverifyOwnerScreen() {
  const { reverifyOwner } = useAuth();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!code.trim()) {
      Alert.alert("Error", "Please enter the referral code.");
      return;
    }
    setLoading(true);
    try {
      await reverifyOwner(code.trim());
      router.replace("/my-salon" as any);
    } catch (err: any) {
      Alert.alert("Invalid Code", err.message || "The referral code is incorrect.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Owner Re-Verification</Text>
        <Text style={styles.subtitle}>
          The owner referral code has been updated. Enter the new code to restore your owner access.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter new referral code"
          value={code}
          onChangeText={setCode}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Pressable style={styles.button} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verify</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  inner: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 12, color: "#111" },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 32, lineHeight: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    marginBottom: 16,
    color: "#111",
  },
  button: {
    backgroundColor: "#111",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
