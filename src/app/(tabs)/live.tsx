import { useCallback, useMemo, useRef } from 'react';
import { AppShell, ConfirmSheet, MotiPhase } from '@/components';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import {
	LiveActiveView,
	LiveIdleView,
	LiveWarmupView,
	useLiveSession,
} from '@/features/live';
import { shortSessionId } from '@/lib/formatSession';

export default function LiveRoute() {
	const live = useLiveSession();
	const stopSheetRef = useRef<BottomSheetModal>(null);

	const subtitle =
		live.sessionId && live.phase !== 'idle'
			? `sess_${shortSessionId(live.sessionId)}`
			: undefined;

	const phaseKey =
		live.phase === 'connecting'
			? 'idle'
			: live.phase === 'idle'
				? 'idle'
				: live.phase;

	const requestStop = useCallback(() => {
		stopSheetRef.current?.present();
	}, []);

	const confirmStop = useCallback(() => {
		void live.stop();
	}, [live]);

	const phaseView = useMemo(() => {
		if (live.phase === 'idle' || live.phase === 'connecting') {
			return (
				<LiveIdleView
					onMicPress={live.start}
					connectionStatus={live.connectionStatus}
					defaults={live.defaults}
					error={live.error}
					onClearError={live.clearError}
					busy={live.phase === 'connecting'}
				/>
			);
		}
		if (live.phase === 'active') {
			return (
				<LiveActiveView
					sessionScore={live.sessionScore}
					chunkIdx={live.chunkIdx}
					label={live.label}
					chunkHistory={live.chunkHistory}
					framesSeen={live.framesSeen}
					lastRtf={live.lastRtf}
					lastLatencyMs={live.lastLatencyMs}
					error={live.error}
					onStop={requestStop}
					onClearError={live.clearError}
				/>
			);
		}
		return (
			<LiveWarmupView
				bufferFillSamples={live.bufferFillSamples}
				bufferTargetSamples={live.bufferTargetSamples}
				error={live.error}
				onCancel={requestStop}
				onClearError={live.clearError}
			/>
		);
	}, [live, requestStop]);

	return (
		<AppShell title="Live Monitor" subtitle={subtitle}>
			<MotiPhase phaseKey={phaseKey}>{phaseView}</MotiPhase>
			<ConfirmSheet
				ref={stopSheetRef}
				title="End live session?"
				description="Stops mic capture and closes the detector session on the server."
				confirmLabel="End session"
				cancelLabel="Keep going"
				destructive
				onConfirm={confirmStop}
			/>
		</AppShell>
	);
}
