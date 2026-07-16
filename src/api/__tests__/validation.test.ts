import { apiUrlSchema } from '@/config/env';
import {
	createSessionRequestSchema,
	listHistorySessionsParamsSchema,
	parseRequestParams,
	parseSessionId,
	requireSessionId,
	sessionIdSchema,
} from '@/api/schemas';
import { ApiError } from '@/api/errors';

describe('sessionIdSchema', () => {
	it('accepts alphanumeric session ids', () => {
		expect(sessionIdSchema.safeParse('a3f9c2e1b7d4').success).toBe(true);
	});

	it('rejects ids that are too short', () => {
		expect(sessionIdSchema.safeParse('abc').success).toBe(false);
	});

	it('rejects ids with invalid characters', () => {
		expect(sessionIdSchema.safeParse('bad/id/here').success).toBe(false);
	});
});

describe('parseSessionId', () => {
	it('returns undefined for invalid values', () => {
		expect(parseSessionId('')).toBeUndefined();
		expect(parseSessionId('short')).toBeUndefined();
	});

	it('returns trimmed valid ids', () => {
		expect(parseSessionId('  a3f9c2e1b7d4  ')).toBe('a3f9c2e1b7d4');
	});
});

describe('requireSessionId', () => {
	it('throws ApiError for invalid ids', () => {
		expect(() => requireSessionId('bad')).toThrow(ApiError);
	});
});

describe('apiUrlSchema', () => {
	it('accepts localhost http urls', () => {
		expect(apiUrlSchema.safeParse('http://localhost:8000').success).toBe(true);
	});

	it('accepts lan ip urls', () => {
		expect(apiUrlSchema.safeParse('http://192.168.1.102:8000').success).toBe(
			true,
		);
	});

	it('rejects non-http schemes', () => {
		expect(apiUrlSchema.safeParse('ws://localhost:8000').success).toBe(false);
	});
});

describe('createSessionRequestSchema', () => {
	it('accepts valid optional fields', () => {
		const result = createSessionRequestSchema.safeParse({
			sample_rate: 16000,
			spoof_threshold: 0.6,
		});
		expect(result.success).toBe(true);
	});

	it('rejects invalid vad_frame_ms', () => {
		const result = createSessionRequestSchema.safeParse({
			vad_frame_ms: 25,
		});
		expect(result.success).toBe(false);
	});

	it('rejects spoof threshold outside 0-1', () => {
		const result = createSessionRequestSchema.safeParse({
			spoof_threshold: 1.5,
		});
		expect(result.success).toBe(false);
	});
});

describe('listHistorySessionsParamsSchema', () => {
	it('rejects limit above max', () => {
		const result = listHistorySessionsParamsSchema.safeParse({ limit: 1000 });
		expect(result.success).toBe(false);
	});
});

describe('parseRequestParams', () => {
	it('throws ApiError with label on invalid params', () => {
		expect(() =>
			parseRequestParams(
				listHistorySessionsParamsSchema,
				{ limit: -1 },
				'history list params',
			),
		).toThrow('Invalid history list params');
	});
});
