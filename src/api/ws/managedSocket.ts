import type { ZodType } from 'zod';
import { parseJsonMessage } from '../schemas';
import { mapWsClose, socketUrl, WsCloseError } from './url';

export type ManagedSocketCallbacks<TMessage> = {
	onMessage?: (message: TMessage) => void;
	onOpen?: () => void;
	onClose?: (error: WsCloseError | null) => void;
	onError?: (error: Error) => void;
};

export type ManagedSocket = {
	ws: WebSocket;
	close: () => void;
};

type CreateManagedSocketOptions<TMessage> = {
	path: string;
	label: string;
	schema: ZodType<TMessage>;
	callbacks: ManagedSocketCallbacks<TMessage>;
	binaryType?: BinaryType;
};

/**
 * Shared WebSocket open/message/error/close lifecycle for frames + output.
 */
export function createManagedSocket<TMessage>({
	path,
	label,
	schema,
	callbacks,
	binaryType,
}: CreateManagedSocketOptions<TMessage>): ManagedSocket {
	const ws = new WebSocket(socketUrl(path));
	if (binaryType) {
		ws.binaryType = binaryType;
	}

	let closed = false;

	ws.onopen = () => {
		callbacks.onOpen?.();
	};

	ws.onmessage = (event) => {
		if (typeof event.data !== 'string') return;
		const parsed = parseJsonMessage(event.data, schema);
		if (parsed) callbacks.onMessage?.(parsed);
	};

	ws.onerror = () => {
		callbacks.onError?.(new Error(`${label} WebSocket error`));
	};

	ws.onclose = (event) => {
		if (closed) return;
		closed = true;
		const err = event.code === 1000 ? null : mapWsClose(event);
		callbacks.onClose?.(err);
	};

	return {
		ws,
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

export { WsCloseError };
