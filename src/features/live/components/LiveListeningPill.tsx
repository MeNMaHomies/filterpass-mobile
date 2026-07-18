import { View, Text, StyleSheet } from 'react-native';
import { LiveDot } from '@/components';
import {
	deriveListeningStatus,
	formatListeningStatus,
} from '../lib/liveVerdict';
import { colors, radius } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';

type LiveListeningPillProps = {
	lastVoiced: boolean | null;
	voicedAcks: number;
	totalAcks: number;
};

export function LiveListeningPill({
	lastVoiced,
	voicedAcks,
	totalAcks,
}: LiveListeningPillProps) {
	const status = deriveListeningStatus(lastVoiced, totalAcks, voicedAcks);
	const isSpeech = status === 'speech';

	return (
		<View
			style={styles.pill}
			accessibilityRole="text"
			accessibilityLabel={formatListeningStatus(status)}
		>
			{isSpeech ? <LiveDot /> : null}
			<Text style={[styles.label, isSpeech && styles.labelActive]}>
				{formatListeningStatus(status)}
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	pill: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		paddingVertical: 10,
		paddingHorizontal: 16,
		borderRadius: radius.pill,
		backgroundColor: colors.secondary,
		borderWidth: 1,
		borderColor: colors.border,
	},
	label: {
		fontFamily: fontFamilies.sansMedium,
		fontSize: 13,
		color: colors.muted,
	},
	labelActive: {
		color: colors.foreground,
	},
});
