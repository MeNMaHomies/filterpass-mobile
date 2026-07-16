import { View, Text, StyleSheet } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { colors } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';

type ErrorBannerProps = {
	message: string;
	onRetry?: () => void;
	retryLabel?: string;
};

export function ErrorBanner({
	message,
	onRetry,
	retryLabel = 'Retry',
}: ErrorBannerProps) {
	return (
		<Card
			style={styles.card}
			accessibilityRole="alert"
			accessibilityLiveRegion="polite"
		>
			<Text style={styles.message}>{message}</Text>
			{onRetry ? (
				<Button
					variant="ghost"
					label={retryLabel}
					onPress={onRetry}
					accessibilityHint="Tries the failed action again"
				/>
			) : null}
		</Card>
	);
}

const styles = StyleSheet.create({
	card: {
		padding: 14,
		marginBottom: 14,
		gap: 10,
		borderColor: 'rgba(239,68,68,0.35)',
		backgroundColor: colors.destructiveSoft,
	},
	message: {
		fontFamily: fontFamilies.sans,
		fontSize: 13,
		color: colors.destructive,
		lineHeight: 18,
	},
});
