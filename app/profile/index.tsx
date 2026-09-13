import { Redirect, useRouter } from 'expo-router';
import { Button } from 'heroui-native';
import { ArrowLeft, Pencil } from 'lucide-react-native';
import { View } from 'react-native';
import { AppShell } from '@/components/AppShell';
import { ProfileDetails } from '@/components/ProfileDetails';
import { useProfileFormSchema } from '@/hooks/useProfileFormSchema';
import { useHackmatchStore } from '@/lib/hackmatch.store';
import { goBackOrReplace } from '@/lib/navigation';

export default function Profile() {
  const router = useRouter();
  const identity = useHackmatchStore((state) => state.identity);
  const profile = useHackmatchStore((state) => state.profile);
  const { schema } = useProfileFormSchema(identity);
  if (!identity) return <Redirect href="/invite" />;
  if (!profile) return <Redirect href="/profile/setup" />;
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
        <ProfileDetails profile={profile} schema={schema} />
      </View>
    </AppShell>
  );
}
