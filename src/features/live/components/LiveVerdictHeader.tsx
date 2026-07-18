import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { SessionLabel } from '@/types';
import type { CaptureMode } from '../types';
import {
	formatCaptureModeLabel,
	formatElapsed,
	formatVerdictHeadline,
} from '../lib/liveVerdict';
import { colors } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';

type LiveVerdictHeaderProps = {
	label: SessionLabel;
	startedAt: number | null;
	captureMode: CaptureMode;
};

export function LiveVerdictHeader({
	label,
	startedAt,
	captureMode,
}: LiveVerdictHeaderProps) {
	const [elapsed, setElapsed] = useState(0);

	useEffect(() => {
		if (!startedAt) {
			setElapsed(0);
			return;
		}
		const tick = () =>
			setElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
		tick();
		const id = setInterval(tick, 1000);
		return () => clearInterval(id);
	}, [startedAt]);

	const subline = startedAt
		? `Listening · ${formatElapsed(elapsed)} · ${formatCaptureModeLabel(captureMode)}`
		: formatCaptureModeLabel(captureMode);

	return (
		<View style={styles.wrap} accessibilityRole="header">
			<Text style={styles.headline}>{formatVerdictHeadline(label)}</Text>
			<Text style={styles.subline}>{subline}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {
		gap: 4,
		marginBottom: 4,
	},
	headline: {
		fontFamily: fontFamilies.sansBold,
		fontSize: 22,
		color: colors.foreground,
		letterSpacing: -0.3,
	},
	subline: {
		fontFamily: fontFamilies.sans,
		fontSize: 13,
		color: colors.muted,
	},
});
