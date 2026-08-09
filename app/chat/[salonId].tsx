import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  LayoutAnimation,
  Modal,
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
import {
  ChatMessage,
  deleteMyMessage,
  editMyMessage,
  fetchMyMessages,
  sendMyMessage,
  WS_BASE_URL,
} from "../../api/client";

export default function CustomerChatScreen() {
  const { salonId, salonName } = useLocalSearchParams<{ salonId: string; salonName?: string }>();
  const { token } = useAuth();
  const { colors } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [menuMessage, setMenuMessage] = useState<ChatMessage | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const listRef = useRef<FlatList>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    function animateTo(height: number, e: { duration?: number; easing?: string }) {
      LayoutAnimation.configureNext({
        duration: e.duration || 250,
        update: { type: (LayoutAnimation.Types as any)[e.easing || ""] || LayoutAnimation.Types.keyboard },
      });
      setKeyboardHeight(height);
    }
    const showSub = Keyboard.addListener("keyboardWillShow", (e) => animateTo(e.endCoordinates.height, e));
    const hideSub = Keyboard.addListener("keyboardWillHide", (e) => animateTo(0, e));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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
        } else if (data.type === "message_edited") {
          setMessages((prev) => prev.map((m) => (m.id === data.message.id ? data.message : m)));
        } else if (data.type === "message_deleted") {
          setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
        }
      } catch {}
    };

    return () => ws.close();
  }, [token, salonId]);

  useEffect(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  async function handleSend() {
    const body = draft.trim();
    if (!body || !token || !salonId) return;

    if (editingMessageId) {
      const id = editingMessageId;
      setDraft("");
      setEditingMessageId(null);
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "edit_message", messageId: id, body }));
        setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, body, edited: 1 } : m)));
      } else {
        const updated = await editMyMessage(id, body, token).catch(() => null);
        if (updated) setMessages((prev) => prev.map((m) => (m.id === id ? updated : m)));
      }
      return;
    }

    setDraft("");
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "message", body }));
    } else {
      const message = await sendMyMessage(salonId, body, token).catch(() => null);
      if (message) setMessages((prev) => [...prev, message]);
    }
  }

  function handleStartEdit(message: ChatMessage) {
    setEditingMessageId(message.id);
    setDraft(message.body);
  }

  function handleCancelEdit() {
    setEditingMessageId(null);
    setDraft("");
  }

  function handleDeleteMessage(messageId: string) {
    Alert.alert("Delete message?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setMessages((prev) => prev.filter((m) => m.id !== messageId));
          if (editingMessageId === messageId) handleCancelEdit();
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: "delete_message", messageId }));
          } else if (token) {
            deleteMyMessage(messageId, token).catch(() => {});
          }
        },
      },
    ]);
  }

  function handleLongPressMessage(message: ChatMessage) {
    if (message.senderRole !== "customer") return;
    setMenuMessage(message);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: salonName || "Chat" }} />
      <View style={{ flex: 1, paddingBottom: keyboardHeight }}>
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
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                Say hi! Ask about availability, pricing, or anything else.
              </Text>
            }
            renderItem={({ item }) => {
              const isMe = item.senderRole === "customer";
              return (
                <View style={[styles.bubbleRow, isMe && styles.bubbleRowMe]}>
                  <Pressable
                    onLongPress={() => handleLongPressMessage(item)}
                    style={[
                      styles.bubble,
                      isMe
                        ? { backgroundColor: colors.clay }
                        : { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
                    ]}
                  >
                    <Text style={[styles.bubbleText, { color: isMe ? "#fff" : colors.text }]}>{item.body}</Text>
                    {!!item.edited && (
                      <Text style={[styles.editedTag, { color: isMe ? "rgba(255,255,255,0.7)" : colors.muted }]}>
                        (edited)
                      </Text>
                    )}
                  </Pressable>
                </View>
              );
            }}
          />
        )}

        {editingMessageId && (
          <View style={[styles.editingBar, { borderTopColor: colors.border }]}>
            <Text style={[styles.editingBarText, { color: colors.muted }]}>Editing message</Text>
            <Pressable onPress={handleCancelEdit}>
              <Text style={[styles.editingBarCancel, { color: colors.clay }]}>Cancel</Text>
            </Pressable>
          </View>
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
            <Text style={styles.sendBtnText}>{editingMessageId ? "Save" : "Send"}</Text>
          </Pressable>
        </View>
      </View>

      <Modal visible={!!menuMessage} transparent animationType="fade" onRequestClose={() => setMenuMessage(null)}>
        <Pressable style={styles.menuOverlay} onPress={() => setMenuMessage(null)}>
          <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
            <Pressable
              style={styles.menuRow}
              onPress={() => {
                if (menuMessage) handleStartEdit(menuMessage);
                setMenuMessage(null);
              }}
            >
              <Text style={[styles.menuRowText, { color: colors.text }]}>Edit</Text>
              <Ionicons name="pencil-outline" size={18} color={colors.text} />
            </Pressable>
            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
            <Pressable
              style={styles.menuRow}
              onPress={() => {
                if (menuMessage) handleDeleteMessage(menuMessage.id);
                setMenuMessage(null);
              }}
            >
              <Text style={[styles.menuRowText, { color: "#FF3B30" }]}>Delete</Text>
              <Ionicons name="trash-outline" size={18} color="#FF3B30" />
            </Pressable>
          </View>
        </Pressable>
      </Modal>
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
  editedTag: {
    fontFamily: "Manrope_500Medium",
    fontSize: 10,
    marginTop: 2,
  },
  editingBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  editingBarText: { fontFamily: "Manrope_600SemiBold", fontSize: 12 },
  editingBarCancel: { fontFamily: "Manrope_700Bold", fontSize: 12 },
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
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  menuCard: {
    width: 220,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  menuRowText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 15,
  },
  menuDivider: {
    height: 1,
  },
});
