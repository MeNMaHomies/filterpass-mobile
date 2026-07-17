import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/errors';

function shouldRetry(failureCount: number, error: unknown): boolean {
	if (failureCount >= 1) return false;
	if (error instanceof ApiError) {
		// Client validation / offline — no retry.
		if (error.clientCode) return false;
		if (error.status === 0) return false;
		if (error.status >= 400 && error.status < 500) return false;
	}
	return true;
}

/** App-wide QueryClient defaults for mobile + local backend. */
export function createAppQueryClient(): QueryClient {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 30_000,
				gcTime: 5 * 60_000,
				retry: shouldRetry,
				refetchOnReconnect: true,
				refetchOnWindowFocus: true,
			},
			mutations: {
				retry: false,
			},
		},
	});
}

export const queryClient = createAppQueryClient();
