import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
	requestRecordingPermissionsAsync,
	setAudioModeAsync,
} from 'expo-audio';
import { type FramesSocket, type OutputSocket, WsCloseError } from '@/api/ws';
import { useBackendHealth } from '@/features/health';
import { ensureSessionDefaults } from '@/features/settings/sessionDefaultsStore';
import { useSessionDefaults } from '@/features/settings/hooks/useSessionDefaults';
import {
	createLiveSessionMutation,
	deleteLiveSessionMutation,
	invalidateAfterLiveSessionChange,
} from '@/queries/sessions';
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

type SessionMeta = {
	sessionId: string | null;
	spoofThreshold: number;
	realThreshold: number;
};

const INITIAL_META: SessionMeta = {
	sessionId: null,
	spoofThreshold: 0.5,
	realThreshold: 0.4,
};

/**
 * Live session orchestrator: health gate → create session → dual WS → capture.
 * Domain state lives in one `model`; chart fields flush on a throttle.
 */
export function useLiveSession(): LiveSessionState {
	const { ensureReady } = useBackendHealth();
	const [captureMode, setCaptureModeState] = useState<CaptureMode>('mic');
	const [model, setModel] = useState<LiveSessionModel>(
		createInitialLiveSessionModel,
	);
	const [meta, setMeta] = useState<SessionMeta>(INITIAL_META);
	const [chartHistory, setChartHistory] = useState<number[]>([]);
	const [chartFramesSeen, setChartFramesSeen] = useState(0);
	const [voiceSnapshot, setVoiceSnapshot] = useState({
		lastVoiced: null as boolean | null,
		voicedAcks: 0,
		totalAcks: 0,
	});
	const [startedAt, setStartedAt] = useState<number | null>(null);
	const { defaults } = useSessionDefaults();
	const [error, setError] = useState<string | null>(null);

	const framesRef = useRef<FramesSocket | null>(null);
	const outputRef = useRef<OutputSocket | null>(null);
	const sessionIdRef = useRef<string | null>(null);
	const spoofThresholdRef = useRef(INITIAL_META.spoofThreshold);
	const realThresholdRef = useRef(INITIAL_META.realThreshold);
	const stoppingRef = useRef(false);
	const modelRef = useRef(model);
	const flushChartRef = useRef<() => void>(() => {});
	const captureModeRef = useRef<CaptureMode>(captureMode);
	const activeCaptureRef = useRef<CaptureMode | null>(null);
	const stopCaptureRef = useRef<() => Promise<void>>(async () => {});

	useEffect(() => {
		modelRef.current = model;
	}, [model]);

	useEffect(() => {
		captureModeRef.current = captureMode;
	}, [captureMode]);

	useEffect(() => {
		flushChartRef.current = throttle(() => {
			const { metrics } = modelRef.current;
			setChartHistory([...metrics.chunkHistory]);
			setChartFramesSeen(metrics.framesSeen);
			setVoiceSnapshot({
				lastVoiced: metrics.lastVoiced,
				voicedAcks: metrics.voicedAcks,
				totalAcks: metrics.totalAcks,
			});
		}, CHART_FLUSH_MS);
	}, []);

	const sendPcm = useCallback((data: ArrayBuffer) => {
		framesRef.current?.sendPcm(data);
	}, []);

	const callCapture = useCallCapture({ onPcm: sendPcm });
	const micCapture = useMicCapture({
		sampleRate: defaults.sample_rate,
		onPcm: sendPcm,
	});

	useEffect(() => {
		stopCaptureRef.current = async () => {
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
		};
	}, [callCapture, micCapture]);

	const setCaptureMode = useCallback(
		(mode: CaptureMode) => {
			if (modelRef.current.phase !== 'idle') return;
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
		[callCapture],
	);

	const teardown = useCallback(async () => {
		stoppingRef.current = true;
		await stopCaptureRef.current();

		framesRef.current?.close();
		outputRef.current?.close();
		framesRef.current = null;
		outputRef.current = null;

		const id = sessionIdRef.current;
		sessionIdRef.current = null;
		if (id) {
			try {
				await deleteLiveSessionMutation(id);
			} catch {
				// session may already be gone — still refresh lists
				await invalidateAfterLiveSessionChange().catch(() => {});
			}
		}

		const next = createInitialLiveSessionModel();
		modelRef.current = next;
		setModel(next);
		setMeta(INITIAL_META);
		setChartHistory([]);
		setChartFramesSeen(0);
		setVoiceSnapshot({ lastVoiced: null, voicedAcks: 0, totalAcks: 0 });
		setStartedAt(null);
		stoppingRef.current = false;
	}, []);

	// Full teardown on unmount (capture + sockets + REST delete).
	useEffect(() => {
		return () => {
			stoppingRef.current = true;
			void stopCaptureRef.current();
			framesRef.current?.close();
			outputRef.current?.close();
			framesRef.current = null;
			outputRef.current = null;
			const id = sessionIdRef.current;
			sessionIdRef.current = null;
			if (id) {
				deleteLiveSessionMutation(id).catch(() => {
					void invalidateAfterLiveSessionChange();
				});
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
		if (modelRef.current.phase !== 'idle') return;
		void hapticLight();
		setError(null);
		const connecting = {
			...createInitialLiveSessionModel(),
			phase: 'connecting' as LivePhase,
		};
		modelRef.current = connecting;
		setModel(connecting);

		const mode = captureModeRef.current;

		try {
			await ensureReady();
			const sessionDefaults = await ensureSessionDefaults();

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
				const idle = createInitialLiveSessionModel();
				modelRef.current = idle;
				setModel(idle);
				setError('Microphone permission is required for live detection.');
				return;
			}

			await setAudioModeAsync({
				allowsRecording: true,
				playsInSilentMode: true,
			});

			const created = await createLiveSessionMutation({
				sample_rate: sessionDefaults.sample_rate,
				chunk_duration_s: sessionDefaults.chunk_duration_s,
				ema_alpha: sessionDefaults.ema_alpha,
				spoof_threshold: sessionDefaults.spoof_threshold,
				vad_mode: sessionDefaults.vad_mode,
				vad_frame_ms: sessionDefaults.vad_frame_ms,
			});

			const id = created.session_id;
			sessionIdRef.current = id;
			spoofThresholdRef.current = created.config.spoof_threshold;
			realThresholdRef.current = sessionDefaults.real_threshold;
			setMeta({
				sessionId: id,
				spoofThreshold: created.config.spoof_threshold,
				realThreshold: sessionDefaults.real_threshold,
			});
			setModel((prev) => ({
				...prev,
				metrics: {
					...prev.metrics,
					bufferTargetSamples: created.config.chunk_samples,
				},
			}));
			modelRef.current = {
				...modelRef.current,
				metrics: {
					...modelRef.current.metrics,
					bufferTargetSamples: created.config.chunk_samples,
				},
			};

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
					setModel(result.state);

					if (msg.type === 'score') {
						if (result.effect.type === 'haptic_spoof') {
							void hapticWarning();
						}
						flushChartRef.current();
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
					flushChartRef.current();
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
			setStartedAt(Date.now());
		} catch (e) {
			void hapticError();
			const idle = createInitialLiveSessionModel();
			modelRef.current = idle;
			setModel(idle);
			setError(formatApiError(e));
			await teardown();
		}
	}, [micCapture, callCapture, teardown, handleWsClose, ensureReady]);

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

	const { metrics, phase } = model;

	return {
		phase,
		captureMode,
		setCaptureMode,
		sessionId: meta.sessionId,
		sessionScore: metrics.sessionScore,
		chunkIdx: metrics.chunkIdx,
		label: metrics.label,
		chunkHistory: chartHistory,
		bufferFillSamples: metrics.bufferFillSamples,
		bufferTargetSamples: metrics.bufferTargetSamples,
		spoofThreshold: meta.spoofThreshold,
		realThreshold: meta.realThreshold,
		framesSeen: chartFramesSeen,
		lastRtf: metrics.lastRtf,
		lastLatencyMs: metrics.lastLatencyMs,
		lastChunkProb: metrics.lastChunkProb,
		lastVoiced: voiceSnapshot.lastVoiced,
		voicedAcks: voiceSnapshot.voicedAcks,
		totalAcks: voiceSnapshot.totalAcks,
		startedAt,
		connectionStatus: deriveConnectionStatus(phase),
		defaults,
		error,
		callScan,
		start,
		stop,
		clearError: () => setError(null),
	};
}
