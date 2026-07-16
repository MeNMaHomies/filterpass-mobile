import { ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '@/theme/tokens';

type ScreenLoaderProps = {
	label?: string;
};

export function ScreenLoader({ label = 'Loading' }: ScreenLoaderProps) {
	return (
		<ActivityIndicator
			color={colors.primary}
			style={styles.loader}
			accessibilityLabel={label}
		/>
	);
}

const styles = StyleSheet.create({
	loader: {
		marginTop: 40,
		alignSelf: 'center',
	},
});
