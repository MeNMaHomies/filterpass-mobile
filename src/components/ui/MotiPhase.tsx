import { type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { AnimatePresence, MotiView } from '@/lib/moti';
import { motiPhase } from '@/theme/motion';
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

	return (
		<AnimatePresence exitBeforeEnter>
			<MotiView
				key={phaseKey}
				from={motiPhase.from}
				animate={motiPhase.animate}
				exit={motiPhase.exit}
				transition={motiPhase.transition}
				style={styles.fill}
			>
				{children}
			</MotiView>
		</AnimatePresence>
	);
}

const styles = StyleSheet.create({
	fill: {
		flex: 1,
	},
});
