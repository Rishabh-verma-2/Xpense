#!/usr/bin/env node
/**
 * patch-pwa.js — runs after `npx expo export -p web`
 * Injects PWA manifest, iOS meta tags, and service worker registration
 * into the Expo-generated dist/index.html and ensures all icon assets are copied.
 */

const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const distAssetsDir = path.join(distDir, 'assets');
const indexPath = path.join(distDir, 'index.html');

if (!fs.existsSync(distDir)) {
  console.error('❌  dist/ not found. Run `npx expo export -p web` first.');
  process.exit(1);
}

if (!fs.existsSync(distAssetsDir)) {
  fs.mkdirSync(distAssetsDir, { recursive: true });
}

// ─── 1. Copy Manifest, Service Worker & Icon Assets ───────────────────────────
const copyFileSafe = (src, dest) => {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✅ Copied: ${path.basename(src)} → ${path.relative(__dirname, dest)}`);
  }
};

copyFileSafe(path.join(__dirname, 'public', 'manifest.json'), path.join(distDir, 'manifest.json'));
copyFileSafe(path.join(__dirname, 'public', 'sw.js'), path.join(distDir, 'sw.js'));
copyFileSafe(path.join(__dirname, 'assets', 'icon-192.png'), path.join(distAssetsDir, 'icon-192.png'));
copyFileSafe(path.join(__dirname, 'assets', 'icon-512.png'), path.join(distAssetsDir, 'icon-512.png'));
copyFileSafe(path.join(__dirname, 'assets', 'icon.png'), path.join(distAssetsDir, 'icon.png'));
copyFileSafe(path.join(__dirname, 'assets', 'favicon.png'), path.join(distDir, 'favicon.ico'));

// ─── 2. Inject PWA Head Tags ───────────────────────────────────────────────────
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');

  // 2a. Update viewport meta to strictly prevent mobile zooming
  html = html.replace(
    /<meta\s+name=["']viewport["']\s+content=["'][^"']*["']\s*\/?>/i,
    '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no" />'
  );

  const pwaHeadTags = `
  <!-- PWA Manifest — REQUIRED for browser install prompt -->
  <link rel="manifest" href="/manifest.json" />
  <link rel="icon" type="image/png" sizes="192x192" href="/assets/icon-192.png" />
  <link rel="icon" type="image/png" sizes="512x512" href="/assets/icon-512.png" />

  <!-- Apple iOS PWA support -->
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Xpense" />
  <link rel="apple-touch-icon" href="/assets/icon-192.png" />
  <link rel="apple-touch-icon" sizes="192x192" href="/assets/icon-192.png" />
  <link rel="apple-touch-icon" sizes="512x512" href="/assets/icon-512.png" />

  <!-- Prevent pinch-to-zoom on mobile browsers / PWAs -->
  <style id="xpense-prevent-zoom-style">
    html, body, #root {
      touch-action: pan-x pan-y !important;
      -webkit-text-size-adjust: 100% !important;
    }
  </style>
  <script>
    (function() {
      function prevent(e) { if (e.preventDefault) e.preventDefault(); }
      document.addEventListener('gesturestart', prevent, { passive: false });
      document.addEventListener('gesturechange', prevent, { passive: false });
      document.addEventListener('gestureend', prevent, { passive: false });
      document.addEventListener('touchstart', function(e) {
        if (e.touches && e.touches.length > 1) prevent(e);
      }, { passive: false });
      document.addEventListener('touchmove', function(e) {
        if (e.touches && e.touches.length > 1) prevent(e);
      }, { passive: false });
      var lastTouch = 0;
      document.addEventListener('touchend', function(e) {
        var now = Date.now();
        if (now - lastTouch <= 300) prevent(e);
        lastTouch = now;
      }, false);
    })();
  </script>
`;

  if (!html.includes('rel="manifest"')) {
    html = html.replace('</head>', `${pwaHeadTags}\n</head>`);
    console.log('✅ Injected PWA manifest + iOS meta tags + anti-zoom protection');
  }

  // Inject Service Worker
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
    html = html.replace('</body>', `${swScript}\n</body>`);
    console.log('✅ Injected service worker registration script');
  }

  fs.writeFileSync(indexPath, html, 'utf8');
}

console.log('🎉  PWA patch complete! dist is fully prepared for Vercel deployment.');
