import { useInfiniteQuery } from '@tanstack/react-query';
import type { HistorySession } from '@/types';
import { formatApiError } from '@/lib/apiError';
import {
	formatAgo,
	formatDurationFromTimestamps,
	shortSessionId,
} from '@/lib/formatSession';
import { deriveSessionLabel } from '@/lib/sessionLabel';
import { useSessionDefaults } from '@/features/settings/hooks/useSessionDefaults';
import { historySessionsInfiniteOptions } from '@/queries/history';
import type { HistorySessionSummary } from '@/types/api';

type HistorySessionsState = {
	sessions: HistorySession[];
	loading: boolean;
	refreshing: boolean;
	loadingMore: boolean;
	hasMore: boolean;
	error: string | null;
	refresh: () => Promise<void>;
	loadMore: () => Promise<void>;
};

function mapSessionRow(
	s: HistorySessionSummary,
	realThreshold: number,
): HistorySession {
	return {
		id: s.session_id,
		label:
			s.avg_session_score !== null
				? deriveSessionLabel(
						s.avg_session_score,
						s.spoof_threshold,
						realThreshold,
					)
				: 'REAL',
		score: s.avg_session_score ?? 0,
		duration: formatDurationFromTimestamps(s.created_at, s.closed_at),
		ago: formatAgo(s.closed_at ?? s.created_at),
		sortTs: s.closed_at ?? s.created_at,
	};
}

export function useHistorySessions(): HistorySessionsState {
	const { defaults } = useSessionDefaults();
	const realThreshold = defaults.real_threshold;

	const query = useInfiniteQuery(historySessionsInfiniteOptions());

	const sessions =
		query.data?.pages.flatMap((page) =>
			page.map((row) => mapSessionRow(row, realThreshold)),
		) ?? [];

	const refresh = async () => {
		await query.refetch();
	};

	const loadMore = async () => {
		if (
			!query.hasNextPage ||
			query.isFetchingNextPage ||
			query.isPending ||
			query.isRefetching
		) {
			return;
		}
		await query.fetchNextPage();
	};

	return {
		sessions,
		loading: query.isPending,
		refreshing: query.isRefetching && !query.isFetchingNextPage,
		loadingMore: query.isFetchingNextPage,
		hasMore: Boolean(query.hasNextPage),
		error: query.error ? formatApiError(query.error) : null,
		refresh,
		loadMore,
	};
}

export { shortSessionId };
