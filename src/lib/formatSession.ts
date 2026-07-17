import { formatSessionLabel as formatSessionLabelBase } from '@/lib/sessionLabel';

const timeFormatter = new Intl.DateTimeFormat(undefined, {
	hour: '2-digit',
	minute: '2-digit',
});

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

/** Prefer importing from `@/lib/sessionLabel`; re-export for existing call sites. */
export const formatSessionLabel = formatSessionLabelBase;

export function shortSessionId(sessionId: string): string {
	return sessionId.length > 8 ? sessionId.slice(0, 8) : sessionId;
}

export function formatTimestamp(ts: number): string {
	return timeFormatter.format(new Date(ts * 1000));
}

function sameCalendarDay(a: Date, b: Date): boolean {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	);
}

const daySectionFormatter = new Intl.DateTimeFormat(undefined, {
	month: 'short',
	day: 'numeric',
	year: 'numeric',
});

/** Section label for history list grouping. */
export function formatDaySectionLabel(
	ts: number,
	nowMs = Date.now(),
): string {
	const date = new Date(ts * 1000);
	const now = new Date(nowMs);
	if (sameCalendarDay(date, now)) return 'Today';
	const yesterday = new Date(nowMs - 86_400_000);
	if (sameCalendarDay(date, yesterday)) return 'Yesterday';
	return daySectionFormatter.format(date);
}

export function daySectionKey(ts: number): string {
	const d = new Date(ts * 1000);
	return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
