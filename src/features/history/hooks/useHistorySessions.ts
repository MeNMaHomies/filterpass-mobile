import { useCallback, useEffect, useState } from 'react';
import { listHistorySessions } from '@/api';
import type { HistorySession } from '@/types';
import { formatApiError } from '@/lib/apiError';
import {
	formatAgo,
	formatDurationFromTimestamps,
	shortSessionId,
} from '@/lib/formatSession';
import { deriveSessionLabel } from '@/lib/sessionLabel';

const PAGE_SIZE = 50;

type HistorySessionsState = {
	sessions: HistorySession[];
	loading: boolean;
	refreshing: boolean;
	error: string | null;
	refresh: () => Promise<void>;
};

export function useHistorySessions(): HistorySessionsState {
	const [sessions, setSessions] = useState<HistorySession[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async (isRefresh = false) => {
		if (isRefresh) setRefreshing(true);
		else setLoading(true);
		setError(null);

		try {
			const rows = await listHistorySessions({ limit: PAGE_SIZE });
			setSessions(
				rows.map((s) => ({
					id: s.session_id,
					label:
						s.avg_session_score !== null
							? deriveSessionLabel(
									s.avg_session_score,
									s.spoof_threshold,
								)
							: 'REAL',
					score: s.avg_session_score ?? 0,
					duration: formatDurationFromTimestamps(
						s.created_at,
						s.closed_at,
					),
					ago: formatAgo(s.closed_at ?? s.created_at),
				})),
			);
		} catch (e) {
			setError(formatApiError(e));
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const refresh = useCallback(() => load(true), [load]);

	return { sessions, loading, refreshing, error, refresh };
}

export { shortSessionId };
