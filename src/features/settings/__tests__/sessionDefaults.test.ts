import {
	API_SESSION_DEFAULTS,
	loadSessionDefaults,
	saveSessionDefaults,
	withClampedThresholds,
} from '@/features/settings/sessionDefaults';

const mockStorage = new Map<string, string>();

jest.mock('@react-native-async-storage/async-storage', () => ({
	setItem: jest.fn((key: string, value: string) => {
		mockStorage.set(key, value);
		return Promise.resolve();
	}),
	getItem: jest.fn((key: string) =>
		Promise.resolve(mockStorage.get(key) ?? null),
	),
	removeItem: jest.fn((key: string) => {
		mockStorage.delete(key);
		return Promise.resolve();
	}),
	clear: jest.fn(() => {
		mockStorage.clear();
		return Promise.resolve();
	}),
}));

describe('sessionDefaults', () => {
	beforeEach(() => {
		mockStorage.clear();
		jest.clearAllMocks();
	});

	it('returns API defaults when storage is empty', async () => {
		await expect(loadSessionDefaults()).resolves.toEqual(API_SESSION_DEFAULTS);
	});

	it('loads valid persisted defaults', async () => {
		mockStorage.set(
			'@filterpass/session_defaults',
			JSON.stringify({
				ema_alpha: 0.4,
				real_threshold: 0.35,
				spoof_threshold: 0.65,
				vad_mode: 1,
				vad_frame_ms: 20,
			}),
		);
		await expect(loadSessionDefaults()).resolves.toEqual({
			ema_alpha: 0.4,
			real_threshold: 0.35,
			spoof_threshold: 0.65,
			vad_mode: 1,
			vad_frame_ms: 20,
		});
	});

	it('removes fixed audio config from legacy storage', async () => {
		mockStorage.set(
			'@filterpass/session_defaults',
			JSON.stringify({
				sample_rate: 8000,
				chunk_duration_s: 0.5,
				chunk_overlap_s: 0.25,
				ema_alpha: 0.4,
				real_threshold: 0.35,
				spoof_threshold: 0.65,
				vad_mode: 1,
				vad_frame_ms: 20,
			}),
		);

		const expected = {
			ema_alpha: 0.4,
			real_threshold: 0.35,
			spoof_threshold: 0.65,
			vad_mode: 1,
			vad_frame_ms: 20,
		};
		await expect(loadSessionDefaults()).resolves.toEqual(expected);
		expect(
			JSON.parse(mockStorage.get('@filterpass/session_defaults') ?? ''),
		).toEqual(expected);
	});

	it('backfills real_threshold and VAD from legacy storage', async () => {
		mockStorage.set(
			'@filterpass/session_defaults',
			JSON.stringify({
				sample_rate: 16000,
				chunk_duration_s: 0.5,
				ema_alpha: 0.4,
				spoof_threshold: 0.6,
			}),
		);
		const loaded = await loadSessionDefaults();
		expect(loaded.spoof_threshold).toBe(0.6);
		expect(loaded.real_threshold).toBeLessThan(loaded.spoof_threshold);
		expect(loaded.vad_mode).toBe(2);
		expect(loaded.vad_frame_ms).toBe(30);
	});

	it('falls back when stored JSON is invalid', async () => {
		mockStorage.set(
			'@filterpass/session_defaults',
			JSON.stringify({ spoof_threshold: 99 }),
		);
		await expect(loadSessionDefaults()).resolves.toEqual(API_SESSION_DEFAULTS);
	});

	it('rejects invalid values on save', async () => {
		await expect(
			saveSessionDefaults({
				...API_SESSION_DEFAULTS,
				spoof_threshold: 5,
			}),
		).rejects.toThrow();
	});

	it('does not persist fixed audio config', async () => {
		const defaultsWithLegacyAudio = {
			...API_SESSION_DEFAULTS,
			sample_rate: 8000,
			chunk_duration_s: 0.5,
			chunk_overlap_s: 0.25,
		};

		await saveSessionDefaults(defaultsWithLegacyAudio);

		expect(
			JSON.parse(mockStorage.get('@filterpass/session_defaults') ?? ''),
		).toEqual(API_SESSION_DEFAULTS);
	});

	it('clamps real below spoof when editing thresholds', () => {
		const next = withClampedThresholds(API_SESSION_DEFAULTS, {
			real_threshold: 0.7,
		});
		expect(next.real_threshold).toBeLessThan(next.spoof_threshold);
	});
});
