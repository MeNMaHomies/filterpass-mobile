/**
 * Shared real/spoof threshold band rules (client-only UNCERTAIN range).
 * Used by Zod transforms and Settings UI patches.
 */

export const THRESHOLD_BOUNDS = {
	realMin: 0.05,
	realMax: 0.85,
	spoofMin: 0.1,
	spoofMax: 0.9,
} as const;

export type ThresholdPair = {
	real_threshold: number;
	spoof_threshold: number;
};

function round2(n: number): number {
	return Number(n.toFixed(2));
}

/** Keep real strictly below spoof within product bounds. */
export function clampSessionThresholds(
	input: Partial<ThresholdPair> & {
		real_threshold?: number;
		spoof_threshold?: number;
	},
	fallback: ThresholdPair = { real_threshold: 0.4, spoof_threshold: 0.6 },
): ThresholdPair {
	let real = input.real_threshold ?? fallback.real_threshold;
	let spoof = input.spoof_threshold ?? fallback.spoof_threshold;

	real = Math.min(
		THRESHOLD_BOUNDS.realMax,
		Math.max(THRESHOLD_BOUNDS.realMin, real),
	);
	spoof = Math.min(
		THRESHOLD_BOUNDS.spoofMax,
		Math.max(THRESHOLD_BOUNDS.spoofMin, spoof),
	);

	if (input.real_threshold != null && real >= spoof) {
		real = Math.max(THRESHOLD_BOUNDS.realMin, spoof - 0.05);
	}
	if (input.spoof_threshold != null && spoof <= real) {
		spoof = Math.min(THRESHOLD_BOUNDS.spoofMax, real + 0.05);
	}
	if (real >= spoof) {
		real = Math.max(THRESHOLD_BOUNDS.realMin, spoof - 0.05);
	}

	return {
		real_threshold: round2(real),
		spoof_threshold: round2(spoof),
	};
}

/** Default real band derived from spoof when omitted from storage. */
export function deriveRealThreshold(spoof: number): number {
	const candidate = Math.min(Math.max(spoof - 0.2, 0.1), spoof - 0.05);
	return clampSessionThresholds({
		real_threshold: candidate,
		spoof_threshold: spoof,
	}).real_threshold;
}
