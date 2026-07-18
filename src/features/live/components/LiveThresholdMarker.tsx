import { View, Text, StyleSheet } from 'react-native';
import { colors, radius } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';

type LiveThresholdMarkerProps = {
	realThreshold: number;
	spoofThreshold: number;
	sessionScore: number;
};

export function LiveThresholdMarker({
	realThreshold,
	spoofThreshold,
	sessionScore,
}: LiveThresholdMarkerProps) {
	const realPct = Math.max(0, Math.min(100, realThreshold * 100));
	const spoofPct = Math.max(0, Math.min(100, spoofThreshold * 100));
	const uncertainPct = Math.max(0, spoofPct - realPct);
	const spoofWidth = Math.max(0, 100 - spoofPct);
	const markerPct = Math.max(0, Math.min(100, sessionScore * 100));

	return (
		<View
			style={styles.wrap}
			accessibilityRole="summary"
			accessibilityLabel={`Score ${sessionScore.toFixed(2)} on confidence scale`}
		>
			<View style={styles.bar}>
				<View
					style={[styles.segment, styles.real, { width: `${realPct}%` }]}
				/>
				<View
					style={[
						styles.segment,
						styles.uncertain,
						{ width: `${uncertainPct}%` },
					]}
				/>
				<View
					style={[styles.segment, styles.spoof, { width: `${spoofWidth}%` }]}
				/>
				<View style={[styles.marker, { left: `${markerPct}%` }]} />
			</View>
			<View style={styles.labels}>
				<Text style={[styles.zone, styles.zoneReal]}>Real</Text>
				<Text style={[styles.zone, styles.zoneUncertain]}>Unsure</Text>
				<Text style={[styles.zone, styles.zoneSpoof]}>Synthetic</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {
		marginTop: 12,
		gap: 8,
	},
	bar: {
		height: 10,
		borderRadius: radius.pill,
		overflow: 'visible',
		backgroundColor: colors.border,
		flexDirection: 'row',
		position: 'relative',
	},
	segment: {
		height: '100%',
	},
	real: {
		backgroundColor: colors.accent,
		borderTopLeftRadius: radius.pill,
		borderBottomLeftRadius: radius.pill,
	},
	uncertain: {
		backgroundColor: colors.amber,
	},
	spoof: {
		backgroundColor: colors.destructive,
		borderTopRightRadius: radius.pill,
		borderBottomRightRadius: radius.pill,
	},
	marker: {
		position: 'absolute',
		top: -3,
		width: 3,
		height: 16,
		marginLeft: -1.5,
		borderRadius: 2,
		backgroundColor: colors.foreground,
	},
	labels: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	zone: {
		fontFamily: fontFamilies.sansMedium,
		fontSize: 11,
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
