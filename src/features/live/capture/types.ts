export type PcmSink = (data: ArrayBuffer) => void;

export type AudioCaptureController = {
	start: (sampleRate: number) => Promise<void>;
	stop: () => Promise<void>;
};
