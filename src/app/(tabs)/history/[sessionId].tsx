import { useLocalSearchParams } from 'expo-router';
import { AppShell } from '@/components';
import { ReportScreen } from '@/features/history';

export default function ReportRoute() {
	const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
	const id = typeof sessionId === 'string' ? sessionId : undefined;
	const shortId = id?.slice(0, 8) ?? 'report';

	return (
		<AppShell title="Session Report" subtitle={shortId}>
			<ReportScreen sessionId={id} />
		</AppShell>
	);
}
