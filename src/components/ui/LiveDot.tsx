import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withSequence,
	withTiming,
	cancelAnimation,
} from 'react-native-reanimated';
import { colors } from '@/theme/tokens';

type LiveDotProps = {
	color?: string;
};

export function LiveDot({ color = colors.accent }: LiveDotProps) {
	const opacity = useSharedValue(1);
	const [reduceMotion, setReduceMotion] = useState(false);

	useEffect(() => {
		let mounted = true;
		AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
			if (mounted) setReduceMotion(enabled);
		});
		const sub = AccessibilityInfo.addEventListener(
			'reduceMotionChanged',
			setReduceMotion,
		);
		return () => {
			mounted = false;
			sub.remove();
		};
	}, []);

	useEffect(() => {
		if (reduceMotion) {
			cancelAnimation(opacity);
			opacity.set(1);
			return;
		}
		opacity.set(
			withRepeat(
				withSequence(
					withTiming(0.5, { duration: 800 }),
					withTiming(1, { duration: 800 }),
				),
				-1,
				false,
			),
		);
		return () => {
			cancelAnimation(opacity);
		};
	}, [opacity, reduceMotion]);

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: opacity.get(),
		transform: [{ scale: opacity.get() * 0.08 + 0.92 }],
	}));

	if (reduceMotion) {
		return (
			<View
				style={[styles.dot, { backgroundColor: color }]}
				accessibilityElementsHidden
				importantForAccessibility="no"
			/>
		);
	}

	return (
		<Animated.View
			style={[styles.dot, { backgroundColor: color }, animatedStyle]}
			accessibilityElementsHidden
			importantForAccessibility="no"
		/>
	);
}

const styles = StyleSheet.create({
	dot: {
		width: 6,
		height: 6,
		borderRadius: 3,
		borderCurve: 'continuous',
	},
});
