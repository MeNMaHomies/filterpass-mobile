import { apiBaseUrl } from '@/config/env';

export class ApiError extends Error {
	readonly status: number;
	readonly body: unknown;
	readonly requestId: string | null;

	constructor(
		message: string,
		status: number,
		body: unknown,
		requestId: string | null,
	) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
		this.body = body;
		this.requestId = requestId;
	}

	get code(): string | undefined {
		if (
			this.body &&
			typeof this.body === 'object' &&
			'detail' in this.body
		) {
			const detail = (this.body as { detail: unknown }).detail;
			if (typeof detail === 'string') return detail;
			if (
				detail &&
				typeof detail === 'object' &&
				'code' in detail &&
				typeof (detail as { code: unknown }).code === 'string'
			) {
				return (detail as { code: string }).code;
			}
		}
		return undefined;
	}
}

type RequestOptions = Omit<RequestInit, 'body'> & {
	body?: unknown;
	requestId?: string;
};

export async function apiRequest<T>(
	path: string,
	options: RequestOptions = {},
): Promise<T> {
	const { body, requestId, headers, ...rest } = options;

	const reqHeaders: Record<string, string> = {
		Accept: 'application/json',
		...(headers as Record<string, string>),
	};

	if (body !== undefined) {
		reqHeaders['Content-Type'] = 'application/json';
	}

	if (requestId) {
		reqHeaders['X-Request-Id'] = requestId;
	}

	const response = await fetch(`${apiBaseUrl}${path}`, {
		...rest,
		headers: reqHeaders,
		body: body !== undefined ? JSON.stringify(body) : undefined,
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

	return parsed as T;
}
