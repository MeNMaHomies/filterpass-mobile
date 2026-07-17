import type { HistoryInferenceEntry } from '@/types/api';
import type { ChunkTimelineItem } from '@/types';

export type RealLabelStats = {
	realCount: number;
	realPct: number;
};

export function computeRealLabelStats(
	timeline: ChunkTimelineItem[],
): RealLabelStats {
	const realCount = timeline.filter((c) => c.label === 'REAL').length;
	const realPct =
		timeline.length > 0 ? Math.round((realCount / timeline.length) * 100) : 0;
	return { realCount, realPct };
}

export function buildScoreSummary(
	scores: number[],
	realPct: number,
): string {
	if (scores.length === 0) return 'No score data';
	const min = Math.min(...scores);
	const max = Math.max(...scores);
	return `Score ranged ${min.toFixed(2)} to ${max.toFixed(2)}. ${realPct}% of chunks labeled REAL.`;
}

/** Normalized bar heights (0–45) for RTF distribution chart. */
export function buildRtfHistogramBars(
	inferences: HistoryInferenceEntry[],
	maxBarHeight = 45,
	binCount = 6,
): number[] {
	if (inferences.length === 0) {
		return Array.from({ length: binCount }, () => 0);
	}
	const max = Math.max(...inferences.map((e) => e.rtf), 0.01);
	const bins = Array.from({ length: binCount }, () => 0);
	for (const e of inferences) {
		const idx = Math.min(binCount - 1, Math.floor((e.rtf / max) * binCount));
		bins[idx] += 1;
	}
	const peak = Math.max(...bins, 1);
	return bins.map((n) => Math.round((n / peak) * maxBarHeight));
}

export function extractSessionScores(
	inferences: HistoryInferenceEntry[],
): number[] {
	return inferences.map((e) => e.session_score);
}
