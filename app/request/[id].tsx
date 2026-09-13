import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { Button, Input, Spinner, Typography } from 'heroui-native';
import { ArrowLeft, Send } from 'lucide-react-native';
import { SafeAreaView } from '@/components/ui/primitives/SafeAreaView';
import { getInviteMessages, postInviteMessage } from '@/lib/hackmatch.api';
import { useHackmatchStore } from '@/lib/hackmatch.store';
import type { ChannelMessage } from '@/lib/hackmatch.types';
import { goBackOrReplace } from '@/lib/navigation';

export default function RequestThread() {
  const params = useLocalSearchParams<{ id: string; name?: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const name = (Array.isArray(params.name) ? params.name[0] : params.name) ?? 'Team-up request';
  const identity = useHackmatchStore((state) => state.identity);
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const list = useRef<FlatList<ChannelMessage>>(null);

  const load = useCallback(async () => {
    if (!id || !identity) return;
    try {
      setMessages(await getInviteMessages(identity, id));
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Messages could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [id, identity]);

  useEffect(() => {
    const initialLoad = setTimeout(() => void load(), 0);
    const timer = setInterval(() => void load(), 5000);
    return () => {
      clearTimeout(initialLoad);
      clearInterval(timer);
    };
  }, [load]);

  const send = async () => {
    const body = draft.trim();
    if (!body || !identity || !id || sending) return;
    setSending(true);
    try {
      await postInviteMessage(identity, id, body);
      setDraft('');
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Your message could not be sent.');
    } finally {
      setSending(false);
    }
  };

  if (!identity) return <Redirect href="/invite" />;

  const renderMessage = ({ item }: ListRenderItemInfo<ChannelMessage>) => {
    const own = item.user_id === identity.userId;
    return (
      <View className={`mb-3 ${own ? 'items-end' : 'items-start'}`}>
        {!own ? <Typography className="mb-1 text-xs">{item.author_name}</Typography> : null}
        <View
          className={`max-w-[82%] rounded-2xl px-4 py-3 ${own ? 'bg-accent' : 'bg-surface-secondary'}`}
        >
          <Typography className={own ? 'text-accent-foreground' : ''}>{item.body}</Typography>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="bg-background flex-1" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="border-border bg-surface web:max-w-5xl mx-auto flex-1 border-x">
          <View className="border-border flex-row items-center gap-3 border-b p-3">
            <Button isIconOnly variant="ghost" onPress={() => goBackOrReplace('/(tabs)/activity')}>
              <ArrowLeft size={21} />
            </Button>
            <View className="flex-1">
              <Typography.Heading>{name}</Typography.Heading>
              <Typography.Paragraph color="muted">
                This conversation remains available after the request is answered.
              </Typography.Paragraph>
            </View>
          </View>
          {error ? (
            <View className="bg-danger-soft gap-2 p-3">
              <Typography>{error}</Typography>
              <Button size="sm" variant="secondary" onPress={() => void load()}>
                <Button.Label>Try again</Button.Label>
              </Button>
            </View>
          ) : null}
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <Spinner />
            </View>
          ) : (
            <FlatList
              ref={list}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ flexGrow: 1, padding: 16 }}
              onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
              ListEmptyComponent={
                <View className="flex-1 items-center justify-center">
                  <Typography>No messages yet. Ask a question to get started.</Typography>
                </View>
              }
            />
          )}
          <View className="border-border flex-row gap-2 border-t p-3">
            <Input
              className="flex-1"
              value={draft}
              onChangeText={setDraft}
              placeholder={`Message ${name}`}
              onSubmitEditing={() => void send()}
            />
            <Button isIconOnly isDisabled={!draft.trim() || sending} onPress={() => void send()}>
              {sending ? <Spinner size="sm" /> : <Send size={18} />}
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
