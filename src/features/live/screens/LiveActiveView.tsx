import { ScrollView, View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
	Button,
	Card,
	ChunkSparkline,
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
	onStop?: () => void;
};

export function LiveActiveView({
	sessionScore = 0,
	chunkIdx = 0,
	label = 'REAL',
	chunkHistory = [],
	framesSeen = 0,
	lastRtf = null,
	lastLatencyMs = null,
	onStop,
}: LiveActiveViewProps) {
	const scrollProps = useScrollScreenProps();

	return (
		<ScrollView
			contentContainerStyle={styles.scroll}
			showsVerticalScrollIndicator={false}
			keyboardShouldPersistTaps="handled"
			{...scrollProps}
		>
			<Card glow style={styles.gaugeCard}>
				<View style={styles.gaugeHeader}>
					<StatusBadge label={label} variant={label} />
					<View style={styles.chunkRow}>
						<LiveDot />
						<Text style={styles.chunkLabel}>chunk {chunkIdx}</Text>
					</View>
				</View>
				<ScoreGauge score={sessionScore} />
			</Card>

			<Card style={styles.section}>
				<Eyebrow>Waveform</Eyebrow>
				<Svg
					width="100%"
					height={44}
					viewBox="0 0 300 44"
					preserveAspectRatio="none"
					style={styles.waveform}
				>
					<Path
						d="M0,22 Q30,12 60,22 T120,22 T180,22 T240,22 T300,22"
						fill="none"
						stroke={colors.primary}
						strokeWidth={1.5}
						opacity={0.3}
					/>
					<Path
						d="M0,22 Q15,32 30,22 T60,22 T90,14 T120,24 T150,20 T180,16 T210,22 T240,20 T270,18 T300,20"
						fill="none"
						stroke={colors.primary}
						strokeWidth={2}
					/>
				</Svg>
			</Card>

			<Card style={styles.section}>
				<Eyebrow>Chunk history</Eyebrow>
				{chunkHistory.length > 0 ? (
					<ChunkSparkline chunks={chunkHistory} />
				) : (
					<Text style={styles.empty}>Waiting for scores…</Text>
				)}
			</Card>

			<View style={styles.metrics}>
				{[
					['RTF', lastRtf !== null ? lastRtf.toFixed(2) : '—'],
					['Frames', framesSeen.toLocaleString()],
					[
						'Latency',
						lastLatencyMs !== null
							? `${Math.round(lastLatencyMs)}ms`
							: '—',
					],
				].map(([k, v]) => (
					<View key={k} style={styles.metric}>
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
	waveform: {
		marginTop: 6,
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
