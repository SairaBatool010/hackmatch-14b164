import { View } from 'react-native';
import { Card, Chip, Typography } from 'heroui-native';
import { Mail, Users } from 'lucide-react-native';
import { TeamRequestActions } from '@/components/TeamRequestActions';
import { TeamStatusDot } from '@/components/TeamStatusDot';
import type { Profile, ProfileFormSchema } from '@/lib/hackmatch.types';

export function ProfileDetails({
  profile,
  canRequest = false,
  schema,
  teamMemberCount,
}: {
  profile: Profile;
  canRequest?: boolean;
  schema?: ProfileFormSchema;
  teamMemberCount?: number;
}) {
  const sections = [
    ['Skills I bring', profile.skills_have],
    ['Skills I want', profile.skills_want],
    ['Interests', profile.interests],
    ['Roles wanted', profile.roles_wanted],
  ] as const;
  const customEntries = Object.entries(profile.custom_fields ?? {}).filter(([, answer]) =>
    Array.isArray(answer) ? answer.length : Boolean(answer),
  );
  const customLabel = (key: string) =>
    schema?.questions.find((question) => question.key === key)?.label ??
    key.replace(/^custom-/, '').replaceAll('-', ' ');
  return (
    <View className="gap-5">
      <Card className="gap-5 p-6">
        <View className="flex-row items-center gap-4">
          <View className="bg-accent-soft relative h-16 w-16 items-center justify-center rounded-full">
            <Typography className="text-xl font-bold">{profile.name[0]}</Typography>
            <TeamStatusDot status={profile.team_status} />
          </View>
          <View className="flex-1">
            <Typography.Heading className="text-2xl">{profile.name}</Typography.Heading>
            {profile.email ? (
              <View className="flex-row items-center gap-2">
                <Mail size={15} />
                <Typography.Paragraph color="muted">{profile.email}</Typography.Paragraph>
              </View>
            ) : null}
          </View>
        </View>
        <Typography.Paragraph color="muted">{profile.bio}</Typography.Paragraph>
        {profile.group_id && teamMemberCount !== undefined ? (
          <View className="bg-default/60 flex-row items-center gap-2 rounded-xl px-3 py-2">
            <Users size={16} />
            <Typography className="font-medium">
              {teamMemberCount} {teamMemberCount === 1 ? 'member' : 'members'} in their team
            </Typography>
          </View>
        ) : null}
      </Card>
      <Card className="gap-6 p-6">
        {sections.map(([title, items]) => (
          <View key={title} className="gap-3">
            <Typography className="font-semibold">{title}</Typography>
            <View className="flex-row flex-wrap gap-2">
              {items.map((item) => (
                <Chip key={item} variant="secondary">
                  <Chip.Label>{item}</Chip.Label>
                </Chip>
              ))}
            </View>
          </View>
        ))}
      </Card>
      {customEntries.length ? (
        <Card className="gap-5 p-6">
          <Typography.Heading>More about {profile.name}</Typography.Heading>
          {customEntries.map(([key, answer]) => (
            <View key={key} className="gap-1">
              <Typography className="font-semibold">{customLabel(key)}</Typography>
              <Typography color="muted">
                {Array.isArray(answer) ? answer.join(', ') : answer}
              </Typography>
            </View>
          ))}
        </Card>
      ) : null}
      {canRequest ? (
        <TeamRequestActions recipientId={profile.user_id} recipientName={profile.name} />
      ) : null}
    </View>
  );
}
