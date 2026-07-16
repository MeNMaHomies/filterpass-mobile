import { useCallback, useMemo, useState } from 'react';
import {
	View,
	Text,
	TextInput,
	StyleSheet,
	RefreshControl,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter, type Href } from 'expo-router';
import { Search } from 'lucide-react-native';
import { EmptyState, ErrorBanner, Eyebrow, ScreenLoader } from '@/components';
import { HistorySessionRow } from '../components/HistorySessionRow';
import {
	HistoryFilters,
	hasActiveHistoryFilters,
	sessionMatchesDateFilter,
	type DateFilter,
	type LabelFilter,
} from '../components/HistoryFilters';
import { useHistorySessions } from '../hooks/useHistorySessions';
import { useBackendHealth } from '@/features/health';
import { useScrollScreenProps } from '@/hooks/useScrollScreenProps';
import {
	daySectionKey,
	formatDaySectionLabel,
} from '@/lib/formatSession';
import type { HistorySession } from '@/types';
import { colors, spacing } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';

type DayHeaderItem = {
	kind: 'header';
	key: string;
	title: string;
};

type SessionItem = {
	kind: 'session';
	key: string;
	session: HistorySession;
};

type ListItem = DayHeaderItem | SessionItem;

export function HistoryScreen() {
	const router = useRouter();
	const { bottomPadding, ...scrollProps } = useScrollScreenProps();
	const { error: backendError } = useBackendHealth();
	const {
		sessions,
		loading,
		refreshing,
		loadingMore,
		error,
		refresh,
		loadMore,
	} = useHistorySessions();
	const [query, setQuery] = useState('');
	const [labelFilter, setLabelFilter] = useState<LabelFilter>('all');
	const [dateFilter, setDateFilter] = useState<DateFilter>('all');

	const filtersActive = hasActiveHistoryFilters(labelFilter, dateFilter, query);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		const base = sessions.filter((s) => {
			if (q && !s.id.toLowerCase().includes(q)) return false;
			if (labelFilter !== 'all' && s.label !== labelFilter) return false;
			if (!sessionMatchesDateFilter(s.sortTs, dateFilter)) return false;
			return true;
		});
		return [...base].sort((a, b) => b.sortTs - a.sortTs);
	}, [sessions, query, labelFilter, dateFilter]);

	const spoofCount = useMemo(
		() => filtered.filter((s) => s.label === 'SPOOF').length,
		[filtered],
	);

	const listItems = useMemo(() => {
		const items: ListItem[] = [];
		let lastKey = '';
		for (const session of filtered) {
			const key = daySectionKey(session.sortTs);
			if (key !== lastKey) {
				items.push({
					kind: 'header',
					key: `h-${key}`,
					title: formatDaySectionLabel(session.sortTs),
				});
				lastKey = key;
			}
			items.push({
				kind: 'session',
				key: session.id,
				session,
			});
		}
		return items;
	}, [filtered]);

	const stickyHeaderIndices = useMemo(
		() =>
			listItems
				.map((item, index) => (item.kind === 'header' ? index : -1))
				.filter((index) => index >= 0),
		[listItems],
	);

	const renderItem = useCallback(
		({ item, index }: { item: ListItem; index: number }) => {
			if (item.kind === 'header') {
				return (
					<View style={styles.sectionHeader}>
						<Text style={styles.sectionTitle}>{item.title}</Text>
					</View>
				);
			}
			const s = item.session;
			return (
				<HistorySessionRow
					id={s.id}
					label={s.label}
					score={s.score}
					ago={s.ago}
					duration={s.duration}
					index={index}
				/>
			);
		},
		[],
	);

	const keyExtractor = useCallback((item: ListItem) => item.key, []);

	const openLive = useCallback(() => {
		router.push('/live' as Href);
	}, [router]);

	const clearFilters = useCallback(() => {
		setQuery('');
		setLabelFilter('all');
		setDateFilter('all');
	}, []);

	const emptyTitle = filtersActive ? 'No matches' : 'No sessions found';
	const emptyDescription = filtersActive
		? 'Try clearing search or filters.'
		: 'Completed live sessions will appear here.';

	const listHeader = useMemo(
		() => (
			<View style={styles.header}>
				{sessions.length > 0 ? (
					<View style={styles.summary}>
						<Eyebrow>Overview</Eyebrow>
						<Text style={styles.summaryText}>
							{filtersActive
								? `${filtered.length} of ${sessions.length} session${sessions.length === 1 ? '' : 's'}`
								: `${sessions.length} session${sessions.length === 1 ? '' : 's'}`}
							{' · '}
							{spoofCount} spoof
							{!filtersActive && sessions[0]
								? ` · last ${sessions[0].ago}`
								: ''}
						</Text>
					</View>
				) : null}

				<View style={styles.searchWrap}>
					<View style={styles.searchIcon}>
						<Search size={16} color={colors.muted2} strokeWidth={2} />
					</View>
					<TextInput
						placeholder="Search session id…"
						placeholderTextColor={colors.muted2}
						style={styles.search}
						value={query}
						onChangeText={setQuery}
						accessibilityLabel="Search sessions"
						autoCapitalize="none"
						autoCorrect={false}
					/>
				</View>

				{sessions.length > 0 || filtersActive ? (
					<HistoryFilters
						labelFilter={labelFilter}
						dateFilter={dateFilter}
						onLabelChange={setLabelFilter}
						onDateChange={setDateFilter}
					/>
				) : null}

				{loading && sessions.length === 0 ? <ScreenLoader /> : null}

				{error && !backendError ? (
					<ErrorBanner message={error} onRetry={refresh} />
				) : null}

				{!loading && !error && filtered.length === 0 ? (
					<EmptyState
						title={emptyTitle}
						description={emptyDescription}
						actionLabel={
							filtersActive
								? 'Clear filters'
								: 'Start live session'
						}
						onAction={filtersActive ? clearFilters : openLive}
					/>
				) : null}
			</View>
		),
		[
			sessions,
			filtered.length,
			spoofCount,
			query,
			labelFilter,
			dateFilter,
			filtersActive,
			loading,
			error,
			backendError,
			emptyTitle,
			emptyDescription,
			refresh,
			openLive,
			clearFilters,
		],
	);

	const listFooter = useMemo(() => {
		if (!loadingMore) return null;
		return <ScreenLoader label="Loading more sessions" />;
	}, [loadingMore]);

	return (
		<View style={styles.list}>
			<FlashList
				data={listItems}
				renderItem={renderItem}
				keyExtractor={keyExtractor}
				ListHeaderComponent={listHeader}
				ListFooterComponent={listFooter}
				stickyHeaderIndices={stickyHeaderIndices}
				getItemType={(item) => item.kind}
				onEndReached={filtersActive ? undefined : loadMore}
				onEndReachedThreshold={0.4}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={[styles.listContent, { paddingBottom: bottomPadding }]}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={refresh}
						tintColor={colors.primary}
					/>
				}
				{...scrollProps}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	list: {
		flex: 1,
	},
	listContent: {
		paddingHorizontal: spacing.screenX,
		paddingTop: 12,
	},
	header: {
		marginBottom: 4,
	},
	summary: {
		marginBottom: 14,
		gap: 6,
	},
	summaryText: {
		fontFamily: fontFamilies.sans,
		fontSize: 13,
		color: colors.muted,
		lineHeight: 18,
	},
	searchWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: colors.card2,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: 12,
		borderCurve: 'continuous',
		paddingHorizontal: 12,
		minHeight: 48,
		marginBottom: 10,
	},
	searchIcon: {
		marginRight: 8,
	},
	search: {
		flex: 1,
		paddingVertical: 12,
		color: colors.foreground,
		fontFamily: fontFamilies.sans,
		fontSize: 14,
	},
	sectionHeader: {
		backgroundColor: colors.background,
		paddingTop: 10,
		paddingBottom: 8,
	},
	sectionTitle: {
		fontFamily: fontFamilies.sansSemibold,
		fontSize: 12,
		color: colors.muted,
		letterSpacing: 0.4,
		textTransform: 'uppercase',
	},
});
