import { memo, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { MotiEnter, PressableScale, StatusBadge } from '@/components';
import type { HistorySession, SessionLabel } from '@/types';
import { shortSessionId } from '@/lib/formatSession';
import { scoreColor } from '@/lib/scoreColor';
import { colors, radius } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';

type HistorySessionRowProps = {
	id: string;
	label: HistorySession['label'];
	score: number;
	ago: string;
	duration: string;
	index?: number;
};

function railColor(label: SessionLabel): string {
	return label === 'SPOOF' ? colors.destructive : colors.accent;
}

export const HistorySessionRow = memo(function HistorySessionRow({
	id,
	label,
	score,
	ago,
	duration,
	index = 0,
}: HistorySessionRowProps) {
	const router = useRouter();
	const displayId = shortSessionId(id);
	const color = scoreColor(score);
	const fillPct = Math.min(1, Math.max(0, score));

	const onPress = useCallback(() => {
		router.push(`/history/${id}` as Href);
	}, [router, id]);

	return (
		<MotiEnter index={index}>
			<PressableScale
				onPress={onPress}
				accessibilityRole="button"
				accessibilityLabel={`Session ${displayId}, ${label}, score ${score.toFixed(2)}, ${ago}`}
				accessibilityHint="Opens the session report"
				scaleTo={0.985}
			>
				<View
					style={[styles.row, label === 'SPOOF' && styles.rowSpoof]}
				>
					<View
						style={[styles.rail, { backgroundColor: railColor(label) }]}
					/>
					<View style={styles.body}>
						<View style={styles.top}>
							<View style={styles.scoreBlock}>
								<Text style={[styles.score, { color }]}>
									{score.toFixed(2)}
								</Text>
								<View style={styles.barTrack}>
									<View
										style={[
											styles.barFill,
											{
												transform: [{ scaleX: fillPct }],
												backgroundColor: color,
											},
										]}
									/>
								</View>
							</View>
							<StatusBadge label={label} variant={label} />
						</View>
						<Text style={styles.meta}>
							{displayId} · {ago} · {duration}
						</Text>
					</View>
				</View>
			</PressableScale>
		</MotiEnter>
	);
});

const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		backgroundColor: colors.card,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.card,
		borderCurve: 'continuous',
		overflow: 'hidden',
		marginBottom: 8,
		minHeight: 76,
	},
	rowSpoof: {
		backgroundColor: colors.destructiveSoft,
		borderColor: 'rgba(239,68,68,0.28)',
	},
	rail: {
		width: 3,
	},
	body: {
		flex: 1,
		paddingHorizontal: 14,
		paddingVertical: 12,
		gap: 8,
	},
	top: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		gap: 12,
	},
	scoreBlock: {
		flex: 1,
		gap: 6,
	},
	score: {
		fontFamily: fontFamilies.monoSemibold,
		fontSize: 24,
		letterSpacing: -0.5,
	},
	barTrack: {
		height: 3,
		borderRadius: 99,
		backgroundColor: colors.border,
		overflow: 'hidden',
		maxWidth: 120,
	},
	barFill: {
		height: '100%',
		width: '100%',
		borderRadius: 99,
		transformOrigin: 'left center',
	},
	meta: {
		fontFamily: fontFamilies.mono,
		fontSize: 11,
		color: colors.muted2,
	},
});
