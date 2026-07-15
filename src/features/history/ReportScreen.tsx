import { ScrollView, View, Text, StyleSheet } from 'react-native';
import Svg, {
	Path,
	Line,
	Rect,
	Circle,
	Defs,
	LinearGradient,
	Stop,
} from 'react-native-svg';
import { Card, Eyebrow, StatusBadge } from '@/components/filterpass';
import { reportChunks } from '@/mocks/sessions';
import { scoreColor } from '@/lib/scoreColor';
import { colors, spacing } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';

export function ReportScreen() {
	return (
		<ScrollView
			contentContainerStyle={styles.scroll}
			showsVerticalScrollIndicator={false}
		>
			<Card style={styles.summaryCard}>
				<View style={styles.summaryGrid}>
					{[
						['Duration', '4m 12s', colors.foreground],
						['Chunks', '248', colors.foreground],
						['Label', 'REAL', colors.accent],
					].map(([k, v, c], i) => (
						<View
							key={k}
							style={[styles.summaryCell, i < 2 && styles.summaryBorder]}
						>
							<Text style={styles.summaryLabel}>{k}</Text>
							<Text
								style={[styles.summaryValue, { color: c as string }]}
							>
								{v}
							</Text>
						</View>
					))}
				</View>
			</Card>

			<Card style={styles.section}>
				<Eyebrow>Score over time</Eyebrow>
				<Svg
					width="100%"
					height={100}
					viewBox="0 0 320 100"
					style={styles.chart}
				>
					<Defs>
						<LinearGradient id="scoreArea" x1="0" y1="0" x2="0" y2="1">
							<Stop
								offset="0%"
								stopColor={colors.accent}
								stopOpacity={0.28}
							/>
							<Stop
								offset="100%"
								stopColor={colors.accent}
								stopOpacity={0}
							/>
						</LinearGradient>
					</Defs>
					<Line
						x1={0}
						y1={50}
						x2={320}
						y2={50}
						stroke={colors.muted2}
						strokeDasharray="4 4"
						opacity={0.4}
					/>
					<Path
						d="M0,70 L40,65 L80,58 L120,52 L160,48 L200,45 L240,42 L280,40 L320,38 L320,100 L0,100 Z"
						fill="url(#scoreArea)"
					/>
					<Path
						d="M0,70 L40,65 L80,58 L120,52 L160,48 L200,45 L240,42 L280,40 L320,38"
						fill="none"
						stroke={colors.accent}
						strokeWidth={2.5}
					/>
				</Svg>
			</Card>

			<View style={styles.chartsRow}>
				<Card style={styles.histCard}>
					<Eyebrow>RTF dist.</Eyebrow>
					<Svg width="100%" height={60} viewBox="0 0 120 60">
						{[12, 28, 45, 32, 18, 8].map((h, i) => (
							<Rect
								key={i}
								x={i * 18 + 4}
								y={60 - h}
								width={14}
								height={h}
								fill={colors.primary}
								opacity={0.55}
								rx={3}
							/>
						))}
					</Svg>
				</Card>
				<Card style={styles.donutCard}>
					<Eyebrow>Labels</Eyebrow>
					<Svg width={80} height={60} viewBox="0 0 80 60">
						<Circle
							cx={40}
							cy={30}
							r={24}
							fill="none"
							stroke={colors.border}
							strokeWidth={8}
						/>
						<Circle
							cx={40}
							cy={30}
							r={24}
							fill="none"
							stroke={colors.accent}
							strokeWidth={8}
							strokeDasharray="120 151"
							rotation={-90}
							origin="40, 30"
						/>
					</Svg>
					<Text style={styles.donutMeta}>79% real</Text>
				</Card>
			</View>

			<Eyebrow>Chunk timeline</Eyebrow>
			<Card style={styles.timeline}>
				{reportChunks.map((c, i) => (
					<View
						key={c.time}
						style={[
							styles.timelineRow,
							i < reportChunks.length - 1 && styles.timelineBorder,
						]}
					>
						<Text style={styles.timelineTime}>{c.time}</Text>
						<Text
							style={[
								styles.timelineScore,
								{ color: scoreColor(c.score) },
							]}
						>
							{c.score.toFixed(2)}
						</Text>
						<StatusBadge label={c.label} variant={c.label} />
					</View>
				))}
			</Card>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	scroll: {
		paddingHorizontal: spacing.screenX,
		paddingTop: 12,
		paddingBottom: spacing.contentBottom,
	},
	summaryCard: {
		padding: 0,
		overflow: 'hidden',
		marginBottom: 14,
	},
	summaryGrid: {
		flexDirection: 'row',
	},
	summaryCell: {
		flex: 1,
		paddingVertical: 12,
		paddingHorizontal: 8,
		alignItems: 'center',
	},
	summaryBorder: {
		borderRightWidth: 1,
		borderRightColor: colors.border,
	},
	summaryLabel: {
		fontFamily: fontFamilies.sans,
		fontSize: 10,
		color: colors.muted2,
	},
	summaryValue: {
		fontFamily: fontFamilies.monoSemibold,
		fontSize: 14,
		marginTop: 4,
	},
	section: {
		padding: 16,
		marginBottom: 12,
	},
	chart: {
		marginTop: 10,
	},
	chartsRow: {
		flexDirection: 'row',
		gap: 10,
		marginBottom: 12,
	},
	histCard: {
		flex: 1,
		padding: 12,
	},
	donutCard: {
		flex: 1,
		padding: 12,
		alignItems: 'center',
	},
	donutMeta: {
		fontFamily: fontFamilies.sans,
		fontSize: 10,
		color: colors.muted2,
		marginTop: 4,
	},
	timeline: {
		marginTop: 8,
		padding: 0,
		overflow: 'hidden',
	},
	timelineRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	timelineBorder: {
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
	},
	timelineTime: {
		fontFamily: fontFamilies.mono,
		fontSize: 12,
		color: colors.muted2,
	},
	timelineScore: {
		fontFamily: fontFamilies.mono,
		fontSize: 14,
	},
});
