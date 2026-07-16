import { apiRequest } from './client';
import { healthResponseSchema } from './schemas';
import type { HealthResponse } from '@/types/api';

export function getHealth(): Promise<HealthResponse> {
	return apiRequest<HealthResponse>('/health', {
		schema: healthResponseSchema,
	});
}
