import { Platform } from 'react-native';
import { isDevice } from 'expo-device';
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

/**
 * Android emulator loopback is 10.0.2.2 (host machine), not localhost.
 * Physical devices keep localhost / LAN IPs unchanged.
 */
export function remapApiHostForDevice(httpUrl: string): string {
	if (Platform.OS !== 'android' || isDevice) return httpUrl;

	try {
		const url = new URL(httpUrl);
		if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
			url.hostname = '10.0.2.2';
			return url.toString().replace(/\/$/, '');
		}
	} catch {
		// ignore malformed — caller already validated
	}
	return httpUrl;
}

function parseApiBaseUrl(raw: string | undefined): string {
	if (!raw?.trim()) {
		return remapApiHostForDevice(DEFAULT_API_URL);
	}

	const normalized = raw.trim().replace(/\/$/, '');
	const result = apiUrlSchema.safeParse(normalized);
	if (!result.success) {
		if (__DEV__) {
			console.warn(
				'[env] Invalid EXPO_PUBLIC_API_URL, using default:',
				result.error.message,
			);
		}
		return remapApiHostForDevice(DEFAULT_API_URL);
	}
	return remapApiHostForDevice(result.data);
}

/** HTTP base URL for REST. Override via EXPO_PUBLIC_API_URL in .env */
export const apiBaseUrl = parseApiBaseUrl(process.env.EXPO_PUBLIC_API_URL);

/**
 * WebSocket base URL derived from apiBaseUrl.
 * Android emulator rewrites localhost → 10.0.2.2 automatically.
 * Physical device: set EXPO_PUBLIC_API_URL to your machine's LAN IP
 * and bind the backend on 0.0.0.0 (not only 127.0.0.1).
 */
export const apiWsBaseUrl = deriveWsBaseUrl(apiBaseUrl);

if (__DEV__) {
	console.log(`[env] API base URL: ${apiBaseUrl}`);
}
