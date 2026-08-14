#!/usr/bin/env node
/**
 * patch-pwa.js — runs after `npx expo export -p web`
 * Injects PWA manifest, iOS meta tags, and service worker registration
 * into the Expo-generated dist/index.html
 */

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'dist', 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('❌  dist/index.html not found. Run `npm run build:web` first.');
  process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf8');

// --- 1. Inject manifest + iOS meta tags before </head> ---
const pwaHeadTags = `
<!-- PWA Manifest — REQUIRED for browser install prompt -->
<link rel="manifest" href="/manifest.json" />

<!-- Apple iOS PWA support -->
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Xpense" />
<link rel="apple-touch-icon" href="/assets/icon-192.png" />
`;

if (!html.includes('rel="manifest"')) {
  html = html.replace('</head>', `${pwaHeadTags}</head>`);
  console.log('✅  Injected PWA manifest + iOS meta tags');
} else {
  console.log('ℹ️   PWA manifest already present, skipping');
}

// --- 2. Inject service worker registration before </body> ---
const swScript = `
  <!-- Service Worker Registration -->
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
          .then(function(reg) { console.log('SW registered:', reg.scope); })
          .catch(function(err) { console.warn('SW registration failed:', err); });
      });
    }
  </script>
`;

if (!html.includes("serviceWorker.register('/sw.js')")) {
  html = html.replace('</body>', `${swScript}</body>`);
  console.log('✅  Injected service worker registration script');
} else {
  console.log('ℹ️   Service worker registration already present, skipping');
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('🎉  PWA patch complete! dist/index.html is ready for Vercel deployment.');
