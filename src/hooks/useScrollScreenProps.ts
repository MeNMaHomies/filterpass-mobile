import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '@/theme/tokens';

/** Scroll props for tab screens behind the floating tab bar. */
export function useScrollScreenProps() {
	const insets = useSafeAreaInsets();

	return useMemo(() => {
		const bottom = spacing.contentBottom + Math.max(insets.bottom, 0);

		return {
			contentInsetAdjustmentBehavior: 'automatic' as const,
			contentInset: { bottom },
			scrollIndicatorInsets: { bottom },
		};
	}, [insets.bottom]);
}
