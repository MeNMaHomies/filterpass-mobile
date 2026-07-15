import { View, Text, StyleSheet } from 'react-native';
import { Card } from './Card';
import { Eyebrow } from './Eyebrow';
import { LiveDot } from './LiveDot';
import type { KpiItem } from '@/mocks/kpis';
import { colors } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';

type KpiGridProps = {
	items: KpiItem[];
};

export function KpiGrid({ items }: KpiGridProps) {
	return (
		<Card style={styles.card}>
			<View style={styles.grid}>
				{items.map((k, i) => (
					<View
						key={k.label}
						style={[
							styles.cell,
							i % 2 === 0 && styles.cellRightBorder,
							i < 2 && styles.cellBottomBorder,
						]}
					>
						<Eyebrow>{k.label}</Eyebrow>
						<View style={styles.valueRow}>
							{k.live ? <LiveDot /> : null}
							<Text style={styles.value}>{k.value}</Text>
						</View>
					</View>
				))}
			</View>
		</Card>
	);
}

const styles = StyleSheet.create({
	card: {
		padding: 0,
		overflow: 'hidden',
		marginBottom: 14,
	},
	grid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
	},
	cell: {
		width: '50%',
		paddingHorizontal: 14,
		paddingVertical: 12,
	},
	cellRightBorder: {
		borderRightWidth: 1,
		borderRightColor: colors.border,
	},
	cellBottomBorder: {
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
	},
	valueRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		marginTop: 4,
	},
	value: {
		fontFamily: fontFamilies.monoSemibold,
		fontSize: 19,
		fontWeight: '600',
		color: colors.foreground,
	},
});
