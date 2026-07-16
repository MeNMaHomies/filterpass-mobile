import { Tabs } from 'expo-router';
import { FloatingTabBar } from '@/components';
import { colors } from '@/theme/tokens';

export default function TabLayout() {
	return (
		<Tabs
			tabBar={(props) => <FloatingTabBar {...props} />}
			screenOptions={{
				headerShown: false,
				lazy: true,
				sceneStyle: { backgroundColor: colors.background },
			}}
		>
			<Tabs.Screen name="index" options={{ title: 'Home' }} />
			<Tabs.Screen name="live" options={{ title: 'Live' }} />
			<Tabs.Screen name="history" options={{ title: 'History' }} />
			<Tabs.Screen name="settings" options={{ title: 'Settings' }} />
		</Tabs>
	);
}
