import { type ReactNode, useEffect } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
	cancelAnimation,
	interpolate,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withTiming,
} from 'react-native-reanimated';
import { motion } from '@/theme/motion';
import { useReduceMotion } from '@/hooks/useReduceMotion';

type MotiEnterProps = {
	children: ReactNode;
	style?: StyleProp<ViewStyle>;
	/** Index in a list — capped for performance */
	index?: number;
	delay?: number;
};

export function MotiEnter({
	children,
	style,
	index = 0,
	delay,
}: MotiEnterProps) {
	const reduceMotion = useReduceMotion();
	const staggerIndex = Math.min(index, motion.staggerMax);
	const enterDelay =
		delay ?? (index > 0 ? staggerIndex * motion.staggerMs : 0);
	const progress = useSharedValue(reduceMotion ? 1 : 0);

	useEffect(() => {
		if (reduceMotion) {
			cancelAnimation(progress);
			progress.set(1);
			return;
		}

		progress.set(
			withDelay(
				enterDelay,
				withTiming(1, { duration: motion.enter.duration }),
			),
		);

		return () => {
			cancelAnimation(progress);
		};
	}, [enterDelay, progress, reduceMotion]);

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: progress.get(),
		transform: [{ translateY: interpolate(progress.get(), [0, 1], [8, 0]) }],
	}));

	if (reduceMotion) {
		return <>{children}</>;
	}

	return (
		<Animated.View style={[styles.fill, style, animatedStyle]}>
			{children}
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	fill: {
		// keep layout neutral; parents control width
	},
});
