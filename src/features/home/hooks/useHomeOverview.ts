import { useQueries } from '@tanstack/react-query';
import type { KpiItem, RecentSession } from '@/types';
import { deriveSessionLabel } from '@/lib/sessionLabel';
import { shortSessionId } from '@/lib/formatSession';
import { formatApiError } from '@/lib/apiError';
import { useSessionDefaults } from '@/features/settings/hooks/useSessionDefaults';
import {
	healthQueryOptions,
	homeActiveSessionsQueryOptions,
	homeBuckets24hQueryOptions,
	homeRecentSessionsQueryOptions,
} from '@/queries/home';

export function useHomeOverview() {
	const { defaults } = useSessionDefaults();
	const realThreshold = defaults.real_threshold;

	const [healthQuery, activeQuery, bucketsQuery, recentQuery] = useQueries({
		queries: [
			{ ...healthQueryOptions },
			{ ...homeActiveSessionsQueryOptions() },
			{ ...homeBuckets24hQueryOptions() },
			{ ...homeRecentSessionsQueryOptions() },
		],
	});

	const health = healthQuery.data;
	const liveSessions = activeQuery.data ?? [];
	const buckets = bucketsQuery.data;
	const recent = recentQuery.data ?? [];

	const chunks24h =
		buckets?.buckets.reduce((sum, b) => sum + b.chunks_total, 0) ?? 0;

	const closedWithRtf = recent.filter(
		(s) => s.closed_at !== null && s.last_rtf !== null,
	);
	const avgRtf =
		closedWithRtf.length > 0
			? closedWithRtf.reduce((sum, s) => sum + (s.last_rtf ?? 0), 0) /
				closedWithRtf.length
			: null;

	const kpis: KpiItem[] =
		health && buckets
			? [
					{
						label: 'Detector',
						value: health.model_loaded ? 'Ready' : 'Unavailable',
						live: health.status === 'ok' && health.model_loaded,
					},
					{
						label: 'Active now',
						value: String(liveSessions.length),
						live: liveSessions.length > 0,
					},
					{
						label: 'Chunks 24h',
						value: chunks24h.toLocaleString(),
						live: false,
					},
					{
						label: 'Avg speed',
						value: avgRtf !== null ? avgRtf.toFixed(2) : '—',
						live: false,
					},
				]
			: [];

	const recentSessions: RecentSession[] = recent.map((s) => ({
		id: shortSessionId(s.session_id),
		sessionId: s.session_id,
		score: s.avg_session_score ?? 0,
		label:
			s.avg_session_score !== null
				? deriveSessionLabel(
						s.avg_session_score,
						s.spoof_threshold,
						realThreshold,
					)
				: 'REAL',
	}));

	const firstError =
		healthQuery.error ??
		activeQuery.error ??
		bucketsQuery.error ??
		recentQuery.error;

	const loading =
		healthQuery.isPending ||
		activeQuery.isPending ||
		bucketsQuery.isPending ||
		recentQuery.isPending;

	const refresh = async () => {
		await Promise.all([
			healthQuery.refetch(),
			activeQuery.refetch(),
			bucketsQuery.refetch(),
			recentQuery.refetch(),
		]);
	};

	return {
		kpis,
		recentSessions,
		loading,
		error: firstError ? formatApiError(firstError) : null,
		refresh,
	};
}
