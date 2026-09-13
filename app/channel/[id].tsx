import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Input, Spinner, Typography } from 'heroui-native';
import { ArrowLeft, Lock, Send, Users } from 'lucide-react-native';
import { SafeAreaView } from '@/components/ui/primitives/SafeAreaView';
import { getChannelMessages, postChannelMessage } from '@/lib/hackmatch.api';
import { useHackmatchStore } from '@/lib/hackmatch.store';
import type { Channel, ChannelMessage } from '@/lib/hackmatch.types';
import { channelMembersHref, goBackOrReplace, memberProfileHref } from '@/lib/navigation';
export default function Channel() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    name?: string;
    description?: string;
    type?: Channel['type'];
    group_id?: string;
    allows_posting?: string;
  }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const name = (Array.isArray(params.name) ? params.name[0] : params.name) ?? 'Channel';
  const allows = params.allows_posting !== 'false';
  const channel: Channel = {
    id,
    name,
    description:
      (Array.isArray(params.description) ? params.description[0] : params.description) ?? '',
    type: (Array.isArray(params.type) ? params.type[0] : params.type) ?? 'admin',
    group_id: (Array.isArray(params.group_id) ? params.group_id[0] : params.group_id) || undefined,
    allows_posting: allows,
  };
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
        {!own ? (
          <Button
            size="sm"
            variant="ghost"
            onPress={() => router.push(memberProfileHref(item.user_id))}
          >
            <Button.Label>{item.author_name}</Button.Label>
          </Button>
        ) : null}
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
            <View className="flex-1">
              <Typography.Heading>{name}</Typography.Heading>
              <Typography.Paragraph color="muted">{params.description}</Typography.Paragraph>
            </View>
            <Button
              variant="secondary"
              size="sm"
              onPress={() => router.push(channelMembersHref(channel))}
            >
              <Users size={16} />
              <Button.Label>View members</Button.Label>
            </Button>
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
