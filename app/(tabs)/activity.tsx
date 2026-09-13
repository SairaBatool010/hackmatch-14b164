import { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Button, Card, Input, Spinner, Typography } from 'heroui-native';
import { Bell, Check, Inbox, MessageCircle } from 'lucide-react-native';
import { AppShell } from '@/components/AppShell';
import { ParticipantTabGuard } from '@/components/ParticipantTabGuard';
import {
  ApiError,
  confirmGroupInvite,
  getGroupInvites,
  getTeamRequests,
  respondToGroupInvite,
  respondToTeamRequest,
  sendTeamInvite,
} from '@/lib/hackmatch.api';
import { useHackmatchStore } from '@/lib/hackmatch.store';
import type { GroupInvite, InviteConflict } from '@/lib/hackmatch.types';
import { channelHref, requestThreadHref } from '@/lib/navigation';

type ActivityItem = GroupInvite & { kind: 'group' | 'request' };

function isInviteConflict(value: unknown): value is InviteConflict {
  return Boolean(
    value &&
    typeof value === 'object' &&
    'error' in value &&
    value.error === 'sender_already_grouped' &&
    'open_spots' in value,
  );
}

function Content() {
  const router = useRouter();
  const identity = useHackmatchStore((state) => state.identity);
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [reverseRequest, setReverseRequest] = useState<{
    item: ActivityItem;
    openSpots: number;
  } | null>(null);

  const load = useCallback(async () => {
    if (!identity) return;
    const [requests, groups] = await Promise.allSettled([
      getTeamRequests(identity),
      getGroupInvites(identity),
    ]);
    const next: ActivityItem[] = [];
    if (requests.status === 'fulfilled') {
      next.push(...requests.value.map((item) => ({ ...item, kind: 'request' as const })));
    }
    if (groups.status === 'fulfilled') {
      next.push(...groups.value.map((item) => ({ ...item, kind: 'group' as const })));
    }
    setItems(next);
    if (requests.status === 'rejected' && groups.status === 'rejected') {
      setError('Activity could not be loaded. Pull back here and try again.');
    } else {
      setError(null);
    }
    setLoading(false);
  }, [identity]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const respond = async (item: ActivityItem, accept: boolean) => {
    if (!identity || busyId) return;
    setBusyId(item.id);
    setError(null);
    try {
      if (item.kind === 'request') await respondToTeamRequest(identity, item.id, accept);
      else await respondToGroupInvite(identity, item.id, accept);
      await load();
    } catch (caught) {
      if (caught instanceof ApiError && isInviteConflict(caught.data)) {
        const sender = item.from_name ?? 'This participant';
        Alert.alert('Request can’t be accepted', `${sender} has already joined another team.`);
        if (caught.data.open_spots > 0) {
          setReverseRequest({ item, openSpots: caught.data.open_spots });
        }
      } else {
        setError(caught instanceof Error ? caught.message : 'The request could not be updated.');
      }
    } finally {
      setBusyId(null);
    }
  };

  const confirmInvitation = async (item: ActivityItem) => {
    const code = codes[item.id]?.trim() ?? '';
    if (!identity || item.kind !== 'group' || code.length !== 6 || busyId) return;
    setBusyId(item.id);
    setError(null);
    try {
      const result = await confirmGroupInvite(identity, item.id, code);
      setCodes((current) => ({ ...current, [item.id]: '' }));
      await load();
      if (result.channel) router.push(channelHref(result.channel));
      else router.push('/(tabs)/dms');
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'The invitation code could not be confirmed.',
      );
    } finally {
      setBusyId(null);
    }
  };

  const sendReverseRequest = async () => {
    if (!identity || !reverseRequest?.item.from_user_id) return;
    setBusyId(reverseRequest.item.id);
    try {
      const request = await sendTeamInvite(identity, reverseRequest.item.from_user_id, null);
      const recipientName = reverseRequest.item.from_name ?? 'Team-up request';
      setReverseRequest(null);
      if (request.id) router.push(requestThreadHref(request.id, recipientName));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The request could not be sent.');
    } finally {
      setBusyId(null);
    }
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
      description="Team requests, conversations, and membership updates appear here."
    >
      {error ? (
        <Card className="bg-danger-soft mb-4 gap-3 p-4">
          <Typography>{error}</Typography>
          <Button variant="secondary" onPress={() => void load()}>
            <Button.Label>Try again</Button.Label>
          </Button>
        </Card>
      ) : null}
      {reverseRequest ? (
        <Card className="bg-warning-soft mb-4 gap-3 p-4">
          <Typography.Heading>They still have room</Typography.Heading>
          <Typography>
            They still have {reverseRequest.openSpots} spot
            {reverseRequest.openSpots === 1 ? '' : 's'} open — want to send a request to join their
            team instead?
          </Typography>
          <View className="flex-row gap-2">
            <Button variant="secondary" onPress={() => setReverseRequest(null)}>
              <Button.Label>Not now</Button.Label>
            </Button>
            <Button
              isDisabled={busyId === reverseRequest.item.id}
              onPress={() => void sendReverseRequest()}
            >
              <Button.Label>Send request</Button.Label>
            </Button>
          </View>
        </Card>
      ) : null}
      {items.length ? (
        <View className="gap-3">
          {items.map((item) => {
            const outgoing = item.direction === 'outgoing';
            const pending = !item.status || item.status === 'pending' || item.status === 'sent';
            const pendingIncoming = !outgoing && pending;
            const codedGroupInvite = item.kind === 'group' && item.confirmation_required !== false;
            const conversationId = item.direct_conversation_id ?? item.id;
            const personName = outgoing
              ? (item.to_name ?? 'Participant')
              : (item.from_name ?? 'Participant');
            const title =
              item.kind === 'group'
                ? item.status === 'confirmed'
                  ? 'Team invitation confirmed'
                  : item.status === 'declined'
                    ? 'Team invitation declined'
                    : outgoing
                      ? 'Invitation code sent'
                      : 'Confirm team invitation'
                : outgoing && item.status === 'declined'
                  ? 'Request declined'
                  : outgoing && item.status === 'accepted'
                    ? 'Request accepted'
                    : outgoing
                      ? 'Request sent'
                      : 'Team-up request';
            const description =
              item.kind === 'group'
                ? item.status === 'confirmed'
                  ? `The invitation to ${item.group_name ?? 'the team'} was confirmed. The team chat is now available.`
                  : item.status === 'declined'
                    ? `The invitation to ${item.group_name ?? 'the team'} was declined.`
                    : outgoing
                      ? `A one-time code for ${item.group_name ?? 'your team'} was sent automatically in your DM with ${personName}.`
                      : `${personName} invited you to ${item.group_name ?? 'a team'}. Get the one-time code from your DM and enter it below.`
                : outgoing
                  ? item.status === 'declined'
                    ? `Your request to ${personName} was declined. Keep looking for a match.`
                    : item.status === 'accepted'
                      ? `${personName} accepted your team-up request.`
                      : `You sent a team-up request to ${personName}.`
                  : `${personName} wants to team up.`;
            return (
              <Card key={`${item.kind}-${item.id}`} className="gap-4 p-5">
                <Bell size={21} />
                <Typography.Heading>{title}</Typography.Heading>
                <Typography.Paragraph color="muted">{description}</Typography.Paragraph>
                {item.note ? (
                  <Card className="bg-surface-secondary p-3">
                    <Typography>{item.note}</Typography>
                  </Card>
                ) : null}
                <Button
                  variant="secondary"
                  onPress={() => router.push(requestThreadHref(conversationId, personName))}
                >
                  <MessageCircle size={16} />
                  <Button.Label>Open DM</Button.Label>
                </Button>
                {pendingIncoming && codedGroupInvite ? (
                  <View className="gap-3">
                    <Input
                      value={codes[item.id] ?? ''}
                      onChangeText={(value) =>
                        setCodes((current) => ({
                          ...current,
                          [item.id]: value.replace(/\D/g, '').slice(0, 6),
                        }))
                      }
                      keyboardType="number-pad"
                      maxLength={6}
                      placeholder="6-digit invitation code"
                    />
                    <View className="flex-row gap-2">
                      <Button
                        variant="secondary"
                        isDisabled={busyId === item.id}
                        onPress={() => void respond(item, false)}
                      >
                        <Button.Label>Decline</Button.Label>
                      </Button>
                      <Button
                        className="flex-1"
                        isDisabled={busyId === item.id || (codes[item.id]?.length ?? 0) !== 6}
                        onPress={() => void confirmInvitation(item)}
                      >
                        <Check size={15} />
                        <Button.Label>Confirm code</Button.Label>
                      </Button>
                    </View>
                  </View>
                ) : pendingIncoming && item.kind === 'request' ? (
                  <View className="flex-row gap-2">
                    <Button
                      variant="secondary"
                      isDisabled={busyId === item.id}
                      onPress={() => void respond(item, false)}
                    >
                      <Button.Label>Decline</Button.Label>
                    </Button>
                    <Button
                      isDisabled={busyId === item.id}
                      onPress={() => void respond(item, true)}
                    >
                      <Check size={15} />
                      <Button.Label>Accept</Button.Label>
                    </Button>
                  </View>
                ) : null}
              </Card>
            );
          })}
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
