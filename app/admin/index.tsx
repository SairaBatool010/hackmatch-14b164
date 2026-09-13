import { useCallback, useState } from 'react';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { Button, Card, Chip, Input, Spinner, TextArea, Typography } from 'heroui-native';
import { ArrowLeftRight, Hash, Plus, RefreshCw, ShieldCheck, Users } from 'lucide-react-native';
import { View } from 'react-native';
import { AppShell } from '@/components/AppShell';
import { ENABLE_ADMIN } from '@/lib/features';
import {
  createAdminChannel,
  getAdminAnalytics,
  getAdminChannels,
  getAdminTeams,
} from '@/lib/hackmatch.api';
import { useHackmatchStore } from '@/lib/hackmatch.store';
import type { AdminAnalytics, AdminTeamSummary, Channel } from '@/lib/hackmatch.types';
import { channelHref } from '@/lib/navigation';
const ANALYTICS: AdminAnalytics = {
  total_participants: 128,
  total_teams: 27,
  complete_teams: 19,
  participants_seeking_team: 21,
  active_channels: 6,
};
const TEAMS: AdminTeamSummary[] = [
  { id: '1', name: 'Team Builders', member_count: 4, capacity: 5, status: 'forming' },
];
const CHANNELS: Channel[] = [
  {
    id: 'preview-admin',
    name: 'announcements',
    description: 'Official updates.',
    type: 'admin',
    allows_posting: false,
  },
];
export default function Admin() {
  const router = useRouter();
  const hydrated = useHackmatchStore((s) => s.hydrated);
  const role = useHackmatchStore((s) => s.appRole);
  const setRole = useHackmatchStore((s) => s.setAppRole);
  const [analytics, setAnalytics] = useState(ANALYTICS);
  const [teams, setTeams] = useState(TEAMS);
  const [channels, setChannels] = useState(CHANNELS);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const load = useCallback(async () => {
    try {
      const [a, t, c] = await Promise.all([
        getAdminAnalytics(),
        getAdminTeams(),
        getAdminChannels(),
      ]);
      setAnalytics(a);
      setTeams(t);
      setChannels(c);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      if (role === 'admin') void load();
    }, [load, role]),
  );
  if (!hydrated)
    return (
      <View className="flex-1 items-center justify-center">
        <Spinner />
      </View>
    );
  if (!ENABLE_ADMIN || role !== 'admin') return <Redirect href="/role" />;
  const create = async () => {
    const channel = await createAdminChannel({
      name: name.trim().replace(/\s+/g, '-'),
      description: description.trim(),
      allows_posting: false,
    });
    setChannels([channel, ...channels]);
    setName('');
    setDescription('');
  };
  return (
    <AppShell
      eyebrow="Admin workspace"
      title="Hackathon overview"
      description="Track team formation and manage channels."
      action={
        <View className="flex-row gap-2">
          <Button isIconOnly variant="secondary" onPress={() => void load()}>
            {loading ? <Spinner size="sm" /> : <RefreshCw size={18} />}
          </Button>
          <Button
            variant="secondary"
            onPress={() => {
              setRole(null);
              router.replace('/role');
            }}
          >
            <ArrowLeftRight size={18} />
            <Button.Label>Change role</Button.Label>
          </Button>
        </View>
      }
    >
      <View className="gap-6">
        <View className="bg-warning-soft flex-row gap-3 rounded-xl p-4">
          <ShieldCheck size={20} />
          <Typography className="flex-1">
            Preview-only admin authorization. Production requires server-verified permissions.
          </Typography>
        </View>
        <View className="flex-row flex-wrap gap-3">
          {[
            ['Participants', analytics.total_participants],
            ['Teams', analytics.total_teams],
            ['Seeking team', analytics.participants_seeking_team],
            ['Channels', analytics.active_channels],
          ].map(([label, value]) => (
            <Card key={label} className="min-w-40 flex-1 p-5">
              <Typography color="muted">{label}</Typography>
              <Typography.Heading className="text-3xl">{value}</Typography.Heading>
            </Card>
          ))}
        </View>
        <View className="gap-4 lg:flex-row">
          <Card className="flex-1 gap-4 p-5">
            <View className="flex-row gap-2">
              <Users size={20} />
              <Typography.Heading>Team formation</Typography.Heading>
            </View>
            {teams.map((t) => (
              <View key={t.id} className="border-border flex-row rounded-xl border p-4">
                <View className="flex-1">
                  <Typography>{t.name}</Typography>
                  <Typography color="muted">{t.member_count} members</Typography>
                </View>
                <Chip variant="secondary">
                  <Chip.Label>{t.status}</Chip.Label>
                </Chip>
              </View>
            ))}
          </Card>
          <Card className="flex-1 gap-4 p-5">
            <View className="flex-row gap-2">
              <Hash size={20} />
              <Typography.Heading>Admin channels</Typography.Heading>
            </View>
            {channels.map((c) => (
              <Button key={c.id} variant="secondary" onPress={() => router.push(channelHref(c))}>
                <Button.Label># {c.name}</Button.Label>
              </Button>
            ))}
          </Card>
        </View>
        <Card className="gap-4 p-5">
          <Typography.Heading>Create announcement channel</Typography.Heading>
          <Input value={name} onChangeText={setName} placeholder="channel-name" />
          <TextArea value={description} onChangeText={setDescription} placeholder="Description" />
          <Button isDisabled={!name.trim() || !description.trim()} onPress={() => void create()}>
            <Plus size={18} />
            <Button.Label>Create channel</Button.Label>
          </Button>
        </Card>
      </View>
    </AppShell>
  );
}
