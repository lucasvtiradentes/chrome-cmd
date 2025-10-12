import { defineConfig } from 'tsup';
import { copyFileSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read package.json for version
const packageJson = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8'));
const version = packageJson.version;

export default defineConfig([
  // CLI Build (includes shared)
  {
    name: 'cli',
    entry: ['src/cli/**/*.ts', 'src/shared/**/*.ts'],
    outDir: 'dist',
    format: ['esm'],
    target: 'node18',
    clean: false,
    shims: true,
    splitting: false,
    sourcemap: false,
    dts: false,
    bundle: false,
    onSuccess: async () => {
      console.log('✅ CLI + Shared compiled successfully');
    }
  },
  // Chrome Extension Build
  {
    name: 'chrome-extension',
    entry: {
      background: 'src/chrome-extension/background.ts',
      popup: 'src/chrome-extension/popup.ts'
    },
    outDir: 'dist/chrome-extension',
    format: ['iife'],
    target: 'es2020',
    clean: false,
    splitting: false,
    sourcemap: false,
    dts: false,
    globalName: 'ChromeExtension',
    define: {
      __VERSION__: JSON.stringify(version)
    },
    onSuccess: async () => {
      const distDir = join(__dirname, 'dist/chrome-extension');
      const { renameSync } = await import('node:fs');

      // Rename .global.js files to .js
      renameSync(join(distDir, 'background.global.js'), join(distDir, 'background.js'));
      renameSync(join(distDir, 'popup.global.js'), join(distDir, 'popup.js'));

      // Copy HTML
      let popupHtml = readFileSync(join(__dirname, 'src/chrome-extension/popup.html'), 'utf8');
      popupHtml = popupHtml.replace('{{VERSION}}', version);
      writeFileSync(join(distDir, 'popup.html'), popupHtml);

      // Copy CSS
      copyFileSync(join(__dirname, 'src/chrome-extension/popup.css'), join(distDir, 'popup.css'));

      // Copy and process manifest.json
      const manifestJson = JSON.parse(readFileSync(join(__dirname, 'src/chrome-extension/manifest.json'), 'utf8'));
      manifestJson.version = version;
      writeFileSync(join(distDir, 'manifest.json'), JSON.stringify(manifestJson, null, 2));

      // Copy icons directory
      const iconsDir = join(__dirname, 'src/chrome-extension/icons');
      const distIconsDir = join(distDir, 'icons');

      if (existsSync(iconsDir)) {
        mkdirSync(distIconsDir, { recursive: true });
        for (const icon of readdirSync(iconsDir)) {
          const iconPath = join(iconsDir, icon);
          if (statSync(iconPath).isFile()) {
            copyFileSync(iconPath, join(distIconsDir, icon));
          }
        }
      }

      console.log(`✅ Chrome Extension v${version} compiled successfully`);
    }
  }
]);
