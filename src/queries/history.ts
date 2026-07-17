import { listHistorySessions } from '@/api';
import type { HistorySessionSummary } from '@/types/api';
import { queryKeys } from './keys';

export const HISTORY_PAGE_SIZE = 50;

export type HistorySessionsPageParam = number;

export async function fetchHistorySessionsPage(
	offset: HistorySessionsPageParam,
): Promise<HistorySessionSummary[]> {
	return listHistorySessions({
		limit: HISTORY_PAGE_SIZE,
		offset,
	});
}

export function historySessionsInfiniteOptions() {
	return {
		queryKey: queryKeys.history.sessions({ limit: HISTORY_PAGE_SIZE }),
		queryFn: ({ pageParam }: { pageParam: HistorySessionsPageParam }) =>
			fetchHistorySessionsPage(pageParam),
		initialPageParam: 0 as HistorySessionsPageParam,
		getNextPageParam: (
			lastPage: HistorySessionSummary[],
			_pages: HistorySessionSummary[][],
			lastPageParam: HistorySessionsPageParam,
		) =>
			lastPage.length < HISTORY_PAGE_SIZE
				? undefined
				: lastPageParam + lastPage.length,
	};
}
