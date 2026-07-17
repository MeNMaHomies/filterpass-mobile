import { useQuery } from '@tanstack/react-query';
import {
	API_SESSION_DEFAULTS,
	type SessionDefaults,
} from '../sessionDefaults';
import {
	ensureSessionDefaultsQuery,
	sessionDefaultsQueryOptions,
} from '@/queries/settings';
import { queryClient } from '@/queries/client';

type SessionDefaultsState = {
	defaults: SessionDefaults;
	loaded: boolean;
	refresh: () => Promise<SessionDefaults>;
};

export function useSessionDefaults(): SessionDefaultsState {
	const query = useQuery(sessionDefaultsQueryOptions);

	const refresh = async () => {
		const result = await queryClient.fetchQuery({
			...sessionDefaultsQueryOptions,
			staleTime: 0,
		});
		return result;
	};

	return {
		defaults: query.data ?? API_SESSION_DEFAULTS,
		loaded: query.isSuccess || query.isError,
		refresh,
	};
}

/** Imperative ensure used by Live start (Query-backed). */
export { ensureSessionDefaultsQuery as ensureSessionDefaults };
