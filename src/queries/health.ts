import { getHealth } from '@/api';
import { assertBackendHealthy } from '@/lib/backendHealth';
import type { HealthResponse } from '@/types/api';
import { queryKeys } from './keys';

export { queryKeys };

/** Fetch /health and assert model readiness (throws ApiError if not ready). */
export async function fetchHealthyBackend(): Promise<HealthResponse> {
	return assertBackendHealthy(await getHealth());
}

export const healthQueryOptions = {
	queryKey: queryKeys.health,
	queryFn: fetchHealthyBackend,
} as const;
