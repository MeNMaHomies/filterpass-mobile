import { View, Text, StyleSheet, Platform } from 'react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import type { CaptureMode } from '../types';
import { colors, radius } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';

type CaptureModeToggleProps = {
	value: CaptureMode;
	onChange: (mode: CaptureMode) => void;
	disabled?: boolean;
};

const OPTIONS: { mode: CaptureMode; label: string; hint: string }[] = [
	{ mode: 'mic', label: 'Mic', hint: 'Device microphone only' },
	{ mode: 'call', label: 'Call Scan', hint: 'Mix mic + call path' },
];

export function CaptureModeToggle({
	value,
	onChange,
	disabled = false,
}: CaptureModeToggleProps) {
	return (
		<View
			style={styles.row}
			accessibilityRole="tablist"
			accessibilityLabel="Capture mode"
		>
			{OPTIONS.map((option) => {
				const selected = value === option.mode;
				const callUnavailable =
					option.mode === 'call' && Platform.OS !== 'android';
				const isDisabled = disabled || callUnavailable;

				return (
					<PressableScale
						key={option.mode}
						onPress={() => onChange(option.mode)}
						disabled={isDisabled}
						style={[
							styles.option,
							selected ? styles.optionSelected : null,
							isDisabled ? styles.optionDisabled : null,
						]}
						accessibilityRole="tab"
						accessibilityState={{ selected, disabled: isDisabled }}
						accessibilityLabel={`${option.label}. ${option.hint}`}
						scaleTo={0.97}
						haptic={!isDisabled}
					>
						<Text
							style={[
								styles.label,
								selected ? styles.labelSelected : null,
							]}
						>
							{option.label}
						</Text>
					</PressableScale>
				);
			})}
		</View>
	);
}

const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		gap: 8,
		padding: 4,
		borderRadius: radius.pill,
		backgroundColor: colors.secondary,
		borderWidth: 1,
		borderColor: colors.border,
	},
	option: {
		flex: 1,
		paddingVertical: 10,
		paddingHorizontal: 12,
		borderRadius: radius.pill,
		alignItems: 'center',
	},
	optionSelected: {
		backgroundColor: colors.primarySoft,
		borderWidth: 1,
		borderColor: 'rgba(59,130,246,0.35)',
	},
	optionDisabled: {
		opacity: 0.45,
	},
	label: {
		fontFamily: fontFamilies.sansMedium,
		fontSize: 13,
		color: colors.muted,
	},
	labelSelected: {
		color: colors.foreground,
	},
});
