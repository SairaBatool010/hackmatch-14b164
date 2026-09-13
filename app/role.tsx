import { useRouter } from 'expo-router';
import { Button, Card, Chip, Typography } from 'heroui-native';
import { ArrowRight, ShieldCheck, UserRound } from 'lucide-react-native';
import { View } from 'react-native';
import { AppShell } from '@/components/AppShell';
import { ENABLE_ADMIN } from '@/lib/features';
import { useHackmatchStore } from '@/lib/hackmatch.store';
import type { AppRole } from '@/lib/hackmatch.types';
function Option({
  role,
  title,
  children,
  choose,
}: {
  role: AppRole;
  title: string;
  children: string;
  choose: (r: AppRole) => void;
}) {
  const Icon = role === 'admin' ? ShieldCheck : UserRound;
  return (
    <Card className="flex-1 gap-5 p-6">
      <View className="flex-row justify-between">
        <View className="bg-accent-soft h-12 w-12 items-center justify-center rounded-2xl">
          <Icon className="text-accent" size={24} />
        </View>
        {role === 'admin' ? (
          <Chip color="warning" variant="secondary">
            <Chip.Label>Preview access</Chip.Label>
          </Chip>
        ) : null}
      </View>
      <Typography.Heading className="text-2xl">{title}</Typography.Heading>
      <Typography.Paragraph color="muted" className="flex-1 leading-6">
        {children}
      </Typography.Paragraph>
      <Button size="lg" onPress={() => choose(role)}>
        <Button.Label>Continue as {title.toLowerCase()}</Button.Label>
        <ArrowRight size={18} />
      </Button>
    </Card>
  );
}
export default function RoleScreen() {
  const router = useRouter();
  const setRole = useHackmatchStore((s) => s.setAppRole);
  const choose = (role: AppRole) => {
    setRole(role);
    router.replace(role === 'admin' ? '/admin' : { pathname: '/invite', params: { preview: '1' } });
  };
  return (
    <AppShell width="wide">
      <View className="mx-auto w-full max-w-4xl gap-8 pt-12">
        <View className="items-center gap-3">
          <Typography.Paragraph className="text-accent font-semibold uppercase">
            talash access
          </Typography.Paragraph>
          <Typography.Heading className="text-center text-4xl">
            Choose how you want to enter
          </Typography.Heading>
        </View>
        <View className="gap-4 md:flex-row">
          <Option role="participant" title="Participant" choose={choose}>
            Confirm your invitation, create your matching profile, and discover teammates.
          </Option>
          {ENABLE_ADMIN ? (
            <Option role="admin" title="Admin" choose={choose}>
              Monitor participation, team formation, and shared hackathon channels.
            </Option>
          ) : null}
        </View>
      </View>
    </AppShell>
  );
}
