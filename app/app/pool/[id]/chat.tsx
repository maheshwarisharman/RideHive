import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowUp, Clock, AlertCircle, MessageSquare, Lock } from 'lucide-react-native';
import { ScreenHeader, Avatar } from '../../../src/components/ui';
import { chatService, ChatMessage } from '../../../src/features/chat/chatService';
import { poolLifecycleService, DetailedPool } from '../../../src/features/pools/poolLifecycleService';
import { useAuthStore } from '../../../src/features/auth/authStore';
import { colors, radii, spacing, typography } from '../../../src/theme/tokens';

function formatMessageTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  } catch {
    return '';
  }
}

export default function PoolChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state: any) => state.user);

  const [pool, setPool] = useState<DetailedPool | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const flatListRef = useRef<FlatList>(null);

  // Load pool & historical messages
  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    async function loadData() {
      setLoading(true);
      const [poolData, chatHistory] = await Promise.all([
        poolLifecycleService.fetchPoolDetails(id as string, user?.id),
        chatService.fetchMessages(id as string),
      ]);

      if (isMounted) {
        setPool(poolData);
        // Inverted list, so newest first
        setMessages([...chatHistory].reverse());
        setLoading(false);
      }
    }

    loadData();

    // Subscribe to realtime changes
    const unsubscribe = chatService.subscribeToMessages(id as string, (newMsg) => {
      setMessages((prev) => {
        const exists = prev.some(
          (m) =>
            m.id === newMsg.id ||
            (m.isPending && m.body === newMsg.body && m.senderId === newMsg.senderId)
        );
        if (exists) {
          return prev.map((m) =>
            m.isPending && m.body === newMsg.body && m.senderId === newMsg.senderId ? newMsg : m
          );
        }
        return [newMsg, ...prev];
      });
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [id, user?.id]);

  // Read-only / archived condition
  const isArchived = Boolean(
    pool &&
      (pool.status === 'completed' ||
        pool.status === 'cancelled' ||
        (pool.departsAt && new Date().getTime() - new Date(pool.departsAt).getTime() > 24 * 60 * 60 * 1000))
  );

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !id || sending || isArchived) return;

    setInputText('');
    setSending(true);

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      poolId: id,
      senderId: user?.id || null,
      senderName: 'You',
      body: text,
      kind: 'user',
      createdAt: new Date().toISOString(),
      isPending: true,
    };

    setMessages((prev) => [optimisticMsg, ...prev]);

    const res = await chatService.sendMessage(id, text, user?.id);

    setSending(false);

    if (res.success && res.message) {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...res.message!, isPending: false } : m))
      );
    } else {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, isPending: false, failed: true } : m))
      );
    }
  }, [inputText, id, sending, isArchived, user?.id]);

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => {
      if (item.kind === 'system') {
        return (
          <View style={styles.systemMessageContainer}>
            <View style={styles.systemMessagePill}>
              <Text style={styles.systemMessageText}>{item.body}</Text>
            </View>
          </View>
        );
      }

      const isMe = item.senderId === user?.id || item.senderName === 'You';

      if (isMe) {
        return (
          <View style={[styles.messageRow, styles.myMessageRow]}>
            <View style={styles.myBubble}>
              <Text style={styles.myMessageText}>{item.body}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.myTimeText}>{formatMessageTime(item.createdAt)}</Text>
                {item.isPending && (
                  <Clock size={12} color="#A0A0A0" style={{ marginLeft: 4 }} />
                )}
                {item.failed && (
                  <AlertCircle size={12} color="#FF3B30" style={{ marginLeft: 4 }} />
                )}
              </View>
            </View>
          </View>
        );
      }

      return (
        <View style={[styles.messageRow, styles.otherMessageRow]}>
          <Avatar name={item.senderName || 'Member'} avatarUrl={item.senderAvatarUrl} size="sm" />
          <View style={styles.otherContent}>
            <Text style={styles.senderName}>{item.senderName}</Text>
            <View style={styles.otherBubble}>
              <Text style={styles.otherMessageText}>{item.body}</Text>
              <Text style={styles.otherTimeText}>{formatMessageTime(item.createdAt)}</Text>
            </View>
          </View>
        </View>
      );
    },
    [user?.id]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScreenHeader
        title={pool ? pool.destinationName : 'Pool Chat'}
        subtitle={pool ? `${pool.seatsTaken} riders` : undefined}
        showBack
        onBack={() => router.back()}
      />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          inverted
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <MessageSquare size={32} color={colors.textDisabled} />
                <Text style={styles.emptyTitle}>No messages yet</Text>
                <Text style={styles.emptySubtitle}>
                  Coordinate pickup spots, cab booking, and travel timing with your co-riders here.
                </Text>
              </View>
            ) : undefined
          }
        />

        {isArchived ? (
          <View style={styles.archivedBanner}>
            <Lock size={16} color={colors.textSecondary} />
            <Text style={styles.archivedText}>
              This pool has ended. Chat is archived for reference.
            </Text>
          </View>
        ) : (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Message your pool members..."
              placeholderTextColor={colors.textDisabled}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                inputText.trim().length === 0 || sending ? styles.sendButtonDisabled : null,
              ]}
              disabled={inputText.trim().length === 0 || sending}
              onPress={handleSend}
              accessibilityRole="button"
              accessibilityLabel="Send message"
            >
              <ArrowUp
                size={20}
                color={inputText.trim().length === 0 || sending ? '#A0A0A0' : '#FFFFFF'}
              />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  messageRow: {
    marginVertical: spacing.xs,
    flexDirection: 'row',
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  otherMessageRow: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  myBubble: {
    backgroundColor: '#000000',
    borderRadius: radii.lg,
    borderBottomRightRadius: 2,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    maxWidth: '80%',
  },
  myMessageText: {
    ...typography.body,
    color: '#FFFFFF',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: spacing.xs,
  },
  myTimeText: {
    ...typography.caption,
    color: '#A0A0A0',
    fontVariant: ['tabular-nums'],
  },
  otherContent: {
    marginLeft: spacing.sm,
    maxWidth: '75%',
  },
  senderName: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  otherBubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderBottomLeftRadius: 2,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  otherMessageText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  otherTimeText: {
    ...typography.caption,
    color: colors.textSecondary,
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
    fontVariant: ['tabular-nums'],
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  systemMessagePill: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  systemMessageText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['5xl'],
    paddingHorizontal: spacing['3xl'],
    transform: [{ scaleY: -1 }], // Counteract inverted FlatList
  },
  emptyTitle: {
    ...typography.heading,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  archivedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  archivedText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
    maxHeight: 120,
    marginRight: spacing.md,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
