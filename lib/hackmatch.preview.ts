import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Channel,
  ChannelMessage,
  Group,
  GroupInvite,
  GroupInviteResponse,
  GroupMember,
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

interface StoredPreviewGroup {
  id: string;
  code: string;
  name: string;
  leader_user_id: string;
  member_user_ids: string[];
  created_at: string;
}

interface StoredPreviewGroupInvite {
  id: string;
  group_id: string;
  from_user_id: string;
  to_user_id: string;
  status: 'pending' | 'accepted' | 'confirmed' | 'declined';
  created_at: string;
}

const REQUESTS_KEY = 'hackmatch-preview-requests';
// Versioned keys intentionally start the simplified team-invitation test flow with clean data.
const GROUPS_KEY = 'hackmatch-preview-groups-v2';
const GROUP_INVITES_KEY = 'hackmatch-preview-group-invites-v2';
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

function isStoredPreviewGroup(value: unknown): value is StoredPreviewGroup {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.code === 'string' &&
    typeof value.name === 'string' &&
    typeof value.leader_user_id === 'string' &&
    Array.isArray(value.member_user_ids) &&
    value.member_user_ids.every((memberId) => typeof memberId === 'string') &&
    typeof value.created_at === 'string'
  );
}

function isStoredPreviewGroupInvite(value: unknown): value is StoredPreviewGroupInvite {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.group_id === 'string' &&
    typeof value.from_user_id === 'string' &&
    typeof value.to_user_id === 'string' &&
    (value.status === 'pending' ||
      value.status === 'accepted' ||
      value.status === 'confirmed' ||
      value.status === 'declined') &&
    typeof value.created_at === 'string'
  );
}

async function readPreviewGroupInvites(): Promise<StoredPreviewGroupInvite[]> {
  const value = await AsyncStorage.getItem(GROUP_INVITES_KEY);
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(isStoredPreviewGroupInvite) : [];
  } catch {
    return [];
  }
}

async function readPreviewGroups(): Promise<StoredPreviewGroup[]> {
  const value = await AsyncStorage.getItem(GROUPS_KEY);
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(isStoredPreviewGroup) : [];
  } catch {
    return [];
  }
}

export async function createPreviewGroup(
  identity: ParticipantIdentity,
  name: string,
): Promise<Group> {
  const groups = await readPreviewGroups();
  const timestamp = Date.now();
  const group: StoredPreviewGroup = {
    id: `preview-group-${timestamp}`,
    code: `TEAM-${String(timestamp).slice(-6)}`,
    name: name.trim(),
    leader_user_id: identity.userId,
    member_user_ids: [identity.userId],
    created_at: new Date(timestamp).toISOString(),
  };
  await AsyncStorage.setItem(GROUPS_KEY, JSON.stringify([group, ...groups]));
  return group;
}

export async function getPreviewGroupChannels(identity: ParticipantIdentity): Promise<Channel[]> {
  const groups = await readPreviewGroups();
  return groups
    .filter(
      (group) =>
        group.member_user_ids.length > 1 && group.member_user_ids.includes(identity.userId),
    )
    .map((group) => ({
      id: `preview-channel-${group.id}`,
      name: group.name,
      description: 'Your private team collaboration space.',
      type: 'my_group' as const,
      group_id: group.id,
      allows_posting: true,
    }));
}

export async function getPreviewGroupMembers(groupId: string): Promise<GroupMember[]> {
  const groups = await readPreviewGroups();
  const group = groups.find((item) => item.id === groupId);
  if (!group) return [];
  return group.member_user_ids.map((userId) => {
    const profile = PREVIEW_PARTICIPANTS.find((participant) => participant.user_id === userId);
    return {
      user_id: userId,
      name: profile?.name ?? participantName(userId),
      email: profile?.email,
      role: userId === group.leader_user_id ? 'Team lead' : 'Team member',
      team_status: 'forming',
    };
  });
}

function previewGroupInvite(
  invite: StoredPreviewGroupInvite,
  group: StoredPreviewGroup | undefined,
  identity: ParticipantIdentity,
): GroupInvite {
  return {
    id: invite.id,
    group_id: invite.group_id,
    group_name: group?.name ?? 'Team',
    from_user_id: invite.from_user_id,
    to_user_id: invite.to_user_id,
    from_name: participantName(invite.from_user_id),
    to_name: participantName(invite.to_user_id),
    status: invite.status === 'confirmed' ? 'accepted' : invite.status,
    direction: invite.from_user_id === identity.userId ? 'outgoing' : 'incoming',
    created_at: invite.created_at,
  };
}

export async function createPreviewGroupInvite(
  identity: ParticipantIdentity,
  groupId: string,
  toUserId: string,
): Promise<GroupInvite> {
  const [groups, invites] = await Promise.all([readPreviewGroups(), readPreviewGroupInvites()]);
  const group = groups.find((item) => item.id === groupId);
  if (!group || group.leader_user_id !== identity.userId) {
    throw new Error('Only the team lead can invite participants to this team.');
  }

  const existing = invites.find(
    (item) =>
      item.group_id === groupId && item.to_user_id === toUserId && item.status === 'pending',
  );
  if (existing) return previewGroupInvite(existing, group, identity);

  const timestamp = Date.now();
  const invite: StoredPreviewGroupInvite = {
    id: `preview-group-invite-${timestamp}`,
    group_id: groupId,
    from_user_id: identity.userId,
    to_user_id: toUserId,
    status: 'pending',
    created_at: new Date(timestamp).toISOString(),
  };
  await AsyncStorage.setItem(GROUP_INVITES_KEY, JSON.stringify([invite, ...invites]));
  return previewGroupInvite(invite, group, identity);
}

export async function getPreviewGroupInvites(
  identity: ParticipantIdentity,
): Promise<GroupInvite[]> {
  const [groups, invites] = await Promise.all([readPreviewGroups(), readPreviewGroupInvites()]);
  return invites
    .filter(
      (invite) => invite.from_user_id === identity.userId || invite.to_user_id === identity.userId,
    )
    .map((invite) =>
      previewGroupInvite(
        invite,
        groups.find((group) => group.id === invite.group_id),
        identity,
      ),
    );
}

export async function respondToPreviewGroupInvite(
  identity: ParticipantIdentity,
  inviteId: string,
  accept: boolean,
): Promise<GroupInviteResponse> {
  const [invites, groups] = await Promise.all([readPreviewGroupInvites(), readPreviewGroups()]);
  const invite = invites.find((item) => item.id === inviteId);
  if (!invite || invite.to_user_id !== identity.userId) {
    throw new Error('This team invitation is not available for this account.');
  }
  if (invite.status !== 'pending') throw new Error('This invitation has already been answered.');

  const group = groups.find((item) => item.id === invite.group_id);
  if (!group) throw new Error('This team is no longer available.');
  const status = accept ? ('accepted' as const) : ('declined' as const);
  const nextInvites = invites.map((item) => (item.id === inviteId ? { ...item, status } : item));
  const nextGroups = accept
    ? groups.map((item) =>
        item.id === group.id && !item.member_user_ids.includes(identity.userId)
          ? { ...item, member_user_ids: [...item.member_user_ids, identity.userId] }
          : item,
      )
    : groups;
  await Promise.all([
    AsyncStorage.setItem(GROUP_INVITES_KEY, JSON.stringify(nextInvites)),
    AsyncStorage.setItem(GROUPS_KEY, JSON.stringify(nextGroups)),
  ]);

  return {
    status,
    group_id: group.id,
    channel: accept
      ? {
          id: `preview-channel-${group.id}`,
          name: group.name,
          description: 'Your private team collaboration space.',
          type: 'my_group',
          group_id: group.id,
          allows_posting: true,
        }
      : undefined,
  };
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
  const [requests, groupInvites] = await Promise.all([
    readPreviewRequests(),
    readPreviewGroupInvites(),
  ]);
  const request = requests.find((item) => item.id === inviteId);
  if (request) return [request.from_user_id, request.to_user_id].sort().join(':');
  const groupInvite = groupInvites.find((item) => item.id === inviteId);
  if (groupInvite) return [groupInvite.from_user_id, groupInvite.to_user_id].sort().join(':');
  return inviteId;
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
