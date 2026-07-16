import { z } from 'zod';

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
	sample_rate: z.number().optional(),
	chunk_duration_s: z.number().optional(),
	chunk_overlap_s: z.number().optional(),
	ema_alpha: z.number().optional(),
	spoof_threshold: z.number().optional(),
	vad_mode: z.number().optional(),
	vad_frame_ms: z.number().optional(),
	idle_timeout_s: z.number().optional(),
});

/** Persisted device settings — validate on read/write from AsyncStorage */
export const sessionDefaultsSchema = z.object({
	sample_rate: z.number().int().positive(),
	chunk_duration_s: z.number().positive(),
	ema_alpha: z.number().min(0.1).max(0.9),
	spoof_threshold: z.number().min(0.1).max(0.9),
});

export const createSessionResponseSchema = z.object({
	session_id: z.string(),
	config: sessionConfigSchema,
});

export const liveSessionSchema = z.object({
	session_id: z.string(),
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
	session_id: z.string(),
	chunk_idx: z.number(),
	chunk_prob: z.number(),
	session_score: z.number(),
	latency_ms: z.number(),
	rtf: z.number(),
});

export const outputWarmupSchema = z.object({
	type: z.literal('warmup'),
	session_id: z.string(),
	buffer_fill_samples: z.number(),
	buffer_target_samples: z.number(),
});

export const outputErrorSchema = z.object({
	type: z.literal('error'),
	session_id: z.string(),
	code: z.enum(['decode_failed', 'infer_failed']),
	message: z.string(),
});

export const outputMessageSchema = z.discriminatedUnion('type', [
	outputScoreSchema,
	outputWarmupSchema,
	outputErrorSchema,
]);

export const historySessionSummarySchema = z.object({
	session_id: z.string(),
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
	session_id: z.string(),
	chunk_idx: z.number(),
	ts: z.number(),
	chunk_prob: z.number(),
	session_score: z.number(),
	rtf: z.number(),
});

export const historyInferencesResponseSchema = z.object({
	session_id: z.string(),
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

export const historyEventSchema = z.object({
	id: z.number(),
	session_id: z.string(),
	ts: z.number(),
	event_type: historyEventTypeSchema,
	details: z.record(z.string(), z.unknown()).nullable(),
});

export const historyEventsResponseSchema = z.object({
	count: z.number(),
	entries: z.array(historyEventSchema),
});

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
