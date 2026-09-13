import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Button, Card, Spinner, Typography } from 'heroui-native';
import { Bell, Check, Inbox } from 'lucide-react-native';
import { View } from 'react-native';
import { AppShell } from '@/components/AppShell';
import { ParticipantTabGuard } from '@/components/ParticipantTabGuard';
import { getGroupInvites, respondToGroupInvite } from '@/lib/hackmatch.api';
import { useHackmatchStore } from '@/lib/hackmatch.store';
import type { GroupInvite } from '@/lib/hackmatch.types';
function Content() {
  const identity = useHackmatchStore((s) => s.identity);
  const [items, setItems] = useState<GroupInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    if (identity) {
      try {
        setItems(await getGroupInvites(identity));
      } catch {
        setItems([]);
      }
    }
    setLoading(false);
  }, [identity]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  const respond = async (id: string, accept: boolean) => {
    if (!identity) return;
    await respondToGroupInvite(identity, id, accept);
    setItems((v) => v.filter((x) => x.id !== id));
  };
  if (loading)
    return (
      <View className="flex-1 items-center justify-center">
        <Spinner />
      </View>
    );
  return (
    <AppShell
      eyebrow="Updates"
      title="Activity"
      description="Team invitations and membership updates appear here."
    >
      {items.length ? (
        <View className="gap-3">
          {items.map((item) => (
            <Card key={item.id} className="gap-4 p-5">
              <Bell size={21} />
              <Typography.Heading>Team invitation</Typography.Heading>
              <Typography.Paragraph color="muted">
                {item.from_name ?? 'A participant'} invited you to {item.group_name ?? 'their team'}
                .
              </Typography.Paragraph>
              <View className="flex-row gap-2">
                <Button variant="secondary" onPress={() => void respond(item.id, false)}>
                  <Button.Label>Decline</Button.Label>
                </Button>
                <Button onPress={() => void respond(item.id, true)}>
                  <Check size={15} />
                  <Button.Label>Accept</Button.Label>
                </Button>
              </View>
            </Card>
          ))}
        </View>
      ) : (
        <Card className="items-center gap-4 px-6 py-12">
          <Inbox size={28} />
          <Typography.Heading>You’re all caught up</Typography.Heading>
        </Card>
      )}
    </AppShell>
  );
}
export default function ActivityScreen() {
  return (
    <ParticipantTabGuard>
      <Content />
    </ParticipantTabGuard>
  );
}
