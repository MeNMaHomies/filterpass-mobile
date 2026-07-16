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
import { useHistorySessions } from '../hooks/useHistorySessions';
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
	const scrollProps = useScrollScreenProps();
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

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		const base = q
			? sessions.filter((s) => s.id.toLowerCase().includes(q))
			: sessions;
		return [...base].sort((a, b) => b.sortTs - a.sortTs);
	}, [sessions, query]);

	const spoofCount = useMemo(
		() => sessions.filter((s) => s.label === 'SPOOF').length,
		[sessions],
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

	const renderItem = useCallback(({ item }: { item: ListItem }) => {
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
			/>
		);
	}, []);

	const keyExtractor = useCallback((item: ListItem) => item.key, []);

	const openLive = useCallback(() => {
		router.push('/live' as Href);
	}, [router]);

	const listHeader = useMemo(
		() => (
			<View style={styles.header}>
				{sessions.length > 0 ? (
					<View style={styles.summary}>
						<Eyebrow>Overview</Eyebrow>
						<Text style={styles.summaryText}>
							{sessions.length} session{sessions.length === 1 ? '' : 's'}
							{' · '}
							{spoofCount} spoof
							{sessions[0] ? ` · last ${sessions[0].ago}` : ''}
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

				{loading && sessions.length === 0 ? <ScreenLoader /> : null}

				{error ? <ErrorBanner message={error} onRetry={refresh} /> : null}

				{!loading && !error && filtered.length === 0 ? (
					<EmptyState
						title={query.trim() ? 'No matches' : 'No sessions found'}
						description={
							query.trim()
								? 'Try a different session id.'
								: 'Completed live sessions will appear here.'
						}
						actionLabel={query.trim() ? undefined : 'Start live session'}
						onAction={query.trim() ? undefined : openLive}
					/>
				) : null}
			</View>
		),
		[
			sessions,
			spoofCount,
			query,
			loading,
			error,
			filtered.length,
			refresh,
			openLive,
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
				onEndReached={query.trim() ? undefined : loadMore}
				onEndReachedThreshold={0.4}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={styles.listContent}
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
		marginBottom: 14,
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
