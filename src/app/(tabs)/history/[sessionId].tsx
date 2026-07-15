import { useLocalSearchParams } from 'expo-router';
import { AppShell } from '@/components/filterpass';
import { ReportScreen } from '@/features/history/ReportScreen';

export default function ReportRoute() {
	const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
	const shortId =
		typeof sessionId === 'string' ? sessionId.slice(0, 8) : 'report';

	return (
		<AppShell title="Session Report" subtitle={shortId}>
			<ReportScreen />
		</AppShell>
	);
}
