import {
	API_SESSION_DEFAULTS,
	loadSessionDefaults,
	resetSessionDefaults,
	saveSessionDefaults,
	type SessionDefaults,
} from './sessionDefaults';
import {
	ensureSessionDefaultsQuery,
	persistSessionDefaultsQuery,
	resetSessionDefaultsQuery,
} from '@/queries/settings';

/**
 * Compatibility façade over TanStack Query settings cache.
 * Prefer `ensureSessionDefaultsQuery` / mutations from `@/queries/settings`.
 */
export async function ensureSessionDefaults(): Promise<SessionDefaults> {
	return ensureSessionDefaultsQuery();
}

export async function refreshSessionDefaults(): Promise<SessionDefaults> {
	return ensureSessionDefaultsQuery();
}

export async function persistSessionDefaults(
	defaults: SessionDefaults,
): Promise<void> {
	await persistSessionDefaultsQuery(defaults);
}

export async function resetStoredSessionDefaults(): Promise<SessionDefaults> {
	return resetSessionDefaultsQuery();
}

export function getSessionDefaultsSnapshot(): SessionDefaults {
	return API_SESSION_DEFAULTS;
}

export function subscribeSessionDefaults(_listener: () => void): () => void {
	return () => {};
}

export function __resetSessionDefaultsStoreForTests(): void {
	// Query cache is reset in tests via a fresh QueryClient.
}

export {
	loadSessionDefaults,
	saveSessionDefaults,
	resetSessionDefaults,
};
