import type { ParticipantSearchResult, Profile } from '@/lib/hackmatch.types';

const SEEDS = [
  ['Maya Chen', 'Product design', 'React Native'],
  ['Leo Martins', 'Mobile development', 'Expo'],
  ['Amara Okafor', 'Backend development', 'PostgreSQL'],
  ['Aisha Rahman', 'Machine learning', 'Python'],
  ['Daniel Kim', 'Security', 'OAuth'],
  ['Grace Liu', 'Data visualization', 'SQL'],
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
}));
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
