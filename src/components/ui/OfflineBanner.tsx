import { Text, StyleSheet } from 'react-native';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { colors, radius } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';

export function OfflineBanner() {
	const { isOffline } = useNetworkStatus();

	if (!isOffline) return null;

	return (
		<Text
			style={styles.banner}
			accessibilityRole="alert"
			accessibilityLiveRegion="polite"
		>
			No internet connection. Some features are unavailable.
		</Text>
	);
}

const styles = StyleSheet.create({
	banner: {
		marginHorizontal: 0,
		marginTop: 10,
		marginBottom: 2,
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderRadius: radius.input,
		borderCurve: 'continuous',
		backgroundColor: colors.amberSoft,
		borderWidth: 1,
		borderColor: 'rgba(245,158,11,0.35)',
		fontFamily: fontFamilies.sans,
		fontSize: 13,
		color: colors.amber,
		lineHeight: 18,
	},
});
