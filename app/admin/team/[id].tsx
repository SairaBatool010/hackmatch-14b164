import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, Spinner, Typography } from 'heroui-native';
import { ArrowLeft, ChevronRight, Users } from 'lucide-react-native';
import { AppShell } from '@/components/AppShell';
import { getGroupMembers } from '@/lib/hackmatch.api';
import { useHackmatchStore } from '@/lib/hackmatch.store';
import type { GroupMember } from '@/lib/hackmatch.types';
import { goBackOrReplace, memberProfileHref } from '@/lib/navigation';

export default function AdminTeamDetail() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; name?: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const name = (Array.isArray(params.name) ? params.name[0] : params.name) ?? 'Team';
  const role = useHackmatchStore((state) => state.appRole);
  const identity = useHackmatchStore((state) => state.identity);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setMembers(await getGroupMembers(identity, id));
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Team members could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [id, identity]);
  useEffect(() => {
    const initialLoad = setTimeout(() => void load(), 0);
    return () => clearTimeout(initialLoad);
  }, [load]);
  if (role !== 'admin') return <Redirect href="/role" />;
  return (
    <AppShell
      eyebrow="Team drill-down"
      title={name}
      description={`${members.length} member${members.length === 1 ? '' : 's'}`}
    >
      <Button className="mb-5 self-start" variant="ghost" onPress={() => goBackOrReplace('/admin')}>
        <ArrowLeft size={18} />
        <Button.Label>Team dashboard</Button.Label>
      </Button>
      {loading ? (
        <Card className="items-center py-12">
          <Spinner />
        </Card>
      ) : null}
      {error ? (
        <Card className="bg-danger-soft gap-3 p-4">
          <Typography>{error}</Typography>
          <Button onPress={() => void load()}>
            <Button.Label>Try again</Button.Label>
          </Button>
        </Card>
      ) : null}
      {!loading && !error ? (
        <View className="gap-3">
          {members.map((member) => (
            <Button
              key={member.user_id}
              variant="secondary"
              onPress={() => router.push(memberProfileHref(member.user_id))}
            >
              <Users size={17} />
              <Button.Label className="flex-1 text-left">{member.name}</Button.Label>
              <ChevronRight size={17} />
            </Button>
          ))}
          {!members.length ? (
            <Card className="p-6">
              <Typography>No members found.</Typography>
            </Card>
          ) : null}
        </View>
      ) : null}
    </AppShell>
  );
}
