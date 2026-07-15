import { colors } from '@/theme/tokens';

export const SCORE_GREEN = colors.accent;
export const SCORE_AMBER = colors.amber;
export const SCORE_RED = colors.destructive;

export function scoreColor(prob: number | null | undefined): string {
  if (prob === null || prob === undefined || Number.isNaN(prob)) {
    return colors.muted2;
  }
  if (prob < 0.4) return SCORE_GREEN;
  if (prob < 0.6) return SCORE_AMBER;
  return SCORE_RED;
}
