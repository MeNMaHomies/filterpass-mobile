import { ApiError } from '@/api/errors';
import type { HealthResponse } from '@/types/api';

export const HEALTH_NOT_READY_MESSAGE = 'Backend model not ready';

/** Throws when /health is reachable but the detector is not usable. */
export function assertBackendHealthy(health: HealthResponse): HealthResponse {
	if (health.status !== 'ok' || !health.model_loaded) {
		throw new ApiError(HEALTH_NOT_READY_MESSAGE, 0, health, null);
	}
	return health;
}
