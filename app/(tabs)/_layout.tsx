import { Ionicons } from "@expo/vector-icons";
import { router, Tabs } from "expo-router";
import { View } from "react-native";

const CLAY = "#C1683C";
const MUTED = "#8C8378";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: CLAY,
        tabBarInactiveTintColor: MUTED,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          bottom: 24,
          left: 20,
          right: 20,
          borderRadius: 30,
          height: 64,
          backgroundColor: "#fff",
          borderTopWidth: 0,
          shadowColor: "#2B2622",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.1,
          shadowRadius: 14,
          elevation: 6,
        },
        tabBarItemStyle: {
          height: 64,
          justifyContent: "center",
          alignItems: "center",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                width: 44,
                height: 44,
                backgroundColor: focused ? "#F3E4D8" : "transparent",
                borderRadius: 22,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ color }) => (
            <View style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="search" size={24} color={color} />
            </View>
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
           router.push({ pathname: "/(tabs)" as any, params: { focusSearch: "1" } });
          },
        }}
      />
      <Tabs.Screen
        name="my-bookings"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                width: 44,
                height: 44,
                backgroundColor: focused ? "#F3E4D8" : "transparent",
                borderRadius: 22,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name={focused ? "calendar" : "calendar-outline"}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                width: 44,
                height: 44,
                backgroundColor: focused ? "#F3E4D8" : "transparent",
                borderRadius: 22,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}