import type { FramesMessage } from '@/types/api';
import {
	framesMessageSchema,
	parseJsonMessage,
	requireSessionId,
} from '../schemas';
import { mapWsClose, socketUrl, WsCloseError } from './url';

export type FramesSocketCallbacks = {
	onMessage?: (message: FramesMessage) => void;
	onOpen?: () => void;
	onClose?: (error: WsCloseError | null) => void;
	onError?: (error: Error) => void;
};

export type FramesSocket = {
	sendPcm: (data: ArrayBuffer) => void;
	sendReset: () => void;
	close: () => void;
};

export function connectFramesSocket(
	sessionId: string,
	callbacks: FramesSocketCallbacks = {},
): FramesSocket {
	const id = requireSessionId(sessionId);
	const ws = new WebSocket(socketUrl(`/ws/frames/${id}`));
	ws.binaryType = 'arraybuffer';

	let closed = false;

	ws.onopen = () => {
		callbacks.onOpen?.();
	};

	ws.onmessage = (event) => {
		if (typeof event.data !== 'string') return;
		const parsed = parseJsonMessage(event.data, framesMessageSchema);
		if (parsed) callbacks.onMessage?.(parsed);
	};

	ws.onerror = () => {
		callbacks.onError?.(new Error('Frames WebSocket error'));
	};

	ws.onclose = (event) => {
		if (closed) return;
		closed = true;
		const err =
			event.code === 1000 ? null : mapWsClose(event);
		callbacks.onClose?.(err);
	};

	return {
		sendPcm(data: ArrayBuffer) {
			if (ws.readyState === WebSocket.OPEN) {
				ws.send(data);
			}
		},
		sendReset() {
			if (ws.readyState === WebSocket.OPEN) {
				ws.send(JSON.stringify({ type: 'reset' }));
			}
		},
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
