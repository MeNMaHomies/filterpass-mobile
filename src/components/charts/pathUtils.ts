export function clampScore(score: number): number {
	if (!Number.isFinite(score)) return 0;
	return Math.min(1, Math.max(0, score));
}

type LinePathOptions = {
	/** Inset from left/right edges (sparkline style). */
	inset?: number;
};

/**
 * SVG polyline path for normalized scores in [0, 1].
 * Y=0 is top; higher scores plot higher on the chart.
 */
export function buildScoreLinePath(
	scores: number[],
	width: number,
	plotHeight: number,
	options?: LinePathOptions,
): string {
	const values = scores.map(clampScore);
	if (values.length === 0) return '';

	const inset = options?.inset ?? 0;
	const innerW = width - inset * 2;

	const toY = (score: number) => inset + (1 - score) * (plotHeight - inset * 2);

	if (values.length === 1) {
		const y = toY(values[0]);
		return `M ${inset} ${y} L ${width - inset} ${y}`;
	}

	const step = innerW / Math.max(values.length - 1, 1);
	return values
		.map((score, i) => {
			const x = inset + i * step;
			const y = toY(score);
			return `${i === 0 ? 'M' : 'L'}${x},${y}`;
		})
		.join(' ');
}

type AreaPathOptions = {
	leftX?: number;
	rightX?: number;
};

/** Close a line path into a filled area down to bottomY. */
export function buildClosedAreaPath(
	linePath: string,
	bottomY: number,
	options?: AreaPathOptions,
): string {
	if (!linePath) return '';
	const rightX = options?.rightX ?? 0;
	const leftX = options?.leftX ?? 0;
	return `${linePath} L${rightX},${bottomY} L${leftX},${bottomY} Z`;
}

export function buildSparklinePaths(
	scores: number[],
	width: number,
	height: number,
): { line: string; area: string } | null {
	const line = buildScoreLinePath(scores, width, height, { inset: 4 });
	if (!line) return null;
	const area = buildClosedAreaPath(line, height, {
		leftX: 4,
		rightX: width - 4,
	});
	return { line, area };
}
