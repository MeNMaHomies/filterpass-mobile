const DEFAULT_API_URL = 'http://localhost:8000';

function deriveWsBaseUrl(httpUrl: string): string {
	const url = new URL(httpUrl);
	const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
	return `${protocol}//${url.host}`;
}

/** HTTP base URL for REST. Override via EXPO_PUBLIC_API_URL in .env */
export const apiBaseUrl =
	process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? DEFAULT_API_URL;

/**
 * WebSocket base URL derived from apiBaseUrl.
 * Android emulator: use http://10.0.2.2:8000 in .env.
 * Physical device: use your machine's LAN IP.
 */
export const apiWsBaseUrl = deriveWsBaseUrl(apiBaseUrl);
