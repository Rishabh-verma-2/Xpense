import { Platform, StatusBar } from 'react-native';

interface Insets {
  top: number;
  bottom?: number;
  left?: number;
  right?: number;
}

/**
 * Returns a guaranteed safe top inset that accommodates
 * iOS notches, Dynamic Island, Android status bars (translucent/opaque),
 * and punch-hole camera cutouts with comfortable minimum padding.
 */
export function getSafeTopInset(insets: Insets): number {
  const androidStatusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0;
  return Math.max(insets?.top || 0, androidStatusBarHeight, Platform.OS === 'ios' ? 20 : 12);
}
