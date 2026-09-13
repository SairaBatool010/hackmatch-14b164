import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, Spinner, Typography } from 'heroui-native';
import { ArrowLeft, ChevronRight, Users } from 'lucide-react-native';
import { AppShell } from '@/components/AppShell';
import { getAdminTeamsData } from '@/lib/hackmatch.api';
import { useHackmatchStore } from '@/lib/hackmatch.store';
import type { AdminTeamsData } from '@/lib/hackmatch.types';
import { adminTeamHref, goBackOrReplace, memberProfileHref } from '@/lib/navigation';

const EMPTY: AdminTeamsData = { teams: [], no_group_participants: [] };
export default function AdminTeamsList() {
  const router = useRouter();
  const params = useLocalSearchParams<{ filter: 'no_group' | 'partial' | 'complete' }>();
  const filter = Array.isArray(params.filter) ? params.filter[0] : params.filter;
  const role = useHackmatchStore((state) => state.appRole);
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await getAdminTeamsData());
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Teams could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const initialLoad = setTimeout(() => void load(), 0);
    return () => clearTimeout(initialLoad);
  }, [load]);
  const teams = useMemo(
    () =>
      data.teams.filter((team) =>
        filter === 'complete'
          ? team.member_count >= (team.capacity ?? 5)
          : team.member_count < (team.capacity ?? 5),
      ),
    [data.teams, filter],
  );
  if (role !== 'admin') return <Redirect href="/role" />;
  const title =
    filter === 'no_group'
      ? 'Participants without a team'
      : filter === 'complete'
        ? 'Complete teams'
        : 'Partial teams';
  return (
    <AppShell eyebrow="Admin team dashboard" title={title}>
      <Button className="mb-5 self-start" variant="ghost" onPress={() => goBackOrReplace('/admin')}>
        <ArrowLeft size={18} />
        <Button.Label>Dashboard</Button.Label>
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
          {filter === 'no_group'
            ? data.no_group_participants.map((participant) => (
                <Button
                  key={participant.user_id}
                  variant="secondary"
                  onPress={() => router.push(memberProfileHref(participant.user_id))}
                >
                  <Users size={17} />
                  <Button.Label className="flex-1 text-left">{participant.name}</Button.Label>
                  <ChevronRight size={17} />
                </Button>
              ))
            : teams.map((team) => (
                <Button
                  key={team.id}
                  variant="secondary"
                  onPress={() => router.push(adminTeamHref(team.id, team.name))}
                >
                  <Button.Label className="flex-1 text-left">
                    {team.name} · {team.member_count}/{team.capacity ?? 5}
                  </Button.Label>
                  <ChevronRight size={17} />
                </Button>
              ))}
          {filter === 'no_group' && !data.no_group_participants.length ? (
            <Card className="p-6">
              <Typography>
                The teams response did not include ungrouped participant records.
              </Typography>
            </Card>
          ) : null}
          {filter !== 'no_group' && !teams.length ? (
            <Card className="p-6">
              <Typography>No teams in this category.</Typography>
            </Card>
          ) : null}
        </View>
      ) : null}
    </AppShell>
  );
}
