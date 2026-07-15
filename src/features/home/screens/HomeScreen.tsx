import { ScrollView, View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Button, Card, Eyebrow, StatusBadge } from '@/components';
import { KpiGrid } from '../components/KpiGrid';
import { useHomeOverview } from '../hooks/useHomeOverview';
import { scoreColor } from '@/lib/scoreColor';
import { colors, spacing } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';

export function HomeScreen() {
	const router = useRouter();
	const { kpis, recentSessions, loading, error, refresh } = useHomeOverview();

	return (
		<ScrollView
			contentContainerStyle={styles.scroll}
			showsVerticalScrollIndicator={false}
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
					onPress={() => router.push('/live' as Href)}
				/>
			</Card>

			<Eyebrow>Recent sessions</Eyebrow>
			{recentSessions.length === 0 && !loading ? (
				<Text style={styles.empty}>No sessions yet</Text>
			) : (
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.recentRow}
				>
					{recentSessions.map((s) => (
						<Pressable
							key={s.sessionId}
							onPress={() =>
								router.push(`/history/${s.sessionId}` as Href)
							}
						>
							<Card style={styles.recentCard}>
								<Text style={styles.recentId}>{s.id}</Text>
								<Text
									style={[
										styles.recentScore,
										{ color: scoreColor(s.score) },
									]}
								>
									{s.score.toFixed(2)}
								</Text>
								<StatusBadge label={s.label} variant={s.label} />
							</Card>
						</Pressable>
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
		paddingBottom: spacing.contentBottom,
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
		gap: 10,
		paddingTop: 10,
		paddingBottom: 4,
	},
	recentCard: {
		minWidth: 128,
		padding: 12,
	},
	recentId: {
		fontFamily: fontFamilies.mono,
		fontSize: 10,
		color: colors.muted2,
		marginBottom: 8,
	},
	recentScore: {
		fontFamily: fontFamilies.monoSemibold,
		fontSize: 20,
		marginBottom: 8,
	},
});
