import { ApiError, WsCloseError } from '@/api';
import {
	isNetworkErrorMessage,
	messageForClientError,
	messageForFramesCode,
	messageForHttpStatus,
	messageForNetworkError,
	messageForOutputCode,
	messageForRestCode,
	messageForWsSocketError,
	type FramesErrorCode,
	type OutputErrorCode,
} from '@/lib/apiErrorMessages';

type ParsedApiDetail = {
	code?: string;
	message?: string;
};

function isSnakeCaseCode(value: string): boolean {
	return /^[a-z][a-z0-9_]*$/.test(value);
}

export function parseApiErrorDetail(body: unknown): ParsedApiDetail {
	if (!body || typeof body !== 'object' || !('detail' in body)) {
		return {};
	}

	const { detail } = body as { detail: unknown };

	if (typeof detail === 'string') {
		if (isSnakeCaseCode(detail)) {
			return { code: detail };
		}
		return { message: detail };
	}

	if (Array.isArray(detail)) {
		const messages = detail
			.filter(
				(entry): entry is { msg?: string } =>
					entry !== null && typeof entry === 'object',
			)
			.map((entry) => entry.msg)
			.filter((msg): msg is string => typeof msg === 'string' && msg.length > 0);

		if (messages.length > 0) {
			return { message: messages.join(' ') };
		}
	}

	if (detail && typeof detail === 'object') {
		const record = detail as { code?: unknown; message?: unknown };
		const code = typeof record.code === 'string' ? record.code : undefined;
		const message =
			typeof record.message === 'string' ? record.message : undefined;
		return { code, message };
	}

	return {};
}

function formatApiErrorInstance(error: ApiError): string {
	// Client validation / schema mismatches — match by message, any status.
	const clientMapped = messageForClientError(error.message);
	if (clientMapped) {
		return clientMapped;
	}

	if (error.status === 0) {
		return error.message;
	}

	const parsed = parseApiErrorDetail(error.body);
	const code = error.code ?? parsed.code;

	if (code) {
		const byCode = messageForRestCode(code);
		if (byCode) {
			return byCode;
		}
	}

	if (parsed.message) {
		return parsed.message;
	}

	if (error.status === 429) {
		return (
			messageForRestCode('session_limit_reached') ??
			messageForHttpStatus(429)!
		);
	}

	const byStatus = messageForHttpStatus(error.status);
	if (byStatus) {
		return byStatus;
	}

	return error.message;
}

function formatWsCloseErrorInstance(error: WsCloseError): string {
	if (error.isAlreadyAttached) {
		return 'Another device or tab is already using this live session.';
	}
	if (error.isSessionNotFound) {
		return messageForRestCode('session_not_found')!;
	}
	if (error.isServerError) {
		return messageForHttpStatus(500)!;
	}
	return 'Live session connection closed unexpectedly. Try starting again.';
}

export function formatWsFramesError(code: FramesErrorCode): string {
	return messageForFramesCode(code);
}

export function formatWsOutputError(
	code: OutputErrorCode,
	serverMessage?: string,
): string {
	return messageForOutputCode(code, serverMessage);
}

export function formatApiError(error: unknown): string {
	if (error instanceof ApiError) {
		return formatApiErrorInstance(error);
	}
	if (error instanceof WsCloseError) {
		return formatWsCloseErrorInstance(error);
	}
	if (error instanceof Error) {
		const wsMessage = messageForWsSocketError(error.message);
		if (wsMessage) {
			return wsMessage;
		}
		if (isNetworkErrorMessage(error.message)) {
			return messageForNetworkError();
		}
		return error.message;
	}
	return messageForRestCode('unknown')!;
}
