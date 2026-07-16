import { useMemo } from 'react';
import {
	ScrollView,
	View,
	Text,
	StyleSheet,
	ActivityIndicator,
} from 'react-native';
import Svg, {
	Path,
	Line,
	Rect,
	Circle,
	Defs,
	LinearGradient,
	Stop,
} from 'react-native-svg';
import { Card, Eyebrow, StatusBadge } from '@/components';
import { useSessionReport } from '../hooks/useSessionReport';
import { useScrollScreenProps } from '@/hooks/useScrollScreenProps';
import { scoreColor } from '@/lib/scoreColor';
import { colors, spacing } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';
import type { SessionLabel } from '@/types';

type ReportScreenProps = {
	sessionId?: string;
};

function buildScorePath(
	scores: number[],
	width: number,
	height: number,
): string {
	if (scores.length === 0) return '';
	const step = width / Math.max(scores.length - 1, 1);
	const points = scores.map((score, i) => {
		const safe = Number.isFinite(score)
			? Math.min(1, Math.max(0, score))
			: 0;
		const x = i * step;
		const y = height - safe * height;
		return `${i === 0 ? 'M' : 'L'}${x},${y}`;
	});
	return points.join(' ');
}

export function ReportScreen({ sessionId }: ReportScreenProps) {
	const scrollProps = useScrollScreenProps();
	const { duration, label, chunkCount, timeline, inferences, loading, error } =
		useSessionReport(sessionId);

	const scores = useMemo(
		() => inferences.map((e) => e.session_score),
		[inferences],
	);

	const linePath = useMemo(
		() => buildScorePath(scores, 320, 80),
		[scores],
	);

	const areaPath = useMemo(() => {
		if (!linePath) return '';
		return `${linePath} L320,100 L0,100 Z`;
	}, [linePath]);

	const realStats = useMemo(() => {
		const realCount = timeline.filter((c) => c.label === 'REAL').length;
		const realPct =
			timeline.length > 0
				? Math.round((realCount / timeline.length) * 100)
				: 0;
		return { realCount, realPct };
	}, [timeline]);

	const rtfBuckets = useMemo(() => {
		if (inferences.length === 0) return [0, 0, 0, 0, 0, 0];
		const max = Math.max(...inferences.map((e) => e.rtf), 0.01);
		const bins = [0, 0, 0, 0, 0, 0];
		for (const e of inferences) {
			const idx = Math.min(5, Math.floor((e.rtf / max) * 6));
			bins[idx] += 1;
		}
		const peak = Math.max(...bins, 1);
		return bins.map((n) => Math.round((n / peak) * 45));
	}, [inferences]);

	if (loading) {
		return (
			<ActivityIndicator
				color={colors.primary}
				style={styles.loader}
			/>
		);
	}

	if (error) {
		return <Text style={styles.error}>{error}</Text>;
	}

	const labelDisplay = label === '—' ? '—' : label;
	const labelColor = label === 'SPOOF' ? colors.destructive : colors.accent;

	return (
		<ScrollView
			contentContainerStyle={styles.scroll}
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

			<Card style={styles.section}>
				<Eyebrow>Score over time</Eyebrow>
				{scores.length > 0 ? (
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
				<Card style={styles.histCard}>
					<Eyebrow>RTF dist.</Eyebrow>
					<Svg width="100%" height={60} viewBox="0 0 120 60">
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
	loader: {
		marginTop: 40,
	},
	error: {
		fontFamily: fontFamilies.sans,
		fontSize: 13,
		color: colors.destructive,
		padding: spacing.screenX,
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
