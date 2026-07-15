import type { SessionLabel } from '@/types';

/**
 * Derive REAL/SPOOF from session_score and per-session spoof_threshold.
 * Backend never sends a label on score events.
 */
export function deriveSessionLabel(
	sessionScore: number,
	spoofThreshold: number,
): SessionLabel {
	return sessionScore >= spoofThreshold ? 'SPOOF' : 'REAL';
}
