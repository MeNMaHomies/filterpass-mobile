// Wire contract — Zod is canonical; types are inferred from `@/api/schemas`.
import type { z } from 'zod';
import type {
	createSessionRequestSchema,
	createSessionResponseSchema,
	framesAckSchema,
	framesErrorSchema,
	framesMessageSchema,
	getHistoryEventsParamsSchema,
	getInferenceBucketsParamsSchema,
	getSessionInferencesParamsSchema,
	healthResponseSchema,
	historyEventSchema,
	historyEventTypeSchema,
	historyEventsResponseSchema,
	historyInferenceEntrySchema,
	historyInferencesResponseSchema,
	historySessionSummarySchema,
	inferenceBucketSchema,
	inferenceBucketsResponseSchema,
	listHistorySessionsParamsSchema,
	liveSessionSchema,
	outputErrorSchema,
	outputMessageSchema,
	outputScoreSchema,
	outputWarmupSchema,
	sessionConfigSchema,
} from '@/api/schemas';

export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type CreateSessionRequest = z.infer<typeof createSessionRequestSchema>;
export type SessionConfig = z.infer<typeof sessionConfigSchema>;
export type LiveSession = z.infer<typeof liveSessionSchema>;
export type CreateSessionResponse = z.infer<typeof createSessionResponseSchema>;

export type FramesAck = z.infer<typeof framesAckSchema>;
export type FramesError = z.infer<typeof framesErrorSchema>;
export type FramesMessage = z.infer<typeof framesMessageSchema>;

export type OutputScore = z.infer<typeof outputScoreSchema>;
export type OutputWarmup = z.infer<typeof outputWarmupSchema>;
export type OutputError = z.infer<typeof outputErrorSchema>;
export type OutputMessage = z.infer<typeof outputMessageSchema>;

export type HistorySessionSummary = z.infer<typeof historySessionSummarySchema>;
export type HistoryInferenceEntry = z.infer<typeof historyInferenceEntrySchema>;
export type HistoryInferencesResponse = z.infer<
	typeof historyInferencesResponseSchema
>;
export type InferenceBucket = z.infer<typeof inferenceBucketSchema>;
export type InferenceBucketsResponse = z.infer<
	typeof inferenceBucketsResponseSchema
>;
export type HistoryEventType = z.infer<typeof historyEventTypeSchema>;
export type HistoryEvent = z.infer<typeof historyEventSchema>;
export type HistoryEventsResponse = z.infer<typeof historyEventsResponseSchema>;

export type ListHistorySessionsParams = z.infer<
	typeof listHistorySessionsParamsSchema
>;
export type GetSessionInferencesParams = z.infer<
	typeof getSessionInferencesParamsSchema
>;
export type GetInferenceBucketsParams = z.infer<
	typeof getInferenceBucketsParamsSchema
>;
export type GetHistoryEventsParams = z.infer<
	typeof getHistoryEventsParamsSchema
>;

export type ApiErrorCode =
	| 'session_not_found'
	| 'session_limit_reached'
	| 'unknown';
