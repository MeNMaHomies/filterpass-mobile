import { View, Text, StyleSheet } from 'react-native';
import { CircleAlert } from 'lucide-react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import { colors, radius } from '@/theme/tokens';
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
		<View
			style={styles.wrap}
			accessibilityRole="alert"
			accessibilityLiveRegion="polite"
		>
			<View style={styles.rail} />
			<View style={styles.body}>
				<View style={styles.copyRow}>
					<View
						accessibilityElementsHidden
						importantForAccessibility="no"
					>
						<CircleAlert
							size={15}
							color={colors.destructive}
							strokeWidth={2}
						/>
					</View>
					<Text style={styles.message}>{message}</Text>
				</View>
				{onRetry ? (
					<PressableScale
						onPress={onRetry}
						style={styles.retry}
						accessibilityRole="button"
						accessibilityLabel={retryLabel}
						accessibilityHint="Tries the failed action again"
					>
						<Text style={styles.retryLabel}>{retryLabel}</Text>
					</PressableScale>
				) : null}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {
		flexDirection: 'row',
		marginTop: 10,
		marginBottom: 14,
		overflow: 'hidden',
		borderRadius: radius.card,
		borderCurve: 'continuous',
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.card,
	},
	rail: {
		width: 3,
		backgroundColor: colors.destructive,
		opacity: 0.75,
	},
	body: {
		flex: 1,
		paddingVertical: 12,
		paddingHorizontal: 12,
		gap: 10,
	},
	copyRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 8,
	},
	message: {
		flex: 1,
		fontFamily: fontFamilies.sans,
		fontSize: 13,
		color: colors.muted,
		lineHeight: 18,
	},
	retry: {
		alignSelf: 'flex-start',
		minHeight: 32,
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: radius.button,
		borderCurve: 'continuous',
		backgroundColor: colors.primarySoft,
		borderWidth: 1,
		borderColor: 'rgba(59,130,246,0.28)',
		justifyContent: 'center',
	},
	retryLabel: {
		fontFamily: fontFamilies.sansSemibold,
		fontSize: 12,
		color: colors.primary,
	},
});
