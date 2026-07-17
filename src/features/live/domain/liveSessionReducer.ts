import type { FramesMessage, OutputMessage } from '@/types/api';
import type { SessionLabel } from '@/types';
import { deriveSessionLabel } from '@/lib/sessionLabel';
import type { LivePhase } from '../types';
import {
	appendChunkScore,
	createEmptyMetrics,
	type LiveMetricSnapshot,
} from './liveMetrics';

export type LiveSessionModel = {
	phase: LivePhase;
	hasScored: boolean;
	metrics: LiveMetricSnapshot;
};

export type LiveThresholds = {
	spoof: number;
	real: number;
};

export type LiveReduceEffect =
	| { type: 'none' }
	| { type: 'teardown' }
	| { type: 'haptic_spoof' }
	| { type: 'haptic_error' }
	| { type: 'soft_error'; code: string };

export type LiveReduceResult = {
	state: LiveSessionModel;
	effect: LiveReduceEffect;
	/** Present when output hard-error or frames soft-error. */
	errorCode?: string;
	errorMessage?: string;
};

export function createInitialLiveSessionModel(
	overrides: Partial<LiveMetricSnapshot> = {},
): LiveSessionModel {
	return {
		phase: 'idle',
		hasScored: false,
		metrics: { ...createEmptyMetrics(), ...overrides },
	};
}

export function resetLiveSessionModel(
	state: LiveSessionModel,
	keepTargets?: { bufferTargetSamples?: number },
): LiveSessionModel {
	return {
		phase: 'idle',
		hasScored: false,
		metrics: {
			...createEmptyMetrics(),
			bufferTargetSamples:
				keepTargets?.bufferTargetSamples ??
				state.metrics.bufferTargetSamples,
		},
	};
}

export function reduceOutputMessage(
	state: LiveSessionModel,
	msg: OutputMessage,
	thresholds: LiveThresholds,
): LiveReduceResult {
	if (msg.type === 'warmup') {
		return {
			state: {
				...state,
				phase: state.hasScored ? state.phase : 'warmup',
				metrics: {
					...state.metrics,
					bufferFillSamples: msg.buffer_fill_samples,
					bufferTargetSamples: msg.buffer_target_samples,
				},
			},
			effect: { type: 'none' },
		};
	}

	if (msg.type === 'score') {
		const nextLabel: SessionLabel = deriveSessionLabel(
			msg.session_score,
			thresholds.spoof,
			thresholds.real,
		);
		const becameSpoof =
			state.metrics.label !== 'SPOOF' && nextLabel === 'SPOOF';

		return {
			state: {
				phase: 'active',
				hasScored: true,
				metrics: {
					...state.metrics,
					sessionScore: msg.session_score,
					chunkIdx: msg.chunk_idx,
					label: nextLabel,
					lastRtf: msg.rtf,
					lastLatencyMs: msg.latency_ms,
					chunkHistory: appendChunkScore(
						state.metrics.chunkHistory,
						msg.session_score,
					),
				},
			},
			effect: becameSpoof
				? { type: 'haptic_spoof' }
				: { type: 'none' },
		};
	}

	// msg.type === 'error'
	return {
		state,
		effect: { type: 'teardown' },
		errorCode: msg.code,
		errorMessage: msg.message,
	};
}

export function reduceFramesMessage(
	state: LiveSessionModel,
	msg: FramesMessage,
): LiveReduceResult {
	if (msg.type === 'ack') {
		return {
			state: {
				...state,
				metrics: {
					...state.metrics,
					framesSeen: msg.frame_idx,
				},
			},
			effect: { type: 'none' },
		};
	}

	return {
		state,
		effect: { type: 'soft_error', code: msg.code },
		errorCode: msg.code,
	};
}
