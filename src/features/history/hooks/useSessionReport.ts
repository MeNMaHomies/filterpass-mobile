import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { parseSessionId } from '@/api';
import type { ChunkTimelineItem, SessionLabel } from '@/types';
import type { HistorySessionSummary, HistoryInferenceEntry } from '@/types/api';
import {
	messageForClientErrorCode,
	REST_ERROR_MESSAGES,
} from '@/lib/apiErrorMessages';
import { ClientErrorCode } from '@/lib/clientErrorCodes';
import { formatApiError } from '@/lib/apiError';
import {
	formatDurationFromTimestamps,
	formatSessionLabel,
	formatTimestamp,
} from '@/lib/formatSession';
import { deriveSessionLabel } from '@/lib/sessionLabel';
import { useSessionDefaults } from '@/features/settings/hooks/useSessionDefaults';
import {
	historyInferencesQueryOptions,
	historySessionQueryOptions,
} from '@/queries/historySession';

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
	const { defaults } = useSessionDefaults();
	const realThreshold = defaults.real_threshold;

	const enabled = Boolean(sessionId && validatedSessionId);

	const [sessionQuery, inferencesQuery] = useQueries({
		queries: [
			{
				...historySessionQueryOptions(validatedSessionId ?? ''),
				enabled,
			},
			{
				...historyInferencesQueryOptions(validatedSessionId ?? '', {
					limit: 1000,
				}),
				enabled,
			},
		],
	});

	const session = sessionQuery.data ?? null;
	const inferences = inferencesQuery.data?.entries ?? [];

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

	const queryError =
		sessionQuery.error ?? inferencesQuery.error
			? formatApiError(sessionQuery.error ?? inferencesQuery.error)
			: null;

	const resolvedError = validationError ?? queryError;
	const resolvedLoading =
		enabled &&
		!validationError &&
		(sessionQuery.isPending || inferencesQuery.isPending);

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
			if (validationError) return;
			await Promise.all([sessionQuery.refetch(), inferencesQuery.refetch()]);
		},
	};
}
