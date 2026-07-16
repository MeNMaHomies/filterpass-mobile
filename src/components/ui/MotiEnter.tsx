import { type ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { MotiView } from 'moti';
import { motiEnter, motion } from '@/theme/motion';
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

	if (reduceMotion) {
		return <>{children}</>;
	}

	return (
		<MotiView
			from={motiEnter.from}
			animate={motiEnter.animate}
			transition={{
				...motiEnter.transition,
				delay: enterDelay,
			}}
			style={[styles.fill, style]}
		>
			{children}
		</MotiView>
	);
}

const styles = StyleSheet.create({
	fill: {
		// keep layout neutral; parents control width
	},
});
