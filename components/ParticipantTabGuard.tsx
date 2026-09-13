import type { PropsWithChildren } from 'react';
import { Redirect } from 'expo-router';
import { Spinner, Typography } from 'heroui-native';
import { View } from 'react-native';
import { ENABLE_ADMIN } from '@/lib/features';
import { useHackmatchStore } from '@/lib/hackmatch.store';

export function ParticipantTabGuard({ children }: PropsWithChildren) {
  const hydrated = useHackmatchStore((state) => state.hydrated);
  const appRole = useHackmatchStore((state) => state.appRole);
  const identity = useHackmatchStore((state) => state.identity);
  const profile = useHackmatchStore((state) => state.profile);
  if (!hydrated)
    return (
      <View className="bg-background flex-1 items-center justify-center gap-3">
        <Spinner size="lg" />
        <Typography.Paragraph color="muted">Opening HackMatch…</Typography.Paragraph>
      </View>
    );
  if (!appRole) return <Redirect href="/role" />;
  if (appRole === 'admin') return <Redirect href={ENABLE_ADMIN ? '/admin' : '/role'} />;
  if (!identity) return <Redirect href="/invite" />;
  if (!profile) return <Redirect href="/profile/setup" />;
  return children;
}
