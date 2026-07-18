import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '@/theme/tokens';

type LogoBadgeProps = {
	size?: number;
};

export function LogoBadge({ size = 28 }: LogoBadgeProps) {
	const glyphSize = Math.round(size * 0.54);

	return (
		<View
			style={[styles.badge, { width: size, height: size, borderRadius: size * 0.28 }]}
			accessible
			accessibilityRole="image"
			accessibilityLabel="FilterPass logo"
		>
			<Svg width={glyphSize} height={glyphSize} viewBox="0 0 24 24" fill="none">
				<Path
					d="M3 12h2l2-6 4 16 3-12 2 8 1-4h4"
					stroke={colors.foreground}
					strokeWidth={2.2}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</Svg>
		</View>
	);
}

const styles = StyleSheet.create({
	badge: {
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.primary,
	},
});
