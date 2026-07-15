import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { scoreColor } from '@/lib/scoreColor';
import { colors } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';

type ScoreGaugeProps = {
	score: number;
	label?: string;
	size?: number;
};

export function ScoreGauge({
	score,
	label = 'real',
	size = 196,
}: ScoreGaugeProps) {
	const r = size / 2 - 16;
	const cx = size / 2;
	const circumference = 2 * Math.PI * r;
	const clamped = Math.max(0, Math.min(1, score));
	const offset = circumference * (1 - clamped);
	const color = scoreColor(score);
	const glowSize = size * 0.76;

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
				<Circle
					cx={cx}
					cy={cx}
					r={r}
					fill="none"
					stroke={color}
					strokeWidth={10}
					strokeLinecap="round"
					strokeDasharray={circumference}
					strokeDashoffset={offset}
					rotation={-90}
					origin={`${cx}, ${cx}`}
				/>
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
