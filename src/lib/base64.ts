/**
 * Decode a base64 string into an ArrayBuffer (PCM binary frames).
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
	const binary = globalThis.atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i += 1) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes.buffer;
}
