import { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
	cancelAnimation,
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withSequence,
	withTiming,
} from 'react-native-reanimated';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import type { SessionLabel } from '@/types';
import {
	deriveListeningStatus,
	type ListeningStatus,
} from '../lib/liveVerdict';
import { colors } from '@/theme/tokens';

const BAR_COUNT = 40;
const PANEL_HEIGHT = 88;
const MAX_BAR = 62;
const MIN_BAR = 3;

/** Fixed silhouette so the wave feels intentional, not random noise. */
const BASE_HEIGHTS = [
	15, 28, 19, 46, 64, 38, 78, 52, 31, 68, 90, 49, 72, 34, 58, 81, 43, 27, 61,
	74, 37, 55, 88, 63, 29, 47, 69, 40, 76, 51, 24, 58, 84, 45, 66, 32, 73, 54,
	22, 49,
];

type LiveWaveformProps = {
	label: SessionLabel;
	lastVoiced: boolean | null;
	voicedAcks: number;
	totalAcks: number;
};

function signalColor(label: SessionLabel): string {
	switch (label) {
		case 'REAL':
			return colors.accent;
		case 'UNCERTAIN':
			return colors.amber;
		case 'SPOOF':
			return colors.destructive;
	}
}

function activityScale(status: ListeningStatus): number {
	switch (status) {
		case 'speech':
			return 1;
		case 'quiet':
			return 0.38;
		case 'waiting':
			return 0.22;
	}
}

function WaveBar({
	baseHeight,
	index,
	color,
	active,
	reduceMotion,
}: {
	baseHeight: number;
	index: number;
	color: string;
	active: boolean;
	reduceMotion: boolean;
}) {
	const pulse = useSharedValue(1);

	useEffect(() => {
		if (reduceMotion || !active) {
			cancelAnimation(pulse);
			pulse.set(1);
			return;
		}
		pulse.set(
			withRepeat(
				withSequence(
					withTiming(0.68, {
						duration: 550 + (index % 5) * 40,
						easing: Easing.inOut(Easing.ease),
					}),
					withTiming(1, {
						duration: 550 + (index % 7) * 35,
						easing: Easing.inOut(Easing.ease),
					}),
				),
				-1,
				false,
			),
		);
		return () => {
			cancelAnimation(pulse);
		};
	}, [active, index, pulse, reduceMotion]);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scaleY: pulse.get() }],
		opacity: 0.42 + (baseHeight / 140),
	}));

	const height = Math.max(
		MIN_BAR,
		Math.min(MAX_BAR, (baseHeight / 100) * MAX_BAR),
	);

	return (
		<Animated.View
			style={[
				styles.bar,
				{
					height,
					backgroundColor: color,
				},
				animatedStyle,
			]}
		/>
	);
}

export function LiveWaveform({
	label,
	lastVoiced,
	voicedAcks,
	totalAcks,
}: LiveWaveformProps) {
	const reduceMotion = useReduceMotion();
	const status = deriveListeningStatus(lastVoiced, totalAcks, voicedAcks);
	const color = signalColor(label);
	const scale = activityScale(status);
	const active = status === 'speech';

	const [tick, setTick] = useState(0);

	useEffect(() => {
		if (reduceMotion || !active) return;
		const id = setInterval(() => setTick((t) => t + 1), 320);
		return () => clearInterval(id);
	}, [active, reduceMotion]);

	const heights = useMemo(() => {
		return BASE_HEIGHTS.slice(0, BAR_COUNT).map((h, i) => {
			const wobble = active
				? (((i * 13 + tick * 17) % 29) - 14) * 0.55
				: 0;
			return Math.max(8, Math.min(96, h * scale + wobble));
		});
	}, [active, scale, tick]);

	return (
		<View
			style={styles.panel}
			accessibilityRole="image"
			accessibilityLabel={
				status === 'speech'
					? 'Live audio activity — hearing speech'
					: status === 'quiet'
						? 'Live audio activity — quiet'
						: 'Live audio activity — waiting'
			}
		>
			<View style={styles.grid} pointerEvents="none">
				{[0.25, 0.5, 0.75].map((x) => (
					<View
						key={x}
						style={[styles.gridLine, { left: `${x * 100}%` }]}
					/>
				))}
			</View>
			<View style={styles.row}>
				{heights.map((h, i) => (
					<WaveBar
						key={i}
						baseHeight={h}
						index={i}
						color={color}
						active={active}
						reduceMotion={reduceMotion}
					/>
				))}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	panel: {
		height: PANEL_HEIGHT,
		overflow: 'hidden',
		borderTopWidth: 1,
		borderBottomWidth: 1,
		borderColor: colors.border,
		justifyContent: 'center',
	},
	grid: {
		...StyleSheet.absoluteFill,
	},
	gridLine: {
		position: 'absolute',
		top: 0,
		bottom: 0,
		width: StyleSheet.hairlineWidth,
		backgroundColor: '#1B1B1E',
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 3,
		paddingVertical: 12,
		height: PANEL_HEIGHT,
	},
	bar: {
		flex: 1,
		minWidth: 2,
		borderRadius: 3,
		transformOrigin: 'center',
	},
});
