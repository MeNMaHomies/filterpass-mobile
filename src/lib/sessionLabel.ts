import type { SessionLabel } from '@/types';

/**
 * Derive label from session_score.
 * Backend only stores spoof_threshold; real_threshold is a client-side band
 * (scores in [real, spoof) → UNCERTAIN).
 */
export function deriveSessionLabel(
	sessionScore: number,
	spoofThreshold: number,
	realThreshold?: number,
): SessionLabel {
	if (sessionScore >= spoofThreshold) return 'SPOOF';
	if (
		realThreshold != null &&
		Number.isFinite(realThreshold) &&
		sessionScore >= realThreshold
	) {
		return 'UNCERTAIN';
	}
	return 'REAL';
}

/** Null-safe label for session summaries (Home / History / Report). */
export function formatSessionLabel(
	avgSessionScore: number | null,
	spoofThreshold: number,
	realThreshold?: number,
): SessionLabel | '—' {
	if (avgSessionScore === null) return '—';
	return deriveSessionLabel(avgSessionScore, spoofThreshold, realThreshold);
}
