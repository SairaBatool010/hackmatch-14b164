import { bilt } from '@/lib/bilt';
import { PREVIEW_PARTICIPANTS, searchPreviewParticipants } from '@/lib/hackmatch.preview';
import type {
  AdminAnalytics,
  AdminTeamCounts,
  AdminTeamsData,
  AdminTeamSummary,
  Channel,
  ChannelMessage,
  CreateChannelValues,
  Group,
  GroupInvite,
  GroupMember,
  ParticipantIdentity,
  ParticipantSearchResult,
  Profile,
  ProfileFormSchema,
  ProfileQuestion,
  ProfileValues,
  Recommendation,
  RecommenderGroup,
  TeamRequest,
} from '@/lib/hackmatch.types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '');
const USE_PREVIEW_DATA = __DEV__;
const GROUP_ID = 'preview-group-builders';
const CHANNELS: Channel[] = [
  {
    id: 'preview-announcements',
    name: 'announcements',
    description: 'Official hackathon updates and important information.',
    type: 'admin',
    allows_posting: false,
  },
  {
    id: 'preview-faq',
    name: 'faq',
    description: 'Ask questions and get help.',
    type: 'admin',
    allows_posting: true,
  },
  {
    id: 'preview-resources',
    name: 'resources',
    description: 'Official links, tools, and starter kits.',
    type: 'admin',
    allows_posting: false,
  },
  {
    id: 'preview-schedule',
    name: 'schedule',
    description: 'Event schedule, deadlines, and sessions.',
    type: 'admin',
    allows_posting: false,
  },
  {
    id: 'preview-find-team',
    name: 'find-a-team',
    description: 'Discover participants whose skills complement yours.',
    type: 'find_team',
    allows_posting: false,
  },
  {
    id: 'preview-team-builders',
    name: 'team-builders',
    description: 'Your private team collaboration space.',
    type: 'my_group',
    group_id: GROUP_ID,
    allows_posting: true,
  },
];
const MESSAGES: Record<string, ChannelMessage[]> = {
  'preview-announcements': [
    {
      id: 'a1',
      channel_id: 'preview-announcements',
      user_id: 'admin',
      author_name: 'HackMatch Admin',
      body: 'Welcome to HackMatch. Complete your profile and use the team finder to meet participants.',
      created_at: new Date().toISOString(),
    },
  ],
  'preview-faq': [
    {
      id: 'f1',
      channel_id: 'preview-faq',
      user_id: 'preview-user-1',
      author_name: 'Maya Chen',
      body: 'Where should we submit the final project link?',
      created_at: new Date().toISOString(),
    },
  ],
  'preview-team-builders': [
    {
      id: 't1',
      channel_id: 'preview-team-builders',
      user_id: 'preview-user-2',
      author_name: 'Leo Martins',
      body: 'What should we prioritize for the prototype?',
      created_at: new Date().toISOString(),
    },
  ],
};
const DEFAULT_ROLES = ['Frontend', 'Backend', 'Design', 'PM', 'Data/ML'];
export const DEFAULT_PROFILE_SCHEMA: ProfileFormSchema = {
  questions: [
    {
      id: 'skills-have',
      key: 'skills_have',
      label: 'Skills you bring',
      type: 'multi_select',
      required: true,
      baseline: true,
    },
    {
      id: 'skills-want',
      key: 'skills_want',
      label: 'Skills you want',
      type: 'multi_select',
      required: true,
      baseline: true,
    },
    {
      id: 'interests',
      key: 'interests',
      label: 'Interests',
      type: 'multi_select',
      required: true,
      baseline: true,
    },
    {
      id: 'bio',
      key: 'bio',
      label: 'About you',
      type: 'long_text',
      required: true,
      baseline: true,
    },
    {
      id: 'roles-wanted',
      key: 'roles_wanted',
      label: 'Roles you want to find',
      type: 'multi_select',
      options: DEFAULT_ROLES,
      baseline: true,
    },
    {
      id: 'availability',
      key: 'availability',
      label: 'Availability',
      type: 'single_select',
      options: ['Full hackathon', 'Partial', 'Remote only'],
      baseline: true,
    },
  ],
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
function asArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}
async function request<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string,
): Promise<T> {
  if (!API_BASE_URL) throw new ApiError('The API is not configured.', 0);
  const headers = new Headers({ Accept: 'application/json', 'Content-Type': 'application/json' });
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  new Headers(options.headers).forEach((value, key) => headers.set(key, value));
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const raw = await response.text();
  let data: unknown = null;
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = raw;
    }
  }
  if (!response.ok) {
    const message =
      typeof data === 'object' && data && 'message' in data
        ? String(data.message)
        : typeof data === 'object' && data && 'error' in data
          ? String(data.error)
          : 'Something went wrong. Please try again.';
    throw new ApiError(message, response.status, data);
  }
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return data as T;
}
export async function confirmInvitation(inviteToken: string, code: string) {
  const result = await request<{
    user?: { id?: string; user_id?: string; name: string; email: string };
    user_id?: string;
    name?: string;
    email?: string;
    access_token?: string;
    profile?: Profile;
  }>('/invite/confirm', {
    method: 'POST',
    body: JSON.stringify({ invite_token: inviteToken, code }),
  });
  const user = result.user ?? result;
  const userId = 'id' in user ? (user.id ?? user.user_id) : result.user_id;
  if (!userId || !user.name || !user.email)
    throw new ApiError('The invitation response did not include a valid participant.', 500);
  return {
    identity: { userId, name: user.name, email: user.email, accessToken: result.access_token },
    profile: result.profile,
  };
}
function profileBody(identity: ParticipantIdentity, values: ProfileValues) {
  return {
    user_id: identity.userId,
    name: identity.name,
    email: identity.email,
    ...values,
    group_id: values.group_id ?? null,
  };
}
export async function getProfileFormSchema(identity?: ParticipantIdentity | null) {
  try {
    const result = await request<ProfileFormSchema | ProfileQuestion[]>(
      '/admin/form-schema',
      {},
      identity?.accessToken,
    );
    return Array.isArray(result) ? { questions: result } : result;
  } catch (caught) {
    if (caught instanceof ApiError && (caught.status === 404 || caught.status === 0)) {
      return DEFAULT_PROFILE_SCHEMA;
    }
    throw caught;
  }
}
export async function saveProfileFormSchema(
  schema: ProfileFormSchema,
  identity?: ParticipantIdentity | null,
) {
  const result = await request<ProfileFormSchema | ProfileQuestion[]>(
    '/admin/form-schema',
    { method: 'POST', body: JSON.stringify(schema.questions) },
    identity?.accessToken,
  );
  return Array.isArray(result) ? { questions: result } : result;
}

export function createProfile(identity: ParticipantIdentity, values: ProfileValues) {
  return request<Profile>(
    '/profiles',
    { method: 'POST', body: JSON.stringify(profileBody(identity, values)) },
    identity.accessToken,
  );
}
export function getProfile(identity: ParticipantIdentity) {
  return request<Profile>(
    `/profiles/${encodeURIComponent(identity.userId)}`,
    {},
    identity.accessToken,
  );
}
export function updateProfile(identity: ParticipantIdentity, values: ProfileValues) {
  return request<Profile>(
    `/profiles/${encodeURIComponent(identity.userId)}`,
    { method: 'PATCH', body: JSON.stringify(profileBody(identity, values)) },
    identity.accessToken,
  );
}
export async function getChannels(identity: ParticipantIdentity) {
  if (USE_PREVIEW_DATA) return CHANNELS;
  const result = await request<Channel[] | { data?: Channel[]; channels?: Channel[] }>(
    `/channels?user_id=${encodeURIComponent(identity.userId)}`,
    {},
    identity.accessToken,
  );
  return Array.isArray(result) ? result : asArray(result.channels ?? result.data);
}
interface RecommenderResponse {
  recommendations?: Recommendation[];
}
function normalized(values: string[]) {
  return new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean));
}
function overlap(first: Set<string>, second: Set<string>) {
  return [...first].filter((value) => second.has(value));
}
function getPreviewRecommendations(requester: Profile, profiles: Profile[]): Recommendation[] {
  const requesterSkills = normalized(requester.skills_have);
  const requesterWants = normalized(requester.skills_want);
  const requesterInterests = normalized(requester.interests);
  return profiles
    .filter(
      (candidate) =>
        candidate.user_id !== requester.user_id && candidate.team_status !== 'finalized',
    )
    .map((candidate) => {
      const skillsForRequester = overlap(normalized(candidate.skills_have), requesterWants);
      const skillsForCandidate = overlap(requesterSkills, normalized(candidate.skills_want));
      const sharedInterests = overlap(requesterInterests, normalized(candidate.interests));
      const score = Math.min(
        98,
        58 +
          skillsForRequester.length * 14 +
          skillsForCandidate.length * 10 +
          sharedInterests.length * 6,
      );
      const reason = skillsForRequester.length
        ? `${candidate.name} brings ${skillsForRequester.slice(0, 2).join(' and ')}, which complements the skills you want.`
        : sharedInterests.length
          ? `You both care about ${sharedInterests.slice(0, 2).join(' and ')}, giving you a strong starting point.`
          : `${candidate.name}'s ${candidate.skills_have.slice(0, 2).join(' and ')} experience adds useful range to your team.`;
      return {
        user_id: candidate.user_id,
        name: candidate.name,
        score,
        reason,
        team_status: candidate.team_status,
        skills: candidate.skills_have.slice(0, 4),
      } satisfies Recommendation;
    })
    .sort((first, second) => second.score - first.score || first.name.localeCompare(second.name))
    .slice(0, 5);
}
export async function getRecommendations(
  identity: ParticipantIdentity,
  profile?: Profile | null,
  groups: RecommenderGroup[] = [],
) {
  if (USE_PREVIEW_DATA) {
    if (!profile) throw new ApiError('Complete your profile before requesting matches.', 400);
    const profiles = [
      profile,
      ...PREVIEW_PARTICIPANTS.filter((candidate) => candidate.user_id !== profile.user_id),
    ];
    try {
      const { data, error } = await bilt.functions.invoke<RecommenderResponse>(
        'hackmatch-recommender',
        {
          body: {
            requesting_user_id: profile.user_id,
            profiles,
            groups,
            top_n: 5,
            provider_access_token: identity.accessToken,
          },
        },
      );
      if (!error && data?.recommendations) return data.recommendations;
    } catch {
      // Preview matching remains available if the optional recommender function is unavailable.
    }
    return getPreviewRecommendations(profile, profiles);
  }
  const result = await request<
    Recommendation[] | { data?: Recommendation[]; recommendations?: Recommendation[] }
  >(`/recommendations/${encodeURIComponent(identity.userId)}`, {}, identity.accessToken);
  return Array.isArray(result) ? result : asArray(result.recommendations ?? result.data);
}
export function sendTeamInvite(
  identity: ParticipantIdentity,
  toUserId: string,
  note: string | null = null,
) {
  return request<TeamRequest | { invite: TeamRequest }>(
    '/invite',
    {
      method: 'POST',
      body: JSON.stringify({
        from_user_id: identity.userId,
        to_user_id: toUserId,
        note: note?.trim() || null,
      }),
    },
    identity.accessToken,
  ).then((result) => ('invite' in result ? result.invite : result));
}
export async function getTeamRequests(identity: ParticipantIdentity) {
  const result = await request<
    TeamRequest[] | { data?: TeamRequest[]; invitations?: TeamRequest[]; requests?: TeamRequest[] }
  >(`/invites?user_id=${encodeURIComponent(identity.userId)}`, {}, identity.accessToken);
  return Array.isArray(result)
    ? result
    : asArray(result.requests ?? result.invitations ?? result.data);
}
export function respondToTeamRequest(
  identity: ParticipantIdentity,
  inviteId: string,
  accept: boolean,
) {
  return request<{ status: string }>(
    `/invite/${encodeURIComponent(inviteId)}/respond`,
    { method: 'POST', body: JSON.stringify({ accept }) },
    identity.accessToken,
  );
}
export async function getInviteMessages(identity: ParticipantIdentity, inviteId: string) {
  const result = await request<
    ChannelMessage[] | { data?: ChannelMessage[]; messages?: ChannelMessage[] }
  >(`/invite/${encodeURIComponent(inviteId)}/messages`, {}, identity.accessToken);
  return Array.isArray(result) ? result : asArray(result.messages ?? result.data);
}
export function postInviteMessage(identity: ParticipantIdentity, inviteId: string, body: string) {
  return request<ChannelMessage>(
    `/invite/${encodeURIComponent(inviteId)}/messages`,
    { method: 'POST', body: JSON.stringify({ user_id: identity.userId, body }) },
    identity.accessToken,
  );
}
export function createGroup(identity: ParticipantIdentity, name: string) {
  return request<Group>(
    '/group/create',
    { method: 'POST', body: JSON.stringify({ user_id: identity.userId, name }) },
    identity.accessToken,
  );
}
export async function searchParticipants(identity: ParticipantIdentity, query: string) {
  if (USE_PREVIEW_DATA) return searchPreviewParticipants(query, identity.userId);
  const result = await request<
    | ParticipantSearchResult[]
    | { data?: ParticipantSearchResult[]; users?: ParticipantSearchResult[] }
  >(`/users/search?q=${encodeURIComponent(query)}`, {}, identity.accessToken);
  return Array.isArray(result) ? result : asArray(result.users ?? result.data);
}
export function inviteToGroup(identity: ParticipantIdentity, groupId: string, toUserId: string) {
  return request<{ status: string }>(
    '/group/invite',
    { method: 'POST', body: JSON.stringify({ group_id: groupId, to_user_id: toUserId }) },
    identity.accessToken,
  );
}
export async function getGroupInvites(identity: ParticipantIdentity) {
  const result = await request<
    GroupInvite[] | { data?: GroupInvite[]; invitations?: GroupInvite[] }
  >(`/group/invites?user_id=${encodeURIComponent(identity.userId)}`, {}, identity.accessToken);
  return Array.isArray(result) ? result : asArray(result.invitations ?? result.data);
}
export function respondToGroupInvite(
  identity: ParticipantIdentity,
  inviteId: string,
  accept: boolean,
) {
  return request<{ status: string }>(
    `/group/invite/${encodeURIComponent(inviteId)}/respond`,
    { method: 'POST', body: JSON.stringify({ accept }) },
    identity.accessToken,
  );
}
export function getAdminAnalytics() {
  return request<AdminAnalytics>('/admin/analytics');
}
export async function getAdminTeamsData(): Promise<AdminTeamsData> {
  const result = await request<
    AdminTeamSummary[] | (Partial<AdminTeamsData> & { data?: AdminTeamSummary[] })
  >('/admin/teams');
  if (Array.isArray(result)) return { teams: result, no_group_participants: [] };
  return {
    teams: asArray(result.teams ?? result.data),
    no_group_participants: asArray(result.no_group_participants),
  };
}
export async function getAdminTeams() {
  return (await getAdminTeamsData()).teams;
}
export async function getAdminTeamCounts(
  teams: AdminTeamSummary[],
  noGroupFallback = 0,
): Promise<AdminTeamCounts> {
  try {
    return await request<AdminTeamCounts>('/admin/teams/summary');
  } catch (caught) {
    if (!(caught instanceof ApiError) || (caught.status !== 404 && caught.status !== 0))
      throw caught;
    return {
      no_group: noGroupFallback,
      partial: teams.filter((team) => team.member_count < (team.capacity ?? 5)).length,
      complete: teams.filter((team) => team.member_count >= (team.capacity ?? 5)).length,
    };
  }
}
export async function getAdminChannels() {
  const result = await request<Channel[] | { data?: Channel[]; channels?: Channel[] }>(
    '/admin/channels',
  );
  return Array.isArray(result) ? result : asArray(result.channels ?? result.data);
}
export function createAdminChannel(values: CreateChannelValues) {
  return request<Channel>('/channels', {
    method: 'POST',
    body: JSON.stringify({ ...values, type: 'admin' }),
  });
}
export async function getChannelMessages(identity: ParticipantIdentity, channelId: string) {
  if (USE_PREVIEW_DATA) return [...(MESSAGES[channelId] ?? [])];
  const result = await request<
    ChannelMessage[] | { data?: ChannelMessage[]; messages?: ChannelMessage[] }
  >(`/channels/${encodeURIComponent(channelId)}/messages`, {}, identity.accessToken);
  return Array.isArray(result) ? result : asArray(result.messages ?? result.data);
}
export function postChannelMessage(identity: ParticipantIdentity, channelId: string, body: string) {
  if (USE_PREVIEW_DATA) {
    const message = {
      id: `preview-${Date.now()}`,
      channel_id: channelId,
      user_id: identity.userId,
      author_name: identity.name,
      body,
      created_at: new Date().toISOString(),
    };
    (MESSAGES[channelId] ??= []).push(message);
    return Promise.resolve(message);
  }
  return request<ChannelMessage>(
    `/channels/${encodeURIComponent(channelId)}/messages`,
    { method: 'POST', body: JSON.stringify({ user_id: identity.userId, body }) },
    identity.accessToken,
  );
}
export function getParticipantProfile(identity: ParticipantIdentity | null, userId: string) {
  if (USE_PREVIEW_DATA) {
    const preview = PREVIEW_PARTICIPANTS.find((participant) => participant.user_id === userId);
    if (preview) return Promise.resolve(preview);
  }
  return request<Profile>(`/profiles/${encodeURIComponent(userId)}`, {}, identity?.accessToken);
}
export async function getChannelMembers(
  identity: ParticipantIdentity,
  channelId: string,
): Promise<GroupMember[]> {
  if (USE_PREVIEW_DATA) {
    return PREVIEW_PARTICIPANTS.map((participant) => ({
      user_id: participant.user_id,
      name: participant.name,
      email: participant.email,
      team_status: participant.team_status,
    }));
  }
  const result = await request<GroupMember[] | { data?: GroupMember[]; members?: GroupMember[] }>(
    `/channels/${encodeURIComponent(channelId)}/members`,
    {},
    identity.accessToken,
  );
  return Array.isArray(result) ? result : asArray(result.members ?? result.data);
}

export async function getGroupMembers(
  identity: ParticipantIdentity | null,
  groupId: string,
): Promise<GroupMember[]> {
  if (USE_PREVIEW_DATA && groupId === GROUP_ID && identity)
    return [
      {
        user_id: identity.userId,
        name: identity.name,
        email: identity.email,
        role: 'Team member',
        team_status: 'forming',
      },
      ...PREVIEW_PARTICIPANTS.slice(0, 3).map((p) => ({
        user_id: p.user_id,
        name: p.name,
        email: p.email,
        team_status: p.team_status,
      })),
    ];
  const result = await request<GroupMember[] | { data?: GroupMember[]; members?: GroupMember[] }>(
    `/groups/${encodeURIComponent(groupId)}/members`,
    {},
    identity?.accessToken,
  );
  return Array.isArray(result) ? result : asArray(result.members ?? result.data);
}
