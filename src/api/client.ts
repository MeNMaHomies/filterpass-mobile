import { apiBaseUrl } from '@/config/env';
import type { ZodType } from 'zod';
import NetInfo from '@react-native-community/netinfo';
import { ApiError } from './errors';

export { ApiError } from './errors';

/** Default wait before aborting a hung request (unreachable backend). */
export const API_REQUEST_TIMEOUT_MS = 12_000;

type RequestOptions<T> = Omit<RequestInit, 'body' | 'signal'> & {
	body?: unknown;
	requestId?: string;
	schema?: ZodType<T>;
	bodySchema?: ZodType<unknown>;
	timeoutMs?: number;
	signal?: AbortSignal;
};

function validateBody(
	body: unknown,
	bodySchema: ZodType<unknown> | undefined,
	requestId: string | null,
): unknown {
	if (body === undefined || !bodySchema) return body;

	const result = bodySchema.safeParse(body);
	if (!result.success) {
		throw new ApiError(
			'Invalid request body',
			0,
			result.error.flatten(),
			requestId,
		);
	}
	return result.data;
}

function isAbortError(error: unknown): boolean {
	if (!error || typeof error !== 'object') return false;
	const name = 'name' in error ? String(error.name) : '';
	const message =
		'message' in error && typeof error.message === 'string'
			? error.message.toLowerCase()
			: '';
	return (
		name === 'AbortError' ||
		message.includes('aborted') ||
		message.includes('abort')
	);
}

async function assertNetworkAvailable(requestId: string | null): Promise<void> {
	try {
		const state = await NetInfo.fetch();
		if (state.isConnected === false) {
			throw new ApiError('No internet connection', 0, null, requestId);
		}
	} catch (e) {
		if (e instanceof ApiError) throw e;
		// NetInfo unavailable — continue; timeout still protects hung fetches.
	}
}

export async function apiRequest<T>(
	path: string,
	options: RequestOptions<T> = {},
): Promise<T> {
	const {
		body,
		requestId,
		headers,
		schema,
		bodySchema,
		timeoutMs = API_REQUEST_TIMEOUT_MS,
		signal: externalSignal,
		...rest
	} = options;

	await assertNetworkAvailable(requestId ?? null);

	const reqHeaders: Record<string, string> = {
		Accept: 'application/json',
		...(headers as Record<string, string>),
	};

	const validatedBody = validateBody(body, bodySchema, requestId ?? null);

	if (validatedBody !== undefined) {
		reqHeaders['Content-Type'] = 'application/json';
	}

	if (requestId) {
		reqHeaders['X-Request-Id'] = requestId;
	}

	const controller = new AbortController();
	const onExternalAbort = () => controller.abort();
	if (externalSignal) {
		if (externalSignal.aborted) {
			controller.abort();
		} else {
			externalSignal.addEventListener('abort', onExternalAbort, {
				once: true,
			});
		}
	}

	const timeoutId = setTimeout(() => {
		controller.abort();
	}, timeoutMs);

	try {
		const response = await fetch(`${apiBaseUrl}${path}`, {
			...rest,
			headers: reqHeaders,
			signal: controller.signal,
			body:
				validatedBody !== undefined
					? JSON.stringify(validatedBody)
					: undefined,
		});

		const responseRequestId =
			response.headers.get('X-Request-Id') ?? requestId ?? null;

		if (response.status === 204) {
			return undefined as T;
		}

		const text = await response.text();
		let parsed: unknown = null;
		if (text) {
			try {
				parsed = JSON.parse(text);
			} catch {
				parsed = text;
			}
		}

		if (!response.ok) {
			const message =
				typeof parsed === 'object' &&
				parsed !== null &&
				'detail' in parsed &&
				typeof (parsed as { detail: unknown }).detail === 'string'
					? (parsed as { detail: string }).detail
					: `Request failed with status ${response.status}`;
			throw new ApiError(message, response.status, parsed, responseRequestId);
		}

		if (schema) {
			const result = schema.safeParse(parsed);
			if (!result.success) {
				throw new ApiError(
					'Invalid API response shape',
					response.status,
					result.error.flatten(),
					responseRequestId,
				);
			}
			return result.data;
		}

		return parsed as T;
	} catch (e) {
		if (isAbortError(e)) {
			if (externalSignal?.aborted) {
				throw e;
			}
			throw new ApiError(
				'Request timed out',
				0,
				null,
				requestId ?? null,
			);
		}
		throw e;
	} finally {
		clearTimeout(timeoutId);
		externalSignal?.removeEventListener('abort', onExternalAbort);
	}
}
