import { useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { AppShell } from '@/components/AppShell';
import { ProfileForm } from '@/components/ProfileForm';
import { createProfile } from '@/lib/hackmatch.api';
import { useProfileFormSchema } from '@/hooks/useProfileFormSchema';
import { useHackmatchStore } from '@/lib/hackmatch.store';
import type { ProfileValues } from '@/lib/hackmatch.types';
export default function Setup() {
  const router = useRouter();
  const identity = useHackmatchStore((s) => s.identity);
  const setProfile = useHackmatchStore((s) => s.setProfile);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { schema } = useProfileFormSchema(identity);
  if (!identity) return <Redirect href="/invite" />;
  const submit = async (values: ProfileValues) => {
    setBusy(true);
    try {
      const p = await createProfile(identity, values);
      setProfile({
        ...p,
        ...values,
        user_id: p.user_id ?? identity.userId,
        name: p.name ?? identity.name,
        email: p.email ?? identity.email,
      });
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Profile could not be saved.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <AppShell
      width="narrow"
      eyebrow="Profile setup"
      title="What makes a great team for you?"
      description="Tell us what you bring and what you hope to find."
    >
      <ProfileForm
        identity={identity}
        schema={schema}
        submitLabel="Find my teammates"
        isSubmitting={busy}
        submitError={error}
        onSubmit={submit}
      />
    </AppShell>
  );
}
