import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { Button, Card, Eyebrow } from '@/components';
import { useScrollScreenProps } from '@/hooks/useScrollScreenProps';
import { colors, spacing } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';
import {
	API_SESSION_DEFAULTS,
	loadSessionDefaults,
	resetSessionDefaults,
	saveSessionDefaults,
	type SessionDefaults,
} from '../sessionDefaults';

export function SettingsScreen() {
	const scrollProps = useScrollScreenProps();
	const [defaults, setDefaults] = useState<SessionDefaults>(
		API_SESSION_DEFAULTS,
	);
	const [loaded, setLoaded] = useState(false);
	const [saved, setSaved] = useState(false);

	useEffect(() => {
		loadSessionDefaults().then((d) => {
			setDefaults(d);
			setLoaded(true);
		});
	}, []);

	const handleSave = useCallback(async () => {
		await saveSessionDefaults(defaults);
		setSaved(true);
		setTimeout(() => setSaved(false), 2000);
	}, [defaults]);

	const handleReset = useCallback(async () => {
		const d = await resetSessionDefaults();
		setDefaults(d);
	}, []);

	if (!loaded) {
		return null;
	}

	return (
		<ScrollView
			contentContainerStyle={styles.scroll}
			showsVerticalScrollIndicator={false}
			{...scrollProps}
		>
			<Card style={styles.banner}>
				<Text style={styles.bannerText}>
					Settings apply to the{' '}
					<Text style={styles.bannerStrong}>next</Text> session only.
					Stored on device.
				</Text>
			</Card>

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
					>
						<Text style={styles.rowLabel}>{k}</Text>
						<Text style={styles.rowValue}>{v}</Text>
					</View>
				))}
			</Card>

			<Eyebrow>Inference</Eyebrow>
			<Card style={styles.group}>
				<View style={styles.sliderBlock}>
					<View style={styles.sliderHeader}>
						<Text style={styles.rowLabel}>Spoof threshold</Text>
						<Text style={styles.sliderValue}>
							{defaults.spoof_threshold.toFixed(2)}
						</Text>
					</View>
					<Slider
						minimumValue={0.1}
						maximumValue={0.9}
						step={0.05}
						value={defaults.spoof_threshold}
						onValueChange={(v) =>
							setDefaults((d) => ({ ...d, spoof_threshold: v }))
						}
						minimumTrackTintColor={colors.primary}
						maximumTrackTintColor={colors.border}
						thumbTintColor={colors.primary}
					/>
				</View>
				<View style={styles.sliderBlock}>
					<View style={styles.sliderHeader}>
						<Text style={styles.rowLabel}>EMA α</Text>
						<Text style={styles.sliderValue}>
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
	group: {
		padding: 14,
		marginBottom: 14,
		marginTop: 8,
	},
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingVertical: 10,
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
	sliderBlock: {
		marginBottom: 18,
	},
	sliderHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 8,
	},
	sliderValue: {
		fontFamily: fontFamilies.mono,
		fontSize: 14,
		color: colors.primary,
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
