import AsyncStorage from '@react-native-async-storage/async-storage';
import { sessionDefaultsSchema } from '@/api/schemas';
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
