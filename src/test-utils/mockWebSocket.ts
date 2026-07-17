type WsListener = ((ev: unknown) => void) | null;

export class MockWebSocket {
	static readonly CONNECTING = 0;
	static readonly OPEN = 1;
	static readonly CLOSING = 2;
	static readonly CLOSED = 3;
	static instances: MockWebSocket[] = [];

	url: string;
	binaryType = '';
	readyState = MockWebSocket.CONNECTING;
	onopen: WsListener = null;
	onmessage: WsListener = null;
	onerror: WsListener = null;
	onclose: WsListener = null;
	sent: Array<string | ArrayBuffer> = [];

	constructor(url: string) {
		this.url = url;
		MockWebSocket.instances.push(this);
	}

	send(data: string | ArrayBuffer) {
		this.sent.push(data);
	}

	close(code = 1000, reason = 'client close') {
		this.readyState = MockWebSocket.CLOSED;
		this.onclose?.({ code, reason });
	}

	simulateOpen() {
		this.readyState = MockWebSocket.OPEN;
		this.onopen?.({});
	}

	simulateMessage(data: string | ArrayBuffer) {
		this.onmessage?.({ data });
	}

	simulateError() {
		this.onerror?.({});
	}

	static reset() {
		MockWebSocket.instances = [];
	}

	static install() {
		MockWebSocket.reset();
		(globalThis as typeof globalThis & { WebSocket: typeof WebSocket }).WebSocket =
			MockWebSocket as unknown as typeof WebSocket;
	}
}
