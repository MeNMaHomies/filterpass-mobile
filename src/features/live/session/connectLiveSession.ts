import {
	connectFramesSocket,
	connectOutputSocket,
	type FramesSocket,
	type OutputSocket,
	type WsCloseError,
} from '@/api/ws';
import type { FramesMessage, OutputMessage } from '@/types/api';

export type LiveSessionChannels = {
	frames: FramesSocket;
	output: OutputSocket;
};

export type LiveSessionChannelHandlers = {
	onOutput: (msg: OutputMessage) => void;
	onFrames: (msg: FramesMessage) => void;
	onClose: (err: WsCloseError | null) => void;
	onError?: (error: Error) => void;
};

/**
 * Open both live WebSockets and resolve only when both are open.
 * On startup failure, both sockets are closed before rejecting.
 */
export function connectLiveSession(
	sessionId: string,
	handlers: LiveSessionChannelHandlers,
): Promise<LiveSessionChannels> {
	return new Promise((resolve, reject) => {
		let outputOpen = false;
		let framesOpen = false;
		let settled = false;

		const fail = (error: Error) => {
			if (settled) {
				handlers.onError?.(error);
				return;
			}
			settled = true;
			output.close();
			frames.close();
			reject(error);
		};

		const output = connectOutputSocket(sessionId, {
			onOpen: () => {
				outputOpen = true;
				tryReady();
			},
			onMessage: handlers.onOutput,
			onClose: (err) => {
				if (!settled) {
					fail(err ?? new Error('Output WebSocket closed before ready'));
					return;
				}
				handlers.onClose(err);
			},
			onError: fail,
		});

		const frames = connectFramesSocket(sessionId, {
			onOpen: () => {
				framesOpen = true;
				tryReady();
			},
			onMessage: handlers.onFrames,
			onClose: (err) => {
				if (!settled) {
					fail(err ?? new Error('Frames WebSocket closed before ready'));
					return;
				}
				handlers.onClose(err);
			},
			onError: fail,
		});

		function tryReady() {
			if (settled || !outputOpen || !framesOpen) return;
			settled = true;
			resolve({ frames, output });
		}
	});
}
