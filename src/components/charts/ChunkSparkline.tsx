import { memo } from 'react';
import Svg, {
	Path,
	Defs,
	LinearGradient,
	Stop,
	Line,
} from 'react-native-svg';
import { buildSparklinePaths, clampScore } from './pathUtils';
import { colors } from '@/theme/tokens';

type ChunkSparklineProps = {
	chunks: number[];
	height?: number;
	realThreshold?: number;
	spoofThreshold?: number;
};

const DEFAULT_HEIGHT = 104;

export const ChunkSparkline = memo(function ChunkSparkline({
	chunks,
	height = DEFAULT_HEIGHT,
	realThreshold,
	spoofThreshold,
}: ChunkSparklineProps) {
	const w = 300;
	const paths = buildSparklinePaths(chunks, w, height);
	if (!paths) return null;

	const inset = 4;
	const innerH = height - inset * 2;
	const toY = (score: number) => inset + (1 - clampScore(score)) * innerH;

	const guides: { y: number; color: string; opacity: number }[] = [];
	if (realThreshold != null) {
		guides.push({
			y: toY(realThreshold),
			color: colors.accent,
			opacity: 0.35,
		});
	}
	if (spoofThreshold != null) {
		guides.push({
			y: toY(spoofThreshold),
			color: colors.destructive,
			opacity: 0.35,
		});
	}

	return (
		<Svg
			width="100%"
			height={height}
			viewBox={`0 0 ${w} ${height}`}
			preserveAspectRatio="none"
		>
			<Defs>
				<LinearGradient id="chunkArea" x1="0" y1="0" x2="0" y2="1">
					<Stop
						offset="0%"
						stopColor={colors.primary}
						stopOpacity={0.32}
					/>
					<Stop offset="100%" stopColor={colors.primary} stopOpacity={0} />
				</LinearGradient>
			</Defs>
			{guides.map((g, i) => (
				<Line
					key={i}
					x1={inset}
					y1={g.y}
					x2={w - inset}
					y2={g.y}
					stroke={g.color}
					strokeWidth={1}
					strokeDasharray="4 4"
					opacity={g.opacity}
				/>
			))}
			<Path d={paths.area} fill="url(#chunkArea)" />
			<Path
				d={paths.line}
				fill="none"
				stroke={colors.primary}
				strokeWidth={2}
			/>
		</Svg>
	);
});
