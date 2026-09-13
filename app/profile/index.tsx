import { Redirect, useRouter } from 'expo-router';
import { Button, Card, Chip, Typography } from 'heroui-native';
import { ArrowLeft, Mail, Pencil } from 'lucide-react-native';
import { View } from 'react-native';
import { AppShell } from '@/components/AppShell';
import { TeamStatusDot } from '@/components/TeamStatusDot';
import { useHackmatchStore } from '@/lib/hackmatch.store';
import { goBackOrReplace } from '@/lib/navigation';
export default function Profile() {
  const router = useRouter();
  const identity = useHackmatchStore((s) => s.identity);
  const p = useHackmatchStore((s) => s.profile);
  if (!identity) return <Redirect href="/invite" />;
  if (!p) return <Redirect href="/profile/setup" />;
  const sections = [
    ['Skills I bring', p.skills_have],
    ['Skills I want', p.skills_want],
    ['Interests', p.interests],
    ['Roles wanted', p.roles_wanted],
  ] as const;
  return (
    <AppShell>
      <View className="gap-5">
        <View className="flex-row justify-between">
          <Button isIconOnly variant="ghost" onPress={() => goBackOrReplace('/(tabs)')}>
            <ArrowLeft size={20} />
          </Button>
          <Button onPress={() => router.push('/profile/edit')}>
            <Pencil size={16} />
            <Button.Label>Edit profile</Button.Label>
          </Button>
        </View>
        <Card className="gap-5 p-6">
          <View className="flex-row items-center gap-4">
            <View className="bg-accent-soft relative h-16 w-16 items-center justify-center rounded-full">
              <Typography className="text-xl font-bold">{p.name[0]}</Typography>
              <TeamStatusDot status={p.team_status} />
            </View>
            <View>
              <Typography.Heading className="text-2xl">{p.name}</Typography.Heading>
              <View className="flex-row gap-2">
                <Mail size={15} />
                <Typography.Paragraph color="muted">{p.email}</Typography.Paragraph>
              </View>
            </View>
          </View>
          <Typography.Paragraph color="muted">{p.bio}</Typography.Paragraph>
        </Card>
        <Card className="gap-6 p-6">
          {sections.map(([title, items]) => (
            <View key={title} className="gap-3">
              <Typography className="font-semibold">{title}</Typography>
              <View className="flex-row flex-wrap gap-2">
                {items.map((x) => (
                  <Chip key={x} variant="secondary">
                    <Chip.Label>{x}</Chip.Label>
                  </Chip>
                ))}
              </View>
            </View>
          ))}
        </Card>
      </View>
    </AppShell>
  );
}
