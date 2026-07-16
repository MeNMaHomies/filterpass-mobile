import { memo, useCallback } from 'react';
import { Text, StyleSheet } from 'react-native';
import { Card, PressableScale, StatusBadge } from '@/components';
import type { RecentSession } from '@/types';
import { scoreColor } from '@/lib/scoreColor';
import { colors } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';

type RecentSessionCardProps = {
	session: RecentSession;
	onPress: (sessionId: string) => void;
};

export const RecentSessionCard = memo(function RecentSessionCard({
	session,
	onPress,
}: RecentSessionCardProps) {
	const handlePress = useCallback(() => {
		onPress(session.sessionId);
	}, [onPress, session.sessionId]);

	return (
		<PressableScale
			onPress={handlePress}
			accessibilityRole="button"
			accessibilityLabel={`Open session ${session.id}, score ${session.score.toFixed(2)}, ${session.label}`}
			scaleTo={0.97}
		>
			<Card style={styles.recentCard}>
				<Text style={styles.recentId}>{session.id}</Text>
				<Text
					style={[styles.recentScore, { color: scoreColor(session.score) }]}
				>
					{session.score.toFixed(2)}
				</Text>
				<StatusBadge label={session.label} variant={session.label} />
			</Card>
		</PressableScale>
	);
});

const styles = StyleSheet.create({
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
