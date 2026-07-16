import { apiBaseUrl } from '@/config/env';
import type { ZodType } from 'zod';
import { ApiError } from './errors';

export { ApiError } from './errors';

type RequestOptions<T> = Omit<RequestInit, 'body'> & {
	body?: unknown;
	requestId?: string;
	schema?: ZodType<T>;
	bodySchema?: ZodType<unknown>;
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

export async function apiRequest<T>(
	path: string,
	options: RequestOptions<T> = {},
): Promise<T> {
	const { body, requestId, headers, schema, bodySchema, ...rest } = options;

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

	const response = await fetch(`${apiBaseUrl}${path}`, {
		...rest,
		headers: reqHeaders,
		body:
			validatedBody !== undefined ? JSON.stringify(validatedBody) : undefined,
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
}
