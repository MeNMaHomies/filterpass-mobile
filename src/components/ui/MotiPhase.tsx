import { type ReactNode, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
	cancelAnimation,
	interpolate,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';
import { motion } from '@/theme/motion';
import { useReduceMotion } from '@/hooks/useReduceMotion';

type MotiPhaseProps = {
	/** Unique key per phase so Moti remounts / crossfades */
	phaseKey: string;
	children: ReactNode;
};

/**
 * Crossfade + slight rise for Live (and similar) phase swaps.
 */
export function MotiPhase({ phaseKey, children }: MotiPhaseProps) {
	const reduceMotion = useReduceMotion();

	if (reduceMotion) {
		return <>{children}</>;
	}

	return <PhaseContent key={phaseKey}>{children}</PhaseContent>;
}

function PhaseContent({ children }: Pick<MotiPhaseProps, 'children'>) {
	const progress = useSharedValue(0);

	useEffect(() => {
		progress.set(withTiming(1, { duration: motion.phase.duration }));

		return () => {
			cancelAnimation(progress);
		};
	}, [progress]);

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: progress.get(),
		transform: [{ translateY: interpolate(progress.get(), [0, 1], [10, 0]) }],
	}));

	return (
		<Animated.View style={[styles.fill, animatedStyle]}>
			{children}
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	fill: {
		flex: 1,
	},
});
