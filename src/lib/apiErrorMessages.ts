import type { ApiErrorCode } from '@/types/api';
import {
	ClientErrorCode,
	isClientErrorCode,
	type ClientErrorCodeName,
} from '@/lib/clientErrorCodes';

/** REST `detail` codes from docs/api.md */
export const REST_ERROR_MESSAGES: Record<ApiErrorCode, string> = {
	session_not_found: 'This session no longer exists on the server.',
	session_limit_reached:
		'Too many active sessions. Stop another session or try again later.',
	unknown: 'Something went wrong. Please try again.',
};

/** Soft errors on WS /ws/frames (socket stays open) */
export const FRAMES_ERROR_MESSAGES = {
	frame_too_large:
		'Audio chunk was too large. Try speaking closer to the mic or lowering input gain.',
	decode_failed:
		'Could not process an audio frame. Check your microphone and try again.',
	invalid_sample_rate:
		'Invalid audio sample rate. Restart the session from Settings defaults.',
	invalid_control:
		'Live session received an invalid control message. Restart the session.',
} as const;

/** Fatal errors on WS /ws/output */
export const OUTPUT_ERROR_MESSAGES = {
	decode_failed:
		'Could not decode audio for analysis. Check your microphone and try again.',
	infer_failed:
		'The detection model failed on this chunk. You can start a new session.',
} as const;

export type FramesErrorCode = keyof typeof FRAMES_ERROR_MESSAGES;
export type OutputErrorCode = keyof typeof OUTPUT_ERROR_MESSAGES;

const HTTP_STATUS_MESSAGES: Record<number, string> = {
	400: 'The request was invalid. Check your settings and try again.',
	404: 'The requested resource was not found.',
	422: 'Some request values were invalid. Check filters or date range.',
	429: 'Too many requests. Wait a moment and try again.',
	500: 'The server encountered an error. Try again shortly.',
	502: 'The server is temporarily unavailable. Try again shortly.',
	503: 'The server is temporarily unavailable. Try again shortly.',
};

/** Typed client error codes → user-facing copy. */
export const CLIENT_ERROR_MESSAGES: Record<ClientErrorCodeName, string> = {
	[ClientErrorCode.INVALID_REQUEST_BODY]:
		'Session settings are invalid. Review Settings and try again.',
	[ClientErrorCode.INVALID_SESSION_ID]: 'This session link is invalid.',
	[ClientErrorCode.INVALID_HISTORY_LIST_PARAMS]:
		'Could not load history with the current filters.',
	[ClientErrorCode.INVALID_INFERENCE_QUERY_PARAMS]:
		'Could not load inference history with the current filters.',
	[ClientErrorCode.INVALID_INFERENCE_BUCKET_PARAMS]:
		'Could not load chart data with the current date range.',
	[ClientErrorCode.INVALID_HISTORY_EVENTS_PARAMS]:
		'Could not load session events with the current filters.',
	[ClientErrorCode.INVALID_API_RESPONSE_SHAPE]:
		'Received an unexpected response from the server. Try updating the app.',
	[ClientErrorCode.REQUEST_TIMED_OUT]:
		'The server did not respond in time. Check that the backend is running and try again.',
	[ClientErrorCode.NO_INTERNET]:
		'You appear to be offline. Check your connection and try again.',
	[ClientErrorCode.BACKEND_MODEL_NOT_READY]:
		'The detection service is online but the model is not ready yet. Try again in a moment.',
};

/** Legacy message-prefix fallback while older call sites still throw plain strings. */
const CLIENT_ERROR_PREFIXES: { match: string; message: string }[] = [
	{
		match: 'Invalid request body',
		message: CLIENT_ERROR_MESSAGES[ClientErrorCode.INVALID_REQUEST_BODY],
	},
	{
		match: 'Invalid session ID',
		message: CLIENT_ERROR_MESSAGES[ClientErrorCode.INVALID_SESSION_ID],
	},
	{
		match: 'Invalid history list params',
		message: CLIENT_ERROR_MESSAGES[ClientErrorCode.INVALID_HISTORY_LIST_PARAMS],
	},
	{
		match: 'Invalid inference query params',
		message:
			CLIENT_ERROR_MESSAGES[ClientErrorCode.INVALID_INFERENCE_QUERY_PARAMS],
	},
	{
		match: 'Invalid inference bucket params',
		message:
			CLIENT_ERROR_MESSAGES[ClientErrorCode.INVALID_INFERENCE_BUCKET_PARAMS],
	},
	{
		match: 'Invalid history events params',
		message:
			CLIENT_ERROR_MESSAGES[ClientErrorCode.INVALID_HISTORY_EVENTS_PARAMS],
	},
	{
		match: 'Invalid API response shape',
		message:
			CLIENT_ERROR_MESSAGES[ClientErrorCode.INVALID_API_RESPONSE_SHAPE],
	},
	{
		match: 'Request timed out',
		message: CLIENT_ERROR_MESSAGES[ClientErrorCode.REQUEST_TIMED_OUT],
	},
	{
		match: 'No internet connection',
		message: CLIENT_ERROR_MESSAGES[ClientErrorCode.NO_INTERNET],
	},
	{
		match: 'Backend model not ready',
		message: CLIENT_ERROR_MESSAGES[ClientErrorCode.BACKEND_MODEL_NOT_READY],
	},
];

const NETWORK_ERROR_PATTERNS = [
	'fetch',
	'network request failed',
	'failed to connect',
	'econnrefused',
	'timed out',
	'timeout',
	'unable to resolve host',
	'aborted',
	'network error',
	'internet',
];

const WS_SOCKET_ERROR_MESSAGES: Record<string, string> = {
	'Frames WebSocket error':
		'Lost connection while sending audio. Check your network and try again.',
	'Output WebSocket error':
		'Lost connection to live results. Check your network and try again.',
};

/** Snake_case / stack-ish strings are not safe to show as-is. */
function looksUserFacingMessage(value: string): boolean {
	const trimmed = value.trim();
	if (trimmed.length < 8 || trimmed.length > 160) return false;
	if (/^[a-z][a-z0-9_]*$/.test(trimmed)) return false;
	if (/Exception|Traceback|Error:| at 0x/i.test(trimmed)) return false;
	return /\s/.test(trimmed);
}

export function isApiErrorCode(value: string): value is ApiErrorCode {
	return value in REST_ERROR_MESSAGES;
}

export function messageForRestCode(code: string): string | undefined {
	if (isApiErrorCode(code)) {
		return REST_ERROR_MESSAGES[code];
	}
	return undefined;
}

export function messageForHttpStatus(status: number): string | undefined {
	return HTTP_STATUS_MESSAGES[status];
}

export function messageForClientErrorCode(
	code: string | null | undefined,
): string | undefined {
	if (code && isClientErrorCode(code)) {
		return CLIENT_ERROR_MESSAGES[code];
	}
	return undefined;
}

export function messageForClientError(raw: string): string | undefined {
	const lower = raw.toLowerCase();
	for (const { match, message } of CLIENT_ERROR_PREFIXES) {
		if (lower.startsWith(match.toLowerCase())) {
			return message;
		}
	}
	return undefined;
}

export function messageForFramesCode(code: FramesErrorCode): string {
	return FRAMES_ERROR_MESSAGES[code];
}

/**
 * Prefer known-code copy. Only surface server text when it looks user-facing.
 */
export function messageForOutputCode(
	code: OutputErrorCode,
	serverMessage?: string,
): string {
	const friendly = OUTPUT_ERROR_MESSAGES[code];
	const trimmed = serverMessage?.trim();
	if (trimmed && looksUserFacingMessage(trimmed)) {
		return trimmed;
	}
	return friendly;
}

export function isNetworkErrorMessage(message: string): boolean {
	const lower = message.toLowerCase();
	return NETWORK_ERROR_PATTERNS.some((pattern) => lower.includes(pattern));
}

export function messageForNetworkError(): string {
	return 'Cannot reach server. Check your network connection.';
}

export function messageForWsSocketError(message: string): string | undefined {
	return WS_SOCKET_ERROR_MESSAGES[message];
}
