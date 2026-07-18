import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Button, Card, ChunkSparkline, ErrorBanner, ScoreGauge } from '@/components';
import { useScrollScreenProps } from '@/hooks/useScrollScreenProps';
import { LiveListeningPill } from '../components/LiveListeningPill';
import { LiveMomentOverall } from '../components/LiveMomentOverall';
import { LiveThresholdMarker } from '../components/LiveThresholdMarker';
import { LiveVerdictHeader } from '../components/LiveVerdictHeader';
import { LiveWaveform } from '../components/LiveWaveform';
import type { CaptureMode } from '../types';
import type { SessionLabel } from '@/types';
import { colors, spacing } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';

type LiveActiveViewProps = {
	sessionScore?: number;
	chunkIdx?: number;
	label?: SessionLabel;
	chunkHistory?: number[];
	lastChunkProb?: number | null;
	spoofThreshold?: number;
	realThreshold?: number;
	lastVoiced?: boolean | null;
	voicedAcks?: number;
	totalAcks?: number;
	startedAt?: number | null;
	captureMode?: CaptureMode;
	error?: string | null;
	onStop?: () => void;
	onClearError?: () => void;
};

export function LiveActiveView({
	sessionScore = 0,
	label = 'REAL',
	chunkHistory = [],
	lastChunkProb = null,
	spoofThreshold = 0.6,
	realThreshold = 0.4,
	lastVoiced = null,
	voicedAcks = 0,
	totalAcks = 0,
	startedAt = null,
	captureMode = 'mic',
	error,
	onStop,
	onClearError,
}: LiveActiveViewProps) {
	const { bottomPadding, ...scrollProps } = useScrollScreenProps();
	const footerPad = bottomPadding;

	return (
		<View style={styles.fill}>
			<ScrollView
				style={styles.scroll}
				contentContainerStyle={[styles.body, { paddingBottom: 16 }]}
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

				<LiveVerdictHeader
					label={label}
					startedAt={startedAt}
					captureMode={captureMode}
				/>

				<LiveWaveform
					label={label}
					lastVoiced={lastVoiced}
					voicedAcks={voicedAcks}
					totalAcks={totalAcks}
				/>

				<Card glow style={styles.gaugeCard}>
					<ScoreGauge score={sessionScore} label="confidence" />
					<LiveThresholdMarker
						realThreshold={realThreshold}
						spoofThreshold={spoofThreshold}
						sessionScore={sessionScore}
					/>
				</Card>

				<LiveMomentOverall
					chunkProb={lastChunkProb}
					sessionScore={sessionScore}
				/>

				<Card style={styles.trendCard}>
					<Text style={styles.trendTitle}>How confidence moved</Text>
					{chunkHistory.length > 0 ? (
						<ChunkSparkline
							chunks={chunkHistory}
							realThreshold={realThreshold}
							spoofThreshold={spoofThreshold}
						/>
					) : (
						<Text style={styles.empty}>Waiting for scores…</Text>
					)}
				</Card>

				<LiveListeningPill
					lastVoiced={lastVoiced}
					voicedAcks={voicedAcks}
					totalAcks={totalAcks}
				/>
			</ScrollView>

			<View style={[styles.footer, { paddingBottom: footerPad }]}>
				<Button
					variant="danger"
					label="Stop session"
					style={styles.stopBtn}
					onPress={onStop}
					accessibilityHint="Ends the live detection session"
				/>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	fill: {
		flex: 1,
	},
	scroll: {
		flex: 1,
	},
	body: {
		flexGrow: 1,
		paddingHorizontal: spacing.screenX,
		paddingTop: 8,
		gap: 14,
	},
	gaugeCard: {
		paddingTop: 16,
		paddingBottom: 14,
		paddingHorizontal: 16,
		alignItems: 'center',
	},
	trendCard: {
		paddingHorizontal: 14,
		paddingVertical: 14,
		gap: 10,
	},
	trendTitle: {
		fontFamily: fontFamilies.sansMedium,
		fontSize: 13,
		color: colors.muted,
	},
	empty: {
		fontFamily: fontFamilies.sans,
		fontSize: 13,
		color: colors.muted2,
	},
	footer: {
		paddingHorizontal: spacing.screenX,
		paddingTop: 8,
		borderTopWidth: 1,
		borderTopColor: colors.border,
		backgroundColor: colors.background,
	},
	stopBtn: {
		width: '100%',
	},
});
