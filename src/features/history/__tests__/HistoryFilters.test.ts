import {
	hasActiveHistoryFilters,
	sessionMatchesDateFilter,
} from '@/features/history/components/HistoryFilters';

describe('sessionMatchesDateFilter', () => {
	const noonLocal = new Date(2026, 6, 16, 12, 0, 0);
	const nowMs = noonLocal.getTime();
	const todayTs = Math.floor(nowMs / 1000);
	const yesterdayTs = todayTs - 86_400;
	const eightDaysAgoTs = todayTs - 8 * 86_400;
	const fortyDaysAgoTs = todayTs - 40 * 86_400;

	it('allows all timestamps for all filter', () => {
		expect(sessionMatchesDateFilter(fortyDaysAgoTs, 'all', nowMs)).toBe(true);
	});

	it('matches today only for today filter', () => {
		expect(sessionMatchesDateFilter(todayTs, 'today', nowMs)).toBe(true);
		expect(sessionMatchesDateFilter(yesterdayTs, 'today', nowMs)).toBe(false);
	});

	it('matches rolling windows for 7d and 30d', () => {
		expect(sessionMatchesDateFilter(yesterdayTs, '7d', nowMs)).toBe(true);
		expect(sessionMatchesDateFilter(eightDaysAgoTs, '7d', nowMs)).toBe(false);
		expect(sessionMatchesDateFilter(eightDaysAgoTs, '30d', nowMs)).toBe(true);
		expect(sessionMatchesDateFilter(fortyDaysAgoTs, '30d', nowMs)).toBe(false);
	});
});

describe('hasActiveHistoryFilters', () => {
	it('detects non-default filters', () => {
		expect(hasActiveHistoryFilters('all', 'all', '')).toBe(false);
		expect(hasActiveHistoryFilters('SPOOF', 'all', '')).toBe(true);
		expect(hasActiveHistoryFilters('all', '7d', '')).toBe(true);
		expect(hasActiveHistoryFilters('all', 'all', 'abc')).toBe(true);
	});
});
