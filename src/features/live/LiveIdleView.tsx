import { View, Text, StyleSheet } from 'react-native';
import { Card, Eyebrow, MicButton, StatusBadge } from '@/components/filterpass';
import { colors, spacing } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';

type LiveIdleViewProps = {
	onMicPress?: () => void;
};

export function LiveIdleView({ onMicPress }: LiveIdleViewProps) {
	return (
		<View style={styles.root}>
			<View style={styles.center}>
				<MicButton onPress={onMicPress} />
				<Text style={styles.hint}>Tap to start listening</Text>
				<View style={styles.badgeWrap}>
					<StatusBadge label="Disconnected" variant="IDLE" />
				</View>
			</View>

			<Card style={styles.defaultsCard}>
				<Eyebrow>Next session defaults</Eyebrow>
				<View style={styles.grid}>
					{[
						['Sample rate', '16 kHz'],
						['Chunk', '0.5 s'],
						['Threshold', '0.50'],
						['EMA α', '0.30'],
					].map(([k, v]) => (
						<View key={k} style={styles.gridItem}>
							<Text style={styles.gridLabel}>{k}</Text>
							<Text style={styles.gridValue}>{v}</Text>
						</View>
					))}
				</View>
			</Card>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
		paddingHorizontal: spacing.screenX,
		paddingBottom: spacing.contentBottom,
	},
	center: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	hint: {
		marginTop: 14,
		fontFamily: fontFamilies.sans,
		fontSize: 14,
		color: colors.muted,
	},
	badgeWrap: {
		marginTop: 18,
	},
	defaultsCard: {
		padding: 14,
		marginBottom: 4,
	},
	grid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginTop: 10,
		gap: 10,
	},
	gridItem: {
		width: '47%',
	},
	gridLabel: {
		fontFamily: fontFamilies.sans,
		fontSize: 11,
		color: colors.muted2,
	},
	gridValue: {
		fontFamily: fontFamilies.mono,
		fontSize: 13,
		color: colors.foreground,
		marginTop: 2,
	},
});
