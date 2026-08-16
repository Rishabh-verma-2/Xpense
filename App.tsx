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
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { AppProviders } from './src/core/providers/AppProviders';
import RootNavigator from './src/core/navigation/RootNavigator';

export default function App() {
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
