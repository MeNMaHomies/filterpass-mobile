import { useEffect } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { focusManager, onlineManager } from '@tanstack/react-query';

let wired = false;

/**
 * Wire TanStack Query focus + online managers for React Native.
 * Safe to call once from root layout.
 */
export function setupReactQueryNative(): void {
	if (wired) return;
	wired = true;

	onlineManager.setEventListener((setOnline) => {
		return NetInfo.addEventListener((state) => {
			setOnline(!!state.isConnected);
		});
	});
}

/** Subscribe AppState → focusManager. Call from a root component effect. */
export function useReactQueryAppFocus(): void {
	useEffect(() => {
		if (Platform.OS === 'web') return;

		const onChange = (status: AppStateStatus) => {
			focusManager.setFocused(status === 'active');
		};

		const sub = AppState.addEventListener('change', onChange);
		return () => sub.remove();
	}, []);
}
