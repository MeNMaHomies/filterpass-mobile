import type { SessionLabel } from '@/types';

export const CHUNK_HISTORY_MAX = 48;
export const CHART_FLUSH_MS = 250;

export type LiveMetricSnapshot = {
	sessionScore: number;
	chunkIdx: number;
	label: SessionLabel;
	chunkHistory: number[];
	bufferFillSamples: number;
	bufferTargetSamples: number;
	framesSeen: number;
	lastRtf: number | null;
	lastLatencyMs: number | null;
};

export function createEmptyMetrics(): LiveMetricSnapshot {
	return {
		sessionScore: 0,
		chunkIdx: 0,
		label: 'REAL',
		chunkHistory: [],
		bufferFillSamples: 0,
		bufferTargetSamples: 0,
		framesSeen: 0,
		lastRtf: null,
		lastLatencyMs: null,
	};
}

export function appendChunkScore(
	history: number[],
	sessionScore: number,
	max = CHUNK_HISTORY_MAX,
): number[] {
	return [...history, sessionScore].slice(-max);
}
