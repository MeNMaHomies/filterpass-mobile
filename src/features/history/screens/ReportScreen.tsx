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
import {
	Card,
	ErrorBanner,
	Eyebrow,
	ScreenLoader,
	StatusBadge,
} from '@/components';
import { useSessionReport } from '../hooks/useSessionReport';
import {
	SCORE_CHART_HEIGHT,
	SCORE_CHART_WIDTH,
	useReportAnalytics,
} from '@/features/report/hooks/useReportAnalytics';
import { useScrollScreenProps } from '@/hooks/useScrollScreenProps';
import { scoreColor } from '@/lib/scoreColor';
import { colors, spacing } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';
import type { SessionLabel } from '@/types';

type ReportScreenProps = {
	sessionId?: string;
};

export function ReportScreen({ sessionId }: ReportScreenProps) {
	const { bottomPadding, ...scrollProps } = useScrollScreenProps();
	const {
		duration,
		label,
		chunkCount,
		timeline,
		inferences,
		loading,
		error,
		refresh,
	} = useSessionReport(sessionId);

	const {
		scores,
		linePath,
		areaPath,
		realStats,
		scoreSummary,
		rtfBuckets,
	} = useReportAnalytics(inferences, timeline);

	if (loading) {
		return <ScreenLoader label="Loading session report" />;
	}

	if (error) {
		return (
			<View style={styles.errorWrap}>
				<ErrorBanner message={error} onRetry={refresh} />
			</View>
		);
	}

	const labelDisplay = label === '—' ? '—' : label;
	const labelColor =
		label === 'SPOOF'
			? colors.destructive
			: label === 'UNCERTAIN'
				? colors.amber
				: colors.accent;

	return (
		<ScrollView
			contentContainerStyle={[styles.scroll, { paddingBottom: bottomPadding }]}
			showsVerticalScrollIndicator={false}
			{...scrollProps}
		>
			<Card style={styles.summaryCard}>
				<View style={styles.summaryGrid}>
					{[
						['Duration', duration, colors.foreground],
						['Chunks', String(chunkCount), colors.foreground],
						['Label', labelDisplay, labelColor],
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

			<Card
				style={styles.section}
				accessible
				accessibilityLabel={scoreSummary}
			>
				<Eyebrow>Score over time</Eyebrow>
				{scores.length > 0 ? (
					<Svg
						width="100%"
						height={SCORE_CHART_HEIGHT}
						viewBox={`0 0 ${SCORE_CHART_WIDTH} ${SCORE_CHART_HEIGHT}`}
						style={styles.chart}
						accessible={false}
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
							x2={SCORE_CHART_WIDTH}
							y2={50}
							stroke={colors.muted2}
							strokeDasharray="4 4"
							opacity={0.4}
						/>
						{areaPath ? (
							<Path d={areaPath} fill="url(#scoreArea)" />
						) : null}
						{linePath ? (
							<Path
								d={linePath}
								fill="none"
								stroke={colors.accent}
								strokeWidth={2.5}
							/>
						) : null}
					</Svg>
				) : (
					<Text style={styles.noData}>No inference data</Text>
				)}
			</Card>

			<View style={styles.chartsRow}>
				<Card
					style={styles.histCard}
					accessible
					accessibilityLabel="Processing speed distribution across chunks"
				>
					<Eyebrow>Speed dist.</Eyebrow>
					<Svg width="100%" height={60} viewBox="0 0 120 60" accessible={false}>
						{rtfBuckets.map((h, i) => (
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
				<Card
					style={styles.donutCard}
					accessible
					accessibilityLabel={`${realStats.realPct} percent of chunks labeled real`}
				>
					<Eyebrow>Labels</Eyebrow>
					<Svg width={80} height={60} viewBox="0 0 80 60" accessible={false}>
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
							strokeDasharray={`${(realStats.realPct / 100) * 151} 151`}
							rotation={-90}
							origin="40, 30"
						/>
					</Svg>
					<Text style={styles.donutMeta}>{realStats.realPct}% real</Text>
				</Card>
			</View>

			<Eyebrow>Chunk timeline</Eyebrow>
			<Card style={styles.timeline}>
				{timeline.length === 0 ? (
					<Text style={styles.noData}>No chunks recorded</Text>
				) : (
					timeline.map((c, i) => (
						<View
							key={`${c.time}-${i}`}
							style={[
								styles.timelineRow,
								i < timeline.length - 1 && styles.timelineBorder,
							]}
							accessible
							accessibilityLabel={`Chunk at ${c.time}, score ${c.score.toFixed(2)}, ${c.label}`}
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
							<StatusBadge
								label={c.label as SessionLabel}
								variant={c.label as SessionLabel}
							/>
						</View>
					))
				)}
			</Card>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	scroll: {
		paddingHorizontal: spacing.screenX,
		paddingTop: 12,
	},
	errorWrap: {
		paddingHorizontal: spacing.screenX,
		paddingTop: 16,
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
	noData: {
		fontFamily: fontFamilies.sans,
		fontSize: 13,
		color: colors.muted2,
		marginTop: 10,
		padding: 16,
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
