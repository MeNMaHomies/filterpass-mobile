import { base64ToArrayBuffer } from '../base64';

describe('base64ToArrayBuffer', () => {
	it('decodes PCM-sized payloads', () => {
		// 4 bytes: 0x01 0x02 0x03 0x04
		const buffer = base64ToArrayBuffer('AQIDBA==');
		expect(Array.from(new Uint8Array(buffer))).toEqual([1, 2, 3, 4]);
	});

	it('returns empty buffer for empty input', () => {
		expect(base64ToArrayBuffer('').byteLength).toBe(0);
	});
});
