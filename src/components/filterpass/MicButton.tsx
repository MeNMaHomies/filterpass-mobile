import { Pressable, StyleSheet } from 'react-native';
import { Mic } from 'lucide-react-native';
import { colors } from '@/theme/tokens';

type MicButtonProps = {
  onPress?: () => void;
};

export function MicButton({ onPress }: MicButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel="Start listening"
    >
      <Mic size={28} color={colors.primary} strokeWidth={1.75} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primarySoft,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
