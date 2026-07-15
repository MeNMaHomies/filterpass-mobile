import { Stack } from 'expo-router';
import { colors } from '@/theme/tokens';

export default function HistoryLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    />
  );
}
