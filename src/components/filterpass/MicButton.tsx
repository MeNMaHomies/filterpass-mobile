import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Mic } from 'lucide-react-native';
import { colors } from '@/theme/tokens';

type MicButtonProps = {
  onPress?: () => void;
};

export function MicButton({ onPress }: MicButtonProps) {
  const scale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.35);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.35, { duration: 2000 }),
      -1,
      false,
    );
    ringOpacity.value = withRepeat(
      withTiming(0, { duration: 2000 }),
      -1,
      false,
    );
  }, [ringOpacity, scale]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: ringOpacity.value,
  }));

  return (
    <Pressable onPress={onPress} style={styles.wrap}>
      <Animated.View
        style={[styles.ring, ringStyle]}
      />
      <Pressable
        onPress={onPress}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel="Start listening"
      >
        <Mic size={28} color={colors.primary} strokeWidth={1.75} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  button: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primarySoft,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 6,
  },
});
