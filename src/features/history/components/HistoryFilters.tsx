import { ScrollView, Text, StyleSheet, View } from 'react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import type { SessionLabel } from '@/types';
import { colors, radius } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';

export type LabelFilter = 'all' | SessionLabel;
export type DateFilter = 'all' | 'today' | '7d' | '30d';

type ChipTone = 'neutral' | 'real' | 'uncertain' | 'spoof';

type ChipDef<T extends string> = {
	value: T;
	label: string;
	tone?: ChipTone;
};

const LABEL_CHIPS: ChipDef<LabelFilter>[] = [
	{ value: 'all', label: 'All' },
	{ value: 'REAL', label: 'Real', tone: 'real' },
	{ value: 'UNCERTAIN', label: 'Uncertain', tone: 'uncertain' },
	{ value: 'SPOOF', label: 'Spoof', tone: 'spoof' },
];

const DATE_CHIPS: ChipDef<DateFilter>[] = [
	{ value: 'all', label: 'All time' },
	{ value: 'today', label: 'Today' },
	{ value: '7d', label: '7 days' },
	{ value: '30d', label: '30 days' },
];

const TONE: Record<
	ChipTone,
	{ bg: string; border: string; color: string; activeBg: string; activeBorder: string }
> = {
	neutral: {
		bg: 'rgba(255,255,255,0.03)',
		border: colors.border,
		color: colors.muted,
		activeBg: colors.primarySoft,
		activeBorder: 'rgba(59,130,246,0.45)',
	},
	real: {
		bg: 'rgba(255,255,255,0.03)',
		border: colors.border,
		color: colors.muted,
		activeBg: colors.accentSoft,
		activeBorder: colors.accent,
	},
	uncertain: {
		bg: 'rgba(255,255,255,0.03)',
		border: colors.border,
		color: colors.muted,
		activeBg: colors.amberSoft,
		activeBorder: colors.amber,
	},
	spoof: {
		bg: 'rgba(255,255,255,0.03)',
		border: colors.border,
		color: colors.muted,
		activeBg: colors.destructiveSoft,
		activeBorder: colors.destructive,
	},
};

type HistoryFiltersProps = {
	labelFilter: LabelFilter;
	dateFilter: DateFilter;
	onLabelChange: (value: LabelFilter) => void;
	onDateChange: (value: DateFilter) => void;
};

function ChipRow<T extends string>({
	chips,
	value,
	onChange,
	accessibilityLabel,
}: {
	chips: ChipDef<T>[];
	value: T;
	onChange: (value: T) => void;
	accessibilityLabel: string;
}) {
	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={styles.row}
			accessibilityRole="tablist"
			accessibilityLabel={accessibilityLabel}
		>
			{chips.map((chip) => {
				const active = chip.value === value;
				const tone = TONE[chip.tone ?? 'neutral'];
				return (
					<PressableScale
						key={chip.value}
						onPress={() => onChange(chip.value)}
						style={[
							styles.chip,
							{
								backgroundColor: active ? tone.activeBg : tone.bg,
								borderColor: active ? tone.activeBorder : tone.border,
							},
						]}
						accessibilityRole="tab"
						accessibilityState={{ selected: active }}
						accessibilityLabel={chip.label}
						scaleTo={0.96}
					>
						<Text
							style={[
								styles.chipLabel,
								{
									color: active
										? chip.tone === 'real'
											? colors.accent
											: chip.tone === 'uncertain'
												? colors.amber
												: chip.tone === 'spoof'
													? colors.destructive
													: colors.primary
										: tone.color,
								},
							]}
						>
							{chip.label}
						</Text>
					</PressableScale>
				);
			})}
		</ScrollView>
	);
}

export function HistoryFilters({
	labelFilter,
	dateFilter,
	onLabelChange,
	onDateChange,
}: HistoryFiltersProps) {
	return (
		<View style={styles.wrap}>
			<ChipRow
				chips={LABEL_CHIPS}
				value={labelFilter}
				onChange={onLabelChange}
				accessibilityLabel="Filter by label"
			/>
			<ChipRow
				chips={DATE_CHIPS}
				value={dateFilter}
				onChange={onDateChange}
				accessibilityLabel="Filter by date"
			/>
		</View>
	);
}

/** True when any non-default filter is active (including search). */
export function hasActiveHistoryFilters(
	labelFilter: LabelFilter,
	dateFilter: DateFilter,
	query: string,
): boolean {
	return (
		labelFilter !== 'all' ||
		dateFilter !== 'all' ||
		query.trim().length > 0
	);
}

export function sessionMatchesDateFilter(
	sortTs: number,
	dateFilter: DateFilter,
	nowMs = Date.now(),
): boolean {
	if (dateFilter === 'all') return true;

	const date = new Date(sortTs * 1000);
	const now = new Date(nowMs);

	if (dateFilter === 'today') {
		return (
			date.getFullYear() === now.getFullYear() &&
			date.getMonth() === now.getMonth() &&
			date.getDate() === now.getDate()
		);
	}

	const windowMs =
		dateFilter === '7d' ? 7 * 86_400_000 : 30 * 86_400_000;
	return sortTs * 1000 >= nowMs - windowMs;
}

const styles = StyleSheet.create({
	wrap: {
		gap: 8,
		marginBottom: 14,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingRight: 4,
	},
	chip: {
		minHeight: 32,
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: radius.pill,
		borderCurve: 'continuous',
		borderWidth: 1,
		justifyContent: 'center',
	},
	chipLabel: {
		fontFamily: fontFamilies.sansSemibold,
		fontSize: 12,
	},
});
