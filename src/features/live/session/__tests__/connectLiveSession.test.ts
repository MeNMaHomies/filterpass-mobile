import { connectLiveSession } from '../connectLiveSession';
import { MockWebSocket } from '@/test-utils/mockWebSocket';

describe('connectLiveSession', () => {
	beforeEach(() => {
		MockWebSocket.install();
	});

	it('resolves only after both sockets open', async () => {
		const pending = connectLiveSession('a3f9c2e1b7d4', {
			onOutput: jest.fn(),
			onFrames: jest.fn(),
			onClose: jest.fn(),
		});

		expect(MockWebSocket.instances).toHaveLength(2);
		const [first, second] = MockWebSocket.instances;

		first.simulateOpen();
		let settled = false;
		void pending.then(() => {
			settled = true;
		});
		await Promise.resolve();
		expect(settled).toBe(false);

		second.simulateOpen();
		const channels = await pending;
		expect(channels.frames).toBeTruthy();
		expect(channels.output).toBeTruthy();
	});

	it('rejects when a socket errors before both open', async () => {
		const pending = connectLiveSession('a3f9c2e1b7d4', {
			onOutput: jest.fn(),
			onFrames: jest.fn(),
			onClose: jest.fn(),
		});
		const [first, second] = MockWebSocket.instances;
		first.simulateError();
		await expect(pending).rejects.toThrow(/WebSocket error/);
		expect(first.readyState).toBe(MockWebSocket.CLOSED);
		expect(second.readyState).toBe(MockWebSocket.CLOSED);
	});
});
