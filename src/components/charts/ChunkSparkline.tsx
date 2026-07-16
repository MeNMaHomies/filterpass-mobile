import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '@/theme/tokens';

type ChunkSparklineProps = {
	chunks: number[];
	height?: number;
};

function clampScore(score: number): number {
	if (!Number.isFinite(score)) return 0;
	return Math.min(1, Math.max(0, score));
}

function buildSparklinePaths(
	chunks: number[],
	width: number,
	height: number,
): { line: string; area: string } | null {
	const values = chunks.map(clampScore);
	if (values.length === 0) return null;

	const pad = 4;
	const innerW = width - pad * 2;
	const innerH = height - pad * 2;

	const toY = (score: number) => pad + (1 - score) * innerH;

	if (values.length === 1) {
		const y = toY(values[0]);
		const line = `M ${pad} ${y} L ${width - pad} ${y}`;
		const area = `${line} L ${width - pad} ${height} L ${pad} ${height} Z`;
		return { line, area };
	}

	const line = values
		.map((score, i) => {
			const x = pad + (i / (values.length - 1)) * innerW;
			const y = toY(score);
			return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
		})
		.join(' ');

	const area = `${line} L ${width - pad} ${height} L ${pad} ${height} Z`;
	return { line, area };
}

export function ChunkSparkline({ chunks, height = 48 }: ChunkSparklineProps) {
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
}
