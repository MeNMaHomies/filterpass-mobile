import { useCallback } from 'react';
import {
	ScrollView,
	View,
	Text,
	StyleSheet,
	RefreshControl,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Button, Card, EmptyState, ErrorBanner, Eyebrow } from '@/components';
import { KpiGrid } from '../components/KpiGrid';
import { RecentSessionCard } from '../components/RecentSessionCard';
import { useHomeOverview } from '../hooks/useHomeOverview';
import { useScrollScreenProps } from '@/hooks/useScrollScreenProps';
import { colors, spacing } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';

export function HomeScreen() {
	const router = useRouter();
	const scrollProps = useScrollScreenProps();
	const { kpis, recentSessions, loading, error, refresh } = useHomeOverview();
	const { push } = router;

	const openLive = useCallback(() => {
		push('/live' as Href);
	}, [push]);

	const openSession = useCallback(
		(sessionId: string) => {
			push(`/history/${sessionId}` as Href);
		},
		[push],
	);

	return (
		<ScrollView
			contentContainerStyle={styles.scroll}
			showsVerticalScrollIndicator={false}
			refreshControl={
				<RefreshControl
					refreshing={loading && kpis.length > 0}
					onRefresh={refresh}
					tintColor={colors.primary}
				/>
			}
			{...scrollProps}
		>
			{loading && kpis.length === 0 ? (
				<Text style={styles.loadingHint} accessibilityLabel="Loading overview">
					Loading overview…
				</Text>
			) : null}

			{error ? <ErrorBanner message={error} onRetry={refresh} /> : null}

			{kpis.length > 0 ? <KpiGrid items={kpis} /> : null}

			<Card glow style={styles.ctaCard}>
				<Eyebrow>Start session</Eyebrow>
				<Text style={styles.ctaTitle}>Live spoof detection</Text>
				<Text style={styles.ctaBody}>
					Mic capture streams to the detector. No account required.
				</Text>
				<Button
					variant="primary"
					label="Start session"
					style={styles.ctaButton}
					onPress={openLive}
				/>
			</Card>

			<Eyebrow>Recent sessions</Eyebrow>
			{recentSessions.length === 0 && !loading ? (
				<EmptyState
					title="No sessions yet"
					description="Run a live detection to see recent results here."
					actionLabel="Start session"
					onAction={openLive}
				/>
			) : (
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.recentRow}
				>
					{recentSessions.map((s) => (
						<RecentSessionCard
							key={s.sessionId}
							session={s}
							onPress={openSession}
						/>
					))}
				</ScrollView>
			)}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	scroll: {
		paddingHorizontal: spacing.screenX,
		paddingTop: spacing.screenY,
	},
	loadingHint: {
		fontFamily: fontFamilies.sans,
		fontSize: 13,
		color: colors.muted2,
		marginBottom: 14,
	},
	ctaCard: {
		padding: 16,
		marginBottom: 16,
	},
	ctaTitle: {
		fontFamily: fontFamilies.sansSemibold,
		fontSize: 15,
		color: colors.foreground,
		marginTop: 6,
		marginBottom: 6,
	},
	ctaBody: {
		fontFamily: fontFamilies.sans,
		fontSize: 13,
		color: colors.muted,
		lineHeight: 20,
		marginBottom: 14,
	},
	ctaButton: {
		width: '100%',
		minHeight: 44,
	},
	recentRow: {
		flexDirection: 'row',
		gap: 10,
		paddingTop: 10,
		paddingBottom: 4,
		paddingRight: spacing.screenX,
	},
});
