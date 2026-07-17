import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
	requestRecordingPermissionsAsync,
	setAudioModeAsync,
} from 'expo-audio';
import { createSession, deleteSession } from '@/api';
import { type FramesSocket, type OutputSocket, WsCloseError } from '@/api/ws';
import { useBackendHealth } from '@/features/health';
import {
	loadSessionDefaults,
	type SessionDefaults,
} from '@/features/settings/sessionDefaults';
import {
	formatApiError,
	formatWsFramesError,
	formatWsOutputError,
} from '@/lib/apiError';
import {
	hapticError,
	hapticLight,
	hapticMedium,
	hapticWarning,
} from '@/lib/haptics';
import { throttle } from '@/lib/throttle';
import type { SessionLabel } from '@/types';
import { useMicCapture } from '../capture/useMicCapture';
import { CHART_FLUSH_MS } from '../domain/liveMetrics';
import {
	createInitialLiveSessionModel,
	reduceFramesMessage,
	reduceOutputMessage,
	type LiveSessionModel,
} from '../domain/liveSessionReducer';
import { deriveConnectionStatus } from '../domain/connectionStatus';
import { connectLiveSession } from '../session/connectLiveSession';
import type {
	CallScanSetup,
	CaptureMode,
	LivePhase,
	LiveSessionState,
} from '../types';
import { useCallCapture } from './useCallCapture';

export type { LivePhase, CaptureMode, ConnectionStatus } from '../types';
export type { LiveSessionState };

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
	const modelRef = useRef<LiveSessionModel>(createInitialLiveSessionModel());
	const chunkHistoryRef = useRef<number[]>([]);
	const framesSeenRef = useRef(0);
	const flushDerivedMetricsRef = useRef<() => void>(() => {});
	const captureModeRef = useRef<CaptureMode>(captureMode);
	const activeCaptureRef = useRef<CaptureMode | null>(null);

	useEffect(() => {
		captureModeRef.current = captureMode;
	}, [captureMode]);

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
	const micCapture = useMicCapture({
		sampleRate: defaults?.sample_rate ?? 16000,
		onPcm: sendPcm,
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
				await micCapture.stop();
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
		modelRef.current = createInitialLiveSessionModel();
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
		stoppingRef.current = false;
	}, [micCapture, callCapture]);

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
			void teardown();
		},
		[teardown],
	);

	const start = useCallback(async () => {
		if (phase !== 'idle') return;
		void hapticLight();
		setError(null);
		setPhase('connecting');
		modelRef.current = {
			...createInitialLiveSessionModel(),
			phase: 'connecting',
		};

		const mode = captureModeRef.current;

		try {
			await ensureReady();

			const sessionDefaults = await loadSessionDefaults();
			setDefaults(sessionDefaults);

			if (mode === 'call') {
				if (Platform.OS !== 'android') {
					throw new Error(
						'Call Scan is only available on Android showcase builds.',
					);
				}
				callCapture.refreshAccessibility();
			}

			const { granted } = await requestRecordingPermissionsAsync();
			if (!granted) {
				setPhase('idle');
				modelRef.current = createInitialLiveSessionModel();
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

			const channels = await connectLiveSession(id, {
				onClose: handleWsClose,
				onOutput: (msg) => {
					const result = reduceOutputMessage(modelRef.current, msg, {
						spoof: spoofThresholdRef.current,
						real: realThresholdRef.current,
					});

					if (result.effect.type === 'teardown') {
						void hapticError();
						setError(
							formatWsOutputError(
								(result.errorCode as 'decode_failed' | 'infer_failed') ??
									'infer_failed',
								result.errorMessage ?? '',
							),
						);
						void teardown();
						return;
					}

					modelRef.current = result.state;
					setPhase(result.state.phase);

					if (msg.type === 'warmup') {
						setBufferFillSamples(result.state.metrics.bufferFillSamples);
						setBufferTargetSamples(result.state.metrics.bufferTargetSamples);
						return;
					}

					if (msg.type === 'score') {
						if (result.effect.type === 'haptic_spoof') {
							void hapticWarning();
						}
						setSessionScore(result.state.metrics.sessionScore);
						setChunkIdx(result.state.metrics.chunkIdx);
						setLabel(result.state.metrics.label);
						setLastRtf(result.state.metrics.lastRtf);
						setLastLatencyMs(result.state.metrics.lastLatencyMs);
						chunkHistoryRef.current = result.state.metrics.chunkHistory;
						flushDerivedMetrics();
					}
				},
				onFrames: (msg) => {
					const result = reduceFramesMessage(modelRef.current, msg);

					if (result.effect.type === 'soft_error') {
						void hapticWarning();
						setError(
							formatWsFramesError(
								(result.errorCode as
									| 'frame_too_large'
									| 'decode_failed'
									| 'invalid_sample_rate'
									| 'invalid_control') ?? 'invalid_control',
							),
						);
						return;
					}

					modelRef.current = result.state;
					framesSeenRef.current = result.state.metrics.framesSeen;
					flushDerivedMetrics();
				},
			});

			framesRef.current = channels.frames;
			outputRef.current = channels.output;

			activeCaptureRef.current = mode;
			if (mode === 'call') {
				await callCapture.start(sessionDefaults.sample_rate);
			} else {
				await micCapture.start(sessionDefaults.sample_rate);
			}
		} catch (e) {
			void hapticError();
			setPhase('idle');
			modelRef.current = createInitialLiveSessionModel();
			setError(formatApiError(e));
			await teardown();
		}
	}, [
		phase,
		micCapture,
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

	const callScan: CallScanSetup = {
		available: callCapture.available,
		accessibility: callCapture.accessibility,
		refreshAccessibility: callCapture.refreshAccessibility,
		openAccessibilitySettings: callCapture.openAccessibilitySettings,
	};

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
		connectionStatus: deriveConnectionStatus(phase),
		defaults,
		error,
		callScan,
		start,
		stop,
		clearError: () => setError(null),
	};
}
