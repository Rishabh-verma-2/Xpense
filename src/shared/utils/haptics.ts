import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Universal safe haptic feedback utility.
 * Works natively on iOS & Android via expo-haptics.
 * Falls back safely to navigator.vibrate on mobile Web / PWA.
 * Fails silently on desktop browsers.
 */

// Light impact (for numpad typing, category select, calendar day pick)
export async function hapticLight(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(10);
      }
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Ignore errors on unsupported devices
  }
}

// Medium impact (for Expense <-> Income switch, preset amount chips, bottom tab bar switch)
export async function hapticMedium(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(20);
      }
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // Ignore errors on unsupported devices
  }
}

// Heavy impact (for delete, clear all, major destructive actions)
export async function hapticHeavy(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(35);
      }
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch {
    // Ignore errors on unsupported devices
  }
}

// Subtle selection tick (for toggles, filters, chips)
export async function hapticSelection(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(8);
      }
      return;
    }
    await Haptics.selectionAsync();
  } catch {
    // Ignore errors on unsupported devices
  }
}

// Double pulse confirmation (for successful save, export completion)
export async function hapticSuccess(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate([15, 40, 15]);
      }
      return;
    }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Ignore errors on unsupported devices
  }
}

// Double buzz error (for validation failure, errors)
export async function hapticError(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate([30, 40, 30]);
      }
      return;
    }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    // Ignore errors on unsupported devices
  }
}
