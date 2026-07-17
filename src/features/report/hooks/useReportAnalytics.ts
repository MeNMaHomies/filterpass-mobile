import { useMemo } from 'react';
import {
	buildClosedAreaPath,
	buildScoreLinePath,
} from '@/components/charts/pathUtils';
import type { HistoryInferenceEntry } from '@/types/api';
import type { ChunkTimelineItem } from '@/types';
import {
	buildRtfHistogramBars,
	buildScoreSummary,
	computeRealLabelStats,
	extractSessionScores,
} from '../reportChartData';

const SCORE_CHART_WIDTH = 320;
const SCORE_PLOT_HEIGHT = 80;
const SCORE_CHART_HEIGHT = 100;

export type ReportAnalytics = {
	scores: number[];
	linePath: string;
	areaPath: string;
	realStats: ReturnType<typeof computeRealLabelStats>;
	scoreSummary: string;
	rtfBuckets: number[];
};

export function useReportAnalytics(
	inferences: HistoryInferenceEntry[],
	timeline: ChunkTimelineItem[],
): ReportAnalytics {
	const scores = useMemo(() => extractSessionScores(inferences), [inferences]);

	const linePath = useMemo(
		() => buildScoreLinePath(scores, SCORE_CHART_WIDTH, SCORE_PLOT_HEIGHT),
		[scores],
	);

	const areaPath = useMemo(
		() =>
			buildClosedAreaPath(linePath, SCORE_CHART_HEIGHT, {
				leftX: 0,
				rightX: SCORE_CHART_WIDTH,
			}),
		[linePath],
	);

	const realStats = useMemo(() => computeRealLabelStats(timeline), [timeline]);

	const scoreSummary = useMemo(
		() => buildScoreSummary(scores, realStats.realPct),
		[scores, realStats.realPct],
	);

	const rtfBuckets = useMemo(
		() => buildRtfHistogramBars(inferences),
		[inferences],
	);

	return {
		scores,
		linePath,
		areaPath,
		realStats,
		scoreSummary,
		rtfBuckets,
	};
}

export { SCORE_CHART_WIDTH, SCORE_CHART_HEIGHT };
