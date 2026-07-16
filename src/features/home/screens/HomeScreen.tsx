import { useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Button, Card, Eyebrow } from '@/components';
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
			{...scrollProps}
		>
			{loading && kpis.length === 0 ? (
				<ActivityIndicator color={colors.primary} style={styles.loader} />
			) : null}

			{error ? (
				<Card style={styles.errorCard}>
					<Text style={styles.errorText}>{error}</Text>
					<Button variant="ghost" label="Retry" onPress={refresh} />
				</Card>
			) : null}

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
				<Text style={styles.empty}>No sessions yet</Text>
			) : (
				<View style={styles.recentRow}>
					{recentSessions.map((s) => (
						<RecentSessionCard
							key={s.sessionId}
							session={s}
							onPress={openSession}
						/>
					))}
				</View>
			)}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	scroll: {
		paddingHorizontal: spacing.screenX,
		paddingTop: spacing.screenY,
	},
	loader: {
		marginBottom: 14,
	},
	errorCard: {
		padding: 14,
		marginBottom: 14,
		gap: 10,
	},
	errorText: {
		fontFamily: fontFamilies.sans,
		fontSize: 13,
		color: colors.destructive,
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
		height: 40,
	},
	empty: {
		fontFamily: fontFamilies.sans,
		fontSize: 13,
		color: colors.muted2,
		paddingTop: 10,
	},
	recentRow: {
		flexDirection: 'row',
		gap: 10,
		paddingTop: 10,
		paddingBottom: 4,
	},
});
