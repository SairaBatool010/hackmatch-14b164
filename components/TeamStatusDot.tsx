import { View } from 'react-native';
import type { TeamStatus } from '@/lib/hackmatch.types';
const STATUS_DETAILS: Record<TeamStatus, { className: string; label: string }> = {
  available: { className: 'bg-success', label: 'Available — not in a team' },
  forming: { className: 'bg-warning', label: 'Team forming — still looking for members' },
  finalized: { className: 'bg-danger', label: 'Team finalized — no spaces available' },
};
export function TeamStatusDot({ status }: { status?: TeamStatus }) {
  const details = status ? STATUS_DETAILS[status] : undefined;
  if (!details) return null;
  return (
    <View
      accessible
      accessibilityLabel={details.label}
      className={`border-surface absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full border-2 ${details.className}`}
    />
  );
}
