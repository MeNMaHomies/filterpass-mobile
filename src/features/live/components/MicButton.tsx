import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import Animated, {
	cancelAnimation,
	interpolate,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withSequence,
	withTiming,
} from 'react-native-reanimated';
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
	const pulse = useSharedValue(0);

	useEffect(() => {
		if (reduceMotion || busy) {
			cancelAnimation(pulse);
			pulse.set(0);
			return;
		}

		pulse.set(
			withRepeat(
				withSequence(
					withTiming(1, { duration: 1100 }),
					withTiming(0, { duration: 1100 }),
				),
				-1,
				false,
			),
		);

		return () => {
			cancelAnimation(pulse);
		};
	}, [busy, pulse, reduceMotion]);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: interpolate(pulse.get(), [0, 1], [1, 1.06]) }],
	}));

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
				<Animated.View style={animatedStyle}>
					<Mic size={28} color={colors.primary} strokeWidth={1.75} />
				</Animated.View>
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
