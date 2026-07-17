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

export function homeBucketsQueryOptions(fromTs: number, toTs: number) {
	const params = { from_ts: fromTs, to_ts: toTs, bucket_s: 3600 };
	return {
		queryKey: queryKeys.history.buckets(params),
		queryFn: () => getInferenceBuckets(params),
	} as const;
}

export { healthQueryOptions };
