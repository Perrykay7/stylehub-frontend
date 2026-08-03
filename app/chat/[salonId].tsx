import { useHeaderHeight } from "@react-navigation/elements";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../data/authContext";
import { useTheme } from "../../data/themeContext";
import { ChatMessage, fetchMyMessages, sendMyMessage, WS_BASE_URL } from "../../api/client";

export default function CustomerChatScreen() {
  const { salonId, salonName } = useLocalSearchParams<{ salonId: string; salonName?: string }>();
  const { token } = useAuth();
  const { colors } = useTheme();
  const headerHeight = useHeaderHeight();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const listRef = useRef<FlatList>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!token || !salonId) return;
    fetchMyMessages(salonId, token)
      .then(setMessages)
      .finally(() => setLoading(false));

    const ws = new WebSocket(`${WS_BASE_URL}/ws/chat?token=${token}`);
    wsRef.current = ws;
    ws.onopen = () => ws.send(JSON.stringify({ type: "join", salonId }));
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "message") {
          setMessages((prev) => (prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]));
        }
      } catch {}
    };

    return () => ws.close();
  }, [token, salonId]);

  async function handleSend() {
    const body = draft.trim();
    if (!body || !token || !salonId) return;
    setDraft("");
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "message", body }));
    } else {
      const message = await sendMyMessage(salonId, body, token).catch(() => null);
      if (message) setMessages((prev) => [...prev, message]);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: salonName || "Chat" }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={headerHeight}
      >
        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.clay} />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                Say hi! Ask about availability, pricing, or anything else.
              </Text>
            }
            renderItem={({ item }) => {
              const isMe = item.senderRole === "customer";
              return (
                <View style={[styles.bubbleRow, isMe && styles.bubbleRowMe]}>
                  <View
                    style={[
                      styles.bubble,
                      isMe
                        ? { backgroundColor: colors.clay }
                        : { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
                    ]}
                  >
                    <Text style={[styles.bubbleText, { color: isMe ? "#fff" : colors.text }]}>{item.body}</Text>
                  </View>
                </View>
              );
            }}
          />
        )}

        <View style={[styles.inputRow, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            placeholder="Type a message..."
            placeholderTextColor={colors.muted}
            value={draft}
            onChangeText={setDraft}
            multiline
          />
          <Pressable style={[styles.sendBtn, !draft.trim() && { opacity: 0.5 }]} onPress={handleSend} disabled={!draft.trim()}>
            <Text style={styles.sendBtnText}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 8, flexGrow: 1 },
  emptyText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    textAlign: "center",
    marginTop: 60,
    paddingHorizontal: 30,
  },
  bubbleRow: { flexDirection: "row", marginBottom: 10 },
  bubbleRowMe: { justifyContent: "flex-end" },
  bubble: {
    maxWidth: "78%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: "#C1683C",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  sendBtnText: {
    fontFamily: "Manrope_700Bold",
    fontSize: 14,
    color: "#fff",
  },
});
