import { useEffect, useState } from 'react';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

export type NetworkStatus = {
	/** Device has a network interface (Wi‑Fi / cellular). null = unknown. */
	isConnected: boolean | null;
	/** Internet reachability when known (may be null on some platforms). */
	isInternetReachable: boolean | null;
	/** True when we know the device is offline. */
	isOffline: boolean;
};

function deriveStatus(state: NetInfoState): NetworkStatus {
	const isConnected = state.isConnected;
	const isInternetReachable = state.isInternetReachable;
	const isOffline =
		isConnected === false || isInternetReachable === false;
	return { isConnected, isInternetReachable, isOffline };
}

export function useNetworkStatus(): NetworkStatus {
	const [status, setStatus] = useState<NetworkStatus>({
		isConnected: null,
		isInternetReachable: null,
		isOffline: false,
	});

	useEffect(() => {
		let mounted = true;
		NetInfo.fetch().then((state) => {
			if (mounted) setStatus(deriveStatus(state));
		});
		const unsub = NetInfo.addEventListener((state) => {
			setStatus(deriveStatus(state));
		});
		return () => {
			mounted = false;
			unsub();
		};
	}, []);

	return status;
}
