import { ScrollView, View, Text, StyleSheet } from 'react-native';
import {
	Button,
	Card,
	ChunkSparkline,
	ErrorBanner,
	Eyebrow,
	LiveDot,
	ScoreGauge,
	StatusBadge,
} from '@/components';
import { useScrollScreenProps } from '@/hooks/useScrollScreenProps';
import type { SessionLabel } from '@/types';
import { colors, spacing } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';

type LiveActiveViewProps = {
	sessionScore?: number;
	chunkIdx?: number;
	label?: SessionLabel;
	chunkHistory?: number[];
	framesSeen?: number;
	lastRtf?: number | null;
	lastLatencyMs?: number | null;
	error?: string | null;
	onStop?: () => void;
	onClearError?: () => void;
};

export function LiveActiveView({
	sessionScore = 0,
	chunkIdx = 0,
	label = 'REAL',
	chunkHistory = [],
	framesSeen = 0,
	lastRtf = null,
	lastLatencyMs = null,
	error,
	onStop,
	onClearError,
}: LiveActiveViewProps) {
	const scrollProps = useScrollScreenProps();

	return (
		<ScrollView
			contentContainerStyle={styles.scroll}
			showsVerticalScrollIndicator={false}
			keyboardShouldPersistTaps="handled"
			{...scrollProps}
		>
			{error ? (
				<ErrorBanner
					message={error}
					onRetry={onClearError}
					retryLabel="Dismiss"
				/>
			) : null}

			<Card glow style={styles.gaugeCard}>
				<View style={styles.gaugeHeader}>
					<StatusBadge label={label} variant={label} live />
					<View style={styles.chunkRow}>
						<LiveDot />
						<Text style={styles.chunkLabel}>chunk {chunkIdx}</Text>
					</View>
				</View>
				<ScoreGauge score={sessionScore} label="session score" />
			</Card>

			<Card style={styles.section}>
				<Eyebrow>Score history</Eyebrow>
				{chunkHistory.length > 0 ? (
					<ChunkSparkline chunks={chunkHistory} />
				) : (
					<Text style={styles.empty}>Waiting for scores…</Text>
				)}
			</Card>

			<View style={styles.metrics}>
				{[
					[
						'Speed',
						lastRtf !== null ? lastRtf.toFixed(2) : '—',
						'Real-time factor — lower is faster than real-time',
					],
					[
						'Frames',
						framesSeen.toLocaleString(),
						'Audio frames sent to the detector',
					],
					[
						'Latency',
						lastLatencyMs !== null
							? `${Math.round(lastLatencyMs)}ms`
							: '—',
						'Model inference time for the last chunk',
					],
				].map(([k, v, hint]) => (
					<View
						key={k}
						style={styles.metric}
						accessible
						accessibilityLabel={`${k}: ${v}. ${hint}`}
					>
						<Text style={styles.metricLabel}>{k}</Text>
						<Text style={styles.metricValue}>{v}</Text>
					</View>
				))}
			</View>

			<Button
				variant="danger"
				label="Stop session"
				style={styles.stopBtn}
				onPress={onStop}
				accessibilityHint="Ends the live detection session"
			/>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	scroll: {
		paddingHorizontal: spacing.screenX,
		paddingTop: 12,
	},
	gaugeCard: {
		paddingTop: 16,
		paddingBottom: 12,
		paddingHorizontal: 16,
		marginBottom: 12,
	},
	gaugeHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 4,
	},
	chunkRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	chunkLabel: {
		fontFamily: fontFamilies.mono,
		fontSize: 11,
		color: colors.muted,
	},
	section: {
		paddingHorizontal: 14,
		paddingVertical: 12,
		marginBottom: 10,
	},
	empty: {
		fontFamily: fontFamilies.sans,
		fontSize: 13,
		color: colors.muted2,
		marginTop: 6,
	},
	metrics: {
		flexDirection: 'row',
		gap: 8,
		marginBottom: 20,
	},
	metric: {
		flex: 1,
		backgroundColor: colors.secondary,
		borderRadius: 10,
		paddingVertical: 9,
		paddingHorizontal: 8,
		alignItems: 'center',
		borderWidth: 1,
		borderColor: colors.border,
		minHeight: 52,
		justifyContent: 'center',
	},
	metricLabel: {
		fontFamily: fontFamilies.sans,
		fontSize: 10,
		color: colors.muted2,
	},
	metricValue: {
		fontFamily: fontFamilies.mono,
		fontSize: 14,
		color: colors.foreground,
		marginTop: 2,
	},
	stopBtn: {
		width: '100%',
		marginTop: 4,
	},
});
