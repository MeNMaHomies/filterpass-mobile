import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/api';
import { getHealth, getInferenceBuckets, listHistorySessions } from '@/api';
import type { KpiItem, RecentSession } from '@/types';
import { deriveSessionLabel } from '@/lib/sessionLabel';
import { shortSessionId } from '@/lib/formatSession';

type HomeOverviewState = {
	kpis: KpiItem[];
	recentSessions: RecentSession[];
	loading: boolean;
	error: string | null;
	refresh: () => void;
};

export function useHomeOverview(): HomeOverviewState {
	const [kpis, setKpis] = useState<KpiItem[]>([]);
	const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const now = Date.now() / 1000;
			const [health, liveSessions, buckets, recent] = await Promise.all([
				getHealth(),
				listHistorySessions({ only_closed: false, limit: 100 }),
				getInferenceBuckets({
					from_ts: now - 86400,
					to_ts: now,
					bucket_s: 3600,
				}),
				listHistorySessions({ limit: 3 }),
			]);

			const chunks24h = buckets.buckets.reduce(
				(sum, b) => sum + b.chunks_total,
				0,
			);

			const closedWithRtf = recent.filter(
				(s) => s.closed_at !== null && s.last_rtf !== null,
			);
			const avgRtf =
				closedWithRtf.length > 0
					? closedWithRtf.reduce((sum, s) => sum + (s.last_rtf ?? 0), 0) /
						closedWithRtf.length
					: null;

			setKpis([
				{
					label: 'Backend',
					value: health.model_loaded ? 'Online' : 'No model',
					live: health.status === 'ok' && health.model_loaded,
				},
				{
					label: 'Live sessions',
					value: String(liveSessions.length),
					live: liveSessions.length > 0,
				},
				{
					label: 'Chunks 24h',
					value: chunks24h.toLocaleString(),
					live: false,
				},
				{
					label: 'Avg RTF',
					value: avgRtf !== null ? avgRtf.toFixed(2) : '—',
					live: false,
				},
			]);

			setRecentSessions(
				recent.map((s) => ({
					id: shortSessionId(s.session_id),
					sessionId: s.session_id,
					score: s.avg_session_score ?? 0,
					label:
						s.avg_session_score !== null
							? deriveSessionLabel(
									s.avg_session_score,
									s.spoof_threshold,
								)
							: 'REAL',
				})),
			);
		} catch (e) {
			const message =
				e instanceof ApiError
					? e.message
					: e instanceof Error
						? e.message
						: 'Failed to load overview';
			setError(message);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	return { kpis, recentSessions, loading, error, refresh: load };
}
