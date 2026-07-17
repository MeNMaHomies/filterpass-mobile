import { connectOutputSocket } from '../output';
import { MockWebSocket } from '@/test-utils/mockWebSocket';

describe('connectOutputSocket', () => {
	beforeEach(() => {
		MockWebSocket.install();
	});

	it('parses score and warmup messages', () => {
		const onMessage = jest.fn();
		connectOutputSocket('a3f9c2e1b7d4', { onMessage });
		const ws = MockWebSocket.instances[0];
		expect(ws.url).toContain('/ws/output/a3f9c2e1b7d4');
		ws.simulateOpen();

		ws.simulateMessage(
			JSON.stringify({
				type: 'warmup',
				session_id: 'a3f9c2e1b7d4',
				buffer_fill_samples: 100,
				buffer_target_samples: 8000,
			}),
		);
		expect(onMessage).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'warmup', buffer_fill_samples: 100 }),
		);

		ws.simulateMessage(
			JSON.stringify({
				type: 'score',
				session_id: 'a3f9c2e1b7d4',
				chunk_idx: 1,
				chunk_prob: 0.5,
				session_score: 0.4,
				latency_ms: 10,
				rtf: 0.02,
			}),
		);
		expect(onMessage).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'score', session_score: 0.4 }),
		);
	});
});
