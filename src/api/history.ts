import { z } from 'zod';
import { apiRequest } from './client';
import {
	getHistoryEventsParamsSchema,
	getInferenceBucketsParamsSchema,
	getSessionInferencesParamsSchema,
	historyEventsResponseSchema,
	historyInferencesResponseSchema,
	historySessionSummarySchema,
	inferenceBucketsResponseSchema,
	listHistorySessionsParamsSchema,
	parseRequestParams,
	requireSessionId,
} from './schemas';
import type {
	HistoryEventsResponse,
	HistoryInferencesResponse,
	HistorySessionSummary,
	InferenceBucketsResponse,
} from '@/types/api';

export type ListHistorySessionsParams = z.infer<
	typeof listHistorySessionsParamsSchema
>;

const historySessionListSchema = z.array(historySessionSummarySchema);

export function listHistorySessions(
	params: ListHistorySessionsParams = {},
): Promise<HistorySessionSummary[]> {
	const validated = parseRequestParams(
		listHistorySessionsParamsSchema,
		params,
		'history list params',
	);

	const search = new URLSearchParams();
	if (validated.limit !== undefined) {
		search.set('limit', String(validated.limit));
	}
	if (validated.offset !== undefined) {
		search.set('offset', String(validated.offset));
	}
	if (validated.only_closed !== undefined) {
		search.set('only_closed', String(validated.only_closed));
	}
	const qs = search.toString();
	return apiRequest<HistorySessionSummary[]>(
		`/history/sessions${qs ? `?${qs}` : ''}`,
		{ schema: historySessionListSchema },
	);
}

export function getHistorySession(
	sessionId: string,
): Promise<HistorySessionSummary> {
	const id = requireSessionId(sessionId);
	return apiRequest<HistorySessionSummary>(`/history/sessions/${id}`, {
		schema: historySessionSummarySchema,
	});
}

export type GetSessionInferencesParams = z.infer<
	typeof getSessionInferencesParamsSchema
>;

export function getSessionInferences(
	sessionId: string,
	params: GetSessionInferencesParams = {},
): Promise<HistoryInferencesResponse> {
	const id = requireSessionId(sessionId);
	const validated = parseRequestParams(
		getSessionInferencesParamsSchema,
		params,
		'inference query params',
	);

	const search = new URLSearchParams();
	if (validated.since_chunk !== undefined) {
		search.set('since_chunk', String(validated.since_chunk));
	}
	if (validated.limit !== undefined) search.set('limit', String(validated.limit));
	if (validated.from_ts !== undefined) {
		search.set('from_ts', String(validated.from_ts));
	}
	if (validated.to_ts !== undefined) search.set('to_ts', String(validated.to_ts));
	const qs = search.toString();
	return apiRequest<HistoryInferencesResponse>(
		`/history/sessions/${id}/inferences${qs ? `?${qs}` : ''}`,
		{ schema: historyInferencesResponseSchema },
	);
}

export type GetInferenceBucketsParams = z.infer<
	typeof getInferenceBucketsParamsSchema
>;

export function getInferenceBuckets(
	params: GetInferenceBucketsParams = {},
): Promise<InferenceBucketsResponse> {
	const validated = parseRequestParams(
		getInferenceBucketsParamsSchema,
		params,
		'inference bucket params',
	);

	const search = new URLSearchParams();
	if (validated.from_ts !== undefined) {
		search.set('from_ts', String(validated.from_ts));
	}
	if (validated.to_ts !== undefined) search.set('to_ts', String(validated.to_ts));
	if (validated.bucket_s !== undefined) {
		search.set('bucket_s', String(validated.bucket_s));
	}
	const qs = search.toString();
	return apiRequest<InferenceBucketsResponse>(
		`/history/inferences/buckets${qs ? `?${qs}` : ''}`,
		{ schema: inferenceBucketsResponseSchema },
	);
}

export type GetHistoryEventsParams = z.infer<
	typeof getHistoryEventsParamsSchema
>;

export function getHistoryEvents(
	params: GetHistoryEventsParams = {},
): Promise<HistoryEventsResponse> {
	const validated = parseRequestParams(
		getHistoryEventsParamsSchema,
		params,
		'history events params',
	);

	const search = new URLSearchParams();
	if (validated.limit !== undefined) search.set('limit', String(validated.limit));
	if (validated.before_ts !== undefined) {
		search.set('before_ts', String(validated.before_ts));
	}
	if (validated.event_type) {
		for (const t of validated.event_type) {
			search.append('event_type', t);
		}
	}
	const qs = search.toString();
	return apiRequest<HistoryEventsResponse>(`/history/events${qs ? `?${qs}` : ''}`, {
		schema: historyEventsResponseSchema,
	});
}

export function deleteHistorySession(sessionId: string): Promise<void> {
	const id = requireSessionId(sessionId);
	return apiRequest<void>(`/history/sessions/${id}`, {
		method: 'DELETE',
	});
}
