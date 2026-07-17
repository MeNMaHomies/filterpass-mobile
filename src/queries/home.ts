import { getInferenceBuckets, listHistorySessions } from '@/api';
import { queryKeys } from './keys';
import { healthQueryOptions } from './health';

export function homeActiveSessionsQueryOptions() {
	return {
		queryKey: queryKeys.history.sessions({
			only_closed: false,
			limit: 100,
		}),
		queryFn: () => listHistorySessions({ only_closed: false, limit: 100 }),
	} as const;
}

export function homeRecentSessionsQueryOptions() {
	return {
		queryKey: queryKeys.history.sessions({ limit: 3 }),
		queryFn: () => listHistorySessions({ limit: 3 }),
	} as const;
}

export function homeBuckets24hQueryOptions() {
	return {
		queryKey: queryKeys.history.buckets({ window: '24h', bucket_s: 3600 }),
		queryFn: () => {
			const toTs = Math.floor(Date.now() / 1000);
			const fromTs = toTs - 86400;
			return getInferenceBuckets({
				from_ts: fromTs,
				to_ts: toTs,
				bucket_s: 3600,
			});
		},
	} as const;
}

export { healthQueryOptions };
