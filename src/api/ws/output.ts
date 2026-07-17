import type { OutputMessage } from '@/types/api';
import { outputMessageSchema, requireSessionId } from '../schemas';
import { createManagedSocket, type ManagedSocketCallbacks } from './managedSocket';

export type OutputSocketCallbacks = ManagedSocketCallbacks<OutputMessage>;

export type OutputSocket = {
	close: () => void;
};

export function connectOutputSocket(
	sessionId: string,
	callbacks: OutputSocketCallbacks = {},
): OutputSocket {
	const id = requireSessionId(sessionId);
	const { close } = createManagedSocket({
		path: `/ws/output/${id}`,
		label: 'Output',
		schema: outputMessageSchema,
		callbacks,
	});

	return { close };
}
