import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Button, Card, Spinner, Typography } from 'heroui-native';
import { ChevronRight, MessageCircle, Plus, Users } from 'lucide-react-native';
import { View } from 'react-native';
import { AppShell } from '@/components/AppShell';
import { ParticipantTabGuard } from '@/components/ParticipantTabGuard';
import { getChannels } from '@/lib/hackmatch.api';
import { useHackmatchStore } from '@/lib/hackmatch.store';
import type { Channel } from '@/lib/hackmatch.types';
import { channelHref } from '@/lib/navigation';
function Content() {
  const router = useRouter();
  const identity = useHackmatchStore((s) => s.identity);
  const [teams, setTeams] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    if (identity)
      setTeams((await getChannels(identity)).filter((c) => c.type === 'my_group' || c.group_id));
    setLoading(false);
  }, [identity]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  if (loading)
    return (
      <View className="flex-1 items-center justify-center">
        <Spinner />
      </View>
    );
  return (
    <AppShell
      eyebrow="Private conversations"
      title="DMs"
      description="Your team conversations live here."
      action={
        <Button size="sm" onPress={() => router.push('/group/create')}>
          <Plus size={17} />
          <Button.Label>Create team</Button.Label>
        </Button>
      }
    >
      {teams.length ? (
        <View className="gap-3">
          {teams.map((team) => (
            <Button
              key={team.id}
              variant="secondary"
              className="h-auto justify-start p-4"
              onPress={() => router.push(channelHref(team))}
            >
              <Users size={21} />
              <View className="flex-1 items-start">
                <Button.Label>{team.name}</Button.Label>
                <Typography.Paragraph color="muted">{team.description}</Typography.Paragraph>
              </View>
              <ChevronRight size={18} />
            </Button>
          ))}
        </View>
      ) : (
        <Card className="items-center gap-4 px-6 py-12">
          <MessageCircle size={28} />
          <Typography.Heading>No team conversations yet</Typography.Heading>
          <Button onPress={() => router.push('/group/create')}>
            <Button.Label>Create a team</Button.Label>
          </Button>
        </Card>
      )}
    </AppShell>
  );
}
export default function DMsScreen() {
  return (
    <ParticipantTabGuard>
      <Content />
    </ParticipantTabGuard>
  );
}
