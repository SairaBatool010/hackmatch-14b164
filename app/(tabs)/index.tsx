import { HomeDashboard } from '@/components/HomeDashboard';
import { ParticipantTabGuard } from '@/components/ParticipantTabGuard';
export default function HomeScreen() {
  return (
    <ParticipantTabGuard>
      <HomeDashboard />
    </ParticipantTabGuard>
  );
}
