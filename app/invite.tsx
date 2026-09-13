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
import { PREVIEW_ACCOUNTS } from '@/lib/hackmatch.preview';
import { useHackmatchStore } from '@/lib/hackmatch.store';
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
    const previewAccount = preview
      ? PREVIEW_ACCOUNTS.find((account) => account.code === code)
      : undefined;
    if (!/^\d{6}$/.test(code) || (preview && !previewAccount)) {
      setError(
        preview
          ? 'Enter the code for Maya or Leo shown above.'
          : 'Enter your 6-digit confirmation code.',
      );
      return;
    }
    if (!preview && !params.token) {
      setError('This invitation link is missing its token.');
      return;
    }
    setBusy(true);
    try {
      if (preview && previewAccount) {
        const { profile } = previewAccount;
        setRole('participant');
        setSession({ userId: profile.user_id, name: profile.name, email: profile.email }, profile);
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
            {preview ? (
              <View className="gap-3">
                <View className="flex-row items-center gap-2">
                  <KeyRound size={18} />
                  <Typography className="font-medium">Choose a test participant</Typography>
                </View>
                {PREVIEW_ACCOUNTS.map((account) => (
                  <Button
                    key={account.code}
                    variant={code === account.code ? 'primary' : 'secondary'}
                    className="h-auto justify-between py-3"
                    onPress={() => {
                      setCode(account.code);
                      setError(null);
                    }}
                  >
                    <Button.Label>{account.profile.name}</Button.Label>
                    <Button.Label>{account.code}</Button.Label>
                  </Button>
                ))}
              </View>
            ) : null}
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
              <Description>
                {preview
                  ? 'Use 111111 for Maya or 222222 for Leo. Switch accounts from Change role on Home.'
                  : 'Use the code from your invitation.'}
              </Description>
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
