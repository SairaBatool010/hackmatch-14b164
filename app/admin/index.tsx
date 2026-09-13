import { useCallback, useState } from 'react';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { Button, Card, Chip, Input, Spinner, TextArea, Typography } from 'heroui-native';
import {
  ArrowLeftRight,
  ClipboardList,
  Hash,
  Plus,
  RefreshCw,
  ShieldCheck,
  Users,
} from 'lucide-react-native';
import { View } from 'react-native';
import { AppShell } from '@/components/AppShell';
import { ENABLE_ADMIN } from '@/lib/features';
import {
  createAdminChannel,
  getAdminAnalytics,
  getAdminChannels,
  getAdminTeamCounts,
  getAdminTeams,
} from '@/lib/hackmatch.api';
import { useHackmatchStore } from '@/lib/hackmatch.store';
import type { AdminTeamCounts, AdminTeamSummary, Channel } from '@/lib/hackmatch.types';
import { adminTeamHref, adminTeamsHref, channelHref } from '@/lib/navigation';
const TEAMS: AdminTeamSummary[] = [
  { id: '1', name: 'Team Builders', member_count: 4, capacity: 5, status: 'forming' },
];
const COUNTS: AdminTeamCounts = { no_group: 21, partial: 8, complete: 19 };
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
  const [teams, setTeams] = useState(TEAMS);
  const [counts, setCounts] = useState(COUNTS);
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
      const summary = await getAdminTeamCounts(t, a.participants_seeking_team);
      setTeams(t);
      setCounts(summary);
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
          {(
            [
              ['No group', counts.no_group, 'no_group'],
              ['Partial groups', counts.partial, 'partial'],
              ['Complete groups', counts.complete, 'complete'],
            ] as const
          ).map(([label, value, filter]) => (
            <Button
              key={label}
              variant="secondary"
              className="min-w-40 flex-1 items-start p-5"
              onPress={() => router.push(adminTeamsHref(filter))}
            >
              <View>
                <Typography color="muted">{label}</Typography>
                <Typography.Heading className="text-3xl">{value}</Typography.Heading>
              </View>
            </Button>
          ))}
        </View>
        <Button variant="secondary" onPress={() => router.push('/admin/form-schema')}>
          <ClipboardList size={18} />
          <Button.Label>Edit profile questions</Button.Label>
        </Button>
        <View className="gap-4 lg:flex-row">
          <Card className="flex-1 gap-4 p-5">
            <View className="flex-row gap-2">
              <Users size={20} />
              <Typography.Heading>Team formation</Typography.Heading>
            </View>
            {teams.map((t) => (
              <Button
                key={t.id}
                variant="secondary"
                className="justify-between p-4"
                onPress={() => router.push(adminTeamHref(t.id, t.name))}
              >
                <View className="flex-1 items-start">
                  <Typography>{t.name}</Typography>
                  <Typography color="muted">{t.member_count} members</Typography>
                </View>
                <Chip variant="secondary">
                  <Chip.Label>{t.status}</Chip.Label>
                </Chip>
              </Button>
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
