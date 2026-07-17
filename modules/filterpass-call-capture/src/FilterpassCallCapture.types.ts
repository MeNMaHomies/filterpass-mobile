export type AccessibilityStatus = {
	enabled: boolean;
	connected: boolean;
};

export type AccessibilityStatusEvent = {
	type: 'accessibility';
	enabled: boolean;
	connected: boolean;
};

export type CaptureLifecycleStatusEvent = {
	type: 'capture';
	state: 'starting' | 'running' | 'stopping' | 'stopped' | string;
	message?: string;
};

export type RecorderStatusEvent = {
	type: 'recorder';
	state: 'opened' | 'closed' | 'error' | string;
	message?: string;
};

export type CaptureErrorStatusEvent = {
	type: 'error';
	message: string;
	state?: string;
};

export type CaptureStatusEvent =
	| AccessibilityStatusEvent
	| CaptureLifecycleStatusEvent
	| RecorderStatusEvent
	| CaptureErrorStatusEvent;

export type PcmChunkEvent = {
	/** Base64-encoded PCM16 LE mono frame (3,200 bytes / 100 ms at 16 kHz). */
	data: string;
	sampleRate: number;
	byteLength: number;
};

export type FilterpassCallCaptureModuleEvents = {
	onStatus: (event: CaptureStatusEvent) => void;
	onPcm: (event: PcmChunkEvent) => void;
};
