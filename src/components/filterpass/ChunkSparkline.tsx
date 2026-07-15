import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '@/theme/tokens';

type ChunkSparklineProps = {
  chunks: number[];
  height?: number;
};

export function ChunkSparkline({ chunks, height = 48 }: ChunkSparklineProps) {
  const w = 300;
  const pad = 4;
  const points = chunks
    .map((s, i) => {
      const x = pad + (i / (chunks.length - 1)) * (w - pad * 2);
      const y = pad + (1 - s) * (height - pad * 2);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
  const area = `${points} L ${w - pad} ${height} L ${pad} ${height} Z`;

  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="chunkArea" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={colors.primary} stopOpacity={0.32} />
          <Stop offset="100%" stopColor={colors.primary} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={area} fill="url(#chunkArea)" />
      <Path d={points} fill="none" stroke={colors.primary} strokeWidth={2} />
    </Svg>
  );
}
