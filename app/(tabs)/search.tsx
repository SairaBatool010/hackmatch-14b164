import { useEffect, useState } from 'react';
import { Card, Chip, Input, Spinner, Typography } from 'heroui-native';
import { Search, UserRoundSearch } from 'lucide-react-native';
import { View } from 'react-native';
import { AppShell } from '@/components/AppShell';
import { ParticipantTabGuard } from '@/components/ParticipantTabGuard';
import { TeamStatusDot } from '@/components/TeamStatusDot';
import { searchParticipants } from '@/lib/hackmatch.api';
import { useHackmatchStore } from '@/lib/hackmatch.store';
import type { ParticipantSearchResult } from '@/lib/hackmatch.types';
function Content() {
  const identity = useHackmatchStore((s) => s.identity);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ParticipantSearchResult[]>([]);
  const [busy, setBusy] = useState(false);
  const updateQuery = (value: string) => {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      setBusy(false);
    }
  };
  useEffect(() => {
    if (!identity || query.trim().length < 2) return undefined;
    const timer = setTimeout(() => {
      setBusy(true);
      void searchParticipants(identity, query)
        .then(setResults, () => setResults([]))
        .finally(() => setBusy(false));
    }, 350);
    return () => clearTimeout(timer);
  }, [identity, query]);
  return (
    <AppShell
      eyebrow="Participant directory"
      title="Search"
      description="Find registered participants by name, skill, or email."
    >
      <Card className="gap-5 p-5">
        <View className="relative justify-center">
          <Search className="text-muted absolute left-3 z-10" size={18} />
          <Input
            className="pl-10"
            value={query}
            onChangeText={updateQuery}
            placeholder="Search participants"
          />
        </View>
        {busy ? (
          <Spinner />
        ) : results.length ? (
          <View className="gap-3">
            {results.map((p) => (
              <View key={p.id} className="border-border flex-row gap-3 rounded-xl border p-4">
                <View className="bg-accent-soft relative h-11 w-11 items-center justify-center rounded-full">
                  <Typography>{p.name[0]}</Typography>
                  <TeamStatusDot status={p.team_status} />
                </View>
                <View className="flex-1">
                  <Typography className="font-semibold">{p.name}</Typography>
                  <Typography.Paragraph color="muted">{p.email}</Typography.Paragraph>
                  <View className="mt-2 flex-row flex-wrap gap-1">
                    {p.skills_have?.slice(0, 3).map((s) => (
                      <Chip key={s} size="sm" variant="secondary">
                        <Chip.Label>{s}</Chip.Label>
                      </Chip>
                    ))}
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="items-center gap-3 py-10">
            <UserRoundSearch size={30} />
            <Typography.Paragraph color="muted">
              Enter at least two characters to search.
            </Typography.Paragraph>
          </View>
        )}
      </Card>
    </AppShell>
  );
}
export default function SearchScreen() {
  return (
    <ParticipantTabGuard>
      <Content />
    </ParticipantTabGuard>
  );
}
