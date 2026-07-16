import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Card, Eyebrow, StatusBadge } from '@/components';
import { MicButton } from '../components/MicButton';
import type { SessionDefaults } from '@/features/settings/sessionDefaults';
import type { ConnectionStatus } from '../hooks/useLiveSession';
import { colors, spacing } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';

type LiveIdleViewProps = {
	onMicPress?: () => void;
	connectionStatus?: ConnectionStatus;
	defaults?: SessionDefaults | null;
	error?: string | null;
};

export function LiveIdleView({
	onMicPress,
	connectionStatus = 'Disconnected',
	defaults,
	error,
}: LiveIdleViewProps) {
	const badgeVariant =
		connectionStatus === 'Connecting' ? 'WARMUP' : 'IDLE';

	return (
		<ScrollView
			style={styles.fill}
			contentContainerStyle={styles.scroll}
			showsVerticalScrollIndicator={false}
			keyboardShouldPersistTaps="handled"
		>
			<View style={styles.center}>
				<MicButton onPress={onMicPress} />
				<Text style={styles.hint}>Tap to start listening</Text>
				<View style={styles.badgeWrap}>
					<StatusBadge label={connectionStatus} variant={badgeVariant} />
				</View>
				{error ? <Text style={styles.error}>{error}</Text> : null}
			</View>

			<Card style={styles.defaultsCard}>
				<Eyebrow>Next session defaults</Eyebrow>
				<View style={styles.grid}>
					{[
						['Sample rate', defaults ? `${defaults.sample_rate / 1000} kHz` : '16 kHz'],
						['Chunk', defaults ? `${defaults.chunk_duration_s} s` : '0.5 s'],
						[
							'Threshold',
							defaults ? defaults.spoof_threshold.toFixed(2) : '0.50',
						],
						['EMA α', defaults ? defaults.ema_alpha.toFixed(2) : '0.30'],
					].map(([k, v]) => (
						<View key={k} style={styles.gridItem}>
							<Text style={styles.gridLabel}>{k}</Text>
							<Text style={styles.gridValue}>{v}</Text>
						</View>
					))}
				</View>
			</Card>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	fill: {
		flex: 1,
	},
	scroll: {
		flexGrow: 1,
		justifyContent: 'center',
		paddingHorizontal: spacing.screenX,
		paddingVertical: 24,
		paddingBottom: spacing.contentBottom,
	},
	center: {
		alignItems: 'center',
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
	error: {
		marginTop: 12,
		fontFamily: fontFamilies.sans,
		fontSize: 13,
		color: colors.destructive,
		textAlign: 'center',
		paddingHorizontal: 24,
	},
	defaultsCard: {
		marginTop: 28,
		padding: 14,
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
