import { View, Text, StyleSheet } from 'react-native';
import { AppShell, StatusBadge } from '@/components';
import {
	LiveActiveView,
	LiveIdleView,
	LiveWarmupView,
	useLiveSession,
} from '@/features/live';
import { shortSessionId } from '@/lib/formatSession';
import { colors, spacing } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';

export default function LiveRoute() {
	const live = useLiveSession();

	const subtitle =
		live.sessionId && live.phase !== 'idle'
			? `sess_${shortSessionId(live.sessionId)}`
			: undefined;

	return (
		<AppShell
			title="Live Monitor"
			subtitle={subtitle}
			headerRight={
				live.phase === 'active' || live.phase === 'warmup' ? (
					<StatusBadge
						label={
							live.phase === 'warmup' ? 'Warming up' : 'Live'
						}
						variant={live.phase === 'warmup' ? 'WARMUP' : 'REAL'}
					/>
				) : null
			}
		>
			{live.phase === 'idle' || live.phase === 'connecting' ? (
				<LiveIdleView
					onMicPress={live.start}
					connectionStatus={live.connectionStatus}
					defaults={live.defaults}
					error={live.error}
				/>
			) : null}

			{live.phase === 'active' ? (
				<>
					{live.error ? (
						<View style={styles.errorBanner}>
							<Text style={styles.errorText}>{live.error}</Text>
						</View>
					) : null}
					<LiveActiveView
						sessionScore={live.sessionScore}
						chunkIdx={live.chunkIdx}
						label={live.label}
						chunkHistory={live.chunkHistory}
						framesSeen={live.framesSeen}
						lastRtf={live.lastRtf}
						lastLatencyMs={live.lastLatencyMs}
						onStop={live.stop}
					/>
				</>
			) : null}

			{live.phase === 'warmup' ? (
				<LiveWarmupView
					bufferFillSamples={live.bufferFillSamples}
					bufferTargetSamples={live.bufferTargetSamples}
					onCancel={live.stop}
				/>
			) : null}
		</AppShell>
	);
}

const styles = StyleSheet.create({
	errorBanner: {
		paddingHorizontal: spacing.screenX,
		paddingTop: 8,
	},
	errorText: {
		fontFamily: fontFamilies.sans,
		fontSize: 13,
		color: colors.destructive,
	},
});
