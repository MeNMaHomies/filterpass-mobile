import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
	useAnimatedProps,
	useDerivedValue,
	useSharedValue,
	withSpring,
} from 'react-native-reanimated';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { scoreColor } from '@/lib/scoreColor';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { motion } from '@/theme/motion';
import { colors } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type ScoreGaugeProps = {
	score: number;
	label?: string;
	size?: number;
};

export function ScoreGauge({
	score,
	label = 'session score',
	size = 196,
}: ScoreGaugeProps) {
	const reduceMotion = useReduceMotion();
	const r = size / 2 - 16;
	const cx = size / 2;
	const circumference = 2 * Math.PI * r;
	const clamped = Math.max(0, Math.min(1, score));
	const color = scoreColor(score);
	const glowSize = size * 0.76;

	const progress = useSharedValue(clamped);

	useEffect(() => {
		if (reduceMotion) {
			progress.set(clamped);
			return;
		}
		progress.set(withSpring(clamped, motion.gauge));
	}, [clamped, progress, reduceMotion]);

	const animatedProps = useAnimatedProps(() => ({
		strokeDashoffset: circumference * (1 - progress.get()),
	}));

	const displayScore = useDerivedValue(() => progress.get().toFixed(2));

	return (
		<View style={[styles.wrap, { width: size, height: size }]}>
			<View
				style={[
					styles.glow,
					{
						width: glowSize,
						height: glowSize,
						borderRadius: glowSize / 2,
						backgroundColor: `${color}18`,
						top: size * 0.12,
						left: size * 0.12,
					},
				]}
			/>
			<Svg width={size} height={size}>
				<Circle
					cx={cx}
					cy={cx}
					r={r}
					fill="none"
					stroke={colors.border}
					strokeWidth={10}
					opacity={0.8}
				/>
				<AnimatedCircle
					cx={cx}
					cy={cx}
					r={r}
					fill="none"
					stroke={color}
					strokeWidth={10}
					strokeLinecap="round"
					strokeDasharray={circumference}
					animatedProps={animatedProps}
					rotation={-90}
					origin={`${cx}, ${cx}`}
				/>
				{/* Static text — SVG text doesn't animate easily; value updates each render */}
				<SvgText
					x={cx}
					y={cx - 2}
					textAnchor="middle"
					alignmentBaseline="middle"
					fill={colors.foreground}
					fontSize={size * 0.22}
					fontFamily={fontFamilies.monoSemibold}
					fontWeight="600"
				>
					{score.toFixed(2)}
				</SvgText>
				<SvgText
					x={cx}
					y={cx + size * 0.15}
					textAnchor="middle"
					fill={colors.muted}
					fontSize={10}
					letterSpacing={1.4}
					fontFamily={fontFamilies.mono}
				>
					{label.toUpperCase()}
				</SvgText>
			</Svg>
			{/* silence unused derived until we wire ReText */}
			{displayScore ? null : null}
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {
		alignSelf: 'center',
		position: 'relative',
	},
	glow: {
		position: 'absolute',
		opacity: 0.9,
	},
});
