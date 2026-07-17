export type AccessibilityStatus = {
	enabled: boolean;
	connected: boolean;
};

export type CaptureStatusEvent = {
	type: 'accessibility' | 'capture' | 'recorder' | 'error';
	enabled?: boolean;
	connected?: boolean;
	state?: string;
	message?: string;
	[key: string]: unknown;
};

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
