/**
 * index.js — App entry point (pure CommonJS, NO import statements)
 *
 * IMPORTANT: Do NOT add `import` statements here.
 * Babel hoists all `import` to the top of the file — before ANY code runs.
 * That means polyfills in this file would execute AFTER Firebase/Axios already
 * loaded and crashed with "RangeError: Unknown encoding: latin1".
 * Using only `require()` guarantees: polyfill first → then app modules.
 */

// ─── Step 1: Patch TextDecoder BEFORE any other module loads ─────────────────
// Hermes does not support latin1 / iso-8859-1 / windows-1252 encodings.
// Firebase, Axios, and jsPDF call new TextDecoder('latin1') at module init time.
// This patch intercepts unsupported encodings and falls back to a safe decoder.
(function patchTextDecoder() {
  if (typeof global === 'undefined') return;
  var OriginalTextDecoder = global.TextDecoder;
  if (!OriginalTextDecoder) return;
  if (global.__textDecoderPatched) return; // avoid double-patching

  // Encodings Hermes actually supports
  var HERMES_SUPPORTED = ['utf8', 'utf16le', 'utf16', 'utf16be', 'ucs2', 'ucs2'];

  function normalizeEncoding(enc) {
    return (enc || 'utf-8').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function isHermesSupported(enc) {
    var norm = normalizeEncoding(enc);
    return norm === 'utf8' || HERMES_SUPPORTED.indexOf(norm) !== -1;
  }

  // latin1 / iso-8859-1: single-byte, code point == byte value
  function decodeLatin1(input) {
    if (!input) return '';
    var bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
    var str = '';
    for (var i = 0; i < bytes.length; i++) {
      str += String.fromCharCode(bytes[i]);
    }
    return str;
  }

  function PatchedTextDecoder(encoding, options) {
    encoding = encoding || 'utf-8';
    this.encoding = normalizeEncoding(encoding);
    this._native = null;
    if (isHermesSupported(encoding)) {
      try { this._native = new OriginalTextDecoder(encoding, options); } catch (_) {}
    }
  }

  PatchedTextDecoder.prototype.decode = function (input, options) {
    if (this._native) {
      try { return this._native.decode(input, options); } catch (_) {}
    }
    // Fallback for latin1, iso-8859-1, windows-1252, etc.
    return decodeLatin1(input);
  };

  global.TextDecoder = PatchedTextDecoder;
  global.__textDecoderPatched = true;
}());

// ─── Step 2: Load the app AFTER polyfill is in place ─────────────────────────
var Expo = require('expo');
var App  = require('./App').default;

Expo.registerRootComponent(App);

