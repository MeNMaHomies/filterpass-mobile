import { useEffect } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';
import { Square } from 'lucide-react-native';
import { Card, ErrorBanner, Eyebrow, StatusBadge } from '@/components';
import { useScrollScreenProps } from '@/hooks/useScrollScreenProps';
import { colors, spacing } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';

type LiveWarmupViewProps = {
	bufferFillSamples?: number;
	bufferTargetSamples?: number;
	error?: string | null;
	onCancel?: () => void;
	onClearError?: () => void;
};

export function LiveWarmupView({
	bufferFillSamples = 0,
	bufferTargetSamples = 1,
	error,
	onCancel,
	onClearError,
}: LiveWarmupViewProps) {
	const scrollProps = useScrollScreenProps();
	const fill =
		bufferTargetSamples > 0
			? Math.min(
					100,
					Math.round((bufferFillSamples / bufferTargetSamples) * 100),
				)
			: 0;
	const fillProgress = useSharedValue(fill / 100);

	useEffect(() => {
		fillProgress.set(withTiming(fill / 100, { duration: 220 }));
	}, [fill, fillProgress]);

	const fillStyle = useAnimatedStyle(() => ({
		transform: [{ scaleX: Math.max(0.001, fillProgress.get()) }],
	}));

	return (
		<ScrollView
			contentContainerStyle={styles.scroll}
			showsVerticalScrollIndicator={false}
			keyboardShouldPersistTaps="handled"
			{...scrollProps}
		>
			{error ? (
				<ErrorBanner
					message={error}
					onRetry={onClearError}
					retryLabel="Dismiss"
				/>
			) : null}

			<StatusBadge label="Warming up" variant="WARMUP" live />

			<View
				style={styles.progressBlock}
				accessible
				accessibilityLabel={`Buffer fill ${fill} percent`}
			>
				<Text style={styles.progressLabel}>Buffer fill · {fill}%</Text>
				<View style={styles.track}>
					<Animated.View style={[styles.fill, fillStyle]} />
				</View>
				<Text style={styles.progressMeta}>
					{bufferFillSamples.toLocaleString()} /{' '}
					{bufferTargetSamples.toLocaleString()} samples
				</Text>
			</View>

			<Card style={styles.infoCard}>
				<Eyebrow>Buffering audio</Eyebrow>
				<Text style={styles.infoBody}>
					Model fills its audio buffer before scoring. Keep speaking —
					inference starts automatically.
				</Text>
			</Card>

			<View style={styles.cancelBlock}>
				<Pressable
					onPress={onCancel}
					style={({ pressed }) => [
						styles.cancelButton,
						pressed && styles.cancelPressed,
					]}
					accessibilityRole="button"
					accessibilityLabel="Cancel session"
					accessibilityHint="Stops warmup and returns to idle"
				>
					<Square
						size={18}
						color={colors.destructive}
						fill={colors.destructive}
					/>
				</Pressable>
				<Text style={styles.cancelLabel}>Cancel</Text>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	scroll: {
		paddingHorizontal: spacing.screenX,
		paddingTop: 24,
		alignItems: 'center',
	},
	progressBlock: {
		marginTop: 32,
		width: '100%',
	},
	progressLabel: {
		fontFamily: fontFamilies.mono,
		fontSize: 12,
		color: colors.muted,
		marginBottom: 10,
		textAlign: 'center',
	},
	track: {
		height: 8,
		backgroundColor: colors.border,
		borderRadius: 99,
		overflow: 'hidden',
	},
	fill: {
		height: '100%',
		width: '100%',
		backgroundColor: colors.amber,
		borderRadius: 99,
		transformOrigin: 'left center',
	},
	progressMeta: {
		fontFamily: fontFamilies.mono,
		fontSize: 10,
		color: colors.muted2,
		marginTop: 8,
		textAlign: 'center',
	},
	infoCard: {
		marginTop: 28,
		padding: 16,
		width: '100%',
	},
	infoBody: {
		fontFamily: fontFamilies.sans,
		fontSize: 13,
		color: colors.muted,
		lineHeight: 20,
		marginTop: 8,
	},
	cancelBlock: {
		marginTop: 36,
		alignItems: 'center',
	},
	cancelButton: {
		width: 64,
		height: 64,
		borderRadius: 32,
		backgroundColor: colors.destructiveSoft,
		borderWidth: 2,
		borderColor: colors.destructive,
		alignItems: 'center',
		justifyContent: 'center',
	},
	cancelPressed: {
		opacity: 0.85,
	},
	cancelLabel: {
		fontFamily: fontFamilies.sans,
		fontSize: 13,
		color: colors.muted,
		marginTop: 10,
	},
});
