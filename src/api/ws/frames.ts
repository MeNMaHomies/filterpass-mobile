import type { FramesMessage } from '@/types/api';
import { framesMessageSchema, requireSessionId } from '../schemas';
import { createManagedSocket, type ManagedSocketCallbacks } from './managedSocket';

export type FramesSocketCallbacks = ManagedSocketCallbacks<FramesMessage>;

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
	const { ws, close } = createManagedSocket({
		path: `/ws/frames/${id}`,
		label: 'Frames',
		schema: framesMessageSchema,
		callbacks,
		binaryType: 'arraybuffer',
	});

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
		close,
	};
}
