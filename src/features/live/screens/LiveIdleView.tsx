import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Card, ErrorBanner, Eyebrow, StatusBadge } from '@/components';
import { MicButton } from '../components/MicButton';
import { useScrollScreenProps } from '@/hooks/useScrollScreenProps';
import type { SessionDefaults } from '@/features/settings/sessionDefaults';
import type { ConnectionStatus } from '../hooks/useLiveSession';
import { colors, spacing } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';

type LiveIdleViewProps = {
	onMicPress?: () => void;
	connectionStatus?: ConnectionStatus;
	defaults?: SessionDefaults | null;
	error?: string | null;
	onClearError?: () => void;
	busy?: boolean;
};

export function LiveIdleView({
	onMicPress,
	connectionStatus = 'Disconnected',
	defaults,
	error,
	onClearError,
	busy = false,
}: LiveIdleViewProps) {
	const { bottomPadding, ...scrollProps } = useScrollScreenProps();
	const badgeVariant =
		connectionStatus === 'Connecting' ? 'WARMUP' : 'IDLE';

	return (
		<ScrollView
			style={styles.fill}
			contentContainerStyle={[styles.scroll, { paddingBottom: bottomPadding }]}
			showsVerticalScrollIndicator={false}
			keyboardShouldPersistTaps="handled"
			{...scrollProps}
		>
			{error ? (
				<ErrorBanner
					message={error}
					onRetry={onClearError}
					retryLabel="Dismiss"
				/>
			) : null}

			<View style={styles.center}>
				<MicButton onPress={onMicPress} busy={busy} disabled={busy} />
				<Text style={styles.hint}>
					{busy ? 'Connecting…' : 'Tap to start listening'}
				</Text>
				<View style={styles.badgeWrap}>
					<StatusBadge
						label={connectionStatus}
						variant={badgeVariant}
						live={busy}
					/>
				</View>
			</View>

			<Card style={styles.defaultsCard}>
				<Eyebrow>Next session defaults</Eyebrow>
				<View style={styles.grid}>
					{[
						[
							'Sample rate',
							defaults ? `${defaults.sample_rate / 1000} kHz` : '16 kHz',
							'Audio capture rate',
						],
						[
							'Chunk',
							defaults ? `${defaults.chunk_duration_s} s` : '0.5 s',
							'Audio length per score',
						],
						[
							'Real below',
							defaults ? defaults.real_threshold.toFixed(2) : '0.40',
							'Scores below this are REAL',
						],
						[
							'Spoof at',
							defaults ? defaults.spoof_threshold.toFixed(2) : '0.60',
							'Scores at or above are SPOOF',
						],
						[
							'Smoothing',
							defaults ? defaults.ema_alpha.toFixed(2) : '0.30',
							'How fast the score reacts',
						],
					].map(([k, v, hint]) => (
						<View
							key={k}
							style={styles.gridItem}
							accessible
							accessibilityLabel={`${k}: ${v}. ${hint}`}
						>
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
		paddingBottom: 24,
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
