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
