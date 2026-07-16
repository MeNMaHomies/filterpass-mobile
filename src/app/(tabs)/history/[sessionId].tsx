import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppShell } from '@/components';
import { parseSessionId } from '@/api';
import { ReportScreen } from '@/features/history';

export default function ReportRoute() {
	const router = useRouter();
	const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
	const raw = typeof sessionId === 'string' ? sessionId : undefined;
	const id = parseSessionId(raw);
	const shortId = id?.slice(0, 8) ?? (raw ? 'invalid' : 'report');

	return (
		<AppShell
			title="Session Report"
			subtitle={shortId}
			onBack={() => {
				if (router.canGoBack()) {
					router.back();
				} else {
					router.replace('/history');
				}
			}}
		>
			<ReportScreen sessionId={raw} />
		</AppShell>
	);
}
