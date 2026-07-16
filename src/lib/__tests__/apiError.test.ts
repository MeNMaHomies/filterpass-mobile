import { ApiError } from '@/api/errors';
import { WsCloseError } from '@/api/ws/url';
import {
	formatApiError,
	formatWsFramesError,
	formatWsOutputError,
	parseApiErrorDetail,
} from '@/lib/apiError';

describe('parseApiErrorDetail', () => {
	it('parses snake_case string codes', () => {
		expect(parseApiErrorDetail({ detail: 'session_not_found' })).toEqual({
			code: 'session_not_found',
		});
	});

	it('parses human-readable string messages', () => {
		expect(parseApiErrorDetail({ detail: 'Session expired' })).toEqual({
			message: 'Session expired',
		});
	});

	it('parses FastAPI validation arrays', () => {
		expect(
			parseApiErrorDetail({
				detail: [{ msg: 'from_ts must be before to_ts' }],
			}),
		).toEqual({ message: 'from_ts must be before to_ts' });
	});

	it('parses object detail with code and message', () => {
		expect(
			parseApiErrorDetail({
				detail: { code: 'infer_failed', message: 'GPU OOM' },
			}),
		).toEqual({ code: 'infer_failed', message: 'GPU OOM' });
	});
});

describe('formatApiError', () => {
	it('maps REST session_not_found', () => {
		const error = new ApiError(
			'session_not_found',
			404,
			{ detail: 'session_not_found' },
			null,
		);
		expect(formatApiError(error)).toBe(
			'This session no longer exists on the server.',
		);
	});

	it('maps REST session_limit_reached', () => {
		const error = new ApiError(
			'session_limit_reached',
			429,
			{ detail: 'session_limit_reached' },
			null,
		);
		expect(formatApiError(error)).toBe(
			'Too many active sessions. Stop another session or try again later.',
		);
	});

	it('maps HTTP 422 validation failures', () => {
		const error = new ApiError(
			'Unprocessable Entity',
			422,
			{ detail: [{ msg: 'bucket_s must be greater than 0' }] },
			null,
		);
		expect(formatApiError(error)).toBe('bucket_s must be greater than 0');
	});

	it('maps client Invalid API response shape at non-zero status', () => {
		const error = new ApiError(
			'Invalid API response shape',
			200,
			{ formErrors: [], fieldErrors: {} },
			null,
		);
		expect(formatApiError(error)).toBe(
			'Received an unexpected response from the server. Try updating the app.',
		);
	});

	it('maps request timeout and offline errors', () => {
		expect(
			formatApiError(new ApiError('Request timed out', 0, null, null)),
		).toContain('did not respond in time');
		expect(
			formatApiError(new ApiError('No internet connection', 0, null, null)),
		).toContain('offline');
	});

	it('maps client invalid request body', () => {
		const error = new ApiError('Invalid request body', 0, null, null);
		expect(formatApiError(error)).toBe(
			'Session settings are invalid. Review Settings and try again.',
		);
	});

	it('maps all Invalid * params labels', () => {
		expect(
			formatApiError(
				new ApiError('Invalid history list params', 0, null, null),
			),
		).toContain('history');
		expect(
			formatApiError(
				new ApiError('Invalid inference query params', 0, null, null),
			),
		).toContain('inference');
		expect(
			formatApiError(
				new ApiError('Invalid inference bucket params', 0, null, null),
			),
		).toContain('chart');
		expect(
			formatApiError(
				new ApiError('Invalid history events params', 0, null, null),
			),
		).toContain('events');
	});

	it('maps unknown REST code via HTTP status fallback', () => {
		const error = new ApiError('boom', 503, { detail: 'service_busy' }, null);
		expect(formatApiError(error)).toBe(
			'The server is temporarily unavailable. Try again shortly.',
		);
	});

	it('maps WebSocket close codes', () => {
		expect(formatApiError(new WsCloseError(4409, 'already attached'))).toBe(
			'Another device or tab is already using this live session.',
		);
		expect(formatApiError(new WsCloseError(4404, 'unknown session'))).toBe(
			'This session no longer exists on the server.',
		);
		expect(formatApiError(new WsCloseError(1011, 'server error'))).toBe(
			'The server encountered an error. Try again shortly.',
		);
	});

	it('maps fetch network failures by message pattern', () => {
		expect(formatApiError(new TypeError('Network request failed'))).toBe(
			'Cannot reach the FilterPass server. Check your network connection.',
		);
		expect(formatApiError(new TypeError('Failed to fetch'))).toBe(
			'Cannot reach the FilterPass server. Check your network connection.',
		);
	});

	it('does not treat unrelated TypeErrors as network failures', () => {
		expect(formatApiError(new TypeError('Cannot read property of undefined'))).toBe(
			'Cannot read property of undefined',
		);
	});

	it('maps generic WebSocket transport errors', () => {
		expect(formatApiError(new Error('Frames WebSocket error'))).toBe(
			'Lost connection while sending audio. Check your network and try again.',
		);
		expect(formatApiError(new Error('Output WebSocket error'))).toBe(
			'Lost connection to live results. Check your network and try again.',
		);
	});
});

describe('formatWsFramesError', () => {
	it('maps all frames soft-error codes', () => {
		expect(formatWsFramesError('frame_too_large')).toContain('too large');
		expect(formatWsFramesError('decode_failed')).toContain('audio frame');
		expect(formatWsFramesError('invalid_sample_rate')).toContain('sample rate');
		expect(formatWsFramesError('invalid_control')).toContain('control');
	});
});

describe('formatWsOutputError', () => {
	it('uses user-facing server message when safe', () => {
		expect(
			formatWsOutputError('infer_failed', 'Model warmup is still incomplete'),
		).toBe('Model warmup is still incomplete');
	});

	it('falls back to friendly code for empty or cryptic server text', () => {
		expect(formatWsOutputError('infer_failed', '')).toContain(
			'detection model failed',
		);
		expect(formatWsOutputError('infer_failed', 'gpu_oom')).toContain(
			'detection model failed',
		);
		expect(
			formatWsOutputError('decode_failed', 'Traceback: Exception at 0xdead'),
		).toContain('decode audio');
	});
});
