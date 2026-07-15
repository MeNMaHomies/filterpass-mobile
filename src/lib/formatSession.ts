import type { SessionLabel } from '@/types';
import { deriveSessionLabel } from '@/lib/sessionLabel';

export function formatDuration(seconds: number): string {
	if (seconds < 60) return `${Math.round(seconds)}s`;
	const m = Math.floor(seconds / 60);
	const s = Math.round(seconds % 60);
	return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export function formatDurationFromTimestamps(
	createdAt: number,
	closedAt: number | null,
): string {
	if (closedAt === null) return '—';
	return formatDuration(Math.max(0, closedAt - createdAt));
}

export function formatAgo(ts: number, now = Date.now() / 1000): string {
	const diff = Math.max(0, now - ts);
	if (diff < 60) return 'just now';
	if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
	if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
	return `${Math.floor(diff / 86400)}d ago`;
}

export function formatSessionLabel(
	avgSessionScore: number | null,
	spoofThreshold: number,
): SessionLabel | '—' {
	if (avgSessionScore === null) return '—';
	return deriveSessionLabel(avgSessionScore, spoofThreshold);
}

export function shortSessionId(sessionId: string): string {
	return sessionId.length > 8 ? sessionId.slice(0, 8) : sessionId;
}

export function formatTimestamp(ts: number): string {
	const d = new Date(ts * 1000);
	return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
