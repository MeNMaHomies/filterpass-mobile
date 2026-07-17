import { useCallback, useEffect, useState } from 'react';
import { formatApiError } from '@/lib/apiError';

type UseAsyncResourceOptions = {
	/** When false, skips the initial load (data stays at initialData). */
	enabled?: boolean;
};

export type AsyncResourceState<T> = {
	data: T;
	loading: boolean;
	error: string | null;
	refresh: () => Promise<void>;
	setData: (next: T | ((prev: T) => T)) => void;
};

/**
 * Shared loading / error / refresh pattern for one-shot async fetches.
 */
export function useAsyncResource<T>(
	initialData: T,
	load: () => Promise<T>,
	options?: UseAsyncResourceOptions,
): AsyncResourceState<T> {
	const enabled = options?.enabled ?? true;
	const [data, setData] = useState<T>(initialData);
	const [loading, setLoading] = useState(enabled);
	const [error, setError] = useState<string | null>(null);

	const run = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const next = await load();
			setData(next);
		} catch (e) {
			setError(formatApiError(e));
		} finally {
			setLoading(false);
		}
	}, [load]);

	useEffect(() => {
		if (!enabled) {
			setLoading(false);
			return;
		}
		void run();
	}, [enabled, run]);

	return { data, loading, error, refresh: run, setData };
}
