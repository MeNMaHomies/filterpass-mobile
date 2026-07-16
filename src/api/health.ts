import { apiRequest } from './client';
import { healthResponseSchema } from './schemas';
import type { HealthResponse } from '@/types/api';

/** Health is the fail-fast probe — shorter than the default API timeout. */
export const HEALTH_REQUEST_TIMEOUT_MS = 5_000;

export function getHealth(): Promise<HealthResponse> {
	return apiRequest<HealthResponse>('/health', {
		schema: healthResponseSchema,
		timeoutMs: HEALTH_REQUEST_TIMEOUT_MS,
	});
}
