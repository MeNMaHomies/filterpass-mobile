import type { OutputMessage } from '@/types/api';
import { mapWsClose, socketUrl, WsCloseError } from './url';

export type OutputSocketCallbacks = {
	onMessage?: (message: OutputMessage) => void;
	onOpen?: () => void;
	onClose?: (error: WsCloseError | null) => void;
	onError?: (error: Error) => void;
};

export type OutputSocket = {
	close: () => void;
};

export function connectOutputSocket(
	sessionId: string,
	callbacks: OutputSocketCallbacks = {},
): OutputSocket {
	const ws = new WebSocket(socketUrl(`/ws/output/${sessionId}`));

	let closed = false;

	ws.onopen = () => {
		callbacks.onOpen?.();
	};

	ws.onmessage = (event) => {
		if (typeof event.data !== 'string') return;
		try {
			const parsed = JSON.parse(event.data) as OutputMessage;
			callbacks.onMessage?.(parsed);
		} catch {
			// ignore malformed JSON
		}
	};

	ws.onerror = () => {
		callbacks.onError?.(new Error('Output WebSocket error'));
	};

	ws.onclose = (event) => {
		if (closed) return;
		closed = true;
		const err =
			event.code === 1000 ? null : mapWsClose(event);
		callbacks.onClose?.(err);
	};

	return {
		close() {
			closed = true;
			if (
				ws.readyState === WebSocket.OPEN ||
				ws.readyState === WebSocket.CONNECTING
			) {
				ws.close(1000, 'client close');
			}
		},
	};
}
