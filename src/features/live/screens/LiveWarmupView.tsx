import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { Square } from 'lucide-react-native';
import { Card, Eyebrow, StatusBadge } from '@/components';
import { colors, spacing } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';

type LiveWarmupViewProps = {
	bufferFillSamples?: number;
	bufferTargetSamples?: number;
	onCancel?: () => void;
};

export function LiveWarmupView({
	bufferFillSamples = 0,
	bufferTargetSamples = 1,
	onCancel,
}: LiveWarmupViewProps) {
	const fill =
		bufferTargetSamples > 0
			? Math.min(
					100,
					Math.round((bufferFillSamples / bufferTargetSamples) * 100),
				)
			: 0;

	return (
		<ScrollView
			contentContainerStyle={styles.scroll}
			showsVerticalScrollIndicator={false}
			keyboardShouldPersistTaps="handled"
		>
			<StatusBadge label="Warming up" variant="WARMUP" />

			<View style={styles.progressBlock}>
				<Text style={styles.progressLabel}>Buffer fill · {fill}%</Text>
				<View style={styles.track}>
					<View style={[styles.fill, { width: `${fill}%` }]} />
				</View>
				<Text style={styles.progressMeta}>
					{bufferFillSamples.toLocaleString()} /{' '}
					{bufferTargetSamples.toLocaleString()} samples
				</Text>
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
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	scroll: {
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
		marginTop: 28,
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
		marginTop: 36,
		alignItems: 'center',
	},
	cancelButton: {
		width: 64,
		height: 64,
		borderRadius: 32,
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
