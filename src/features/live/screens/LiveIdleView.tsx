import { useEffect } from 'react';
import { AppState, ScrollView, View, Text, StyleSheet } from 'react-native';
import { Phone } from 'lucide-react-native';
import { Button, Card, ErrorBanner, Eyebrow, StatusBadge } from '@/components';
import { MicButton } from '../components/MicButton';
import { CaptureModeToggle } from '../components/CaptureModeToggle';
import { useScrollScreenProps } from '@/hooks/useScrollScreenProps';
import type { SessionDefaults } from '@/features/settings/sessionDefaults';
import type {
	CallScanSetup,
	CaptureMode,
	ConnectionStatus,
} from '../types';
import { colors, spacing } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';

type LiveIdleViewProps = {
	onMicPress?: () => void;
	connectionStatus?: ConnectionStatus;
	defaults?: SessionDefaults | null;
	error?: string | null;
	onClearError?: () => void;
	busy?: boolean;
	captureMode: CaptureMode;
	onCaptureModeChange: (mode: CaptureMode) => void;
	callScan: CallScanSetup;
};

export function LiveIdleView({
	onMicPress,
	connectionStatus = 'Disconnected',
	defaults,
	error,
	onClearError,
	busy = false,
	captureMode,
	onCaptureModeChange,
	callScan,
}: LiveIdleViewProps) {
	const { bottomPadding, ...scrollProps } = useScrollScreenProps();
	const {
		available: callCaptureAvailable,
		accessibility,
		refreshAccessibility,
		openAccessibilitySettings,
	} = callScan;
	const badgeVariant =
		connectionStatus === 'Connecting' ? 'WARMUP' : 'IDLE';
	const isCall = captureMode === 'call';
	const a11yReady = accessibility.enabled && accessibility.connected;
	const canStart = !busy && (!isCall || (callCaptureAvailable && a11yReady));

	useEffect(() => {
		if (!isCall || !callCaptureAvailable) return;
		refreshAccessibility();
		const sub = AppState.addEventListener('change', (state) => {
			if (state === 'active') refreshAccessibility();
		});
		return () => sub.remove();
	}, [isCall, callCaptureAvailable, refreshAccessibility]);

	const hint = busy
		? 'Connecting…'
		: isCall
			? a11yReady
				? 'Tap to start Call Scan'
				: 'Enable Accessibility first'
			: 'Tap to start listening';

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

			<CaptureModeToggle
				value={captureMode}
				onChange={onCaptureModeChange}
				disabled={busy}
			/>

			{isCall ? (
				<Card style={styles.callCard}>
					<View style={styles.callHeader}>
						<Phone size={16} color={colors.primary} strokeWidth={1.75} />
						<Eyebrow>Call Scan setup</Eyebrow>
					</View>
					<Text style={styles.callBody}>
						Best-effort mix of mic and call-path audio. Enable FilterPass Call
						Capture under Accessibility, then start a phone call and tap below.
					</Text>
					<View style={styles.callStatusRow}>
						<Text style={styles.callStatusLabel}>Accessibility</Text>
						<Text
							style={[
								styles.callStatusValue,
								a11yReady ? styles.callStatusOk : styles.callStatusWait,
							]}
						>
							{!callCaptureAvailable
								? 'Android only'
								: a11yReady
									? 'Ready'
									: accessibility.enabled
										? 'Enabled, reconnecting…'
										: 'Off'}
						</Text>
					</View>
					{callCaptureAvailable && !a11yReady ? (
						<Button
							variant="solid"
							label="Open Accessibility settings"
							style={styles.callButton}
							onPress={() => {
								try {
									openAccessibilitySettings();
								} catch {
									onClearError?.();
								}
							}}
						/>
					) : null}
					{callCaptureAvailable ? (
						<Button
							variant="ghost"
							label="Refresh status"
							style={styles.callButton}
							onPress={refreshAccessibility}
						/>
					) : null}
				</Card>
			) : null}

			<View style={styles.center}>
				<MicButton
					onPress={onMicPress}
					busy={busy}
					disabled={!canStart}
				/>
				<Text style={styles.hint}>{hint}</Text>
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
						[
							'Capture',
							isCall ? 'Call mix' : 'Mic only',
							isCall
								? 'Mixed mic + call-path PCM'
								: 'Device microphone only',
						],
					].map(([k, v, hintText]) => (
						<View
							key={k}
							style={styles.gridItem}
							accessible
							accessibilityLabel={`${k}: ${v}. ${hintText}`}
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
		gap: 18,
	},
	center: {
		alignItems: 'center',
	},
	hint: {
		marginTop: 14,
		fontFamily: fontFamilies.sans,
		fontSize: 14,
		color: colors.muted,
		textAlign: 'center',
	},
	badgeWrap: {
		marginTop: 18,
	},
	callCard: {
		padding: 14,
		gap: 10,
	},
	callHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	callBody: {
		fontFamily: fontFamilies.sans,
		fontSize: 13,
		lineHeight: 19,
		color: colors.muted,
	},
	callStatusRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		gap: 12,
	},
	callStatusLabel: {
		fontFamily: fontFamilies.sans,
		fontSize: 12,
		color: colors.muted2,
	},
	callStatusValue: {
		fontFamily: fontFamilies.mono,
		fontSize: 12,
	},
	callStatusOk: {
		color: colors.accent,
	},
	callStatusWait: {
		color: colors.amber,
	},
	callButton: {
		marginTop: 2,
	},
	defaultsCard: {
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
