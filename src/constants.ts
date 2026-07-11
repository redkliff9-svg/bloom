import { Platform } from 'react-native';

export const BG    = '#EAE4DB';  // warm cream
export const DARK  = '#2A2018';  // warm charcoal
export const PINK  = '#8B6BA0';  // dusty mauve
export const MUTED = '#96897F';  // warm mid-grey
export const WHITE = '#FFFFFF';
export const CARD  = '#FFFFFF';
export const LAVENDER = '#D4BFEA';  // soft lavender for accents

// Serif heading font — Georgia on iOS/web, system serif on Android
export const SERIF: string = Platform.select({
  ios:     'Georgia',
  android: 'serif',
  default: 'Georgia',
}) ?? 'Georgia';

export const PAIN_COLORS = [
  '#4DB880', '#4DB880', '#4DB880',   // 1-3 mild     → green
  '#D4915A', '#D4915A', '#D4915A',   // 4-6 moderate → warm amber
  '#C4604A', '#C4604A',              // 7-8 severe   → terracotta
  '#A03050', '#A03050',              // 9-10 v.severe → deep rose
] as const;

export function painColor(level: number): string {
  return PAIN_COLORS[Math.max(0, Math.min(9, level - 1))];
}

export function painLabelKey(level: number): string {
  if (level <= 3) return 'mild';
  if (level <= 6) return 'moderate';
  if (level <= 8) return 'severe';
  return 'very_severe';
}

export const CARD_SHADOW = {
  elevation: 2,
  shadowColor: '#6B4F3A',
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 3 },
} as const;
