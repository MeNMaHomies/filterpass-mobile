import AsyncStorage from '@react-native-async-storage/async-storage';
import { sessionDefaultsSchema } from './sessionDefaultsSchema';
import { clampSessionThresholds } from '@/lib/sessionThresholds';

const STORAGE_KEY = '@filterpass/session_defaults';

export type VadFrameMs = 10 | 20 | 30;

/**
 * Device defaults for the next live session.
 * `real_threshold` is client-only (uncertain band); API still gets spoof_threshold.
 */
export type SessionDefaults = {
	sample_rate: number;
	chunk_duration_s: number;
	ema_alpha: number;
	real_threshold: number;
	spoof_threshold: number;
	vad_mode: number;
	vad_frame_ms: VadFrameMs;
};

export const API_SESSION_DEFAULTS: SessionDefaults = {
	sample_rate: 16000,
	chunk_duration_s: 0.5,
	ema_alpha: 0.3,
	real_threshold: 0.4,
	spoof_threshold: 0.6,
	vad_mode: 2,
	vad_frame_ms: 30,
};

export const VAD_MODE_OPTIONS = [0, 1, 2, 3] as const;
export const VAD_FRAME_MS_OPTIONS = [10, 20, 30] as const;

function parseStoredDefaults(raw: string): SessionDefaults {
	try {
		const json: unknown = JSON.parse(raw);
		const result = sessionDefaultsSchema.safeParse(json);
		return result.success ? result.data : { ...API_SESSION_DEFAULTS };
	} catch {
		return { ...API_SESSION_DEFAULTS };
	}
}

export async function loadSessionDefaults(): Promise<SessionDefaults> {
	try {
		const raw = await AsyncStorage.getItem(STORAGE_KEY);
		if (!raw) return { ...API_SESSION_DEFAULTS };
		return parseStoredDefaults(raw);
	} catch {
		return { ...API_SESSION_DEFAULTS };
	}
}

export async function saveSessionDefaults(
	defaults: SessionDefaults,
): Promise<void> {
	const validated = sessionDefaultsSchema.parse(defaults);
	await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(validated));
}

export async function resetSessionDefaults(): Promise<SessionDefaults> {
	await AsyncStorage.removeItem(STORAGE_KEY);
	return { ...API_SESSION_DEFAULTS };
}

/** Keep real_threshold strictly below spoof_threshold. */
export function withClampedThresholds(
	defaults: SessionDefaults,
	patch: Partial<Pick<SessionDefaults, 'real_threshold' | 'spoof_threshold'>>,
): SessionDefaults {
	const clamped = clampSessionThresholds(
		{
			real_threshold: patch.real_threshold ?? defaults.real_threshold,
			spoof_threshold: patch.spoof_threshold ?? defaults.spoof_threshold,
		},
		{
			real_threshold: defaults.real_threshold,
			spoof_threshold: defaults.spoof_threshold,
		},
	);
	return { ...defaults, ...clamped };
}
