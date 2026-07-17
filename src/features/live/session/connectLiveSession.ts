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
 * Callers must close channels on failure/teardown.
 */
export function connectLiveSession(
	sessionId: string,
	handlers: LiveSessionChannelHandlers,
): Promise<LiveSessionChannels> {
	return new Promise((resolve, reject) => {
		let outputOpen = false;
		let framesOpen = false;
		let settled = false;

		const output = connectOutputSocket(sessionId, {
			onOpen: () => {
				outputOpen = true;
				tryReady();
			},
			onMessage: handlers.onOutput,
			onClose: handlers.onClose,
			onError: (e) => {
				if (!settled) {
					settled = true;
					reject(e);
				} else {
					handlers.onError?.(e);
				}
			},
		});

		const frames = connectFramesSocket(sessionId, {
			onOpen: () => {
				framesOpen = true;
				tryReady();
			},
			onMessage: handlers.onFrames,
			onClose: handlers.onClose,
			onError: (e) => {
				if (!settled) {
					settled = true;
					reject(e);
				} else {
					handlers.onError?.(e);
				}
			},
		});

		function tryReady() {
			if (settled || !outputOpen || !framesOpen) return;
			settled = true;
			resolve({ frames, output });
		}
	});
}
