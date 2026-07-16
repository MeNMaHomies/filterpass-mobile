import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '@/theme/tokens';

/** Scroll props for tab screens behind the floating tab bar. */
export function useScrollScreenProps() {
	const insets = useSafeAreaInsets();

	return useMemo(() => {
		const bottomPadding = spacing.contentBottom + Math.max(insets.bottom, 0);

		return {
			/** Apply to contentContainerStyle — works on Android + iOS. */
			bottomPadding,
			contentInsetAdjustmentBehavior: 'automatic' as const,
			/** iOS-only inset; prefer bottomPadding on contentContainerStyle. */
			contentInset: { bottom: bottomPadding },
			scrollIndicatorInsets: { bottom: bottomPadding },
		};
	}, [insets.bottom]);
}
