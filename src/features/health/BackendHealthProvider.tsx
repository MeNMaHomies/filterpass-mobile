import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	type ReactNode,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/errors';
import type { HealthResponse } from '@/types/api';
import { ClientErrorCode } from '@/lib/clientErrorCodes';
import { formatApiError } from '@/lib/apiError';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { healthQueryOptions } from '@/queries/health';
import { queryKeys } from '@/queries/keys';

export type BackendHealthStatus = 'checking' | 'ok' | 'down';

type BackendHealthContextValue = {
	status: BackendHealthStatus;
	health: HealthResponse | null;
	/** User-facing error when backend is down (null while offline — OfflineBanner owns that). */
	error: string | null;
	refresh: () => Promise<void>;
	/** Re-check /health and throw a formatted failure if not ready. */
	ensureReady: () => Promise<HealthResponse>;
};

const BackendHealthContext = createContext<BackendHealthContextValue | null>(
	null,
);

export function BackendHealthProvider({ children }: { children: ReactNode }) {
	const { isOffline } = useNetworkStatus();
	const queryClient = useQueryClient();

	const query = useQuery({
		...healthQueryOptions,
		enabled: !isOffline,
		retry: false,
	});

	const { status, health, error } = useMemo(() => {
		if (isOffline) {
			return {
				status: 'down' as const,
				health: null,
				error: null,
			};
		}
		if (query.isPending && !query.isFetched) {
			return {
				status: 'checking' as const,
				health: null,
				error: null,
			};
		}
		if (query.isSuccess) {
			return {
				status: 'ok' as const,
				health: query.data,
				error: null,
			};
		}
		return {
			status: 'down' as const,
			health: null,
			error: query.error ? formatApiError(query.error) : null,
		};
	}, [
		isOffline,
		query.isPending,
		query.isFetched,
		query.isSuccess,
		query.data,
		query.error,
	]);

	const refresh = useCallback(async () => {
		if (isOffline) return;
		await queryClient.refetchQueries({ queryKey: queryKeys.health });
	}, [isOffline, queryClient]);

	const ensureReady = useCallback(async () => {
		if (isOffline) {
			throw new ApiError(
				'No internet connection',
				0,
				null,
				null,
				ClientErrorCode.NO_INTERNET,
			);
		}
		return queryClient.fetchQuery({
			...healthQueryOptions,
			staleTime: 0,
		});
	}, [isOffline, queryClient]);

	const value = useMemo(
		() => ({ status, health, error, refresh, ensureReady }),
		[status, health, error, refresh, ensureReady],
	);

	return (
		<BackendHealthContext.Provider value={value}>
			{children}
		</BackendHealthContext.Provider>
	);
}

export function useBackendHealth(): BackendHealthContextValue {
	const ctx = useContext(BackendHealthContext);
	if (!ctx) {
		throw new Error('useBackendHealth must be used within BackendHealthProvider');
	}
	return ctx;
}
