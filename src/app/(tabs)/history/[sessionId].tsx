import { useLocalSearchParams } from 'expo-router';
import { AppShell } from '@/components';
import { parseSessionId } from '@/api';
import { ReportScreen } from '@/features/history';

export default function ReportRoute() {
	const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
	const raw = typeof sessionId === 'string' ? sessionId : undefined;
	const id = parseSessionId(raw);
	const shortId = id?.slice(0, 8) ?? (raw ? 'invalid' : 'report');

	return (
		<AppShell title="Session Report" subtitle={shortId}>
			<ReportScreen sessionId={raw} />
		</AppShell>
	);
}
