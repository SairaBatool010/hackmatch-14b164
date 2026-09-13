import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Button, Card, Input, Spinner, Typography } from 'heroui-native';
import { ArrowLeft, Check, Search, UserPlus, Users } from 'lucide-react-native';
import { AppShell } from '@/components/AppShell';
import { ENABLE_GROUPS } from '@/lib/features';
import { createGroup, inviteToGroup, searchParticipants } from '@/lib/hackmatch.api';
import { useHackmatchStore } from '@/lib/hackmatch.store';
import type { Group, ParticipantSearchResult } from '@/lib/hackmatch.types';
import { goBackOrReplace } from '@/lib/navigation';
export default function CreateGroup() {
  const router = useRouter();
  const identity = useHackmatchStore((s) => s.identity);
  const [group, setGroup] = useState<Group | null>(null);
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ParticipantSearchResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [invited, setInvited] = useState<string[]>([]);
  useEffect(() => {
    if (!identity || query.length < 2) return undefined;
    const t = setTimeout(() => {
      setBusy(true);
      void searchParticipants(identity, query)
        .then(setResults, () => setResults([]))
        .finally(() => setBusy(false));
    }, 350);
    return () => clearTimeout(t);
  }, [identity, query]);
  if (!identity) return <Redirect href="/invite" />;
  if (!ENABLE_GROUPS) return <Redirect href="/(tabs)" />;
  const create = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      setGroup(await createGroup(identity, name.trim()));
    } finally {
      setBusy(false);
    }
  };
  const invite = async (p: ParticipantSearchResult) => {
    if (!group) return;
    await inviteToGroup(identity, group.id, p.id);
    setInvited([...invited, p.id]);
  };
  return (
    <AppShell
      width="narrow"
      eyebrow="Teams"
      title={group ? `Invite teammates to ${group.name ?? name}` : 'Create your team'}
      action={
        <Button isIconOnly variant="ghost" onPress={() => goBackOrReplace('/(tabs)')}>
          <ArrowLeft size={19} />
        </Button>
      }
    >
      {!group ? (
        <Card className="items-center gap-5 px-6 py-12">
          <Users size={30} />
          <Typography.Heading>Lead a new team</Typography.Heading>
          <Input value={name} onChangeText={setName} placeholder="Team name" />
          <Button size="lg" isDisabled={busy || !name.trim()} onPress={() => void create()}>
            <Button.Label>Create team</Button.Label>
          </Button>
        </Card>
      ) : (
        <View className="gap-5">
          <Card className="gap-2 p-5">
            <Typography color="muted">Group code</Typography>
            <Typography.Heading className="text-2xl">{group.code}</Typography.Heading>
          </Card>
          <Card className="gap-4 p-5">
            <View className="relative justify-center">
              <Search className="absolute left-3 z-10" size={18} />
              <Input
                className="pl-10"
                value={query}
                onChangeText={setQuery}
                placeholder="Search participants"
              />
            </View>
            {busy ? (
              <Spinner />
            ) : (
              results.map((p) => (
                <View
                  key={p.id}
                  className="border-border flex-row items-center gap-3 rounded-xl border p-4"
                >
                  <View className="flex-1">
                    <Typography className="font-semibold">{p.name}</Typography>
                    <Typography.Paragraph color="muted">{p.email}</Typography.Paragraph>
                  </View>
                  <Button isDisabled={invited.includes(p.id)} onPress={() => void invite(p)}>
                    {invited.includes(p.id) ? <Check size={15} /> : <UserPlus size={15} />}
                    <Button.Label>{invited.includes(p.id) ? 'Invited' : 'Invite'}</Button.Label>
                  </Button>
                </View>
              ))
            )}
          </Card>
          <Button variant="secondary" onPress={() => router.replace('/(tabs)/dms')}>
            <Button.Label>Go to DMs</Button.Label>
          </Button>
        </View>
      )}
    </AppShell>
  );
}
