import { Platform } from 'react-native';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useCallCapture } from '../useCallCapture';

const mockGetAccessibilityStatus = jest.fn(() => ({
	enabled: true,
	connected: true,
}));
const mockOpenAccessibilitySettings = jest.fn();
const mockStart = jest.fn(async () => {});
const mockStop = jest.fn(async () => {});
const mockListeners = new Map<string, (event: unknown) => void>();

jest.mock('filterpass-call-capture', () => ({
	__esModule: true,
	default: {
		getAccessibilityStatus: () => mockGetAccessibilityStatus(),
		openAccessibilitySettings: () => mockOpenAccessibilitySettings(),
		start: (sampleRate: number) => mockStart(sampleRate),
		stop: () => mockStop(),
		addListener: (event: string, cb: (payload: unknown) => void) => {
			mockListeners.set(event, cb);
			return { remove: () => mockListeners.delete(event) };
		},
	},
}));

describe('useCallCapture', () => {
	const originalOS = Platform.OS;

	beforeEach(() => {
		mockListeners.clear();
		jest.clearAllMocks();
		Object.defineProperty(Platform, 'OS', {
			configurable: true,
			get: () => 'android',
		});
	});

	afterEach(() => {
		Object.defineProperty(Platform, 'OS', {
			configurable: true,
			get: () => originalOS,
		});
	});

	it('disables capture off Android', async () => {
		Object.defineProperty(Platform, 'OS', {
			configurable: true,
			get: () => 'ios',
		});
		const onPcm = jest.fn();
		const { result } = await renderHook(() => useCallCapture({ onPcm }));
		await waitFor(() => {
			expect(result.current?.available).toBe(false);
		});
		expect(result.current?.accessibility).toEqual({
			enabled: false,
			connected: false,
		});
	});

	it('decodes onPcm events and gates start on accessibility', async () => {
		const onPcm = jest.fn();
		const { result } = await renderHook(() => useCallCapture({ onPcm }));

		await waitFor(() => {
			expect(mockListeners.has('onPcm')).toBe(true);
			expect(result.current).toBeTruthy();
		});

		await act(async () => {
			mockListeners.get('onPcm')?.({
				data: 'AQIDBA==',
				sampleRate: 16000,
				byteLength: 4,
			});
		});
		expect(onPcm).toHaveBeenCalled();
		const buf = onPcm.mock.calls[0][0] as ArrayBuffer;
		expect(Array.from(new Uint8Array(buf))).toEqual([1, 2, 3, 4]);

		mockGetAccessibilityStatus.mockReturnValueOnce({
			enabled: false,
			connected: false,
		});
		await act(async () => {
			await expect(result.current!.start(16000)).rejects.toThrow(
				/Accessibility/,
			);
		});

		mockGetAccessibilityStatus.mockReturnValue({
			enabled: true,
			connected: true,
		});
		await act(async () => {
			await result.current!.start(16000);
		});
		expect(mockStart).toHaveBeenCalledWith(16000);
	});
});
