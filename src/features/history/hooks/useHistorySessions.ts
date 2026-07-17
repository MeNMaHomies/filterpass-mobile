import { useCallback, useEffect, useRef, useState } from 'react';
import { listHistorySessions } from '@/api';
import type { HistorySession } from '@/types';
import { formatApiError } from '@/lib/apiError';
import {
	formatAgo,
	formatDurationFromTimestamps,
	shortSessionId,
} from '@/lib/formatSession';
import { deriveSessionLabel } from '@/lib/sessionLabel';
import { ensureSessionDefaults } from '@/features/settings/sessionDefaultsStore';

const PAGE_SIZE = 50;

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
	s: Awaited<ReturnType<typeof listHistorySessions>>[number],
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
	const [sessions, setSessions] = useState<HistorySession[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const offsetRef = useRef(0);
	const realThresholdRef = useRef(0.4);

	const loadPage = useCallback(async (mode: 'initial' | 'refresh' | 'more') => {
		if (mode === 'more') setLoadingMore(true);
		else if (mode === 'refresh') setRefreshing(true);
		else setLoading(true);

		setError(null);

		const offset = mode === 'more' ? offsetRef.current : 0;

		try {
			if (mode !== 'more') {
				const defaults = await ensureSessionDefaults();
				realThresholdRef.current = defaults.real_threshold;
			}

			const rows = await listHistorySessions({
				limit: PAGE_SIZE,
				offset,
			});
			const mapped = rows.map((row) =>
				mapSessionRow(row, realThresholdRef.current),
			);

			setSessions((prev) =>
				mode === 'more' ? [...prev, ...mapped] : mapped,
			);
			offsetRef.current = offset + rows.length;
			setHasMore(rows.length === PAGE_SIZE);
		} catch (e) {
			setError(formatApiError(e));
			if (mode !== 'more') setSessions([]);
		} finally {
			setLoading(false);
			setRefreshing(false);
			setLoadingMore(false);
		}
	}, []);

	useEffect(() => {
		loadPage('initial');
	}, [loadPage]);

	const refresh = useCallback(() => loadPage('refresh'), [loadPage]);

	const loadMore = useCallback(async () => {
		if (loadingMore || loading || refreshing || !hasMore) return;
		await loadPage('more');
	}, [loadingMore, loading, refreshing, hasMore, loadPage]);

	return {
		sessions,
		loading,
		refreshing,
		loadingMore,
		hasMore,
		error,
		refresh,
		loadMore,
	};
}

export { shortSessionId };
