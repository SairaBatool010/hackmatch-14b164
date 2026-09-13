import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Button,
  Card,
  Chip,
  PressableFeedback,
  SearchField,
  Spinner,
  Typography,
} from 'heroui-native';
import { ArrowLeft, Pencil, Sparkles, UserRoundSearch } from 'lucide-react-native';
import { AppShell } from '@/components/AppShell';
import { TeamRequestActions } from '@/components/TeamRequestActions';
import { getTeamStatusLabel, TeamStatusDot } from '@/components/TeamStatusDot';
import { getRecommendations } from '@/lib/hackmatch.api';
import { useHackmatchStore } from '@/lib/hackmatch.store';
import type { Recommendation } from '@/lib/hackmatch.types';
import { goBackOrReplace, memberProfileHref } from '@/lib/navigation';
export default function FindTeam() {
  const router = useRouter();
  const identity = useHackmatchStore((s) => s.identity);
  const profile = useHackmatchStore((s) => s.profile);
  const version = useHackmatchStore((s) => s.recommendationsVersion);
  const [matches, setMatches] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const load = useCallback(async () => {
    if (!identity) return;
    setLoading(true);
    try {
      setMatches(await getRecommendations(identity, profile));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Matches could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [identity, profile]);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
    // `version` is an explicit refresh signal from the recommendations store.
    // oxlint-disable-next-line react/exhaustive-effect-dependencies
  }, [load, version]);
  const visible = useMemo(
    () =>
      matches.filter((m) =>
        [m.name, m.reason, ...(m.skills ?? [])]
          .join(' ')
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [matches, query],
  );
  return (
    <AppShell>
      <View className="mb-5 flex-row items-center">
        <Button isIconOnly variant="ghost" onPress={() => goBackOrReplace('/(tabs)')}>
          <ArrowLeft size={20} />
        </Button>
        <Typography.Heading className="flex-1">Find your team</Typography.Heading>
        <Button isIconOnly variant="ghost" onPress={() => router.push('/profile/edit')}>
          <Pencil size={18} />
        </Button>
      </View>
      {error ? (
        <Card className="bg-danger-soft mb-4 p-4">
          <Typography>{error}</Typography>
          <Button onPress={() => void load()}>
            <Button.Label>Try again</Button.Label>
          </Button>
        </Card>
      ) : null}
      {loading ? (
        <Card className="items-center gap-3 py-12">
          <Spinner />
          <Typography>Finding strong matches…</Typography>
        </Card>
      ) : (
        <View className="gap-4">
          <SearchField value={query} onChange={setQuery}>
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search by skill or role" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
          {visible.length ? (
            <View className="gap-4 md:flex-row md:flex-wrap">
              {visible.map((m) => {
                return (
                  <Card key={m.user_id} className="gap-4 p-5 md:w-[48%]">
                    <PressableFeedback onPress={() => router.push(memberProfileHref(m.user_id))}>
                      <View className="gap-2">
                        <View className="flex-row items-center gap-3">
                          <View className="bg-accent-soft relative h-10 w-10 items-center justify-center rounded-full">
                            <Typography>{m.name[0]}</Typography>
                            <TeamStatusDot status={m.team_status} />
                          </View>
                          <Typography.Heading className="flex-1 text-lg">
                            {m.name}
                          </Typography.Heading>
                          <Sparkles size={16} />
                        </View>
                        <View className="flex-row items-center gap-2 pl-1">
                          <TeamStatusDot status={m.team_status} inline />
                          <Typography.Paragraph color="muted" className="text-xs">
                            {getTeamStatusLabel(m.team_status)}
                          </Typography.Paragraph>
                        </View>
                      </View>
                    </PressableFeedback>
                    <View className="flex-row flex-wrap gap-2">
                      {m.skills.slice(0, 4).map((s) => (
                        <Chip key={s} variant="secondary">
                          <Chip.Label>{s}</Chip.Label>
                        </Chip>
                      ))}
                    </View>
                    <Typography.Paragraph>{m.reason}</Typography.Paragraph>
                    <TeamRequestActions
                      recipientId={m.user_id}
                      recipientName={m.name}
                      onSent={() =>
                        setMatches((all) =>
                          all.map((candidate) =>
                            candidate.user_id === m.user_id
                              ? { ...candidate, invite_status: 'sent' }
                              : candidate,
                          ),
                        )
                      }
                    />
                  </Card>
                );
              })}
            </View>
          ) : (
            <Card className="items-center gap-3 py-10">
              <UserRoundSearch size={24} />
              <Typography>No people match that search.</Typography>
            </Card>
          )}
        </View>
      )}
    </AppShell>
  );
}
