import { useCallback, useEffect, useMemo, useState } from 'react';
import { getHistorySession, getSessionInferences, parseSessionId } from '@/api';
import type { ChunkTimelineItem, SessionLabel } from '@/types';
import type { HistorySessionSummary, HistoryInferenceEntry } from '@/types/api';
import { formatApiError } from '@/lib/apiError';
import {
	formatDurationFromTimestamps,
	formatSessionLabel,
	formatTimestamp,
} from '@/lib/formatSession';
import { deriveSessionLabel } from '@/lib/sessionLabel';

export type SessionReportData = {
	session: HistorySessionSummary | null;
	inferences: HistoryInferenceEntry[];
	duration: string;
	label: SessionLabel | '—';
	chunkCount: number;
	timeline: ChunkTimelineItem[];
	loading: boolean;
	error: string | null;
	refresh: () => void;
};

export function useSessionReport(
	sessionId: string | undefined,
): SessionReportData {
	const [session, setSession] = useState<HistorySessionSummary | null>(null);
	const [inferences, setInferences] = useState<HistoryInferenceEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const validatedSessionId = useMemo(
		() => parseSessionId(sessionId),
		[sessionId],
	);

	const load = useCallback(async () => {
		if (!sessionId) {
			setLoading(false);
			setError('Session not found');
			return;
		}

		if (!validatedSessionId) {
			setLoading(false);
			setError('Invalid session ID');
			setSession(null);
			setInferences([]);
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const [sess, inf] = await Promise.all([
				getHistorySession(validatedSessionId),
				getSessionInferences(validatedSessionId, { limit: 1000 }),
			]);
			setSession(sess);
			setInferences(inf.entries);
		} catch (e) {
			setError(formatApiError(e));
			setSession(null);
			setInferences([]);
		} finally {
			setLoading(false);
		}
	}, [sessionId, validatedSessionId]);

	useEffect(() => {
		load();
	}, [load]);

	const duration = session
		? formatDurationFromTimestamps(session.created_at, session.closed_at)
		: '—';

	const label = session
		? formatSessionLabel(session.avg_session_score, session.spoof_threshold)
		: '—';

	const timeline: ChunkTimelineItem[] = useMemo(() => {
		if (!session) return [];
		return inferences.map((entry) => ({
			time: formatTimestamp(entry.ts),
			score: entry.session_score,
			label: deriveSessionLabel(
				entry.session_score,
				session.spoof_threshold,
			),
		}));
	}, [inferences, session]);

	return {
		session,
		inferences,
		duration,
		label,
		chunkCount: session?.chunks_inferred ?? inferences.length,
		timeline,
		loading,
		error,
		refresh: load,
	};
}
