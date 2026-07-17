import type { SessionLabel } from '@/types';
import type { SessionDefaults } from '@/features/settings/sessionDefaults';

export type LivePhase = 'idle' | 'connecting' | 'warmup' | 'active';

export type CaptureMode = 'mic' | 'call';

export type ConnectionStatus =
	| 'Disconnected'
	| 'Connecting'
	| 'Live'
	| 'Warming up';

export type AccessibilityStatus = {
	enabled: boolean;
	connected: boolean;
};

export type LiveMetrics = {
	sessionScore: number;
	chunkIdx: number;
	label: SessionLabel;
	chunkHistory: number[];
	bufferFillSamples: number;
	bufferTargetSamples: number;
	framesSeen: number;
	lastRtf: number | null;
	lastLatencyMs: number | null;
	spoofThreshold: number;
	realThreshold: number;
};

/** Idle Call Scan setup surface — no start/stop/PCM. */
export type CallScanSetup = {
	available: boolean;
	accessibility: AccessibilityStatus;
	refreshAccessibility: () => AccessibilityStatus;
	openAccessibilitySettings: () => void;
};

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
	callScan: CallScanSetup;
	start: () => Promise<void>;
	stop: () => Promise<void>;
	clearError: () => void;
};
