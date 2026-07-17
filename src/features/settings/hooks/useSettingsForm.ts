import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { hapticError, hapticSuccess } from '@/lib/haptics';
import { clampSessionThresholds } from '@/lib/sessionThresholds';
import {
	API_SESSION_DEFAULTS,
	type SessionDefaults,
} from '../sessionDefaults';
import {
	persistSessionDefaults,
	resetStoredSessionDefaults,
} from '../sessionDefaultsStore';
import { useSessionDefaults } from './useSessionDefaults';

function formatThreshold(value: number): string {
	return value.toFixed(2);
}

function withClampedThresholds(
	defaults: SessionDefaults,
	patch: Partial<Pick<SessionDefaults, 'real_threshold' | 'spoof_threshold'>>,
): SessionDefaults {
	const clamped = clampSessionThresholds(
		{
			real_threshold: patch.real_threshold ?? defaults.real_threshold,
			spoof_threshold: patch.spoof_threshold ?? defaults.spoof_threshold,
		},
		{
			real_threshold: defaults.real_threshold,
			spoof_threshold: defaults.spoof_threshold,
		},
	);
	return {
		...defaults,
		real_threshold: clamped.real_threshold,
		spoof_threshold: clamped.spoof_threshold,
	};
}

export type SettingsFormState = {
	defaults: SessionDefaults;
	realText: string;
	spoofText: string;
	loaded: boolean;
	saved: boolean;
	persistenceError: string | null;
	setDefaults: Dispatch<SetStateAction<SessionDefaults>>;
	setRealText: (value: string) => void;
	setSpoofText: (value: string) => void;
	applyThresholds: (
		patch: Partial<Pick<SessionDefaults, 'real_threshold' | 'spoof_threshold'>>,
	) => void;
	commitRealText: () => void;
	commitSpoofText: () => void;
	handleSave: () => Promise<void>;
	handleReset: () => Promise<void>;
};

export function useSettingsForm(): SettingsFormState {
	const { defaults: storedDefaults, loaded } = useSessionDefaults();
	const [defaults, setDefaults] = useState<SessionDefaults>(API_SESSION_DEFAULTS);
	const [realText, setRealText] = useState(
		formatThreshold(API_SESSION_DEFAULTS.real_threshold),
	);
	const [spoofText, setSpoofText] = useState(
		formatThreshold(API_SESSION_DEFAULTS.spoof_threshold),
	);
	const [saved, setSaved] = useState(false);
	const [persistenceError, setPersistenceError] = useState<string | null>(null);

	useEffect(() => {
		if (!loaded) return;
		setDefaults(storedDefaults);
		setRealText(formatThreshold(storedDefaults.real_threshold));
		setSpoofText(formatThreshold(storedDefaults.spoof_threshold));
	}, [loaded, storedDefaults]);

	const applyThresholds = useCallback(
		(patch: Partial<Pick<SessionDefaults, 'real_threshold' | 'spoof_threshold'>>) => {
			setDefaults((d) => {
				const next = withClampedThresholds(d, patch);
				setRealText(formatThreshold(next.real_threshold));
				setSpoofText(formatThreshold(next.spoof_threshold));
				return next;
			});
		},
		[],
	);

	const commitRealText = useCallback(() => {
		const parsed = Number.parseFloat(realText);
		if (!Number.isFinite(parsed)) {
			setRealText(formatThreshold(defaults.real_threshold));
			return;
		}
		applyThresholds({ real_threshold: parsed });
	}, [applyThresholds, defaults.real_threshold, realText]);

	const commitSpoofText = useCallback(() => {
		const parsed = Number.parseFloat(spoofText);
		if (!Number.isFinite(parsed)) {
			setSpoofText(formatThreshold(defaults.spoof_threshold));
			return;
		}
		applyThresholds({ spoof_threshold: parsed });
	}, [applyThresholds, defaults.spoof_threshold, spoofText]);

	const handleSave = useCallback(async () => {
		setPersistenceError(null);
		try {
			await persistSessionDefaults(defaults);
			void hapticSuccess();
			setSaved(true);
			setTimeout(() => setSaved(false), 2000);
		} catch {
			void hapticError();
			setSaved(false);
			setPersistenceError(
				'Could not save settings. Restart the app and try again.',
			);
		}
	}, [defaults]);

	const handleReset = useCallback(async () => {
		setPersistenceError(null);
		try {
			const d = await resetStoredSessionDefaults();
			setDefaults(d);
			setRealText(formatThreshold(d.real_threshold));
			setSpoofText(formatThreshold(d.spoof_threshold));
		} catch {
			void hapticError();
			setPersistenceError(
				'Could not reset settings. Restart the app and try again.',
			);
		}
	}, []);

	return {
		defaults,
		realText,
		spoofText,
		loaded,
		saved,
		persistenceError,
		setDefaults,
		setRealText,
		setSpoofText,
		applyThresholds,
		commitRealText,
		commitSpoofText,
		handleSave,
		handleReset,
	};
}
