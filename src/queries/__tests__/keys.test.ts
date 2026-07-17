import { queryKeys } from '../keys';
import { HISTORY_PAGE_SIZE, historySessionsInfiniteOptions } from '../history';

describe('queryKeys', () => {
	it('keeps health key stable', () => {
		expect(queryKeys.health).toEqual(['health']);
	});

	it('nests history sessions under history.all', () => {
		const key = queryKeys.history.sessions({ limit: 50 });
		expect(key[0]).toBe('history');
		expect(key[1]).toBe('sessions');
	});

	it('scopes session detail by id', () => {
		expect(queryKeys.history.session('abc12345')).toEqual([
			'history',
			'session',
			'abc12345',
		]);
	});
});

describe('historySessionsInfiniteOptions', () => {
	it('stops paging when last page is short', () => {
		const opts = historySessionsInfiniteOptions();
		expect(opts.initialPageParam).toBe(0);
		expect(
			opts.getNextPageParam(
				new Array(HISTORY_PAGE_SIZE).fill({}),
				[],
				0,
			),
		).toBe(HISTORY_PAGE_SIZE);
		expect(opts.getNextPageParam([{ id: 1 }], [], 0)).toBeUndefined();
	});
});
