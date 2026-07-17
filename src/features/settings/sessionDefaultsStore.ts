import {
	API_SESSION_DEFAULTS,
	loadSessionDefaults,
	resetSessionDefaults,
	saveSessionDefaults,
	type SessionDefaults,
} from './sessionDefaults';

type Listener = () => void;

let cached: SessionDefaults | null = null;
let loadPromise: Promise<SessionDefaults> | null = null;
const listeners = new Set<Listener>();

function notify() {
	for (const listener of listeners) {
		listener();
	}
}

function setCache(defaults: SessionDefaults) {
	cached = defaults;
	notify();
}

/** Subscribe to in-memory default changes (save, reset, refresh). */
export function subscribeSessionDefaults(listener: Listener): () => void {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

/** Cached value when already loaded; otherwise API defaults. */
export function getSessionDefaultsSnapshot(): SessionDefaults {
	return cached ?? API_SESSION_DEFAULTS;
}

/**
 * Load defaults once and share the result across callers.
 * Concurrent calls share the same in-flight promise.
 */
export async function ensureSessionDefaults(): Promise<SessionDefaults> {
	if (cached) return cached;
	if (!loadPromise) {
		loadPromise = loadSessionDefaults()
			.then((defaults) => {
				cached = defaults;
				return defaults;
			})
			.finally(() => {
				loadPromise = null;
			});
	}
	return loadPromise;
}

/** Force reload from AsyncStorage and update subscribers. */
export async function refreshSessionDefaults(): Promise<SessionDefaults> {
	const defaults = await loadSessionDefaults();
	setCache(defaults);
	return defaults;
}

export async function persistSessionDefaults(
	defaults: SessionDefaults,
): Promise<void> {
	await saveSessionDefaults(defaults);
	setCache(defaults);
}

export async function resetStoredSessionDefaults(): Promise<SessionDefaults> {
	const defaults = await resetSessionDefaults();
	setCache(defaults);
	return defaults;
}

/** Test helper — clears in-memory cache between tests. */
export function __resetSessionDefaultsStoreForTests(): void {
	cached = null;
	loadPromise = null;
}
