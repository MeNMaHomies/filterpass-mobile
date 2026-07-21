import { z } from 'zod';
import {
	THRESHOLD_BOUNDS,
	clampSessionThresholds,
	deriveRealThreshold,
} from '@/lib/sessionThresholds';

/**
 * Local AsyncStorage persistence schema (not a wire contract).
 * Lives next to session defaults, re-exported from `@/api/schemas` for callers.
 */
export const sessionDefaultsSchema = z
	.object({
		ema_alpha: z.number().min(0.1).max(0.9),
		spoof_threshold: z
			.number()
			.min(THRESHOLD_BOUNDS.spoofMin)
			.max(THRESHOLD_BOUNDS.spoofMax),
		/** Client-only; scores in [real, spoof) are UNCERTAIN. */
		real_threshold: z
			.number()
			.min(THRESHOLD_BOUNDS.realMin)
			.max(THRESHOLD_BOUNDS.realMax)
			.optional(),
		vad_mode: z.number().int().min(0).max(3).optional(),
		vad_frame_ms: z
			.union([z.literal(10), z.literal(20), z.literal(30)])
			.optional(),
	})
	.transform((d) => {
		const spoof = d.spoof_threshold;
		const real =
			d.real_threshold ?? deriveRealThreshold(spoof);
		const clamped = clampSessionThresholds({
			real_threshold: real,
			spoof_threshold: spoof,
		});
		return {
			ema_alpha: d.ema_alpha,
			real_threshold: clamped.real_threshold,
			spoof_threshold: clamped.spoof_threshold,
			vad_mode: d.vad_mode ?? 2,
			vad_frame_ms: d.vad_frame_ms ?? 30,
		};
	})
	.refine((d) => d.real_threshold < d.spoof_threshold, {
		message: 'real_threshold must be below spoof_threshold',
	});

export type SessionDefaultsParsed = z.infer<typeof sessionDefaultsSchema>;
