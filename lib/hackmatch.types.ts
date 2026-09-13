export type Availability = 'full_hackathon' | 'partial' | 'remote_only';
export type ChannelType = 'admin' | 'find_team' | 'my_group';
export type InviteStatus = 'none' | 'pending' | 'sent' | 'accepted' | 'declined';
export type GroupInviteStatus = 'pending' | 'accepted' | 'confirmed' | 'declined';
export type AppRole = 'admin' | 'participant';
export type TeamStatus = 'available' | 'forming' | 'finalized';
export type ProfileQuestionType = 'short_text' | 'long_text' | 'multi_select' | 'single_select';
export type ProfileAnswer = string | string[] | null;

export interface ProfileQuestion {
  id: string;
  key: string;
  label: string;
  type: ProfileQuestionType;
  required?: boolean;
  options?: string[];
  baseline?: boolean;
}

export interface ProfileFormSchema {
  questions: ProfileQuestion[];
}

export interface ParticipantIdentity {
  userId: string;
  name: string;
  email: string;
  accessToken?: string;
}
export interface ProfileValues {
  skills_have: string[];
  skills_want: string[];
  interests: string[];
  bio: string;
  roles_wanted: string[];
  availability: Availability;
  group_id?: string | null;
  custom_fields?: Record<string, ProfileAnswer>;
}
export interface Profile extends ProfileValues {
  user_id: string;
  name: string;
  email: string;
  group_id?: string | null;
  team_status?: TeamStatus;
  member_count?: number;
}
export interface RecommenderGroup {
  id: string;
  leader_id: string;
  member_ids: string[];
}
export interface RecommendationScoreComponents {
  semantic_similarity: number;
  skill_complementarity: number;
  a_gets: number;
  b_gets: number;
  requester_gets_skills: string[];
  candidate_gets_skills: string[];
}
export interface Channel {
  id: string;
  name: string;
  description: string;
  type: ChannelType;
  allows_posting?: boolean;
  group_id?: string;
}
export interface Recommendation {
  user_id: string;
  name: string;
  skills: string[];
  shared_skills?: string[];
  complementary_skills?: string[];
  reason: string;
  invite_status?: InviteStatus;
  team_status?: TeamStatus;
  score?: number;
  score_components?: RecommendationScoreComponents;
  recommendation_context?: 'solo' | 'group';
  interests?: string[];
  roles_wanted?: string[];
  bio?: string;
}
export interface GroupInvite {
  id: string;
  group_id?: string;
  group_name?: string;
  from_user_id?: string;
  to_user_id?: string;
  from_name?: string;
  to_name?: string;
  note?: string | null;
  status?: InviteStatus | GroupInviteStatus;
  direction?: 'incoming' | 'outgoing';
  created_at?: string;
}
export interface GroupInviteResponse {
  status: string;
  group_id?: string;
  channel?: Channel;
}
export interface TeamRequest extends GroupInvite {
  from_user_id: string;
  to_user_id: string;
}
export interface InviteConflict {
  error: 'sender_already_grouped';
  group_name?: string;
  group_id?: string;
  open_spots: number;
}
export interface Group {
  id: string;
  code: string;
  name?: string;
  leader_user_id?: string;
}
export interface ParticipantSearchResult {
  id: string;
  name: string;
  email: string;
  skills_have?: string[];
  team_status?: TeamStatus;
}
export interface GroupMember {
  user_id: string;
  name: string;
  email?: string;
  role?: string;
  team_status?: TeamStatus;
  bio?: string;
  skills_have?: string[];
  skills_want?: string[];
  interests?: string[];
  roles_wanted?: string[];
}
export interface ChannelMessage {
  id: string;
  channel_id: string;
  user_id: string;
  author_name: string;
  body: string;
  created_at: string;
}
export interface AdminAnalytics {
  total_participants: number;
  total_teams: number;
  complete_teams: number;
  participants_seeking_team: number;
  active_channels: number;
}
export interface AdminTeamSummary {
  id: string;
  name: string;
  member_count: number;
  capacity?: number;
  status?: 'forming' | 'complete';
}
export interface AdminTeamsData {
  teams: AdminTeamSummary[];
  no_group_participants: GroupMember[];
}
export interface AdminTeamCounts {
  no_group: number;
  partial: number;
  complete: number;
}
export interface CreateChannelValues {
  name: string;
  description: string;
  allows_posting: boolean;
}
