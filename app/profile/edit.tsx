import { useState } from 'react';
import { Redirect } from 'expo-router';
import { AppShell } from '@/components/AppShell';
import { ProfileForm } from '@/components/ProfileForm';
import { updateProfile } from '@/lib/hackmatch.api';
import { useHackmatchStore } from '@/lib/hackmatch.store';
import type { ProfileValues } from '@/lib/hackmatch.types';
import { goBackOrReplace } from '@/lib/navigation';
export default function Edit() {
  const identity = useHackmatchStore((s) => s.identity);
  const profile = useHackmatchStore((s) => s.profile);
  const setProfile = useHackmatchStore((s) => s.setProfile);
  const refresh = useHackmatchStore((s) => s.refreshRecommendations);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!identity) return <Redirect href="/invite" />;
  if (!profile) return <Redirect href="/profile/setup" />;
  const submit = async (values: ProfileValues) => {
    setBusy(true);
    try {
      const p = await updateProfile(identity, values);
      setProfile({
        ...p,
        ...values,
        user_id: p.user_id ?? identity.userId,
        name: p.name ?? identity.name,
        email: p.email ?? identity.email,
      });
      refresh();
      goBackOrReplace('/profile');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Changes could not be saved.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <AppShell width="narrow" eyebrow="Profile" title="Refine what you’re looking for">
      <ProfileForm
        identity={identity}
        initialValues={profile}
        submitLabel="Save and refresh matches"
        isSubmitting={busy}
        submitError={error}
        onSubmit={submit}
      />
    </AppShell>
  );
}
