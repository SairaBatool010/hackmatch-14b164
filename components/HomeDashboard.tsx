import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Button, Card, Spinner, Typography } from 'heroui-native';
import { ChevronRight, Hash, LogOut, Plus, Sparkles, UserRoundPen } from 'lucide-react-native';
import { AppShell } from '@/components/AppShell';
import { ENABLE_GROUPS } from '@/lib/features';
import { getChannels } from '@/lib/hackmatch.api';
import { useHackmatchStore } from '@/lib/hackmatch.store';
import type { Channel } from '@/lib/hackmatch.types';
import { channelHref } from '@/lib/navigation';
export function HomeDashboard() {
  const router = useRouter();
  const identity = useHackmatchStore((s) => s.identity);
  const clearSession = useHackmatchStore((s) => s.clearSession);
  const setAppRole = useHackmatchStore((s) => s.setAppRole);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (!identity) return;
    try {
      setChannels((await getChannels(identity)).filter((c) => c.type !== 'my_group'));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Channels could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [identity]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  if (loading)
    return (
      <View className="bg-background flex-1 items-center justify-center">
        <Spinner size="lg" />
      </View>
    );
  const open = (c: Channel) => router.push(c.type === 'find_team' ? '/find-team' : channelHref(c));
  const changeRole = () => {
    clearSession();
    setAppRole(null);
    router.replace('/role');
  };
  return (
    <AppShell>
      <View className="mb-6 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="bg-accent h-10 w-10 items-center justify-center rounded-xl">
            <Sparkles className="text-accent-foreground" size={20} />
          </View>
          <Typography.Heading className="text-xl">HackMatch</Typography.Heading>
        </View>
        <View className="items-end gap-1">
          <Button size="sm" variant="ghost" onPress={() => router.push('/profile/edit')}>
            <UserRoundPen size={16} />
            <Button.Label>Edit profile</Button.Label>
          </Button>
          <Button size="sm" variant="ghost" onPress={changeRole}>
            <LogOut size={16} />
            <Button.Label>Change role</Button.Label>
          </Button>
        </View>
      </View>
      <Typography.Heading className="text-4xl">
        Hi, {identity?.name.split(' ')[0]}
      </Typography.Heading>
      <Typography.Paragraph color="muted" className="mt-2 mb-6">
        Browse channels and discover teammates. Private team chats live in DMs.
      </Typography.Paragraph>
      {error ? (
        <Card className="bg-danger-soft mb-4 p-4">
          <Typography>{error}</Typography>
        </Card>
      ) : null}
      <View className="gap-4 lg:flex-row">
        <Card className="bg-sidebar gap-2 p-4 lg:w-72">
          <Typography.Paragraph color="muted" className="px-2 text-xs font-semibold uppercase">
            Channels
          </Typography.Paragraph>
          {channels.map((c) => (
            <Button
              key={c.id}
              variant={c.type === 'find_team' ? 'secondary' : 'ghost'}
              className="justify-start"
              onPress={() => open(c)}
            >
              {c.type === 'find_team' ? <Sparkles size={18} /> : <Hash size={18} />}
              <Button.Label className="flex-1">{c.name}</Button.Label>
              <ChevronRight size={16} />
            </Button>
          ))}
        </Card>
        <View className="min-w-0 flex-1 gap-4">
          <Card className="border-accent/20 gap-4 border p-6">
            <Typography.Heading className="text-xl">Find your team</Typography.Heading>
            <Typography.Paragraph color="muted">
              Discover people whose skills complement yours.
            </Typography.Paragraph>
            <Button onPress={() => router.push('/find-team')}>
              <Button.Label>View matches</Button.Label>
            </Button>
          </Card>
          {ENABLE_GROUPS ? (
            <Card className="gap-4 p-6">
              <Plus size={22} />
              <Typography.Heading className="text-xl">Create a team</Typography.Heading>
              <Button variant="secondary" onPress={() => router.push('/group/create')}>
                <Button.Label>Create your group</Button.Label>
              </Button>
            </Card>
          ) : null}
        </View>
      </View>
    </AppShell>
  );
}
