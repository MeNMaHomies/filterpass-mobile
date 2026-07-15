import { Text, StyleSheet, type TextProps } from 'react-native';
import { colors } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';

type EyebrowProps = TextProps & {
	children: string;
};

export function Eyebrow({ children, style, ...props }: EyebrowProps) {
	return (
		<Text style={[styles.eyebrow, style]} {...props}>
			{children}
		</Text>
	);
}

const styles = StyleSheet.create({
	eyebrow: {
		fontFamily: fontFamilies.monoMedium,
		fontSize: 10,
		letterSpacing: 1.2,
		textTransform: 'uppercase',
		color: colors.muted2,
		marginBottom: 4,
	},
});
