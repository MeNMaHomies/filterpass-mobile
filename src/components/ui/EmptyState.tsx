import { View, Text, StyleSheet } from 'react-native';
import { Button } from '@/components/ui/Button';
import { colors } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';

type EmptyStateProps = {
	title: string;
	description?: string;
	actionLabel?: string;
	onAction?: () => void;
};

export function EmptyState({
	title,
	description,
	actionLabel,
	onAction,
}: EmptyStateProps) {
	return (
		<View style={styles.wrap} accessibilityRole="text">
			<Text style={styles.title}>{title}</Text>
			{description ? (
				<Text style={styles.description}>{description}</Text>
			) : null}
			{actionLabel && onAction ? (
				<Button
					variant="primary"
					label={actionLabel}
					style={styles.action}
					onPress={onAction}
				/>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {
		paddingVertical: 16,
		gap: 8,
		alignItems: 'flex-start',
	},
	title: {
		fontFamily: fontFamilies.sansSemibold,
		fontSize: 14,
		color: colors.foreground,
	},
	description: {
		fontFamily: fontFamilies.sans,
		fontSize: 13,
		color: colors.muted2,
		lineHeight: 18,
	},
	action: {
		marginTop: 6,
		minWidth: 160,
	},
});
