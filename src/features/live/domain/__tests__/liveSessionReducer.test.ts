import { CHUNK_HISTORY_MAX, appendChunkScore } from '../liveMetrics';
import {
	createInitialLiveSessionModel,
	reduceFramesMessage,
	reduceOutputMessage,
} from '../liveSessionReducer';
import { deriveConnectionStatus } from '../connectionStatus';

describe('appendChunkScore', () => {
	it('appends and caps history', () => {
		const history = Array.from({ length: CHUNK_HISTORY_MAX }, (_, i) => i);
		const next = appendChunkScore(history, 99);
		expect(next).toHaveLength(CHUNK_HISTORY_MAX);
		expect(next[0]).toBe(1);
		expect(next.at(-1)).toBe(99);
	});
});

describe('deriveConnectionStatus', () => {
	it('maps phases', () => {
		expect(deriveConnectionStatus('idle')).toBe('Disconnected');
		expect(deriveConnectionStatus('connecting')).toBe('Connecting');
		expect(deriveConnectionStatus('warmup')).toBe('Warming up');
		expect(deriveConnectionStatus('active')).toBe('Live');
	});
});

describe('reduceOutputMessage', () => {
	const thresholds = { spoof: 0.6, real: 0.4 };

	it('moves to warmup before first score', () => {
		const state = createInitialLiveSessionModel();
		const result = reduceOutputMessage(
			state,
			{
				type: 'warmup',
				session_id: 'abc',
				buffer_fill_samples: 100,
				buffer_target_samples: 8000,
			},
			thresholds,
		);
		expect(result.state.phase).toBe('warmup');
		expect(result.state.metrics.bufferFillSamples).toBe(100);
		expect(result.effect.type).toBe('none');
	});

	it('does not leave active for warmup after scoring', () => {
		const scored = reduceOutputMessage(
			createInitialLiveSessionModel(),
			{
				type: 'score',
				session_id: 'abc',
				chunk_idx: 1,
				chunk_prob: 0.5,
				session_score: 0.3,
				latency_ms: 10,
				rtf: 0.01,
			},
			thresholds,
		).state;
		expect(scored.phase).toBe('active');

		const warmed = reduceOutputMessage(
			scored,
			{
				type: 'warmup',
				session_id: 'abc',
				buffer_fill_samples: 50,
				buffer_target_samples: 8000,
			},
			thresholds,
		);
		expect(warmed.state.phase).toBe('active');
	});

	it('applies score and emits spoof haptic on transition', () => {
		const state = createInitialLiveSessionModel();
		const result = reduceOutputMessage(
			state,
			{
				type: 'score',
				session_id: 'abc',
				chunk_idx: 2,
				chunk_prob: 0.9,
				session_score: 0.85,
				latency_ms: 12,
				rtf: 0.02,
			},
			thresholds,
		);
		expect(result.state.phase).toBe('active');
		expect(result.state.hasScored).toBe(true);
		expect(result.state.metrics.label).toBe('SPOOF');
		expect(result.state.metrics.sessionScore).toBe(0.85);
		expect(result.effect.type).toBe('haptic_spoof');
	});

	it('requests teardown on output hard error', () => {
		const result = reduceOutputMessage(
			createInitialLiveSessionModel(),
			{
				type: 'error',
				session_id: 'abc',
				code: 'infer_failed',
				message: 'boom',
			},
			thresholds,
		);
		expect(result.effect.type).toBe('teardown');
		expect(result.errorCode).toBe('infer_failed');
	});
});

describe('reduceFramesMessage', () => {
	it('updates framesSeen on ack', () => {
		const result = reduceFramesMessage(createInitialLiveSessionModel(), {
			type: 'ack',
			frame_idx: 42,
			voiced: true,
			voiced_samples: 320,
		});
		expect(result.state.metrics.framesSeen).toBe(42);
		expect(result.effect.type).toBe('none');
	});

	it('marks soft error without changing phase', () => {
		const state = {
			...createInitialLiveSessionModel(),
			phase: 'active' as const,
			hasScored: true,
		};
		const result = reduceFramesMessage(state, {
			type: 'error',
			code: 'frame_too_large',
		});
		expect(result.state.phase).toBe('active');
		expect(result.effect).toEqual({
			type: 'soft_error',
			code: 'frame_too_large',
		});
	});
});
