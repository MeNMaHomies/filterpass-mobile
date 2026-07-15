import { View, StyleSheet, type ViewProps } from 'react-native';
import { colors, radius } from '@/theme/tokens';

type CardProps = ViewProps & {
	glow?: boolean;
};

export function Card({ glow = false, style, children, ...props }: CardProps) {
	return (
		<View style={[styles.base, glow ? styles.glow : null, style]} {...props}>
			{children}
		</View>
	);
}

const styles = StyleSheet.create({
	base: {
		backgroundColor: colors.card,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.card,
		borderTopColor: 'rgba(255,255,255,0.03)',
	},
	glow: {
		backgroundColor: colors.card2,
		borderColor: 'rgba(59,130,246,0.25)',
		shadowColor: colors.primary,
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.08,
		shadowRadius: 32,
		elevation: 4,
	},
});
