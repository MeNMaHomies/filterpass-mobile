import { useCallback, useEffect, useState } from 'react';
import {
	ScrollView,
	View,
	Text,
	TextInput,
	StyleSheet,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Button, Card, Eyebrow, ScreenLoader } from '@/components';
import { useScrollScreenProps } from '@/hooks/useScrollScreenProps';
import { hapticSuccess } from '@/lib/haptics';
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
	const scrollProps = useScrollScreenProps();
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
		await saveSessionDefaults(defaults);
		void hapticSuccess();
		setSaved(true);
		setTimeout(() => setSaved(false), 2000);
	}, [defaults]);

	const handleReset = useCallback(async () => {
		const d = await resetSessionDefaults();
		setDefaults(d);
		setRealText(formatThreshold(d.real_threshold));
		setSpoofText(formatThreshold(d.spoof_threshold));
	}, []);

	if (!loaded) {
		return <ScreenLoader label="Loading settings" />;
	}

	return (
		<ScrollView
			contentContainerStyle={styles.scroll}
			showsVerticalScrollIndicator={false}
			keyboardShouldPersistTaps="handled"
			{...scrollProps}
		>
			<Card style={styles.banner}>
				<Text style={styles.bannerText}>
					Settings apply to the{' '}
					<Text style={styles.bannerStrong}>next</Text> session only.
					Stored on device.
				</Text>
			</Card>

			{saved ? (
				<Text
					style={styles.savedToast}
					accessibilityLiveRegion="polite"
					accessibilityRole="text"
				>
					Settings saved
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

			<Eyebrow>Score smoothing</Eyebrow>
			<Card style={styles.group}>
				<Text style={styles.sectionBody}>
					The raw model output for each audio chunk is averaged over time.
					The smoothed score is compared against the thresholds to decide the
					label.
				</Text>
				<View style={styles.fieldBlock}>
					<Text style={styles.fieldTitle}>Smoothing factor</Text>
					<Text style={styles.fieldHint}>
						How quickly the score reacts to changes.
					</Text>
					<View style={styles.fieldRow}>
						<Text style={styles.fieldValue}>
							{defaults.ema_alpha.toFixed(2)}
						</Text>
						<Text style={styles.fieldMeta}>
							default 0.3 · Higher = more reactive
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
				</View>
			</Card>

			<Eyebrow>Decision thresholds</Eyebrow>
			<Card style={styles.group}>
				<Text style={styles.sectionBody}>
					Scores at or above the spoof line are flagged as spoof. Scores below
					the real line are called real. Scores between the two land in the
					uncertain band.
				</Text>

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
						<Text style={styles.inputMeta}>EMA SCORE</Text>
					</View>
					<View style={styles.thresholdField}>
						<Text style={styles.fieldTitle}>Spoof at or above</Text>
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
						<Text style={styles.inputMeta}>EMA SCORE</Text>
					</View>
				</View>

				<ThresholdBand
					realThreshold={defaults.real_threshold}
					spoofThreshold={defaults.spoof_threshold}
				/>
			</Card>

			<Eyebrow>Voice activity detection</Eyebrow>
			<Card style={styles.group}>
				<Text style={styles.sectionBody}>
					Only frames that contain speech are sent through inference. Silent
					frames are dropped before chunking.
				</Text>

				<View style={styles.vadRow}>
					<View style={styles.vadCopy}>
						<Text style={styles.fieldTitle}>Sensitivity</Text>
						<Text style={styles.fieldHint}>
							0 = least aggressive, 3 = most aggressive.
						</Text>
					</View>
					<SettingSelect
						value={defaults.vad_mode}
						options={VAD_MODE_OPTIONS}
						onChange={(vad_mode) =>
							setDefaults((d) => ({ ...d, vad_mode }))
						}
						accessibilityLabel="VAD sensitivity"
					/>
					<View style={styles.vadMeta}>
						<Text style={styles.vadMetaTitle}>default 2</Text>
						<Text style={styles.vadMetaBody}>
							Higher values cut more silence but risk missing softer speech.
						</Text>
					</View>
				</View>

				<View style={styles.vadDivider} />

				<View style={styles.vadRow}>
					<View style={styles.vadCopy}>
						<Text style={styles.fieldTitle}>Detection frame size</Text>
						<Text style={styles.fieldHint}>
							Length of each frame the detector inspects.
						</Text>
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
					<View style={styles.vadMeta}>
						<Text style={styles.vadMetaTitle}>default 30 ms</Text>
					</View>
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
		padding: 14,
		marginBottom: 16,
		backgroundColor: colors.primarySoft,
		borderColor: 'rgba(59,130,246,0.28)',
	},
	bannerText: {
		fontFamily: fontFamilies.sans,
		fontSize: 13,
		color: colors.muted,
		lineHeight: 20,
	},
	bannerStrong: {
		color: colors.foreground,
		fontFamily: fontFamilies.sansSemibold,
	},
	savedToast: {
		fontFamily: fontFamilies.sansSemibold,
		fontSize: 13,
		color: colors.accent,
		marginBottom: 12,
	},
	group: {
		padding: 14,
		marginBottom: 14,
		marginTop: 8,
	},
	sectionBody: {
		fontFamily: fontFamilies.sans,
		fontSize: 13,
		color: colors.muted2,
		lineHeight: 19,
		marginBottom: 14,
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
	fieldBlock: {
		gap: 4,
	},
	fieldTitle: {
		fontFamily: fontFamilies.sansSemibold,
		fontSize: 14,
		color: colors.foreground,
	},
	fieldHint: {
		fontFamily: fontFamilies.sans,
		fontSize: 12,
		color: colors.muted2,
		marginBottom: 8,
	},
	fieldRow: {
		flexDirection: 'row',
		alignItems: 'baseline',
		justifyContent: 'space-between',
		gap: 10,
		marginBottom: 4,
	},
	fieldValue: {
		fontFamily: fontFamilies.mono,
		fontSize: 16,
		color: colors.primary,
	},
	fieldMeta: {
		flex: 1,
		fontFamily: fontFamilies.sans,
		fontSize: 11,
		color: colors.muted2,
		textAlign: 'right',
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
	inputMeta: {
		fontFamily: fontFamilies.sansBold,
		fontSize: 9,
		letterSpacing: 1.1,
		color: colors.muted2,
	},
	vadRow: {
		gap: 10,
	},
	vadCopy: {
		gap: 2,
	},
	vadMeta: {
		gap: 2,
	},
	vadMetaTitle: {
		fontFamily: fontFamilies.mono,
		fontSize: 11,
		color: colors.muted2,
	},
	vadMetaBody: {
		fontFamily: fontFamilies.sans,
		fontSize: 11,
		color: colors.muted2,
		lineHeight: 15,
	},
	vadDivider: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: colors.border,
		marginVertical: 14,
	},
	actions: {
		flexDirection: 'row',
		gap: 10,
		marginTop: 8,
	},
	actionBtn: {
		flex: 1,
	},
});
