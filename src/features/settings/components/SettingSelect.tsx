import { useState } from 'react';
import {
	Modal,
	Pressable,
	Text,
	View,
	StyleSheet,
} from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import { colors, radius } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';

type SettingSelectProps<T extends number> = {
	value: T;
	options: readonly T[];
	onChange: (value: T) => void;
	formatOption?: (value: T) => string;
	accessibilityLabel: string;
	suffix?: string;
};

export function SettingSelect<T extends number>({
	value,
	options,
	onChange,
	formatOption = String,
	accessibilityLabel,
	suffix,
}: SettingSelectProps<T>) {
	const [open, setOpen] = useState(false);

	return (
		<>
			<PressableScale
				onPress={() => setOpen(true)}
				style={styles.trigger}
				accessibilityRole="button"
				accessibilityLabel={accessibilityLabel}
				accessibilityHint="Opens a list of options"
				accessibilityValue={{ text: formatOption(value) }}
			>
				<Text style={styles.triggerValue}>{formatOption(value)}</Text>
				{suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
				<ChevronDown size={14} color={colors.muted2} strokeWidth={2} />
			</PressableScale>

			<Modal
				visible={open}
				transparent
				animationType="fade"
				onRequestClose={() => setOpen(false)}
			>
				<View style={styles.backdrop}>
					<Pressable
						style={StyleSheet.absoluteFill}
						onPress={() => setOpen(false)}
						accessibilityRole="button"
						accessibilityLabel="Dismiss options"
					/>
					<View style={styles.sheet}>
						{options.map((option) => {
							const selected = option === value;
							return (
								<PressableScale
									key={String(option)}
									onPress={() => {
										onChange(option);
										setOpen(false);
									}}
									style={[
										styles.option,
										selected && styles.optionSelected,
									]}
									accessibilityRole="button"
									accessibilityState={{ selected }}
									accessibilityLabel={formatOption(option)}
								>
									<Text
										style={[
											styles.optionLabel,
											selected && styles.optionLabelSelected,
										]}
									>
										{formatOption(option)}
										{suffix ? ` ${suffix}` : ''}
									</Text>
								</PressableScale>
							);
						})}
					</View>
				</View>
			</Modal>
		</>
	);
}

const styles = StyleSheet.create({
	trigger: {
		minHeight: 40,
		minWidth: 64,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		paddingHorizontal: 12,
		borderRadius: radius.input,
		borderCurve: 'continuous',
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.secondary,
	},
	triggerValue: {
		fontFamily: fontFamilies.mono,
		fontSize: 14,
		color: colors.foreground,
	},
	suffix: {
		fontFamily: fontFamilies.sans,
		fontSize: 12,
		color: colors.muted2,
	},
	backdrop: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.55)',
		justifyContent: 'center',
		paddingHorizontal: 32,
	},
	sheet: {
		borderRadius: radius.card,
		borderCurve: 'continuous',
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.card,
		overflow: 'hidden',
	},
	option: {
		minHeight: 48,
		paddingHorizontal: 16,
		justifyContent: 'center',
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: colors.border,
	},
	optionSelected: {
		backgroundColor: colors.primarySoft,
	},
	optionLabel: {
		fontFamily: fontFamilies.mono,
		fontSize: 15,
		color: colors.muted,
	},
	optionLabelSelected: {
		color: colors.primary,
		fontFamily: fontFamilies.mono,
	},
});
