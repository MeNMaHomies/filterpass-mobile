import { View, Text, StyleSheet } from 'react-native';
import { colors, radius } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';

type ThresholdBandProps = {
	realThreshold: number;
	spoofThreshold: number;
};

export function ThresholdBand({
	realThreshold,
	spoofThreshold,
}: ThresholdBandProps) {
	const realPct = Math.max(0, Math.min(100, realThreshold * 100));
	const spoofPct = Math.max(0, Math.min(100, spoofThreshold * 100));
	const uncertainPct = Math.max(0, spoofPct - realPct);
	const spoofWidth = Math.max(0, 100 - spoofPct);

	return (
		<View style={styles.wrap} accessibilityRole="summary">
			<View style={styles.bar}>
				<View
					style={[
						styles.segment,
						styles.real,
						{ width: `${realPct}%` },
					]}
				/>
				<View
					style={[
						styles.segment,
						styles.uncertain,
						{ width: `${uncertainPct}%` },
					]}
				/>
				<View
					style={[
						styles.segment,
						styles.spoof,
						{ width: `${spoofWidth}%` },
					]}
				/>
			</View>
			<View style={styles.scale}>
				<Text style={styles.scaleEdge}>0.0</Text>
				<Text style={styles.scaleEdge}>1.0</Text>
			</View>
			<View style={styles.labels}>
				<Text style={[styles.zone, styles.zoneReal]}>REAL</Text>
				<Text style={[styles.zone, styles.zoneUncertain]}>UNCERTAIN</Text>
				<Text style={[styles.zone, styles.zoneSpoof]}>SPOOF</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {
		marginTop: 14,
		gap: 8,
	},
	bar: {
		flexDirection: 'row',
		height: 10,
		borderRadius: radius.pill,
		overflow: 'hidden',
		backgroundColor: colors.border,
	},
	segment: {
		height: '100%',
	},
	real: {
		backgroundColor: colors.accent,
	},
	uncertain: {
		backgroundColor: colors.amber,
	},
	spoof: {
		backgroundColor: colors.destructive,
	},
	scale: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	scaleEdge: {
		fontFamily: fontFamilies.mono,
		fontSize: 10,
		color: colors.muted2,
	},
	labels: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	zone: {
		fontFamily: fontFamilies.sansBold,
		fontSize: 10,
		letterSpacing: 1.2,
	},
	zoneReal: {
		color: colors.accent,
	},
	zoneUncertain: {
		color: colors.amber,
	},
	zoneSpoof: {
		color: colors.destructive,
	},
});
