import { router } from "expo-router";
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../data/authContext";

export default function ProfileScreen() {
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>STYLEHUB</Text>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.phone}>{user?.phone}</Text>

        <View style={styles.section}>
          <Pressable
            style={styles.row}
            onPress={() =>
              user?.role === "owner"
                ? router.push("/my-salon")
                : router.push("/reverify-owner" as any)
            }
          >
            <Text style={styles.rowText}>My Salon</Text>
          </Pressable>
          <Pressable
            style={styles.row}
            onPress={() => router.push("/settings")}
          >
            <Text style={styles.rowText}>Settings</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const CLAY = "#C1683C";
const INK = "#2B2622";
const PAPER = "#FBF7F2";
const MUTED = "#8C8378";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PAPER,
  },
  content: {
    padding: 20,
  },
  eyebrow: {
    fontFamily: "Manrope_700Bold",
    fontSize: 11,
    letterSpacing: 2,
    color: CLAY,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  name: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 26,
    color: INK,
  },
  phone: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    color: MUTED,
    marginTop: 4,
    marginBottom: 24,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: INK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  row: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#F3ECE2",
  },
  rowText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 15,
    color: INK,
  },
});