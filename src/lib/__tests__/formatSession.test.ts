import {
	formatAgo,
	formatDuration,
	formatDurationFromTimestamps,
	formatSessionLabel,
	shortSessionId,
} from '@/lib/formatSession';

describe('formatDuration', () => {
	it('formats sub-minute durations', () => {
		expect(formatDuration(45)).toBe('45s');
	});

	it('formats minutes and seconds', () => {
		expect(formatDuration(252)).toBe('4m 12s');
	});
});

describe('formatDurationFromTimestamps', () => {
	it('returns dash when session is open', () => {
		expect(formatDurationFromTimestamps(100, null)).toBe('—');
	});

	it('computes closed session duration', () => {
		expect(formatDurationFromTimestamps(100, 352)).toBe('4m 12s');
	});
});

describe('formatAgo', () => {
	it('formats recent timestamps', () => {
		expect(formatAgo(1000, 1030)).toBe('just now');
		expect(formatAgo(1000, 3700)).toBe('45m ago');
	});
});

describe('formatSessionLabel', () => {
	it('returns dash when no score', () => {
		expect(formatSessionLabel(null, 0.5)).toBe('—');
	});

	it('derives label from score and threshold', () => {
		expect(formatSessionLabel(0.2, 0.5)).toBe('REAL');
		expect(formatSessionLabel(0.7, 0.5)).toBe('SPOOF');
	});
});

describe('shortSessionId', () => {
	it('truncates long ids', () => {
		expect(shortSessionId('abcdef1234567890')).toBe('abcdef12');
	});
});
