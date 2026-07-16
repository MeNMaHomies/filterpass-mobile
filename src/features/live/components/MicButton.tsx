import { ActivityIndicator, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Mic } from 'lucide-react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import { useReduceMotion } from '@/hooks/useReduceMotion';
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
	const reduceMotion = useReduceMotion();
	const isDisabled = disabled || busy;

	return (
		<PressableScale
			onPress={onPress}
			disabled={isDisabled}
			style={[styles.button, isDisabled && styles.disabled]}
			accessibilityRole="button"
			accessibilityLabel={busy ? 'Connecting' : 'Start listening'}
			accessibilityState={{ disabled: isDisabled, busy }}
			scaleTo={0.94}
			haptic={!busy}
		>
			{busy ? (
				<ActivityIndicator color={colors.primary} />
			) : (
				<MotiView
					from={reduceMotion ? undefined : { scale: 1 }}
					animate={
						reduceMotion
							? { scale: 1 }
							: {
									scale: [1, 1.06, 1],
								}
					}
					transition={
						reduceMotion
							? undefined
							: {
									type: 'timing',
									duration: 2200,
									loop: true,
								}
					}
				>
					<Mic size={28} color={colors.primary} strokeWidth={1.75} />
				</MotiView>
			)}
		</PressableScale>
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
	disabled: {
		opacity: 0.5,
	},
});
