import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { Button, Card, Spinner, Typography } from 'heroui-native';
import { ArrowLeft } from 'lucide-react-native';
import { AppShell } from '@/components/AppShell';
import { ProfileDetails } from '@/components/ProfileDetails';
import { useProfileFormSchema } from '@/hooks/useProfileFormSchema';
import { getParticipantProfile } from '@/lib/hackmatch.api';
import { useHackmatchStore } from '@/lib/hackmatch.store';
import type { Profile } from '@/lib/hackmatch.types';
import { goBackOrReplace } from '@/lib/navigation';

export default function MemberProfile() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const identity = useHackmatchStore((state) => state.identity);
  const role = useHackmatchStore((state) => state.appRole);
  const ownProfile = useHackmatchStore((state) => state.profile);
  const { schema } = useProfileFormSchema(identity);
  const [profile, setProfile] = useState<Profile | null>(
    ownProfile?.user_id === id ? ownProfile : null,
  );
  const [loading, setLoading] = useState(!profile);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setProfile(await getParticipantProfile(identity, id));
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'This profile could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [id, identity]);

  useEffect(() => {
    const initialLoad = profile ? null : setTimeout(() => void load(), 0);
    return () => {
      if (initialLoad !== null) clearTimeout(initialLoad);
    };
  }, [load, profile]);
  if (!identity && role !== 'admin') return <Redirect href="/invite" />;

  return (
    <AppShell>
      <View className="mb-5 flex-row items-center gap-3">
        <Button isIconOnly variant="ghost" onPress={() => goBackOrReplace('/(tabs)')}>
          <ArrowLeft size={20} />
        </Button>
        <Typography.Heading>Participant profile</Typography.Heading>
      </View>
      {loading ? (
        <Card className="items-center py-12">
          <Spinner />
        </Card>
      ) : null}
      {error ? (
        <Card className="bg-danger-soft gap-3 p-4">
          <Typography>{error}</Typography>
          <Button onPress={() => void load()}>
            <Button.Label>Try again</Button.Label>
          </Button>
        </Card>
      ) : null}
      {profile ? (
        <ProfileDetails
          profile={profile}
          schema={schema}
          canRequest={Boolean(identity && identity.userId !== profile.user_id)}
        />
      ) : null}
    </AppShell>
  );
}
