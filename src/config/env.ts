import { z } from 'zod';

export const apiUrlSchema = z
	.string()
	.trim()
	.refine(
		(value) => {
			try {
				const url = new URL(value);
				return url.protocol === 'http:' || url.protocol === 'https:';
			} catch {
				return false;
			}
		},
		{ message: 'Must be a valid http(s) URL' },
	);

const DEFAULT_API_URL = 'http://localhost:8000';

function deriveWsBaseUrl(httpUrl: string): string {
	const url = new URL(httpUrl);
	const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
	return `${protocol}//${url.host}`;
}

function parseApiBaseUrl(raw: string | undefined): string {
	if (!raw?.trim()) return DEFAULT_API_URL;

	const normalized = raw.trim().replace(/\/$/, '');
	const result = apiUrlSchema.safeParse(normalized);
	if (!result.success) {
		if (__DEV__) {
			console.warn(
				'[env] Invalid EXPO_PUBLIC_API_URL, using default:',
				result.error.message,
			);
		}
		return DEFAULT_API_URL;
	}
	return result.data;
}

/** HTTP base URL for REST. Override via EXPO_PUBLIC_API_URL in .env */
export const apiBaseUrl = parseApiBaseUrl(process.env.EXPO_PUBLIC_API_URL);

/**
 * WebSocket base URL derived from apiBaseUrl.
 * Android emulator: use http://10.0.2.2:8000 in .env.
 * Physical device: use your machine's LAN IP.
 */
export const apiWsBaseUrl = deriveWsBaseUrl(apiBaseUrl);
