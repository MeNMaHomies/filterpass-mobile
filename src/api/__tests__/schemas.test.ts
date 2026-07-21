import {
	healthResponseSchema,
	outputScoreSchema,
	parseJsonMessage,
	sessionDefaultsSchema,
} from '@/api/schemas';

describe('healthResponseSchema', () => {
	it('accepts valid health payload', () => {
		const result = healthResponseSchema.safeParse({
			status: 'ok',
			device: 'cpu',
			model_loaded: true,
		});
		expect(result.success).toBe(true);
	});

	it('rejects missing fields', () => {
		const result = healthResponseSchema.safeParse({ status: 'ok' });
		expect(result.success).toBe(false);
	});
});

describe('outputScoreSchema', () => {
	it('parses score websocket message', () => {
		const result = outputScoreSchema.safeParse({
			type: 'score',
			session_id: 'a3f9c2e1b7d4',
			chunk_idx: 1,
			chunk_prob: 0.7,
			session_score: 0.6,
			latency_ms: 12,
			rtf: 0.02,
		});
		expect(result.success).toBe(true);
	});
});

describe('sessionDefaultsSchema', () => {
	it('rejects out-of-range spoof threshold', () => {
		const result = sessionDefaultsSchema.safeParse({
			ema_alpha: 0.3,
			spoof_threshold: 2,
		});
		expect(result.success).toBe(false);
	});
});

describe('parseJsonMessage', () => {
	it('returns null for invalid JSON', () => {
		expect(parseJsonMessage('not-json', healthResponseSchema)).toBeNull();
	});

	it('returns parsed object for valid message', () => {
		const raw = JSON.stringify({
			status: 'ok',
			device: 'cpu',
			model_loaded: true,
		});
		expect(parseJsonMessage(raw, healthResponseSchema)).toEqual({
			status: 'ok',
			device: 'cpu',
			model_loaded: true,
		});
	});
});
