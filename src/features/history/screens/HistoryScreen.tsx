import { useCallback, useMemo, useState } from 'react';
import {
	View,
	Text,
	TextInput,
	Pressable,
	StyleSheet,
	ActivityIndicator,
	RefreshControl,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { RefreshCw } from 'lucide-react-native';
import { HistorySessionRow } from '../components/HistorySessionRow';
import { useHistorySessions } from '../hooks/useHistorySessions';
import { useScrollScreenProps } from '@/hooks/useScrollScreenProps';
import type { HistorySession } from '@/types';
import { colors, spacing } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';

export function HistoryScreen() {
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
		if (!q) return sessions;
		return sessions.filter((s) => s.id.toLowerCase().includes(q));
	}, [sessions, query]);

	const renderItem = useCallback(
		({ item }: { item: HistorySession }) => (
			<HistorySessionRow
				id={item.id}
				label={item.label}
				score={item.score}
				ago={item.ago}
				duration={item.duration}
			/>
		),
		[],
	);

	const keyExtractor = useCallback((item: HistorySession) => item.id, []);

	const listHeader = useMemo(
		() => (
			<View style={styles.header}>
				<View style={styles.searchRow}>
					<TextInput
						placeholder="Search session id…"
						placeholderTextColor={colors.muted2}
						style={styles.search}
						value={query}
						onChangeText={setQuery}
					/>
					<Pressable style={styles.refreshBtn} onPress={refresh}>
						<RefreshCw size={16} color={colors.muted} strokeWidth={2} />
					</Pressable>
				</View>

				{loading && sessions.length === 0 ? (
					<ActivityIndicator color={colors.primary} />
				) : null}

				{error ? <Text style={styles.error}>{error}</Text> : null}

				{!loading && filtered.length === 0 ? (
					<Text style={styles.empty}>No sessions found</Text>
				) : null}
			</View>
		),
		[query, loading, sessions.length, error, filtered.length, refresh],
	);

	const listFooter = useMemo(() => {
		if (!loadingMore) return null;
		return (
			<ActivityIndicator
				color={colors.primary}
				style={styles.footerLoader}
			/>
		);
	}, [loadingMore]);

	return (
		<View style={styles.list}>
			<FlashList
				data={filtered}
				renderItem={renderItem}
				keyExtractor={keyExtractor}
				ListHeaderComponent={listHeader}
				ListFooterComponent={listFooter}
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
		borderCurve: 'continuous',
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
		borderCurve: 'continuous',
		backgroundColor: 'rgba(255,255,255,0.03)',
		borderWidth: 1,
		borderColor: colors.border,
		alignItems: 'center',
		justifyContent: 'center',
	},
	error: {
		fontFamily: fontFamilies.sans,
		fontSize: 13,
		color: colors.destructive,
		marginBottom: 12,
	},
	empty: {
		fontFamily: fontFamilies.sans,
		fontSize: 13,
		color: colors.muted2,
		marginBottom: 8,
	},
	footerLoader: {
		marginVertical: 16,
	},
});
