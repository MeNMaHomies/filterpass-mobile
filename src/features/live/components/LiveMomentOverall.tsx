import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';

type LiveMomentOverallProps = {
	chunkProb: number | null;
	sessionScore: number;
};

export function LiveMomentOverall({
	chunkProb,
	sessionScore,
}: LiveMomentOverallProps) {
	return (
		<View style={styles.wrap}>
			<View style={styles.row}>
				<View style={styles.cell}>
					<Text style={styles.label}>This moment</Text>
					<Text style={styles.value}>
						{chunkProb !== null ? chunkProb.toFixed(2) : '—'}
					</Text>
				</View>
				<View style={styles.divider} />
				<View style={styles.cell}>
					<Text style={styles.label}>Overall</Text>
					<Text style={styles.value}>{sessionScore.toFixed(2)}</Text>
				</View>
			</View>
			<Text style={styles.helper}>
				Overall is smoothed so it does not jump every half-second.
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {
		gap: 8,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: colors.secondary,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: colors.border,
		overflow: 'hidden',
	},
	cell: {
		flex: 1,
		paddingVertical: 12,
		paddingHorizontal: 14,
		alignItems: 'center',
		gap: 2,
	},
	divider: {
		width: 1,
		alignSelf: 'stretch',
		backgroundColor: colors.border,
	},
	label: {
		fontFamily: fontFamilies.sans,
		fontSize: 12,
		color: colors.muted2,
	},
	value: {
		fontFamily: fontFamilies.mono,
		fontSize: 20,
		color: colors.foreground,
	},
	helper: {
		fontFamily: fontFamilies.sans,
		fontSize: 12,
		color: colors.muted2,
		lineHeight: 17,
		textAlign: 'center',
		paddingHorizontal: 8,
	},
});
