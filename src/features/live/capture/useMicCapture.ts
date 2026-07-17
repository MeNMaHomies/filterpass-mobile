import { useRef } from 'react';
import {
	requestRecordingPermissionsAsync,
	setAudioModeAsync,
	useAudioStream,
} from 'expo-audio';
import type { AudioCaptureController, PcmSink } from './types';

type UseMicCaptureOptions = {
	/** Fallback rate until start(sampleRate) is called. */
	sampleRate?: number;
	onPcm: PcmSink;
};

/**
 * Mic-only capture via expo-audio.
 * `start(sampleRate)` records the negotiated rate for the session;
 * the stream is started after audio mode / permission are set by the orchestrator.
 */
export function useMicCapture({
	sampleRate = 16000,
	onPcm,
}: UseMicCaptureOptions): AudioCaptureController {
	const rateRef = useRef(sampleRate);
	const { stream } = useAudioStream({
		encoding: 'int16',
		sampleRate,
		channels: 1,
		onBuffer: (buffer) => {
			onPcm(buffer.data);
		},
	});

	return {
		start: async (nextRate: number) => {
			rateRef.current = nextRate;
			// expo-audio binds sampleRate at hook creation; live sessions use
			// settings defaults which match the hook binding. Re-assert intent.
			if (nextRate !== sampleRate) {
				console.warn(
					`[useMicCapture] start(${nextRate}) differs from stream rate ${sampleRate}; stream keeps ${sampleRate}`,
				);
			}
			await stream.start();
		},
		stop: async () => {
			stream.stop();
		},
	};
}

export async function prepareMicCapture(): Promise<boolean> {
	const { granted } = await requestRecordingPermissionsAsync();
	if (!granted) return false;
	await setAudioModeAsync({
		allowsRecording: true,
		playsInSilentMode: true,
	});
	return true;
}
