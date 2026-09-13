import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Button, Card, Spinner, Typography } from 'heroui-native';
import { ChevronRight, MessageCircle, Plus, Users } from 'lucide-react-native';
import { View } from 'react-native';
import { AppShell } from '@/components/AppShell';
import { ParticipantTabGuard } from '@/components/ParticipantTabGuard';
import { getChannels, getGroupInvites, getTeamRequests } from '@/lib/hackmatch.api';
import { useHackmatchStore } from '@/lib/hackmatch.store';
import type { Channel, GroupInvite, TeamRequest } from '@/lib/hackmatch.types';
import { channelHref, requestThreadHref } from '@/lib/navigation';

type DirectConversation = {
  conversationId: string;
  participantId: string;
  personName: string;
  createdAt: string;
};

function toDirectConversation(
  item: TeamRequest | GroupInvite,
  currentUserId: string,
): DirectConversation | null {
  const outgoing = item.from_user_id === currentUserId;
  const participantId = outgoing ? item.to_user_id : item.from_user_id;
  if (!participantId) return null;
  return {
    conversationId: item.id,
    participantId,
    personName: outgoing ? (item.to_name ?? 'Participant') : (item.from_name ?? 'Participant'),
    createdAt: item.created_at ?? '',
  };
}

function Content() {
  const router = useRouter();
  const identity = useHackmatchStore((s) => s.identity);
  const [teams, setTeams] = useState<Channel[]>([]);
  const [requests, setRequests] = useState<TeamRequest[]>([]);
  const [groupInvites, setGroupInvites] = useState<GroupInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (!identity) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [channels, teamRequests, invitations] = await Promise.all([
        getChannels(identity),
        getTeamRequests(identity),
        getGroupInvites(identity),
      ]);
      setTeams(channels.filter((channel) => channel.type === 'my_group' || channel.group_id));
      setRequests(teamRequests);
      setGroupInvites(invitations);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Conversations could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [identity]);
  useFocusEffect(
    useCallback(() => {
      void load();
      const refreshTimer = setInterval(() => void load(), 5000);
      return () => clearInterval(refreshTimer);
    }, [load]),
  );
  const directConversations = identity
    ? Array.from(
        [...requests, ...groupInvites]
          .map((item) => toDirectConversation(item, identity.userId))
          .filter((item): item is DirectConversation => item !== null)
          .reduce((conversations, conversation) => {
            const existing = conversations.get(conversation.participantId);
            const conversationTime = Date.parse(conversation.createdAt) || 0;
            const existingTime = existing ? Date.parse(existing.createdAt) || 0 : 0;
            if (!existing || conversationTime >= existingTime) {
              conversations.set(conversation.participantId, conversation);
            }
            return conversations;
          }, new Map<string, DirectConversation>())
          .values(),
      )
    : [];
  if (loading)
    return (
      <View className="flex-1 items-center justify-center">
        <Spinner />
      </View>
    );
  return (
    <AppShell
      eyebrow="Conversations"
      title="DMs"
      description="One direct conversation per person, plus your team chats."
      action={
        <Button size="sm" onPress={() => router.push('/group/create')}>
          <Plus size={17} />
          <Button.Label>Create team</Button.Label>
        </Button>
      }
    >
      {error ? (
        <Card className="bg-danger-soft mb-4 p-4">
          <Typography>{error}</Typography>
        </Card>
      ) : null}
      {teams.length || directConversations.length ? (
        <View className="gap-6">
          {directConversations.length ? (
            <View className="gap-3">
              <Typography.Heading className="text-lg">Direct messages</Typography.Heading>
              {directConversations.map((conversation) => (
                <Button
                  key={conversation.participantId}
                  variant="secondary"
                  className="h-auto justify-start p-4"
                  onPress={() =>
                    router.push(
                      requestThreadHref(conversation.conversationId, conversation.personName),
                    )
                  }
                >
                  <MessageCircle size={21} />
                  <View className="flex-1 items-start">
                    <Button.Label>{conversation.personName}</Button.Label>
                    <Typography.Paragraph color="muted">Direct message</Typography.Paragraph>
                  </View>
                  <ChevronRight size={18} />
                </Button>
              ))}
            </View>
          ) : null}
          {teams.length ? (
            <View className="gap-3">
              <Typography.Heading className="text-lg">Team conversations</Typography.Heading>
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
          ) : null}
        </View>
      ) : (
        <Card className="items-center gap-4 px-6 py-12">
          <MessageCircle size={28} />
          <Typography.Heading className="text-lg">No conversations yet</Typography.Heading>
          <Typography.Paragraph color="muted" className="text-center">
            Direct messages and team chats will appear here.
          </Typography.Paragraph>
          <Button onPress={() => router.push('/find-team')}>
            <Button.Label>Find teammates</Button.Label>
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
