import type { SessionLabel } from '@/types';

export type LabelFilter = 'all' | SessionLabel;
export type DateFilter = 'all' | 'today' | '7d' | '30d';

/** True when any non-default filter is active (including search). */
export function hasActiveHistoryFilters(
	labelFilter: LabelFilter,
	dateFilter: DateFilter,
	query: string,
): boolean {
	return (
		labelFilter !== 'all' ||
		dateFilter !== 'all' ||
		query.trim().length > 0
	);
}

export function sessionMatchesDateFilter(
	sortTs: number,
	dateFilter: DateFilter,
	nowMs = Date.now(),
): boolean {
	if (dateFilter === 'all') return true;

	const date = new Date(sortTs * 1000);
	const now = new Date(nowMs);

	if (dateFilter === 'today') {
		return (
			date.getFullYear() === now.getFullYear() &&
			date.getMonth() === now.getMonth() &&
			date.getDate() === now.getDate()
		);
	}

	const windowMs =
		dateFilter === '7d' ? 7 * 86_400_000 : 30 * 86_400_000;
	return sortTs * 1000 >= nowMs - windowMs;
}
