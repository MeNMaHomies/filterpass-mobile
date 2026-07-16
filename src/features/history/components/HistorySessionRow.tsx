import { memo, useCallback } from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Card, StatusBadge } from '@/components';
import type { HistorySession } from '@/types';
import { shortSessionId } from '@/lib/formatSession';
import { scoreColor } from '@/lib/scoreColor';
import { colors } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';

type HistorySessionRowProps = {
	id: string;
	label: HistorySession['label'];
	score: number;
	ago: string;
	duration: string;
};

export const HistorySessionRow = memo(function HistorySessionRow({
	id,
	label,
	score,
	ago,
	duration,
}: HistorySessionRowProps) {
	const router = useRouter();
	const displayId = shortSessionId(id);
	const onPress = useCallback(() => {
		router.push(`/history/${id}` as Href);
	}, [router, id]);

	return (
		<Pressable
			onPress={onPress}
			accessibilityRole="button"
			accessibilityLabel={`Session ${displayId}, ${label}, score ${score.toFixed(2)}, ${ago}`}
			accessibilityHint="Opens the session report"
		>
			{({ pressed }) => (
				<Card style={[styles.row, pressed && styles.rowPressed]}>
					<View style={styles.rowTop}>
						<View>
							<Text style={styles.sessionId}>{displayId}</Text>
							<Text style={styles.meta}>
								{ago} · {duration}
							</Text>
						</View>
						<StatusBadge label={label} variant={label} />
					</View>
					<Text style={[styles.score, { color: scoreColor(score) }]}>
						{score.toFixed(2)}
					</Text>
				</Card>
			)}
		</Pressable>
	);
});

const styles = StyleSheet.create({
	row: {
		paddingHorizontal: 14,
		paddingVertical: 13,
		marginBottom: 8,
	},
	rowPressed: {
		opacity: 0.85,
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
