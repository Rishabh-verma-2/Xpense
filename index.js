// Polyfill TextDecoder for Hermes in React Native to prevent "RangeError: Unknown encoding: latin1"
if (typeof global !== 'undefined') {
  const NativeTextDecoder = global.TextDecoder;
  if (NativeTextDecoder) {
    global.TextDecoder = class CustomTextDecoder {
      constructor(encoding = 'utf-8', options) {
        const norm = (encoding || 'utf-8').toLowerCase().replace(/[^a-z0-9]/g, '');
        this.encoding = norm;
        try {
          this._native = new NativeTextDecoder(encoding, options);
        } catch {
          this._native = null;
        }
      }
      decode(input, options) {
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

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
