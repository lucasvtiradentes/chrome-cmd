import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'tsup';
import { APP_NAME_WITH_ENV, IS_DEV } from './src/shared/constants-node.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const packageJson = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8'));
const version = packageJson.version;
const extensionSource = 'src/chrome-extension';

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
      background: `${extensionSource}/background.ts`,
      popup: `${extensionSource}/popup.ts`,
      'content-modal': `${extensionSource}/content-modal.ts`
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

      // Rename .global.js files to .js
      renameSync(join(distDir, 'background.global.js'), join(distDir, 'background.js'));
      renameSync(join(distDir, 'popup.global.js'), join(distDir, 'popup.js'));
      renameSync(join(distDir, 'content-modal.global.js'), join(distDir, 'content-modal.js'));

      // Copy HTML
      let popupHtml = readFileSync(join(__dirname, `${extensionSource}/popup.html`), 'utf8');
      popupHtml = popupHtml.replace(/\{\{VERSION\}\}/g, version);
      popupHtml = popupHtml.replace(/\{\{APP_NAME\}\}/g, APP_NAME_WITH_ENV);
      writeFileSync(join(distDir, 'popup.html'), popupHtml);

      // Copy CSS
      copyFileSync(join(__dirname, `${extensionSource}/popup.css`), join(distDir, 'popup.css'));

      // Copy and process manifest.json
      const manifestJson = JSON.parse(readFileSync(join(__dirname, `${extensionSource}/manifest.json`), 'utf8'));
      manifestJson.version = version;

      if (IS_DEV) {
        manifestJson.name = `${manifestJson.name} (DEV)`;
      }

      writeFileSync(join(distDir, 'manifest.json'), JSON.stringify(manifestJson, null, 2));

      // Copy icons directory
      const iconsDir = join(__dirname, `${extensionSource}/icons`);
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
