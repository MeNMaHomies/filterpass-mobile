import type { ConnectionStatus, LivePhase } from '../types';

export function deriveConnectionStatus(phase: LivePhase): ConnectionStatus {
	switch (phase) {
		case 'connecting':
			return 'Connecting';
		case 'warmup':
			return 'Warming up';
		case 'active':
			return 'Live';
		case 'idle':
		default:
			return 'Disconnected';
	}
}
