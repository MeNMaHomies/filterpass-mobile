import type { SessionLabel } from '@/types';

/**
 * Derive label from session_score.
 * Backend only stores spoof_threshold; real_threshold is a client-side band
 * (scores in [real, spoof) → UNCERTAIN). Omit realThreshold for binary labels.
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
