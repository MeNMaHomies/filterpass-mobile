import type { SessionLabel } from '@/types';
import type { CaptureMode } from '../types';

export function formatVerdictHeadline(label: SessionLabel): string {
	switch (label) {
		case 'REAL':
			return 'Sounds real';
		case 'UNCERTAIN':
			return 'Not sure yet';
		case 'SPOOF':
			return 'Likely synthetic';
	}
}

export function formatCaptureModeLabel(mode: CaptureMode): string {
	return mode === 'call' ? 'Call Scan' : 'Mic';
}

export function formatElapsed(seconds: number): string {
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m}:${s.toString().padStart(2, '0')}`;
}

export type ListeningStatus = 'waiting' | 'speech' | 'quiet';

export function deriveListeningStatus(
	lastVoiced: boolean | null,
	totalAcks: number,
	voicedAcks: number,
): ListeningStatus {
	if (totalAcks === 0) return 'waiting';
	if (lastVoiced) return 'speech';
	const ratio = voicedAcks / totalAcks;
	return ratio >= 0.25 ? 'speech' : 'quiet';
}

export function formatListeningStatus(status: ListeningStatus): string {
	switch (status) {
		case 'waiting':
			return 'Waiting for audio…';
		case 'speech':
			return 'Hearing speech';
		case 'quiet':
			return 'Quiet — keep talking';
	}
}
