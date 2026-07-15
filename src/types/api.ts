// Wire contract — mirrors docs/api.md

export type HealthResponse = {
	status: string;
	device: string;
	model_loaded: boolean;
};

export type CreateSessionRequest = {
	sample_rate?: number;
	chunk_duration_s?: number;
	chunk_overlap_s?: number;
	ema_alpha?: number;
	spoof_threshold?: number;
	vad_mode?: number;
	vad_frame_ms?: number;
	idle_timeout_s?: number;
};

export type SessionConfig = {
	sample_rate: number;
	chunk_samples: number;
	chunk_duration_s: number;
	chunk_overlap_s: number;
	chunk_overlap_samples: number;
	ema_alpha: number;
	spoof_threshold: number;
	vad_mode: number;
	vad_frame_ms: number;
	idle_timeout_s: number;
};

export type LiveSession = {
	session_id: string;
	status: string;
	created_at: number;
	last_frame_at: number | null;
	frames_seen: number;
	chunks_inferred: number;
	last_chunk_prob: number | null;
	last_session_score: number | null;
	config: SessionConfig;
};

export type CreateSessionResponse = {
	session_id: string;
	config: SessionConfig;
};

// WebSocket — frames channel
export type FramesAck = {
	type: 'ack';
	frame_idx: number;
	voiced: boolean;
	voiced_samples: number;
};

export type FramesError = {
	type: 'error';
	code:
		| 'frame_too_large'
		| 'decode_failed'
		| 'invalid_sample_rate'
		| 'invalid_control';
};

export type FramesMessage = FramesAck | FramesError;

// WebSocket — output channel
export type OutputScore = {
	type: 'score';
	session_id: string;
	chunk_idx: number;
	chunk_prob: number;
	session_score: number;
	latency_ms: number;
	rtf: number;
};

export type OutputWarmup = {
	type: 'warmup';
	session_id: string;
	buffer_fill_samples: number;
	buffer_target_samples: number;
};

export type OutputError = {
	type: 'error';
	session_id: string;
	code: 'decode_failed' | 'infer_failed';
	message: string;
};

export type OutputMessage = OutputScore | OutputWarmup | OutputError;

// History
export type HistorySessionSummary = {
	session_id: string;
	created_at: number;
	closed_at: number | null;
	sample_rate: number;
	chunk_duration_s: number;
	ema_alpha: number;
	spoof_threshold: number;
	device: string | null;
	frames_seen: number;
	chunks_inferred: number;
	last_rtf: number | null;
	avg_session_score: number | null;
	avg_latency_ms: number | null;
	voiced_frames: number | null;
	voice_activity: number | null;
};

export type HistoryInferenceEntry = {
	session_id: string;
	chunk_idx: number;
	ts: number;
	chunk_prob: number;
	session_score: number;
	rtf: number;
};

export type HistoryInferencesResponse = {
	session_id: string;
	count: number;
	entries: HistoryInferenceEntry[];
};

export type InferenceBucket = {
	t_start: number;
	chunks_total: number;
	chunks_spoof: number;
};

export type InferenceBucketsResponse = {
	from_ts: number;
	to_ts: number;
	bucket_s: number;
	buckets: InferenceBucket[];
};

export type HistoryEventType =
	| 'created'
	| 'closed'
	| 'reset'
	| 'set_sample_rate'
	| 'idle_evicted'
	| 'decode_failed'
	| 'infer_failed';

export type HistoryEvent = {
	id: number;
	session_id: string;
	ts: number;
	event_type: HistoryEventType;
	details: Record<string, unknown> | null;
};

export type HistoryEventsResponse = {
	count: number;
	entries: HistoryEvent[];
};

export type ApiErrorCode =
	| 'session_not_found'
	| 'session_limit_reached'
	| 'unknown';
