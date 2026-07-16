import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from 'react';
import { getHealth } from '@/api';
import { ApiError } from '@/api/errors';
import type { HealthResponse } from '@/types/api';
import { assertBackendHealthy } from '@/lib/backendHealth';
import { formatApiError } from '@/lib/apiError';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

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
	const [status, setStatus] = useState<BackendHealthStatus>('checking');
	const [health, setHealth] = useState<HealthResponse | null>(null);
	const [error, setError] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		if (isOffline) {
			setStatus('down');
			setHealth(null);
			setError(null);
			return;
		}

		setStatus('checking');
		setError(null);
		try {
			const next = assertBackendHealthy(await getHealth());
			setHealth(next);
			setStatus('ok');
			setError(null);
		} catch (e) {
			setHealth(null);
			setStatus('down');
			setError(formatApiError(e));
		}
	}, [isOffline]);

	const ensureReady = useCallback(async () => {
		if (isOffline) {
			const offlineError = new ApiError(
				'No internet connection',
				0,
				null,
				null,
			);
			setStatus('down');
			setHealth(null);
			setError(null);
			throw offlineError;
		}

		try {
			const next = assertBackendHealthy(await getHealth());
			setHealth(next);
			setStatus('ok');
			setError(null);
			return next;
		} catch (e) {
			setHealth(null);
			setStatus('down');
			setError(formatApiError(e));
			throw e;
		}
	}, [isOffline]);

	useEffect(() => {
		void refresh();
	}, [refresh]);

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
