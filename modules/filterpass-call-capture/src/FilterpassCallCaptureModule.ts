import { NativeModule, requireNativeModule } from 'expo';

import type {
	AccessibilityStatus,
	FilterpassCallCaptureModuleEvents,
} from './FilterpassCallCapture.types';

declare class FilterpassCallCaptureModule extends NativeModule<FilterpassCallCaptureModuleEvents> {
	getAccessibilityStatus(): AccessibilityStatus;
	openAccessibilitySettings(): void;
	start(sampleRate: number): Promise<void>;
	stop(): Promise<void>;
}

export default requireNativeModule<FilterpassCallCaptureModule>(
	'FilterpassCallCapture',
);
