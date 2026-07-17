import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
	Geist_400Regular,
	Geist_500Medium,
	Geist_600SemiBold,
	Geist_700Bold,
} from '@expo-google-fonts/geist';
import {
	GeistMono_400Regular,
	GeistMono_500Medium,
	GeistMono_600SemiBold,
} from '@expo-google-fonts/geist-mono';
import { colors } from '@/theme/tokens';
import { BackendHealthProvider } from '@/features/health';
import {
	queryClient,
	setupReactQueryNative,
	useReactQueryAppFocus,
} from '@/queries';

SplashScreen.preventAutoHideAsync();
setupReactQueryNative();

export default function RootLayout() {
	const [fontsLoaded, fontError] = useFonts({
		Geist_400Regular,
		Geist_500Medium,
		Geist_600SemiBold,
		Geist_700Bold,
		GeistMono_400Regular,
		GeistMono_500Medium,
		GeistMono_600SemiBold,
	});

	useReactQueryAppFocus();

	useEffect(() => {
		if (fontsLoaded || fontError) {
			SplashScreen.hideAsync();
		}
	}, [fontsLoaded, fontError]);

	if (!fontsLoaded && !fontError) {
		return null;
	}

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SafeAreaProvider>
				<QueryClientProvider client={queryClient}>
					<BackendHealthProvider>
						<BottomSheetModalProvider>
							<StatusBar style="light" />
							<Stack
								screenOptions={{
									headerShown: false,
									contentStyle: { backgroundColor: colors.background },
								}}
							>
								<Stack.Screen name="(tabs)" />
							</Stack>
						</BottomSheetModalProvider>
					</BackendHealthProvider>
				</QueryClientProvider>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}
