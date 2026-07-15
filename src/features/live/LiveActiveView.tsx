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
} from '@/components/filterpass';
import { liveChunkHistory } from '@/mocks/sessions';
import { colors, spacing } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';

type LiveActiveViewProps = {
	onStop?: () => void;
};

export function LiveActiveView({ onStop }: LiveActiveViewProps) {
	return (
		<ScrollView
			contentContainerStyle={styles.scroll}
			showsVerticalScrollIndicator={false}
		>
			<Card glow style={styles.gaugeCard}>
				<View style={styles.gaugeHeader}>
					<StatusBadge label="REAL" variant="REAL" />
					<View style={styles.chunkRow}>
						<LiveDot />
						<Text style={styles.chunkLabel}>chunk 47</Text>
					</View>
				</View>
				<ScoreGauge score={0.28} />
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
				<ChunkSparkline chunks={liveChunkHistory} />
			</Card>

			<View style={styles.metrics}>
				{[
					['RTF', '0.29'],
					['Frames', '1,204'],
					['Latency', '18ms'],
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
		paddingBottom: spacing.contentBottom,
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
	metrics: {
		flexDirection: 'row',
		gap: 8,
		marginBottom: 14,
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
	},
});
