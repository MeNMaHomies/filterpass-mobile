import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Square } from 'lucide-react-native';
import { Card, Eyebrow, StatusBadge } from '@/components';
import { colors, spacing } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';

type LiveWarmupViewProps = {
	onCancel?: () => void;
};

export function LiveWarmupView({ onCancel }: LiveWarmupViewProps) {
	const fill = 68;

	return (
		<View style={styles.root}>
			<StatusBadge label="Warming up" variant="WARMUP" />

			<View style={styles.progressBlock}>
				<Text style={styles.progressLabel}>Buffer fill · {fill}%</Text>
				<View style={styles.track}>
					<View style={[styles.fill, { width: `${fill}%` }]} />
				</View>
				<Text style={styles.progressMeta}>6,800 / 10,000 samples</Text>
			</View>

			<Card style={styles.infoCard}>
				<Eyebrow>Buffering audio</Eyebrow>
				<Text style={styles.infoBody}>
					Model fills its audio buffer before scoring. Keep speaking —
					inference starts automatically.
				</Text>
			</Card>

			<View style={styles.cancelBlock}>
				<Pressable onPress={onCancel} style={styles.cancelButton}>
					<Square
						size={18}
						color={colors.destructive}
						fill={colors.destructive}
					/>
				</Pressable>
				<Text style={styles.cancelLabel}>Cancel</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
		paddingHorizontal: spacing.screenX,
		paddingTop: 24,
		paddingBottom: spacing.contentBottom,
		alignItems: 'center',
	},
	progressBlock: {
		marginTop: 32,
		width: '100%',
	},
	progressLabel: {
		fontFamily: fontFamilies.mono,
		fontSize: 12,
		color: colors.muted,
		marginBottom: 10,
		textAlign: 'center',
	},
	track: {
		height: 8,
		backgroundColor: colors.border,
		borderRadius: 99,
		overflow: 'hidden',
	},
	fill: {
		height: '100%',
		backgroundColor: colors.amber,
		borderRadius: 99,
	},
	progressMeta: {
		fontFamily: fontFamilies.mono,
		fontSize: 10,
		color: colors.muted2,
		marginTop: 8,
		textAlign: 'center',
	},
	infoCard: {
		marginTop: 32,
		padding: 16,
		width: '100%',
	},
	infoBody: {
		fontFamily: fontFamilies.sans,
		fontSize: 13,
		color: colors.muted,
		lineHeight: 20,
		marginTop: 8,
	},
	cancelBlock: {
		marginTop: 'auto',
		paddingTop: 28,
		alignItems: 'center',
	},
	cancelButton: {
		width: 72,
		height: 72,
		borderRadius: 36,
		backgroundColor: colors.destructiveSoft,
		borderWidth: 2,
		borderColor: colors.destructive,
		alignItems: 'center',
		justifyContent: 'center',
	},
	cancelLabel: {
		fontFamily: fontFamilies.sans,
		fontSize: 13,
		color: colors.muted,
		marginTop: 10,
	},
});
