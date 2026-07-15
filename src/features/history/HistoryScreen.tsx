import {
	ScrollView,
	View,
	Text,
	TextInput,
	Pressable,
	StyleSheet,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { RefreshCw } from 'lucide-react-native';
import { Card, StatusBadge } from '@/components/filterpass';
import { historySessions } from '@/mocks/sessions';
import { scoreColor } from '@/lib/scoreColor';
import { colors, spacing } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';

export function HistoryScreen() {
	const router = useRouter();

	return (
		<ScrollView
			contentContainerStyle={styles.scroll}
			showsVerticalScrollIndicator={false}
		>
			<View style={styles.searchRow}>
				<TextInput
					placeholder="Search session id…"
					placeholderTextColor={colors.muted2}
					style={styles.search}
				/>
				<Pressable style={styles.refreshBtn}>
					<RefreshCw size={16} color={colors.muted} strokeWidth={2} />
				</Pressable>
			</View>

			{historySessions.map((s) => (
				<Pressable
					key={s.id}
					onPress={() => router.push(`/history/${s.id}` as Href)}
				>
					<Card style={styles.row}>
						<View style={styles.rowTop}>
							<View>
								<Text style={styles.sessionId}>{s.id}</Text>
								<Text style={styles.meta}>
									{s.ago} · {s.duration}
								</Text>
							</View>
							<StatusBadge label={s.label} variant={s.label} />
						</View>
						<Text style={[styles.score, { color: scoreColor(s.score) }]}>
							{s.score.toFixed(2)}
						</Text>
					</Card>
				</Pressable>
			))}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	scroll: {
		paddingHorizontal: spacing.screenX,
		paddingTop: 12,
		paddingBottom: spacing.contentBottom,
	},
	searchRow: {
		flexDirection: 'row',
		gap: 8,
		marginBottom: 14,
	},
	search: {
		flex: 1,
		backgroundColor: colors.secondary,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: 12,
		paddingHorizontal: 14,
		paddingVertical: 11,
		color: colors.foreground,
		fontFamily: fontFamilies.sans,
		fontSize: 14,
	},
	refreshBtn: {
		width: 44,
		height: 44,
		borderRadius: 10,
		backgroundColor: 'rgba(255,255,255,0.03)',
		borderWidth: 1,
		borderColor: colors.border,
		alignItems: 'center',
		justifyContent: 'center',
	},
	row: {
		paddingHorizontal: 14,
		paddingVertical: 13,
		marginBottom: 8,
	},
	rowTop: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
	},
	sessionId: {
		fontFamily: fontFamilies.mono,
		fontSize: 13,
		color: colors.foreground,
	},
	meta: {
		fontFamily: fontFamilies.sans,
		fontSize: 11,
		color: colors.muted2,
		marginTop: 3,
	},
	score: {
		fontFamily: fontFamilies.monoSemibold,
		fontSize: 20,
		marginTop: 8,
	},
});
