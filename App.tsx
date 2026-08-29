// Global TextDecoder polyfill for Hermes in React Native
if (typeof global !== 'undefined') {
  const NativeTextDecoder = (global as any).TextDecoder;
  if (NativeTextDecoder) {
    (global as any).TextDecoder = class CustomTextDecoder {
      private _native: any;
      public encoding: string;
      constructor(encoding = 'utf-8', options?: any) {
        const norm = (encoding || 'utf-8').toLowerCase().replace(/[^a-z0-9]/g, '');
        this.encoding = norm;
        try {
          this._native = new NativeTextDecoder(encoding, options);
        } catch {
          this._native = null;
        }
      }
      decode(input?: any, options?: any) {
        if (this._native) {
          try {
            return this._native.decode(input, options);
          } catch {
            // fallback below
          }
        }
        if (!input) return '';
        const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
        let str = '';
        for (let i = 0; i < bytes.length; i++) {
          str += String.fromCharCode(bytes[i]);
        }
        return str;
      }
    };
  }
}

import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, Platform } from 'react-native';
import { AppProviders } from './src/core/providers/AppProviders';
import RootNavigator from './src/core/navigation/RootNavigator';

export default function App() {
  // Prevent pinch-to-zoom on web/PWA/mobile browser platforms
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      // 1. Ensure viewport meta tag disables user scaling
      let meta = document.querySelector('meta[name="viewport"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'viewport');
        document.head.appendChild(meta);
      }
      meta.setAttribute(
        'content',
        'width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no'
      );

      // 2. Prevent Safari iOS gesture zoom
      const preventGesture = (e: any) => {
        if (e.preventDefault) e.preventDefault();
      };

      // 3. Prevent 2-finger pinch zoom
      const preventTouchZoom = (e: any) => {
        if (e.touches && e.touches.length > 1) {
          if (e.preventDefault) e.preventDefault();
        }
      };

      // 4. Prevent double-tap zoom
      let lastTouchTime = 0;
      const preventDoubleTapZoom = (e: any) => {
        const now = Date.now();
        if (now - lastTouchTime <= 300) {
          if (e.preventDefault) e.preventDefault();
        }
        lastTouchTime = now;
      };

      document.addEventListener('gesturestart', preventGesture, { passive: false });
      document.addEventListener('gesturechange', preventGesture, { passive: false });
      document.addEventListener('gestureend', preventGesture, { passive: false });
      document.addEventListener('touchstart', preventTouchZoom, { passive: false });
      document.addEventListener('touchmove', preventTouchZoom, { passive: false });
      document.addEventListener('touchend', preventDoubleTapZoom, { passive: false });

      // 5. CSS touch-action rules to block pinch zoom
      try {
        if (!document.getElementById('xpense-prevent-zoom-style')) {
          const style = document.createElement('style');
          style.id = 'xpense-prevent-zoom-style';
          style.textContent = `
            html, body, #root {
              touch-action: pan-x pan-y !important;
              -webkit-text-size-adjust: 100% !important;
            }
          `;
          document.head.appendChild(style);
        }
      } catch (_) {}

      return () => {
        document.removeEventListener('gesturestart', preventGesture);
        document.removeEventListener('gesturechange', preventGesture);
        document.removeEventListener('gestureend', preventGesture);
        document.removeEventListener('touchstart', preventTouchZoom);
        document.removeEventListener('touchmove', preventTouchZoom);
        document.removeEventListener('touchend', preventDoubleTapZoom);
      };
    }
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AppProviders>
          <RootNavigator />
        </AppProviders>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
});
