import { connectFramesSocket } from '../frames';
import { MockWebSocket } from '@/test-utils/mockWebSocket';

describe('connectFramesSocket', () => {
	beforeEach(() => {
		MockWebSocket.install();
	});

	it('opens frames URL and sends PCM when open', () => {
		const onOpen = jest.fn();
		const socket = connectFramesSocket('a3f9c2e1b7d4', { onOpen });
		const ws = MockWebSocket.instances[0];

		expect(ws.url).toContain('/ws/frames/a3f9c2e1b7d4');
		expect(ws.binaryType).toBe('arraybuffer');

		ws.simulateOpen();
		expect(onOpen).toHaveBeenCalled();

		const pcm = new ArrayBuffer(4);
		socket.sendPcm(pcm);
		expect(ws.sent).toHaveLength(1);
		expect(ws.sent[0]).toBe(pcm);
	});

	it('parses ack messages and ignores non-string payloads', () => {
		const onMessage = jest.fn();
		connectFramesSocket('a3f9c2e1b7d4', { onMessage });
		const ws = MockWebSocket.instances[0];
		ws.simulateOpen();

		ws.simulateMessage(new ArrayBuffer(2));
		expect(onMessage).not.toHaveBeenCalled();

		ws.simulateMessage(
			JSON.stringify({
				type: 'ack',
				frame_idx: 7,
				voiced: true,
				voiced_samples: 320,
			}),
		);
		expect(onMessage).toHaveBeenCalledWith({
			type: 'ack',
			frame_idx: 7,
			voiced: true,
			voiced_samples: 320,
		});
	});

	it('maps abnormal close to WsCloseError and ignores clean close', () => {
		const onClose = jest.fn();
		connectFramesSocket('a3f9c2e1b7d4', { onClose });
		const ws = MockWebSocket.instances[0];
		ws.simulateOpen();
		ws.close(4404, 'missing');
		expect(onClose).toHaveBeenCalledWith(
			expect.objectContaining({ code: 4404 }),
		);

		MockWebSocket.reset();
		MockWebSocket.install();
		const onCloseClean = jest.fn();
		connectFramesSocket('a3f9c2e1b7d4', { onClose: onCloseClean });
		MockWebSocket.instances[0].simulateOpen();
		MockWebSocket.instances[0].close(1000, 'ok');
		expect(onCloseClean).toHaveBeenCalledWith(null);
	});
});
