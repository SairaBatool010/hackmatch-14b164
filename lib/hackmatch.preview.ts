import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  ChannelMessage,
  ParticipantIdentity,
  ParticipantSearchResult,
  Profile,
  TeamRequest,
} from '@/lib/hackmatch.types';

const SEEDS = [
  ['Maya Chen', 'Product design', 'React Native'],
  ['Grace Liu', 'Data visualization', 'SQL'],
  ['Amara Okafor', 'Backend development', 'PostgreSQL'],
  ['Aisha Rahman', 'Machine learning', 'Python'],
  ['Daniel Kim', 'Security', 'OAuth'],
  ['Leo Martins', 'Mobile development', 'Expo'],
  ['Camila Santos', 'React Native', 'Mobile UX'],
  ['Alejandro Ruiz', 'Node.js', 'REST APIs'],
  ['Anika Sharma', 'Figma', 'UX research'],
  ['Ben Carter', 'DevOps', 'AWS'],
] as const;
export const PREVIEW_PARTICIPANTS: Profile[] = SEEDS.map(([name, skill, second], index) => ({
  user_id: `preview-user-${index + 1}`,
  name,
  email: `${name.toLowerCase().replace(/\s+/g, '.')}@preview.hackmatch.dev`,
  skills_have: [skill, second, 'Teamwork'],
  skills_want: ['Product strategy', 'Rapid prototyping'],
  interests: ['Developer tools', 'Social impact'],
  bio: `${name} enjoys building useful products and collaborating with multidisciplinary teams.`,
  roles_wanted: [skill],
  availability: index % 3 === 0 ? 'partial' : 'full_hackathon',
  team_status: index % 4 === 3 ? 'finalized' : index % 3 === 2 ? 'forming' : 'available',
  group_id: index % 4 === 3 || index % 3 === 2 ? `preview-team-${index + 1}` : null,
  member_count: index % 4 === 3 ? 5 : index % 3 === 2 ? 3 : undefined,
}));
export const PREVIEW_ACCOUNTS = [
  { code: '111111', profile: PREVIEW_PARTICIPANTS[0] },
  { code: '222222', profile: PREVIEW_PARTICIPANTS[1] },
] as const;

interface StoredPreviewRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  note: string | null;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

const REQUESTS_KEY = 'hackmatch-preview-requests';
const MESSAGE_KEY_PREFIX = 'hackmatch-preview-request-messages:';

function participantName(userId: string) {
  return (
    PREVIEW_PARTICIPANTS.find((participant) => participant.user_id === userId)?.name ??
    'Participant'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStoredPreviewRequest(value: unknown): value is StoredPreviewRequest {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.from_user_id === 'string' &&
    typeof value.to_user_id === 'string' &&
    (typeof value.note === 'string' || value.note === null) &&
    (value.status === 'pending' || value.status === 'accepted' || value.status === 'declined') &&
    typeof value.created_at === 'string'
  );
}

function isChannelMessage(value: unknown): value is ChannelMessage {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.channel_id === 'string' &&
    typeof value.user_id === 'string' &&
    typeof value.author_name === 'string' &&
    typeof value.body === 'string' &&
    typeof value.created_at === 'string'
  );
}

async function readPreviewRequests(): Promise<StoredPreviewRequest[]> {
  const value = await AsyncStorage.getItem(REQUESTS_KEY);
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(isStoredPreviewRequest) : [];
  } catch {
    return [];
  }
}

export async function createPreviewTeamRequest(
  identity: ParticipantIdentity,
  toUserId: string,
  note: string | null,
): Promise<TeamRequest> {
  const requests = await readPreviewRequests();
  const request: StoredPreviewRequest = {
    id: `preview-request-${Date.now()}`,
    from_user_id: identity.userId,
    to_user_id: toUserId,
    note,
    status: 'pending',
    created_at: new Date().toISOString(),
  };
  await AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify([request, ...requests]));
  return {
    ...request,
    from_name: identity.name,
    to_name: participantName(toUserId),
    status: 'sent',
    direction: 'outgoing',
  };
}

export async function getPreviewTeamRequests(
  identity: ParticipantIdentity,
): Promise<TeamRequest[]> {
  const requests = await readPreviewRequests();
  return requests
    .filter(
      (request) =>
        request.from_user_id === identity.userId || request.to_user_id === identity.userId,
    )
    .map((request) => {
      const outgoing = request.from_user_id === identity.userId;
      return {
        ...request,
        from_name: participantName(request.from_user_id),
        to_name: participantName(request.to_user_id),
        direction: outgoing ? 'outgoing' : 'incoming',
        status: outgoing && request.status === 'pending' ? 'sent' : request.status,
      };
    });
}

export async function respondToPreviewTeamRequest(inviteId: string, accept: boolean) {
  const requests = await readPreviewRequests();
  const next = requests.map((request) =>
    request.id === inviteId
      ? { ...request, status: accept ? ('accepted' as const) : ('declined' as const) }
      : request,
  );
  await AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify(next));
  return { status: accept ? 'accepted' : 'declined' };
}

async function previewConversationKey(inviteId: string): Promise<string> {
  const requests = await readPreviewRequests();
  const request = requests.find((item) => item.id === inviteId);
  if (!request) return inviteId;
  return [request.from_user_id, request.to_user_id].sort().join(':');
}

async function readPreviewMessages(key: string): Promise<ChannelMessage[]> {
  const value = await AsyncStorage.getItem(`${MESSAGE_KEY_PREFIX}${key}`);
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(isChannelMessage) : [];
  } catch {
    return [];
  }
}

export async function getPreviewInviteMessages(inviteId: string): Promise<ChannelMessage[]> {
  const conversationKey = await previewConversationKey(inviteId);
  const messages = await readPreviewMessages(conversationKey);
  if (messages.length || conversationKey === inviteId) return messages;
  return readPreviewMessages(inviteId);
}

export async function postPreviewInviteMessage(
  identity: ParticipantIdentity,
  inviteId: string,
  body: string,
): Promise<ChannelMessage> {
  const messages = await getPreviewInviteMessages(inviteId);
  const conversationKey = await previewConversationKey(inviteId);
  const message: ChannelMessage = {
    id: `preview-message-${Date.now()}`,
    channel_id: conversationKey,
    user_id: identity.userId,
    author_name: identity.name,
    body: body.trim(),
    created_at: new Date().toISOString(),
  };
  await AsyncStorage.setItem(
    `${MESSAGE_KEY_PREFIX}${conversationKey}`,
    JSON.stringify([...messages, message]),
  );
  return message;
}

export function searchPreviewParticipants(
  query: string,
  currentUserId?: string,
): ParticipantSearchResult[] {
  const q = query.trim().toLowerCase();
  return PREVIEW_PARTICIPANTS.filter(
    (p) =>
      p.user_id !== currentUserId &&
      [p.name, p.email, ...p.skills_have, ...p.interests].some((v) => v.toLowerCase().includes(q)),
  ).map((p) => ({
    id: p.user_id,
    name: p.name,
    email: p.email,
    skills_have: p.skills_have,
    team_status: p.team_status,
  }));
}
