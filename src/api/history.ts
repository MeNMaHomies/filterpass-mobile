import { apiRequest } from './client';
import type {
	HistoryEventsResponse,
	HistoryInferencesResponse,
	HistorySessionSummary,
	InferenceBucketsResponse,
} from '@/types/api';

export type ListHistorySessionsParams = {
	limit?: number;
	offset?: number;
	only_closed?: boolean;
};

export function listHistorySessions(
	params: ListHistorySessionsParams = {},
): Promise<HistorySessionSummary[]> {
	const search = new URLSearchParams();
	if (params.limit !== undefined) search.set('limit', String(params.limit));
	if (params.offset !== undefined) search.set('offset', String(params.offset));
	if (params.only_closed !== undefined) {
		search.set('only_closed', String(params.only_closed));
	}
	const qs = search.toString();
	return apiRequest<HistorySessionSummary[]>(
		`/history/sessions${qs ? `?${qs}` : ''}`,
	);
}

export function getHistorySession(
	sessionId: string,
): Promise<HistorySessionSummary> {
	return apiRequest<HistorySessionSummary>(`/history/sessions/${sessionId}`);
}

export type GetSessionInferencesParams = {
	since_chunk?: number;
	limit?: number;
	from_ts?: number;
	to_ts?: number;
};

export function getSessionInferences(
	sessionId: string,
	params: GetSessionInferencesParams = {},
): Promise<HistoryInferencesResponse> {
	const search = new URLSearchParams();
	if (params.since_chunk !== undefined) {
		search.set('since_chunk', String(params.since_chunk));
	}
	if (params.limit !== undefined) search.set('limit', String(params.limit));
	if (params.from_ts !== undefined) search.set('from_ts', String(params.from_ts));
	if (params.to_ts !== undefined) search.set('to_ts', String(params.to_ts));
	const qs = search.toString();
	return apiRequest<HistoryInferencesResponse>(
		`/history/sessions/${sessionId}/inferences${qs ? `?${qs}` : ''}`,
	);
}

export type GetInferenceBucketsParams = {
	from_ts?: number;
	to_ts?: number;
	bucket_s?: number;
};

export function getInferenceBuckets(
	params: GetInferenceBucketsParams = {},
): Promise<InferenceBucketsResponse> {
	const search = new URLSearchParams();
	if (params.from_ts !== undefined) search.set('from_ts', String(params.from_ts));
	if (params.to_ts !== undefined) search.set('to_ts', String(params.to_ts));
	if (params.bucket_s !== undefined) search.set('bucket_s', String(params.bucket_s));
	const qs = search.toString();
	return apiRequest<InferenceBucketsResponse>(
		`/history/inferences/buckets${qs ? `?${qs}` : ''}`,
	);
}

export type GetHistoryEventsParams = {
	limit?: number;
	before_ts?: number;
	event_type?: string[];
};

export function getHistoryEvents(
	params: GetHistoryEventsParams = {},
): Promise<HistoryEventsResponse> {
	const search = new URLSearchParams();
	if (params.limit !== undefined) search.set('limit', String(params.limit));
	if (params.before_ts !== undefined) {
		search.set('before_ts', String(params.before_ts));
	}
	if (params.event_type) {
		for (const t of params.event_type) {
			search.append('event_type', t);
		}
	}
	const qs = search.toString();
	return apiRequest<HistoryEventsResponse>(
		`/history/events${qs ? `?${qs}` : ''}`,
	);
}

export function deleteHistorySession(sessionId: string): Promise<void> {
	return apiRequest<void>(`/history/sessions/${sessionId}`, {
		method: 'DELETE',
	});
}
