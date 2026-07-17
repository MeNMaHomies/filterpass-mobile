import type {
	AccessibilityStatus,
	FilterpassCallCaptureModuleEvents,
} from './FilterpassCallCapture.types';

type Listener = (event: never) => void;

/**
 * Web stub — call capture is Android-only for the showcase.
 */
const FilterpassCallCaptureModuleWeb = {
	getAccessibilityStatus(): AccessibilityStatus {
		return { enabled: false, connected: false };
	},

	openAccessibilitySettings(): void {
		throw new Error('Call capture is only available on Android');
	},

	async start(_sampleRate: number): Promise<void> {
		throw new Error('Call capture is only available on Android');
	},

	async stop(): Promise<void> {
		// no-op
	},

	addListener(
		_eventName: keyof FilterpassCallCaptureModuleEvents,
		_listener: Listener,
	) {
		return { remove() {} };
	},

	removeListener(
		_eventName: keyof FilterpassCallCaptureModuleEvents,
		_listener: Listener,
	) {},
};

export default FilterpassCallCaptureModuleWeb;
