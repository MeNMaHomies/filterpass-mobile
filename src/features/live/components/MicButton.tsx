import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { Mic } from 'lucide-react-native';
import { colors } from '@/theme/tokens';

type MicButtonProps = {
	onPress?: () => void;
	disabled?: boolean;
	busy?: boolean;
};

export function MicButton({
	onPress,
	disabled = false,
	busy = false,
}: MicButtonProps) {
	const isDisabled = disabled || busy;

	return (
		<Pressable
			onPress={onPress}
			disabled={isDisabled}
			style={({ pressed }) => [
				styles.button,
				pressed && !isDisabled && styles.pressed,
				isDisabled && styles.disabled,
			]}
			accessibilityRole="button"
			accessibilityLabel={busy ? 'Connecting' : 'Start listening'}
			accessibilityState={{ disabled: isDisabled, busy }}
		>
			{busy ? (
				<ActivityIndicator color={colors.primary} />
			) : (
				<Mic size={28} color={colors.primary} strokeWidth={1.75} />
			)}
		</Pressable>
	);
}

const styles = StyleSheet.create({
	button: {
		width: 84,
		height: 84,
		borderRadius: 42,
		backgroundColor: colors.primarySoft,
		borderWidth: 2,
		borderColor: colors.primary,
		alignItems: 'center',
		justifyContent: 'center',
	},
	pressed: {
		opacity: 0.85,
		transform: [{ scale: 0.97 }],
	},
	disabled: {
		opacity: 0.5,
	},
});
