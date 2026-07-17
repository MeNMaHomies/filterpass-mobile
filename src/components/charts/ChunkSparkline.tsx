import { memo } from 'react';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { buildSparklinePaths } from './pathUtils';
import { colors } from '@/theme/tokens';

type ChunkSparklineProps = {
	chunks: number[];
	height?: number;
};

export const ChunkSparkline = memo(function ChunkSparkline({
	chunks,
	height = 48,
}: ChunkSparklineProps) {
	const w = 300;
	const paths = buildSparklinePaths(chunks, w, height);
	if (!paths) return null;

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
