import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CreateSessionRequest } from '@/types/api';

const STORAGE_KEY = '@filterpass/session_defaults';

export type SessionDefaults = Required<
	Pick<
		CreateSessionRequest,
		'sample_rate' | 'chunk_duration_s' | 'ema_alpha' | 'spoof_threshold'
	>
>;

export const API_SESSION_DEFAULTS: SessionDefaults = {
	sample_rate: 16000,
	chunk_duration_s: 0.5,
	ema_alpha: 0.3,
	spoof_threshold: 0.5,
};

export async function loadSessionDefaults(): Promise<SessionDefaults> {
	try {
		const raw = await AsyncStorage.getItem(STORAGE_KEY);
		if (!raw) return { ...API_SESSION_DEFAULTS };
		const parsed = JSON.parse(raw) as Partial<SessionDefaults>;
		return {
			sample_rate: parsed.sample_rate ?? API_SESSION_DEFAULTS.sample_rate,
			chunk_duration_s:
				parsed.chunk_duration_s ?? API_SESSION_DEFAULTS.chunk_duration_s,
			ema_alpha: parsed.ema_alpha ?? API_SESSION_DEFAULTS.ema_alpha,
			spoof_threshold:
				parsed.spoof_threshold ?? API_SESSION_DEFAULTS.spoof_threshold,
		};
	} catch {
		return { ...API_SESSION_DEFAULTS };
	}
}

export async function saveSessionDefaults(
	defaults: SessionDefaults,
): Promise<void> {
	await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
}

export async function resetSessionDefaults(): Promise<SessionDefaults> {
	await AsyncStorage.removeItem(STORAGE_KEY);
	return { ...API_SESSION_DEFAULTS };
}
