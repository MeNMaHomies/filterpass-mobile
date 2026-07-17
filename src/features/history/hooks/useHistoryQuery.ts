import { useCallback, useMemo, useState } from 'react';
import {
	hasActiveHistoryFilters,
	sessionMatchesDateFilter,
	type DateFilter,
	type LabelFilter,
} from '../components/HistoryFilters';
import {
	daySectionKey,
	formatDaySectionLabel,
} from '@/lib/formatSession';
import type { HistorySession } from '@/types';

export type DayHeaderItem = {
	kind: 'header';
	key: string;
	title: string;
};

export type SessionItem = {
	kind: 'session';
	key: string;
	session: HistorySession;
};

export type HistoryListItem = DayHeaderItem | SessionItem;

export function useHistoryQuery(sessions: HistorySession[]) {
	const [query, setQuery] = useState('');
	const [labelFilter, setLabelFilter] = useState<LabelFilter>('all');
	const [dateFilter, setDateFilter] = useState<DateFilter>('all');

	const filtersActive = hasActiveHistoryFilters(labelFilter, dateFilter, query);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		const base = sessions.filter((s) => {
			if (q && !s.id.toLowerCase().includes(q)) return false;
			if (labelFilter !== 'all' && s.label !== labelFilter) return false;
			if (!sessionMatchesDateFilter(s.sortTs, dateFilter)) return false;
			return true;
		});
		return [...base].sort((a, b) => b.sortTs - a.sortTs);
	}, [sessions, query, labelFilter, dateFilter]);

	const spoofCount = useMemo(
		() => filtered.filter((s) => s.label === 'SPOOF').length,
		[filtered],
	);

	const listItems = useMemo(() => {
		const items: HistoryListItem[] = [];
		let lastKey = '';
		for (const session of filtered) {
			const key = daySectionKey(session.sortTs);
			if (key !== lastKey) {
				items.push({
					kind: 'header',
					key: `h-${key}`,
					title: formatDaySectionLabel(session.sortTs),
				});
				lastKey = key;
			}
			items.push({
				kind: 'session',
				key: session.id,
				session,
			});
		}
		return items;
	}, [filtered]);

	const stickyHeaderIndices = useMemo(
		() =>
			listItems
				.map((item, index) => (item.kind === 'header' ? index : -1))
				.filter((index) => index >= 0),
		[listItems],
	);

	const clearFilters = useCallback(() => {
		setQuery('');
		setLabelFilter('all');
		setDateFilter('all');
	}, []);

	const emptyTitle = filtersActive ? 'No matches' : 'No sessions found';
	const emptyDescription = filtersActive
		? 'Try clearing search or filters.'
		: 'Completed live sessions will appear here.';

	return {
		query,
		setQuery,
		labelFilter,
		setLabelFilter,
		dateFilter,
		setDateFilter,
		filtersActive,
		filtered,
		spoofCount,
		listItems,
		stickyHeaderIndices,
		clearFilters,
		emptyTitle,
		emptyDescription,
	};
}
