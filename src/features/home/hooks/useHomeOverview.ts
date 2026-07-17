import { useCallback, useEffect, useRef, useState } from 'react';
import { getHealth, getInferenceBuckets, listHistorySessions } from '@/api';
import type { KpiItem, RecentSession } from '@/types';
import { deriveSessionLabel } from '@/lib/sessionLabel';
import { shortSessionId } from '@/lib/formatSession';
import { ensureSessionDefaults } from '@/features/settings/sessionDefaultsStore';
import { useAsyncResource } from '@/hooks/useAsyncResource';

type HomeOverviewData = {
	kpis: KpiItem[];
	recentSessions: RecentSession[];
};

const EMPTY_OVERVIEW: HomeOverviewData = {
	kpis: [],
	recentSessions: [],
};

export function useHomeOverview() {
	const realThresholdRef = useRef(0.4);

	const load = useCallback(async (): Promise<HomeOverviewData> => {
		const defaults = await ensureSessionDefaults();
		realThresholdRef.current = defaults.real_threshold;

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

		const kpis: KpiItem[] = [
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
		];

		const recentSessions: RecentSession[] = recent.map((s) => ({
			id: shortSessionId(s.session_id),
			sessionId: s.session_id,
			score: s.avg_session_score ?? 0,
			label:
				s.avg_session_score !== null
					? deriveSessionLabel(
							s.avg_session_score,
							s.spoof_threshold,
							realThresholdRef.current,
						)
					: 'REAL',
		}));

		return { kpis, recentSessions };
	}, []);

	const { data, loading, error, refresh } = useAsyncResource(
		EMPTY_OVERVIEW,
		load,
	);

	return {
		kpis: data.kpis,
		recentSessions: data.recentSessions,
		loading,
		error,
		refresh,
	};
}
