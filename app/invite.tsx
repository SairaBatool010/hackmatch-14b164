import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Button,
  Card,
  Description,
  FieldError,
  Input,
  Label,
  Spinner,
  TextField,
  Typography,
} from 'heroui-native';
import { KeyRound, Users } from 'lucide-react-native';
import { AppShell } from '@/components/AppShell';
import { confirmInvitation } from '@/lib/hackmatch.api';
import { useHackmatchStore } from '@/lib/hackmatch.store';
const CODE = '123456';
const IDENTITY = {
  userId: 'preview-participant',
  name: 'Preview Participant',
  email: 'participant@example.com',
};
const PROFILE = {
  user_id: IDENTITY.userId,
  name: IDENTITY.name,
  email: IDENTITY.email,
  skills_have: ['Product design', 'React Native'],
  skills_want: ['Backend development', 'AI'],
  interests: ['Developer tools'],
  bio: 'Exploring HackMatch with the participant preview.',
  roles_wanted: ['Product builder'],
  availability: 'full_hackathon' as const,
};
export default function InviteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string; preview?: string }>();
  const preview = params.preview === '1';
  const setSession = useHackmatchStore((s) => s.setSession);
  const setRole = useHackmatchStore((s) => s.setAppRole);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!/^\d{6}$/.test(code) || (preview && code !== CODE)) {
      setError('Enter the 6-digit confirmation code shown above.');
      return;
    }
    if (!preview && !params.token) {
      setError('This invitation link is missing its token.');
      return;
    }
    setBusy(true);
    try {
      if (preview) {
        setRole('participant');
        setSession(IDENTITY, PROFILE);
        router.replace('/(tabs)');
        return;
      }
      const result = await confirmInvitation(params.token!, code);
      setRole('participant');
      setSession(result.identity, result.profile);
      router.replace(result.profile ? '/(tabs)' : '/profile/setup');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'We could not confirm this invitation.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <AppShell width="narrow">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="mx-auto w-full max-w-xl gap-6 pt-12">
          <View className="bg-accent-soft h-14 w-14 items-center justify-center rounded-2xl">
            <Users className="text-accent" size={28} />
          </View>
          <Typography.Heading className="text-4xl">Welcome to HackMatch</Typography.Heading>
          <Card className="gap-5 p-6">
            <View className="bg-accent-soft gap-2 rounded-xl p-4">
              <View className="flex-row gap-2">
                <KeyRound size={18} />
                <Typography className="font-medium">Temporary confirmation code</Typography>
              </View>
              <Typography.Heading className="text-accent text-3xl tracking-[8px]">
                {CODE}
              </Typography.Heading>
            </View>
            <TextField isRequired isInvalid={Boolean(error)}>
              <Label>Confirmation code</Label>
              <Input
                value={code}
                onChangeText={(v) => {
                  setCode(v.replace(/\D/g, '').slice(0, 6));
                  setError(null);
                }}
                keyboardType="number-pad"
                maxLength={6}
              />
              <Description>Use the code shown above for preview access.</Description>
              <FieldError>{error}</FieldError>
            </TextField>
            <Button size="lg" isDisabled={busy || code.length !== 6} onPress={() => void submit()}>
              {busy ? <Spinner size="sm" /> : <Button.Label>Confirm invitation</Button.Label>}
            </Button>
          </Card>
        </View>
      </KeyboardAvoidingView>
    </AppShell>
  );
}
