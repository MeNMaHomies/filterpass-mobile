import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
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

  return (
    <View style={[styles.outer, { paddingBottom: Math.max(insets.bottom, spacing.tabBarBottom) }]}>
      <View style={styles.pill}>
        {state.routes.map((route: TabRoute, index: number) => {
          const isFocused = state.index === index;
          const Icon = TAB_ICONS[route.name as keyof typeof TAB_ICONS] ?? Home;
          const label = TAB_LABELS[route.name] ?? route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={[styles.tab, isFocused && styles.tabActive]}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={label}
            >
              <Icon
                size={20}
                color={isFocused ? colors.primary : colors.muted2}
                strokeWidth={1.75}
              />
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
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
    backgroundColor: colors.navBg,
    borderWidth: 1,
    borderColor: colors.navBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: radius.navItem,
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
    backgroundColor: colors.accent,
  },
});
