import { useCallback, useEffect, useState } from 'react';
import {
	ScrollView,
	View,
	Text,
	TextInput,
	StyleSheet,
} from 'react-native';
import Slider from '@react-native-community/slider';
import {
	Button,
	Card,
	ErrorBanner,
	Eyebrow,
	ScreenLoader,
} from '@/components';
import { useScrollScreenProps } from '@/hooks/useScrollScreenProps';
import { apiBaseUrl } from '@/config/env';
import { hapticError, hapticSuccess } from '@/lib/haptics';
import { colors, radius, spacing } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';
import { ThresholdBand } from '../components/ThresholdBand';
import { SettingSelect } from '../components/SettingSelect';
import {
	API_SESSION_DEFAULTS,
	VAD_FRAME_MS_OPTIONS,
	VAD_MODE_OPTIONS,
	loadSessionDefaults,
	resetSessionDefaults,
	saveSessionDefaults,
	withClampedThresholds,
	type SessionDefaults,
	type VadFrameMs,
} from '../sessionDefaults';

function formatThreshold(value: number): string {
	return value.toFixed(2);
}

export function SettingsScreen() {
	const { bottomPadding, ...scrollProps } = useScrollScreenProps();
	const [defaults, setDefaults] = useState<SessionDefaults>(
		API_SESSION_DEFAULTS,
	);
	const [realText, setRealText] = useState(
		formatThreshold(API_SESSION_DEFAULTS.real_threshold),
	);
	const [spoofText, setSpoofText] = useState(
		formatThreshold(API_SESSION_DEFAULTS.spoof_threshold),
	);
	const [loaded, setLoaded] = useState(false);
	const [saved, setSaved] = useState(false);
	const [persistenceError, setPersistenceError] = useState<string | null>(null);

	useEffect(() => {
		loadSessionDefaults().then((d) => {
			setDefaults(d);
			setRealText(formatThreshold(d.real_threshold));
			setSpoofText(formatThreshold(d.spoof_threshold));
			setLoaded(true);
		});
	}, []);

	const applyThresholds = useCallback(
		(patch: Partial<Pick<SessionDefaults, 'real_threshold' | 'spoof_threshold'>>) => {
			setDefaults((d) => {
				const next = withClampedThresholds(d, patch);
				setRealText(formatThreshold(next.real_threshold));
				setSpoofText(formatThreshold(next.spoof_threshold));
				return next;
			});
		},
		[],
	);

	const commitRealText = useCallback(() => {
		const parsed = Number.parseFloat(realText);
		if (!Number.isFinite(parsed)) {
			setRealText(formatThreshold(defaults.real_threshold));
			return;
		}
		applyThresholds({ real_threshold: parsed });
	}, [applyThresholds, defaults.real_threshold, realText]);

	const commitSpoofText = useCallback(() => {
		const parsed = Number.parseFloat(spoofText);
		if (!Number.isFinite(parsed)) {
			setSpoofText(formatThreshold(defaults.spoof_threshold));
			return;
		}
		applyThresholds({ spoof_threshold: parsed });
	}, [applyThresholds, defaults.spoof_threshold, spoofText]);

	const handleSave = useCallback(async () => {
		setPersistenceError(null);
		try {
			await saveSessionDefaults(defaults);
			void hapticSuccess();
			setSaved(true);
			setTimeout(() => setSaved(false), 2000);
		} catch {
			void hapticError();
			setSaved(false);
			setPersistenceError(
				'Could not save settings. Restart the app and try again.',
			);
		}
	}, [defaults]);

	const handleReset = useCallback(async () => {
		setPersistenceError(null);
		try {
			const d = await resetSessionDefaults();
			setDefaults(d);
			setRealText(formatThreshold(d.real_threshold));
			setSpoofText(formatThreshold(d.spoof_threshold));
		} catch {
			void hapticError();
			setPersistenceError(
				'Could not reset settings. Restart the app and try again.',
			);
		}
	}, []);

	if (!loaded) {
		return <ScreenLoader label="Loading settings" />;
	}

	return (
		<ScrollView
			contentContainerStyle={[styles.scroll, { paddingBottom: bottomPadding }]}
			showsVerticalScrollIndicator={false}
			keyboardShouldPersistTaps="handled"
			{...scrollProps}
		>
			<Card style={styles.banner}>
				<Text style={styles.bannerText}>
					Applies to the <Text style={styles.bannerStrong}>next</Text> session.
				</Text>
				<Text
					style={styles.apiUrl}
					accessibilityLabel={`API base URL ${apiBaseUrl}`}
				>
					{apiBaseUrl}
				</Text>
			</Card>

			{persistenceError ? (
				<ErrorBanner message={persistenceError} />
			) : null}

			{saved ? (
				<Text
					style={styles.savedToast}
					accessibilityLiveRegion="polite"
					accessibilityRole="text"
				>
					Saved
				</Text>
			) : null}

			<Eyebrow>Audio</Eyebrow>
			<Card style={styles.group}>
				{[
					['Sample rate', `${defaults.sample_rate} Hz`],
					['Chunk duration', `${defaults.chunk_duration_s} s`],
					['Max frame', '32 KB'],
				].map(([k, v], i, arr) => (
					<View
						key={k}
						style={[styles.row, i < arr.length - 1 && styles.rowBorder]}
						accessible
						accessibilityLabel={`${k}: ${v}`}
					>
						<Text style={styles.rowLabel}>{k}</Text>
						<Text style={styles.rowValue}>{v}</Text>
					</View>
				))}
			</Card>

			<Eyebrow>Smoothing</Eyebrow>
			<Card style={styles.group}>
				<View style={styles.sliderHeader}>
					<Text style={styles.fieldTitle}>EMA alpha</Text>
					<Text style={styles.fieldValue}>
						{defaults.ema_alpha.toFixed(2)}
					</Text>
				</View>
				<Slider
					minimumValue={0.1}
					maximumValue={0.9}
					step={0.05}
					value={defaults.ema_alpha}
					onValueChange={(v) =>
						setDefaults((d) => ({ ...d, ema_alpha: v }))
					}
					minimumTrackTintColor={colors.primary}
					maximumTrackTintColor={colors.border}
					thumbTintColor={colors.primary}
					accessibilityLabel="Smoothing factor"
					accessibilityValue={{
						min: 0.1,
						max: 0.9,
						now: defaults.ema_alpha,
						text: defaults.ema_alpha.toFixed(2),
					}}
				/>
				<Text style={styles.hint}>Higher = more reactive</Text>
			</Card>

			<Eyebrow>Thresholds</Eyebrow>
			<Card style={styles.group}>
				<View style={styles.thresholdRow}>
					<View style={styles.thresholdField}>
						<Text style={styles.fieldTitle}>Real below</Text>
						<TextInput
							value={realText}
							onChangeText={setRealText}
							onBlur={commitRealText}
							onSubmitEditing={commitRealText}
							keyboardType="decimal-pad"
							selectTextOnFocus
							style={styles.input}
							accessibilityLabel="Real below threshold"
						/>
					</View>
					<View style={styles.thresholdField}>
						<Text style={styles.fieldTitle}>Spoof at</Text>
						<TextInput
							value={spoofText}
							onChangeText={setSpoofText}
							onBlur={commitSpoofText}
							onSubmitEditing={commitSpoofText}
							keyboardType="decimal-pad"
							selectTextOnFocus
							style={styles.input}
							accessibilityLabel="Spoof at or above threshold"
						/>
					</View>
				</View>
				<ThresholdBand
					realThreshold={defaults.real_threshold}
					spoofThreshold={defaults.spoof_threshold}
				/>
			</Card>

			<Eyebrow>Voice activity</Eyebrow>
			<Card style={styles.group}>
				<View style={styles.vadRow}>
					<View style={styles.vadCopy}>
						<Text style={styles.fieldTitle}>Sensitivity</Text>
						<Text style={styles.hint}>0–3 · higher cuts more silence</Text>
					</View>
					<SettingSelect
						value={defaults.vad_mode}
						options={VAD_MODE_OPTIONS}
						onChange={(vad_mode) =>
							setDefaults((d) => ({ ...d, vad_mode }))
						}
						accessibilityLabel="VAD sensitivity"
					/>
				</View>

				<View style={styles.vadDivider} />

				<View style={styles.vadRow}>
					<View style={styles.vadCopy}>
						<Text style={styles.fieldTitle}>Frame size</Text>
						<Text style={styles.hint}>VAD window</Text>
					</View>
					<SettingSelect
						value={defaults.vad_frame_ms}
						options={VAD_FRAME_MS_OPTIONS}
						onChange={(vad_frame_ms: VadFrameMs) =>
							setDefaults((d) => ({ ...d, vad_frame_ms }))
						}
						suffix="ms"
						accessibilityLabel="VAD detection frame size"
					/>
				</View>
			</Card>

			<View style={styles.actions}>
				<Button
					variant="ghost"
					label="Reset"
					style={styles.actionBtn}
					onPress={handleReset}
				/>
				<Button
					variant="solid"
					label={saved ? 'Saved' : 'Save'}
					style={styles.actionBtn}
					onPress={handleSave}
				/>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	scroll: {
		paddingHorizontal: spacing.screenX,
		paddingTop: 12,
	},
	banner: {
		padding: 12,
		marginBottom: 14,
		backgroundColor: colors.primarySoft,
		borderColor: 'rgba(59,130,246,0.28)',
	},
	bannerText: {
		fontFamily: fontFamilies.sans,
		fontSize: 13,
		color: colors.muted,
		lineHeight: 18,
	},
	bannerStrong: {
		color: colors.foreground,
		fontFamily: fontFamilies.sansSemibold,
	},
	apiUrl: {
		marginTop: 6,
		fontFamily: fontFamilies.mono,
		fontSize: 11,
		color: colors.muted2,
	},
	savedToast: {
		fontFamily: fontFamilies.sansSemibold,
		fontSize: 13,
		color: colors.accent,
		marginBottom: 10,
	},
	group: {
		padding: 14,
		marginBottom: 12,
		marginTop: 6,
	},
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingVertical: 10,
		minHeight: 44,
		alignItems: 'center',
	},
	rowBorder: {
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
	},
	rowLabel: {
		fontFamily: fontFamilies.sans,
		fontSize: 14,
		color: colors.muted,
	},
	rowValue: {
		fontFamily: fontFamilies.mono,
		fontSize: 14,
		color: colors.foreground,
	},
	sliderHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 4,
	},
	fieldTitle: {
		fontFamily: fontFamilies.sansSemibold,
		fontSize: 14,
		color: colors.foreground,
	},
	fieldValue: {
		fontFamily: fontFamilies.mono,
		fontSize: 15,
		color: colors.primary,
	},
	hint: {
		fontFamily: fontFamilies.sans,
		fontSize: 12,
		color: colors.muted2,
		marginTop: 4,
	},
	thresholdRow: {
		flexDirection: 'row',
		gap: 12,
	},
	thresholdField: {
		flex: 1,
		gap: 6,
	},
	input: {
		minHeight: 44,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.input,
		borderCurve: 'continuous',
		backgroundColor: colors.secondary,
		paddingHorizontal: 12,
		fontFamily: fontFamilies.mono,
		fontSize: 16,
		color: colors.foreground,
	},
	vadRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 12,
	},
	vadCopy: {
		flex: 1,
		gap: 2,
	},
	vadDivider: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: colors.border,
		marginVertical: 12,
	},
	actions: {
		flexDirection: 'row',
		gap: 10,
		marginTop: 4,
	},
	actionBtn: {
		flex: 1,
	},
});
