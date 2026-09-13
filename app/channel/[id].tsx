import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Button, Input, Spinner, Typography } from 'heroui-native';
import { ArrowLeft, Lock, Send } from 'lucide-react-native';
import { SafeAreaView } from '@/components/ui/primitives/SafeAreaView';
import { getChannelMessages, postChannelMessage } from '@/lib/hackmatch.api';
import { useHackmatchStore } from '@/lib/hackmatch.store';
import type { ChannelMessage } from '@/lib/hackmatch.types';
import { goBackOrReplace } from '@/lib/navigation';
export default function Channel() {
  const params = useLocalSearchParams<{
    id: string;
    name?: string;
    description?: string;
    allows_posting?: string;
  }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const name = (Array.isArray(params.name) ? params.name[0] : params.name) ?? 'Channel';
  const allows = params.allows_posting !== 'false';
  const identity = useHackmatchStore((s) => s.identity);
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const list = useRef<FlatList<ChannelMessage>>(null);
  const load = useCallback(async () => {
    if (id && identity) setMessages(await getChannelMessages(identity, id));
    setLoading(false);
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
    if (!draft.trim() || !identity || !id) return;
    setSending(true);
    await postChannelMessage(identity, id, draft.trim());
    setDraft('');
    await load();
    setSending(false);
  };
  const render = ({ item }: ListRenderItemInfo<ChannelMessage>) => {
    const own = item.user_id === identity?.userId;
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
            <Button isIconOnly variant="ghost" onPress={() => goBackOrReplace('/(tabs)')}>
              <ArrowLeft size={21} />
            </Button>
            <View>
              <Typography.Heading>{name}</Typography.Heading>
              <Typography.Paragraph color="muted">{params.description}</Typography.Paragraph>
            </View>
          </View>
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <Spinner />
            </View>
          ) : (
            <FlatList
              ref={list}
              data={messages}
              renderItem={render}
              keyExtractor={(x) => x.id}
              contentContainerStyle={{ flexGrow: 1, padding: 16 }}
              ListEmptyComponent={
                <View className="flex-1 items-center justify-center">
                  <Typography>No messages yet</Typography>
                </View>
              }
            />
          )}
          <View className="border-border border-t p-3">
            {allows ? (
              <View className="flex-row gap-2">
                <Input
                  className="flex-1"
                  value={draft}
                  onChangeText={setDraft}
                  placeholder={`Message ${name}`}
                  onSubmitEditing={() => void send()}
                />
                <Button
                  isIconOnly
                  isDisabled={!draft.trim() || sending}
                  onPress={() => void send()}
                >
                  {sending ? <Spinner size="sm" /> : <Send size={18} />}
                </Button>
              </View>
            ) : (
              <View className="flex-row items-center justify-center gap-2">
                <Lock size={15} />
                <Typography>Only organizers can post here</Typography>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
