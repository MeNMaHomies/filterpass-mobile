import { type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from 'react-native-reanimated';
import { motion } from '@/theme/motion';
import { hapticLight } from '@/lib/haptics';
import { useReduceMotion } from '@/hooks/useReduceMotion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PressableScaleProps = PressableProps & {
	children: ReactNode;
	style?: StyleProp<ViewStyle>;
	haptic?: boolean;
	scaleTo?: number;
};

export function PressableScale({
	children,
	style,
	disabled,
	haptic = true,
	scaleTo = motion.pressScale,
	onPressIn,
	onPressOut,
	onPress,
	...props
}: PressableScaleProps) {
	const reduceMotion = useReduceMotion();
	const scale = useSharedValue(1);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.get() }],
	}));

	return (
		<AnimatedPressable
			disabled={disabled}
			style={[animatedStyle, style]}
			onPressIn={(e) => {
				if (!disabled && !reduceMotion) {
					scale.set(withSpring(scaleTo, motion.press));
				}
				onPressIn?.(e);
			}}
			onPressOut={(e) => {
				if (!reduceMotion) {
					scale.set(withSpring(1, motion.press));
				}
				onPressOut?.(e);
			}}
			onPress={(e) => {
				if (haptic && !disabled) {
					void hapticLight();
				}
				onPress?.(e);
			}}
			{...props}
		>
			{children}
		</AnimatedPressable>
	);
}
