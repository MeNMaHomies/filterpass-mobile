import {
	Pressable,
	Text,
	StyleSheet,
	type PressableProps,
	type StyleProp,
	type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';

type ButtonVariant = 'primary' | 'solid' | 'danger' | 'ghost';

type ButtonProps = PressableProps & {
	variant?: ButtonVariant;
	label: string;
	style?: StyleProp<ViewStyle>;
};

export function Button({
	variant = 'ghost',
	label,
	style,
	disabled,
	accessibilityLabel,
	...props
}: ButtonProps) {
	const a11yLabel = accessibilityLabel ?? label;

	if (variant === 'primary') {
		return (
			<Pressable
				style={({ pressed }) => [
					styles.primaryOuter,
					pressed && styles.pressed,
					disabled && styles.disabled,
					style,
				]}
				disabled={disabled}
				accessibilityRole="button"
				accessibilityLabel={a11yLabel}
				accessibilityState={{ disabled: !!disabled }}
				{...props}
			>
				<LinearGradient
					colors={[colors.primary, colors.primaryHover]}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 1 }}
					style={styles.primaryGradient}
				>
					<Text style={styles.primaryLabel}>{label}</Text>
				</LinearGradient>
			</Pressable>
		);
	}

	const variantStyle =
		variant === 'solid'
			? styles.solid
			: variant === 'danger'
				? styles.danger
				: styles.ghost;

	return (
		<Pressable
			style={({ pressed }) => [
				styles.base,
				variantStyle,
				pressed && styles.pressed,
				disabled && styles.disabled,
				style,
			]}
			disabled={disabled}
			accessibilityRole="button"
			accessibilityLabel={a11yLabel}
			accessibilityState={{ disabled: !!disabled }}
			{...props}
		>
			<Text
				style={[
					styles.label,
					variant === 'solid' && styles.solidLabel,
					variant === 'danger' && styles.dangerLabel,
					variant === 'ghost' && styles.ghostLabel,
				]}
			>
				{label}
			</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	base: {
		minHeight: 44,
		borderRadius: radius.button,
		overflow: 'hidden',
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 10,
	},
	primaryOuter: {
		minHeight: 44,
		borderRadius: radius.pill,
		overflow: 'hidden',
	},
	primaryGradient: {
		flex: 1,
		minHeight: 44,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 16,
		borderRadius: radius.pill,
		shadowColor: colors.primary,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.32,
		shadowRadius: 20,
		elevation: 4,
	},
	primaryLabel: {
		fontFamily: fontFamilies.sansSemibold,
		fontSize: 13,
		color: '#fff',
	},
	solid: {
		backgroundColor: colors.primary,
		paddingHorizontal: 16,
		borderRadius: radius.button,
	},
	danger: {
		backgroundColor: colors.destructiveSoft,
		borderWidth: 1,
		borderColor: colors.destructive,
		paddingHorizontal: 16,
	},
	ghost: {
		backgroundColor: 'rgba(255,255,255,0.03)',
		borderWidth: 1,
		borderColor: colors.border,
		paddingHorizontal: 16,
	},
	label: {
		fontFamily: fontFamilies.sansSemibold,
		fontSize: 13,
	},
	solidLabel: { color: '#fff' },
	dangerLabel: { color: colors.destructive },
	ghostLabel: {
		color: colors.muted,
		fontFamily: fontFamilies.sansMedium,
		fontWeight: '500',
	},
	pressed: { opacity: 0.85 },
	disabled: { opacity: 0.4 },
});
