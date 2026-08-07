import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardStickyView } from "react-native-keyboard-controller";

import { useAuth } from "../data/authContext";
import { useTheme } from "../data/themeContext";
import { ChatMessage, fetchOwnerThread, sendOwnerMessage, WS_BASE_URL } from "../api/ownerClient";

export default function OwnerChatThreadScreen() {
  const { salonId, customerId, customerName } = useLocalSearchParams<{
    salonId: string;
    customerId: string;
    customerName?: string;
  }>();
  const { token } = useAuth();
  const { colors } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const listRef = useRef<FlatList>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!token || !salonId || !customerId) return;
    fetchOwnerThread(salonId, customerId, token)
      .then(setMessages)
      .finally(() => setLoading(false));

    const ws = new WebSocket(`${WS_BASE_URL}/ws/chat?token=${token}`);
    wsRef.current = ws;
    ws.onopen = () => ws.send(JSON.stringify({ type: "join", salonId, customerId }));
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "message") {
          setMessages((prev) => (prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]));
        }
      } catch {}
    };

    return () => ws.close();
  }, [token, salonId, customerId]);

  useEffect(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  async function handleSend() {
    const body = draft.trim();
    if (!body || !token || !salonId || !customerId) return;
    setDraft("");
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "message", body }));
    } else {
      const message = await sendOwnerMessage(salonId, customerId, body, token).catch(() => null);
      if (message) setMessages((prev) => [...prev, message]);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "left", "right"]}>
      <Stack.Screen options={{ title: customerName || "Chat" }} />
      <Text style={[styles.expiryHint, { color: colors.muted, borderBottomColor: colors.border }]}>
        Messages disappear 24 hours after they're sent
      </Text>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.clay} />
      ) : (
        <FlatList
          ref={listRef}
          style={{ flex: 1 }}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.muted }]}>No messages yet.</Text>
          }
          renderItem={({ item }) => {
            const isMe = item.senderRole === "owner";
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

      <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
        <SafeAreaView edges={["bottom"]} style={{ backgroundColor: colors.card }}>
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
        </SafeAreaView>
      </KeyboardStickyView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  expiryHint: {
    fontFamily: "Manrope_500Medium",
    fontSize: 11,
    textAlign: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  listContent: { padding: 16, paddingBottom: 8, flexGrow: 1 },
  emptyText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    textAlign: "center",
    marginTop: 60,
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
