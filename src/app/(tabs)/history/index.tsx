import { AppShell } from '@/components';
import { HistoryScreen } from '@/features/history';

export default function HistoryIndexRoute() {
	return (
		<AppShell title="History">
			<HistoryScreen />
		</AppShell>
	);
}
