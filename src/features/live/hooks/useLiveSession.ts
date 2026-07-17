import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
	requestRecordingPermissionsAsync,
	setAudioModeAsync,
	useAudioStream,
} from 'expo-audio';
import { createSession, deleteSession } from '@/api';
import {
	connectFramesSocket,
	connectOutputSocket,
	type FramesSocket,
	type OutputSocket,
	WsCloseError,
} from '@/api/ws';
import { useBackendHealth } from '@/features/health';
import {
	loadSessionDefaults,
	type SessionDefaults,
} from '@/features/settings/sessionDefaults';
import { deriveSessionLabel } from '@/lib/sessionLabel';
import {
	formatApiError,
	formatWsFramesError,
	formatWsOutputError,
} from '@/lib/apiError';
import { hapticError, hapticLight, hapticMedium, hapticWarning } from '@/lib/haptics';
import { throttle } from '@/lib/throttle';
import type { SessionLabel } from '@/types';
import { useCallCapture } from './useCallCapture';

export type LivePhase = 'idle' | 'connecting' | 'warmup' | 'active';

export type CaptureMode = 'mic' | 'call';

export type ConnectionStatus =
	| 'Disconnected'
	| 'Connecting'
	| 'Live'
	| 'Warming up';

export type LiveSessionState = {
	phase: LivePhase;
	captureMode: CaptureMode;
	setCaptureMode: (mode: CaptureMode) => void;
	sessionId: string | null;
	sessionScore: number;
	chunkIdx: number;
	label: SessionLabel;
	chunkHistory: number[];
	bufferFillSamples: number;
	bufferTargetSamples: number;
	spoofThreshold: number;
	realThreshold: number;
	framesSeen: number;
	lastRtf: number | null;
	lastLatencyMs: number | null;
	connectionStatus: ConnectionStatus;
	defaults: SessionDefaults | null;
	error: string | null;
	callCapture: ReturnType<typeof useCallCapture>;
	start: () => Promise<void>;
	stop: () => Promise<void>;
	clearError: () => void;
};

const CHUNK_HISTORY_MAX = 48;
const CHART_FLUSH_MS = 250;

export function useLiveSession(): LiveSessionState {
	const { ensureReady } = useBackendHealth();
	const [phase, setPhase] = useState<LivePhase>('idle');
	const [captureMode, setCaptureModeState] = useState<CaptureMode>('mic');
	const [sessionId, setSessionId] = useState<string | null>(null);
	const [sessionScore, setSessionScore] = useState(0);
	const [chunkIdx, setChunkIdx] = useState(0);
	const [label, setLabel] = useState<SessionLabel>('REAL');
	const [chunkHistory, setChunkHistory] = useState<number[]>([]);
	const [bufferFillSamples, setBufferFillSamples] = useState(0);
	const [bufferTargetSamples, setBufferTargetSamples] = useState(0);
	const [spoofThreshold, setSpoofThreshold] = useState(0.5);
	const [realThreshold, setRealThreshold] = useState(0.4);
	const [framesSeen, setFramesSeen] = useState(0);
	const [lastRtf, setLastRtf] = useState<number | null>(null);
	const [lastLatencyMs, setLastLatencyMs] = useState<number | null>(null);
	const [defaults, setDefaults] = useState<SessionDefaults | null>(null);
	const [error, setError] = useState<string | null>(null);

	const framesRef = useRef<FramesSocket | null>(null);
	const outputRef = useRef<OutputSocket | null>(null);
	const sessionIdRef = useRef<string | null>(null);
	const spoofThresholdRef = useRef(0.5);
	const realThresholdRef = useRef(0.4);
	const stoppingRef = useRef(false);
	const hasScoredRef = useRef(false);
	const chunkHistoryRef = useRef<number[]>([]);
	const framesSeenRef = useRef(0);
	const flushDerivedMetricsRef = useRef<() => void>(() => {});
	const captureModeRef = useRef<CaptureMode>(captureMode);
	captureModeRef.current = captureMode;
	const activeCaptureRef = useRef<CaptureMode | null>(null);

	useEffect(() => {
		flushDerivedMetricsRef.current = throttle(() => {
			setChunkHistory([...chunkHistoryRef.current]);
			setFramesSeen(framesSeenRef.current);
		}, CHART_FLUSH_MS);
	}, []);

	const flushDerivedMetrics = useCallback(() => {
		flushDerivedMetricsRef.current();
	}, []);

	const sendPcm = useCallback((data: ArrayBuffer) => {
		framesRef.current?.sendPcm(data);
	}, []);

	const callCapture = useCallCapture({ onPcm: sendPcm });

	const { stream: audioStream } = useAudioStream({
		encoding: 'int16',
		sampleRate: defaults?.sample_rate ?? 16000,
		channels: 1,
		onBuffer: (buffer) => {
			sendPcm(buffer.data);
		},
	});

	useEffect(() => {
		loadSessionDefaults().then(setDefaults);
	}, []);

	const setCaptureMode = useCallback(
		(mode: CaptureMode) => {
			if (phase !== 'idle') return;
			if (mode === 'call' && Platform.OS !== 'android') {
				setError('Call Scan is only available on Android showcase builds.');
				return;
			}
			setCaptureModeState(mode);
			setError(null);
			if (mode === 'call') {
				callCapture.refreshAccessibility();
			}
		},
		[phase, callCapture],
	);

	const teardown = useCallback(async () => {
		stoppingRef.current = true;
		const mode = activeCaptureRef.current ?? captureModeRef.current;
		try {
			if (mode === 'call') {
				await callCapture.stop();
			} else {
				audioStream.stop();
			}
		} catch {
			// stream may not be running
		}
		activeCaptureRef.current = null;
		framesRef.current?.close();
		outputRef.current?.close();
		framesRef.current = null;
		outputRef.current = null;

		const id = sessionIdRef.current;
		sessionIdRef.current = null;
		if (id) {
			try {
				await deleteSession(id);
			} catch {
				// session may already be gone
			}
		}

		setSessionId(null);
		setPhase('idle');
		setSessionScore(0);
		setChunkIdx(0);
		setLabel('REAL');
		chunkHistoryRef.current = [];
		framesSeenRef.current = 0;
		setChunkHistory([]);
		setBufferFillSamples(0);
		setBufferTargetSamples(0);
		setFramesSeen(0);
		setLastRtf(null);
		setLastLatencyMs(null);
		hasScoredRef.current = false;
		stoppingRef.current = false;
	}, [audioStream, callCapture]);

	useEffect(() => {
		return () => {
			framesRef.current?.close();
			outputRef.current?.close();
			const id = sessionIdRef.current;
			if (id) {
				deleteSession(id).catch(() => {});
			}
		};
	}, []);

	const handleWsClose = useCallback(
		(err: WsCloseError | null) => {
			if (stoppingRef.current || !err) return;
			void hapticError();
			setError(formatApiError(err));
			teardown();
		},
		[teardown],
	);

	const start = useCallback(async () => {
		if (phase !== 'idle') return;
		void hapticLight();
		setError(null);
		setPhase('connecting');
		hasScoredRef.current = false;

		const mode = captureModeRef.current;

		try {
			await ensureReady();

			const sessionDefaults = await loadSessionDefaults();
			setDefaults(sessionDefaults);

			if (mode === 'call') {
				if (Platform.OS !== 'android') {
					throw new Error('Call Scan is only available on Android showcase builds.');
				}
				callCapture.refreshAccessibility();
			}

			const { granted } = await requestRecordingPermissionsAsync();
			if (!granted) {
				setPhase('idle');
				setError('Microphone permission is required for live detection.');
				return;
			}

			await setAudioModeAsync({
				allowsRecording: true,
				playsInSilentMode: true,
			});

			const created = await createSession({
				sample_rate: sessionDefaults.sample_rate,
				chunk_duration_s: sessionDefaults.chunk_duration_s,
				ema_alpha: sessionDefaults.ema_alpha,
				spoof_threshold: sessionDefaults.spoof_threshold,
				vad_mode: sessionDefaults.vad_mode,
				vad_frame_ms: sessionDefaults.vad_frame_ms,
			});

			const id = created.session_id;
			sessionIdRef.current = id;
			setSessionId(id);
			setSpoofThreshold(created.config.spoof_threshold);
			spoofThresholdRef.current = created.config.spoof_threshold;
			setRealThreshold(sessionDefaults.real_threshold);
			realThresholdRef.current = sessionDefaults.real_threshold;
			setBufferTargetSamples(created.config.chunk_samples);

			await new Promise<void>((resolve, reject) => {
				let outputOpen = false;
				let framesOpen = false;

				const tryReady = () => {
					if (outputOpen && framesOpen) resolve();
				};

				outputRef.current = connectOutputSocket(id, {
					onOpen: () => {
						outputOpen = true;
						tryReady();
					},
					onMessage: (msg) => {
						if (msg.type === 'warmup') {
							setBufferFillSamples(msg.buffer_fill_samples);
							setBufferTargetSamples(msg.buffer_target_samples);
							if (!hasScoredRef.current) {
								setPhase('warmup');
							}
						} else if (msg.type === 'score') {
							hasScoredRef.current = true;
							setPhase('active');
							setSessionScore(msg.session_score);
							setChunkIdx(msg.chunk_idx);
							const nextLabel = deriveSessionLabel(
								msg.session_score,
								spoofThresholdRef.current,
								realThresholdRef.current,
							);
							setLabel((prev) => {
								if (prev !== 'SPOOF' && nextLabel === 'SPOOF') {
									void hapticWarning();
								}
								return nextLabel;
							});
							setLastRtf(msg.rtf);
							setLastLatencyMs(msg.latency_ms);
							chunkHistoryRef.current = [
								...chunkHistoryRef.current,
								msg.session_score,
							].slice(-CHUNK_HISTORY_MAX);
							flushDerivedMetrics();
						} else if (msg.type === 'error') {
							void hapticError();
							setError(formatWsOutputError(msg.code, msg.message));
							teardown();
						}
					},
					onClose: handleWsClose,
					onError: (e) => reject(e),
				});

				framesRef.current = connectFramesSocket(id, {
					onOpen: () => {
						framesOpen = true;
						tryReady();
					},
					onMessage: (msg) => {
						if (msg.type === 'ack') {
							framesSeenRef.current = msg.frame_idx;
							flushDerivedMetrics();
						} else if (msg.type === 'error') {
							// Soft error — socket stays open (docs/api.md).
							void hapticWarning();
							setError(formatWsFramesError(msg.code));
						}
					},
					onClose: handleWsClose,
					onError: (e) => reject(e),
				});
			});

			activeCaptureRef.current = mode;
			if (mode === 'call') {
				await callCapture.start(sessionDefaults.sample_rate);
			} else {
				await audioStream.start();
			}
		} catch (e) {
			void hapticError();
			setPhase('idle');
			setError(formatApiError(e));
			await teardown();
		}
	}, [
		phase,
		audioStream,
		callCapture,
		teardown,
		handleWsClose,
		flushDerivedMetrics,
		ensureReady,
	]);

	const stop = useCallback(async () => {
		void hapticMedium();
		setError(null);
		await teardown();
	}, [teardown]);

	const connectionStatus: ConnectionStatus =
		phase === 'connecting'
			? 'Connecting'
			: phase === 'warmup'
				? 'Warming up'
				: phase === 'active'
					? 'Live'
					: 'Disconnected';

	return {
		phase,
		captureMode,
		setCaptureMode,
		sessionId,
		sessionScore,
		chunkIdx,
		label,
		chunkHistory,
		bufferFillSamples,
		bufferTargetSamples,
		spoofThreshold,
		realThreshold,
		framesSeen,
		lastRtf,
		lastLatencyMs,
		connectionStatus,
		defaults,
		error,
		callCapture,
		start,
		stop,
		clearError: () => setError(null),
	};
}
