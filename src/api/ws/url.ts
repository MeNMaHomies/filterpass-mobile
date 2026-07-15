import { apiWsBaseUrl } from '@/config/env';

export function socketUrl(path: string): string {
	const normalized = path.startsWith('/') ? path : `/${path}`;
	return `${apiWsBaseUrl}${normalized}`;
}

export class WsCloseError extends Error {
	readonly code: number;
	readonly reason: string;

	constructor(code: number, reason: string) {
		super(`WebSocket closed: ${code} ${reason}`);
		this.name = 'WsCloseError';
		this.code = code;
		this.reason = reason;
	}

	get isSessionNotFound(): boolean {
		return this.code === 4404;
	}

	get isAlreadyAttached(): boolean {
		return this.code === 4409;
	}

	get isServerError(): boolean {
		return this.code === 1011;
	}
}

export function mapWsClose(event: { code: number; reason?: string }): WsCloseError {
	return new WsCloseError(event.code, event.reason || 'closed');
}
