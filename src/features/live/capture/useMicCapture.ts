import { useAudioStream } from 'expo-audio';
import type { AudioCaptureController, PcmSink } from './types';

type UseMicCaptureOptions = {
	sampleRate: number;
	onPcm: PcmSink;
};

/**
 * Mic-only capture via expo-audio. Permission / audio mode stay in the session orchestrator.
 */
export function useMicCapture({
	sampleRate,
	onPcm,
}: UseMicCaptureOptions): AudioCaptureController {
	const { stream } = useAudioStream({
		encoding: 'int16',
		sampleRate,
		channels: 1,
		onBuffer: (buffer) => {
			onPcm(buffer.data);
		},
	});

	return {
		start: async () => {
			await stream.start();
		},
		stop: async () => {
			stream.stop();
		},
	};
}
