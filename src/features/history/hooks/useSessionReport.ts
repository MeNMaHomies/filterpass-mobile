import { useCallback, useMemo, useRef } from 'react';
import { getHistorySession, getSessionInferences, parseSessionId } from '@/api';
import type { ChunkTimelineItem, SessionLabel } from '@/types';
import type { HistorySessionSummary, HistoryInferenceEntry } from '@/types/api';
import {
	messageForClientErrorCode,
	REST_ERROR_MESSAGES,
} from '@/lib/apiErrorMessages';
import { ClientErrorCode } from '@/lib/clientErrorCodes';
import {
	formatDurationFromTimestamps,
	formatSessionLabel,
	formatTimestamp,
} from '@/lib/formatSession';
import { deriveSessionLabel } from '@/lib/sessionLabel';
import { ensureSessionDefaults } from '@/features/settings/sessionDefaultsStore';
import { useAsyncResource } from '@/hooks/useAsyncResource';

export type SessionReportPayload = {
	session: HistorySessionSummary | null;
	inferences: HistoryInferenceEntry[];
	realThreshold: number;
};

const EMPTY_REPORT: SessionReportPayload = {
	session: null,
	inferences: [],
	realThreshold: 0.4,
};

export type SessionReportData = {
	session: HistorySessionSummary | null;
	inferences: HistoryInferenceEntry[];
	duration: string;
	label: SessionLabel | '—';
	chunkCount: number;
	timeline: ChunkTimelineItem[];
	loading: boolean;
	error: string | null;
	refresh: () => Promise<void>;
};

export function useSessionReport(
	sessionId: string | undefined,
): SessionReportData {
	const validatedSessionId = useMemo(
		() => parseSessionId(sessionId),
		[sessionId],
	);
	const realThresholdRef = useRef(0.4);

	const load = useCallback(async (): Promise<SessionReportPayload> => {
		const defaults = await ensureSessionDefaults();
		realThresholdRef.current = defaults.real_threshold;

		const [sess, inf] = await Promise.all([
			getHistorySession(validatedSessionId!),
			getSessionInferences(validatedSessionId!, { limit: 1000 }),
		]);

		return {
			session: sess,
			inferences: inf.entries,
			realThreshold: defaults.real_threshold,
		};
	}, [validatedSessionId]);

	const enabled = Boolean(sessionId && validatedSessionId);
	const {
		data,
		loading,
		error,
		refresh,
		setData,
	} = useAsyncResource(EMPTY_REPORT, load, { enabled });

	const session = data.session;
	const inferences = data.inferences;
	const realThreshold = data.realThreshold;

	const duration = session
		? formatDurationFromTimestamps(session.created_at, session.closed_at)
		: '—';

	const label = session
		? formatSessionLabel(
				session.avg_session_score,
				session.spoof_threshold,
				realThreshold,
			)
		: '—';

	const timeline: ChunkTimelineItem[] = useMemo(() => {
		if (!session) return [];
		return inferences.map((entry) => ({
			time: formatTimestamp(entry.ts),
			score: entry.session_score,
			label: deriveSessionLabel(
				entry.session_score,
				session.spoof_threshold,
				realThreshold,
			),
		}));
	}, [inferences, session, realThreshold]);

	const validationError = useMemo(() => {
		if (!sessionId) return REST_ERROR_MESSAGES.session_not_found;
		if (sessionId && !validatedSessionId) {
			return messageForClientErrorCode(ClientErrorCode.INVALID_SESSION_ID);
		}
		return null;
	}, [sessionId, validatedSessionId]);

	const resolvedError = validationError ?? error;
	const resolvedLoading = enabled && !validationError && loading;

	return {
		session,
		inferences,
		duration,
		label,
		chunkCount: session?.chunks_inferred ?? inferences.length,
		timeline,
		loading: resolvedLoading,
		error: resolvedError,
		refresh: async () => {
			if (validationError) {
				setData(EMPTY_REPORT);
				return;
			}
			await refresh();
		},
	};
}
