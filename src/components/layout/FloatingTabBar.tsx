import { useCallback } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs/types';
import { Home, Mic, History, Settings } from 'lucide-react-native';
import { colors, radius, spacing } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';

type TabRoute = BottomTabBarProps['state']['routes'][number];

const TAB_ICONS = {
	index: Home,
	live: Mic,
	history: History,
	settings: Settings,
} as const;

const TAB_LABELS: Record<string, string> = {
	index: 'Home',
	live: 'Live',
	history: 'History',
	settings: 'Settings',
};

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
	const insets = useSafeAreaInsets();

	const navigateTo = useCallback(
		(route: TabRoute, isFocused: boolean) => {
			const event = navigation.emit({
				type: 'tabPress',
				target: route.key,
				canPreventDefault: true,
			});
			if (!isFocused && !event.defaultPrevented) {
				navigation.navigate(route.name, route.params);
			}
		},
		[navigation],
	);

	return (
		<View
			style={[
				styles.outer,
				{ paddingBottom: Math.max(insets.bottom, spacing.tabBarBottom) },
			]}
		>
			<View style={styles.pill}>
				{state.routes.map((route: TabRoute, index: number) => {
					const isFocused = state.index === index;
					const Icon =
						TAB_ICONS[route.name as keyof typeof TAB_ICONS] ?? Home;
					const label = TAB_LABELS[route.name] ?? route.name;

					return (
						<Pressable
							key={route.key}
							onPress={() => navigateTo(route, isFocused)}
							style={[styles.tab, isFocused ? styles.tabActive : null]}
							accessibilityRole="button"
							accessibilityState={isFocused ? { selected: true } : {}}
							accessibilityLabel={label}
						>
							<Icon
								size={20}
								color={isFocused ? colors.primary : colors.muted2}
								strokeWidth={1.75}
							/>
							<Text
								style={[
									styles.tabLabel,
									isFocused ? styles.tabLabelActive : null,
								]}
							>
								{label}
							</Text>
							{route.name === 'live' && isFocused ? (
								<View style={styles.liveIndicator} />
							) : null}
						</Pressable>
					);
				})}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	outer: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
		paddingHorizontal: 12,
	},
	pill: {
		flexDirection: 'row',
		padding: 6,
		borderRadius: radius.nav,
		borderCurve: 'continuous',
		backgroundColor: colors.navBg,
		borderWidth: 1,
		borderColor: colors.navBorder,
		boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
	},
	tab: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 4,
		paddingVertical: 8,
		borderRadius: radius.navItem,
		borderCurve: 'continuous',
		position: 'relative',
	},
	tabActive: {
		backgroundColor: colors.tabActive,
	},
	tabLabel: {
		fontFamily: fontFamilies.sansMedium,
		fontSize: 10,
		color: colors.muted2,
	},
	tabLabelActive: {
		color: colors.primary,
		fontFamily: fontFamilies.sansSemibold,
	},
	liveIndicator: {
		position: 'absolute',
		top: 6,
		right: '28%',
		width: 6,
		height: 6,
		borderRadius: 3,
		borderCurve: 'continuous',
		backgroundColor: colors.accent,
	},
});
