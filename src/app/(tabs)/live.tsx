import { AppShell } from '@/components';
import {
	LiveActiveView,
	LiveIdleView,
	LiveWarmupView,
	useLiveSession,
} from '@/features/live';
import { shortSessionId } from '@/lib/formatSession';

export default function LiveRoute() {
	const live = useLiveSession();

	const subtitle =
		live.sessionId && live.phase !== 'idle'
			? `sess_${shortSessionId(live.sessionId)}`
			: undefined;

	return (
		<AppShell title="Live Monitor" subtitle={subtitle}>
			{live.phase === 'idle' || live.phase === 'connecting' ? (
				<LiveIdleView
					onMicPress={live.start}
					connectionStatus={live.connectionStatus}
					defaults={live.defaults}
					error={live.error}
					onClearError={live.clearError}
					busy={live.phase === 'connecting'}
				/>
			) : null}

			{live.phase === 'active' ? (
				<LiveActiveView
					sessionScore={live.sessionScore}
					chunkIdx={live.chunkIdx}
					label={live.label}
					chunkHistory={live.chunkHistory}
					framesSeen={live.framesSeen}
					lastRtf={live.lastRtf}
					lastLatencyMs={live.lastLatencyMs}
					error={live.error}
					onStop={live.stop}
					onClearError={live.clearError}
				/>
			) : null}

			{live.phase === 'warmup' ? (
				<LiveWarmupView
					bufferFillSamples={live.bufferFillSamples}
					bufferTargetSamples={live.bufferTargetSamples}
					error={live.error}
					onCancel={live.stop}
					onClearError={live.clearError}
				/>
			) : null}
		</AppShell>
	);
}
