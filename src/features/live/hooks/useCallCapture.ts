import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import FilterpassCallCapture, {
	type AccessibilityStatus,
	type CaptureStatusEvent,
} from 'filterpass-call-capture';
import { base64ToArrayBuffer } from '@/lib/base64';

export type CallCaptureController = {
	available: boolean;
	accessibility: AccessibilityStatus;
	lastStatus: CaptureStatusEvent | null;
	refreshAccessibility: () => AccessibilityStatus;
	openAccessibilitySettings: () => void;
	start: (sampleRate: number) => Promise<void>;
	stop: () => Promise<void>;
};

type UseCallCaptureOptions = {
	onPcm: (data: ArrayBuffer) => void;
};

const DISABLED_STATUS: AccessibilityStatus = {
	enabled: false,
	connected: false,
};

/**
 * Android call-capture bridge: accessibility gate + mixed PCM events → ArrayBuffer.
 */
export function useCallCapture({
	onPcm,
}: UseCallCaptureOptions): CallCaptureController {
	const available = Platform.OS === 'android';
	const onPcmRef = useRef(onPcm);

	useEffect(() => {
		onPcmRef.current = onPcm;
	}, [onPcm]);

	const [accessibility, setAccessibility] =
		useState<AccessibilityStatus>(DISABLED_STATUS);
	const [lastStatus, setLastStatus] = useState<CaptureStatusEvent | null>(null);

	const refreshAccessibility = useCallback((): AccessibilityStatus => {
		if (!available) {
			setAccessibility(DISABLED_STATUS);
			return DISABLED_STATUS;
		}
		const next = FilterpassCallCapture.getAccessibilityStatus();
		setAccessibility(next);
		return next;
	}, [available]);

	useEffect(() => {
		if (!available) return;

		refreshAccessibility();

		const pcmSub = FilterpassCallCapture.addListener('onPcm', (event) => {
			onPcmRef.current(base64ToArrayBuffer(event.data));
		});
		const statusSub = FilterpassCallCapture.addListener('onStatus', (event) => {
			setLastStatus(event);
			if (event.type === 'accessibility') {
				setAccessibility({
					enabled: Boolean(event.enabled),
					connected: Boolean(event.connected),
				});
			}
		});

		return () => {
			pcmSub.remove();
			statusSub.remove();
			void FilterpassCallCapture.stop();
		};
	}, [available, refreshAccessibility]);

	const openAccessibilitySettings = useCallback(() => {
		if (!available) {
			throw new Error('Call capture is only available on Android');
		}
		FilterpassCallCapture.openAccessibilitySettings();
	}, [available]);

	const start = useCallback(
		async (sampleRate: number) => {
			if (!available) {
				throw new Error('Call capture is only available on Android');
			}
			const status = refreshAccessibility();
			if (!status.enabled || !status.connected) {
				throw new Error(
					'Enable FilterPass Call Capture under Accessibility settings, then return to the app.',
				);
			}
			await FilterpassCallCapture.start(sampleRate);
		},
		[available, refreshAccessibility],
	);

	const stop = useCallback(async () => {
		if (!available) return;
		await FilterpassCallCapture.stop();
	}, [available]);

	return {
		available,
		accessibility,
		lastStatus,
		refreshAccessibility,
		openAccessibilitySettings,
		start,
		stop,
	};
}
