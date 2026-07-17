import { z } from 'zod';
import { ApiError } from './errors';
import { ClientErrorCode } from '@/lib/clientErrorCodes';
import { sessionDefaultsSchema } from '@/features/settings/sessionDefaultsSchema';

export { sessionDefaultsSchema };

/** Session IDs from POST /sessions and history routes */
export const sessionIdSchema = z
	.string()
	.trim()
	.min(8)
	.max(64)
	.regex(/^[a-zA-Z0-9_-]+$/, 'Invalid session ID format');

export function parseSessionId(value: unknown): string | undefined {
	const result = sessionIdSchema.safeParse(value);
	return result.success ? result.data : undefined;
}

export function requireSessionId(sessionId: string): string {
	const result = sessionIdSchema.safeParse(sessionId);
	if (!result.success) {
		throw new ApiError(
			'Invalid session ID',
			0,
			result.error.flatten(),
			null,
			ClientErrorCode.INVALID_SESSION_ID,
		);
	}
	return result.data;
}

export const healthResponseSchema = z.object({
	status: z.string(),
	device: z.string(),
	model_loaded: z.boolean(),
});

export const sessionConfigSchema = z.object({
	sample_rate: z.number(),
	chunk_samples: z.number(),
	chunk_duration_s: z.number(),
	chunk_overlap_s: z.number(),
	chunk_overlap_samples: z.number(),
	ema_alpha: z.number(),
	spoof_threshold: z.number(),
	vad_mode: z.number(),
	vad_frame_ms: z.number(),
	idle_timeout_s: z.number(),
});

export const createSessionRequestSchema = z.object({
	sample_rate: z.number().int().positive().optional(),
	chunk_duration_s: z.number().positive().optional(),
	chunk_overlap_s: z.number().min(0).optional(),
	ema_alpha: z.number().min(0).max(1).optional(),
	spoof_threshold: z.number().min(0).max(1).optional(),
	vad_mode: z.number().int().min(0).max(3).optional(),
	vad_frame_ms: z
		.union([z.literal(10), z.literal(20), z.literal(30)])
		.optional(),
	idle_timeout_s: z.number().positive().optional(),
});

export const listHistorySessionsParamsSchema = z.object({
	limit: z.number().int().min(1).max(100).optional(),
	offset: z.number().int().min(0).optional(),
	only_closed: z.boolean().optional(),
});

export const getSessionInferencesParamsSchema = z.object({
	since_chunk: z.number().int().min(0).optional(),
	limit: z.number().int().min(1).max(10_000).optional(),
	from_ts: z.number().optional(),
	to_ts: z.number().optional(),
});

export const getInferenceBucketsParamsSchema = z.object({
	from_ts: z.number().optional(),
	to_ts: z.number().optional(),
	bucket_s: z.number().int().positive().optional(),
});

export const createSessionResponseSchema = z.object({
	session_id: sessionIdSchema,
	config: sessionConfigSchema,
});

export const liveSessionSchema = z.object({
	session_id: sessionIdSchema,
	status: z.string(),
	created_at: z.number(),
	last_frame_at: z.number().nullable(),
	frames_seen: z.number(),
	chunks_inferred: z.number(),
	last_chunk_prob: z.number().nullable(),
	last_session_score: z.number().nullable(),
	config: sessionConfigSchema,
});

export const framesAckSchema = z.object({
	type: z.literal('ack'),
	frame_idx: z.number(),
	voiced: z.boolean(),
	voiced_samples: z.number(),
});

export const framesErrorSchema = z.object({
	type: z.literal('error'),
	code: z.enum([
		'frame_too_large',
		'decode_failed',
		'invalid_sample_rate',
		'invalid_control',
	]),
});

export const framesMessageSchema = z.discriminatedUnion('type', [
	framesAckSchema,
	framesErrorSchema,
]);

export const outputScoreSchema = z.object({
	type: z.literal('score'),
	session_id: sessionIdSchema,
	chunk_idx: z.number(),
	chunk_prob: z.number(),
	session_score: z.number(),
	latency_ms: z.number(),
	rtf: z.number(),
});

export const outputWarmupSchema = z.object({
	type: z.literal('warmup'),
	session_id: sessionIdSchema,
	buffer_fill_samples: z.number(),
	buffer_target_samples: z.number(),
});

export const outputErrorSchema = z.object({
	type: z.literal('error'),
	session_id: sessionIdSchema,
	code: z.enum(['decode_failed', 'infer_failed']),
	message: z.string(),
});

export const outputMessageSchema = z.discriminatedUnion('type', [
	outputScoreSchema,
	outputWarmupSchema,
	outputErrorSchema,
]);

export const historySessionSummarySchema = z.object({
	session_id: sessionIdSchema,
	created_at: z.number(),
	closed_at: z.number().nullable(),
	sample_rate: z.number(),
	chunk_duration_s: z.number(),
	ema_alpha: z.number(),
	spoof_threshold: z.number(),
	device: z.string().nullable(),
	frames_seen: z.number(),
	chunks_inferred: z.number(),
	last_rtf: z.number().nullable(),
	avg_session_score: z.number().nullable(),
	avg_latency_ms: z.number().nullable(),
	voiced_frames: z.number().nullable(),
	voice_activity: z.number().nullable(),
});

export const historyInferenceEntrySchema = z.object({
	session_id: sessionIdSchema,
	chunk_idx: z.number(),
	ts: z.number(),
	chunk_prob: z.number(),
	session_score: z.number(),
	rtf: z.number(),
});

export const historyInferencesResponseSchema = z.object({
	session_id: sessionIdSchema,
	count: z.number(),
	entries: z.array(historyInferenceEntrySchema),
});

export const inferenceBucketSchema = z.object({
	t_start: z.number(),
	chunks_total: z.number(),
	chunks_spoof: z.number(),
});

export const inferenceBucketsResponseSchema = z.object({
	from_ts: z.number(),
	to_ts: z.number(),
	bucket_s: z.number(),
	buckets: z.array(inferenceBucketSchema),
});

export const historyEventTypeSchema = z.enum([
	'created',
	'closed',
	'reset',
	'set_sample_rate',
	'idle_evicted',
	'decode_failed',
	'infer_failed',
]);

export const getHistoryEventsParamsSchema = z.object({
	limit: z.number().int().min(1).max(500).optional(),
	before_ts: z.number().optional(),
	event_type: z.array(historyEventTypeSchema).optional(),
});

export const historyEventSchema = z.object({
	id: z.number(),
	session_id: sessionIdSchema,
	ts: z.number(),
	event_type: historyEventTypeSchema,
	details: z.record(z.string(), z.unknown()).nullable(),
});

export const historyEventsResponseSchema = z.object({
	count: z.number(),
	entries: z.array(historyEventSchema),
});

const PARAM_LABEL_TO_CODE: Record<string, ClientErrorCode> = {
	'history list params': ClientErrorCode.INVALID_HISTORY_LIST_PARAMS,
	'inference query params': ClientErrorCode.INVALID_INFERENCE_QUERY_PARAMS,
	'inference bucket params': ClientErrorCode.INVALID_INFERENCE_BUCKET_PARAMS,
	'history events params': ClientErrorCode.INVALID_HISTORY_EVENTS_PARAMS,
};

export function parseJsonMessage<T>(
	raw: string,
	schema: z.ZodType<T>,
): T | null {
	try {
		const json: unknown = JSON.parse(raw);
		const result = schema.safeParse(json);
		return result.success ? result.data : null;
	} catch {
		return null;
	}
}

export function parseRequestParams<T>(
	schema: z.ZodType<T>,
	params: unknown,
	label: string,
): T {
	const result = schema.safeParse(params);
	if (!result.success) {
		throw new ApiError(
			`Invalid ${label}`,
			0,
			result.error.flatten(),
			null,
			PARAM_LABEL_TO_CODE[label] ?? null,
		);
	}
	return result.data;
}
