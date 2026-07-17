import { getHistorySession, getSessionInferences } from '@/api';
import { queryKeys } from './keys';

export function historySessionQueryOptions(sessionId: string) {
	return {
		queryKey: queryKeys.history.session(sessionId),
		queryFn: () => getHistorySession(sessionId),
	} as const;
}

export function historyInferencesQueryOptions(
	sessionId: string,
	params: { limit?: number } = { limit: 1000 },
) {
	return {
		queryKey: queryKeys.history.inferences(sessionId, params),
		queryFn: () => getSessionInferences(sessionId, params),
	} as const;
}
