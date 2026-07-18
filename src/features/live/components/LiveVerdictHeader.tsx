import { useSyncExternalStore } from 'react';
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

function subscribeSecondTick(onStoreChange: () => void) {
	const id = setInterval(onStoreChange, 1000);
	return () => clearInterval(id);
}

function getSecondSnapshot() {
	return Math.floor(Date.now() / 1000);
}

export function LiveVerdictHeader({
	label,
	startedAt,
	captureMode,
}: LiveVerdictHeaderProps) {
	const nowSec = useSyncExternalStore(
		subscribeSecondTick,
		getSecondSnapshot,
		getSecondSnapshot,
	);
	const elapsed =
		startedAt == null
			? 0
			: Math.max(0, nowSec - Math.floor(startedAt / 1000));

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
