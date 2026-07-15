import { Text, StyleSheet } from 'react-native';
import { colors, radius } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';

export type StatusVariant = 'REAL' | 'SPOOF' | 'WARMUP' | 'IDLE';

type StatusBadgeProps = {
  label: string;
  variant: StatusVariant;
};

const variantStyles: Record<
  StatusVariant,
  { bg: string; border: string; color: string }
> = {
  REAL: { bg: colors.accentSoft, border: colors.accent, color: colors.accent },
  SPOOF: {
    bg: colors.destructiveSoft,
    border: colors.destructive,
    color: colors.destructive,
  },
  WARMUP: { bg: colors.amberSoft, border: colors.amber, color: colors.amber },
  IDLE: {
    bg: 'rgba(255,255,255,0.03)',
    border: colors.border,
    color: colors.muted,
  },
};

export function StatusBadge({ label, variant }: StatusBadgeProps) {
  const s = variantStyles[variant];
  return (
    <Text
      style={[
        styles.badge,
        { backgroundColor: s.bg, borderColor: s.border, color: s.color },
      ]}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    fontFamily: fontFamilies.sansBold,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    overflow: 'hidden',
  },
});
