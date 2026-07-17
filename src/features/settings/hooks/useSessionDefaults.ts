import { useCallback, useEffect, useState } from 'react';
import {
	API_SESSION_DEFAULTS,
	type SessionDefaults,
} from '../sessionDefaults';
import {
	ensureSessionDefaults,
	refreshSessionDefaults,
	subscribeSessionDefaults,
} from '../sessionDefaultsStore';

type SessionDefaultsState = {
	defaults: SessionDefaults;
	loaded: boolean;
	refresh: () => Promise<SessionDefaults>;
};

export function useSessionDefaults(): SessionDefaultsState {
	const [defaults, setDefaults] = useState<SessionDefaults>(API_SESSION_DEFAULTS);
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		let active = true;

		void ensureSessionDefaults().then((d) => {
			if (!active) return;
			setDefaults(d);
			setLoaded(true);
		});

		const unsubscribe = subscribeSessionDefaults(() => {
			void ensureSessionDefaults().then((d) => {
				if (!active) return;
				setDefaults(d);
				setLoaded(true);
			});
		});

		return () => {
			active = false;
			unsubscribe();
		};
	}, []);

	const refresh = useCallback(async () => {
		const d = await refreshSessionDefaults();
		setDefaults(d);
		setLoaded(true);
		return d;
	}, []);

	return { defaults, loaded, refresh };
}
