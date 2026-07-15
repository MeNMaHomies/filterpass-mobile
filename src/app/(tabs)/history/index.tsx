import { AppShell } from '@/components/filterpass';
import { HistoryScreen } from '@/features/history/HistoryScreen';

export default function HistoryIndexRoute() {
  return (
    <AppShell title="History">
      <HistoryScreen />
    </AppShell>
  );
}
