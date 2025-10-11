import { defineConfig } from 'tsup';

export default defineConfig([
  // Background script (ESM for service worker)
  {
    entry: ['src/background.ts'],
    outDir: 'dist',
    format: ['esm'],
    platform: 'browser',
    target: 'es2020',
    minify: false,
    sourcemap: false,
    clean: false,
    dts: false
  },
  // Popup script (IIFE for inline script)
  {
    entry: { popup: 'src/popup.ts' },
    outDir: 'dist',
    format: ['iife'],
    platform: 'browser',
    target: 'es2020',
    minify: false,
    sourcemap: false,
    clean: false,
    dts: false,
    globalName: 'ChromePopup'
  }
]);
