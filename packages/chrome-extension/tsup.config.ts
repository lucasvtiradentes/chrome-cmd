import { defineConfig } from 'tsup';

export default defineConfig([
  // Background script (IIFE to avoid any imports)
  {
    entry: ['src/background.ts'],
    outDir: 'dist',
    format: ['iife'],
    platform: 'browser',
    target: 'es2020',
    minify: false,
    sourcemap: false,
    clean: false,
    dts: false,
    bundle: true,
    noExternal: [/.*/],
    globalName: 'ChromeBackground'
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
    globalName: 'ChromePopup',
    bundle: true,
    noExternal: [/.*/]
  }
]);
