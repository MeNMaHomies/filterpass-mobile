import { useQueryClient } from '@tanstack/react-query';
import {
	loadSessionDefaults,
	resetSessionDefaults,
	saveSessionDefaults,
	type SessionDefaults,
} from '@/features/settings/sessionDefaults';
import { queryClient } from './client';
import { queryKeys } from './keys';

export const sessionDefaultsQueryOptions = {
	queryKey: queryKeys.settings.defaults,
	queryFn: loadSessionDefaults,
	staleTime: Infinity,
	gcTime: Infinity,
} as const;

/** Shared ensure for imperative callers (Live start, etc.). */
export function ensureSessionDefaultsQuery(
	client = queryClient,
): Promise<SessionDefaults> {
	return client.ensureQueryData(sessionDefaultsQueryOptions);
}

export async function persistSessionDefaultsQuery(
	defaults: SessionDefaults,
	client = queryClient,
): Promise<SessionDefaults> {
	await saveSessionDefaults(defaults);
	client.setQueryData(queryKeys.settings.defaults, defaults);
	return defaults;
}

export async function resetSessionDefaultsQuery(
	client = queryClient,
): Promise<SessionDefaults> {
	const defaults = await resetSessionDefaults();
	client.setQueryData(queryKeys.settings.defaults, defaults);
	return defaults;
}

/** Hook helper to invalidate/refetch settings defaults. */
export function useInvalidateSessionDefaults() {
	const client = useQueryClient();
	return () =>
		client.invalidateQueries({ queryKey: queryKeys.settings.defaults });
}
