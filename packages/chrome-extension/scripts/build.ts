import { build } from 'tsup';
import { copyFileSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const srcDir = join(rootDir, 'src');
const distDir = join(rootDir, 'dist');

// Read package.json for version
const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));
const version = packageJson.version;

console.log(`📦 Building chrome-extension v${version}...`);

// Ensure dist directory exists
mkdirSync(distDir, { recursive: true });

// Build TypeScript files with tsup (uses tsup.config.ts)
try {
  await build({
    config: join(rootDir, 'tsup.config.ts'),
    define: {
      __VERSION__: JSON.stringify(version)
    }
  });

  console.log('✅ TypeScript files built');

  // Rename .global.js files to .js
  const globalBackgroundPath = join(distDir, 'background.global.js');
  const finalBackgroundPath = join(distDir, 'background.js');
  renameSync(globalBackgroundPath, finalBackgroundPath);

  const globalPopupPath = join(distDir, 'popup.global.js');
  const finalPopupPath = join(distDir, 'popup.js');
  renameSync(globalPopupPath, finalPopupPath);

  // Copy and process HTML (inject version)
  let popupHtml = readFileSync(join(srcDir, 'popup.html'), 'utf8');
  popupHtml = popupHtml.replace('{{VERSION}}', version);
  writeFileSync(join(distDir, 'popup.html'), popupHtml);

  // Copy CSS
  copyFileSync(join(srcDir, 'popup.css'), join(distDir, 'popup.css'));

  // Copy and process manifest.json (inject version)
  const manifestJson = JSON.parse(readFileSync(join(rootDir, 'manifest.json'), 'utf8'));
  manifestJson.version = version;
  writeFileSync(join(distDir, 'manifest.json'), JSON.stringify(manifestJson, null, 2));

  // Copy icons directory
  const iconsDir = join(rootDir, 'icons');
  const distIconsDir = join(distDir, 'icons');
  mkdirSync(distIconsDir, { recursive: true });

  for (const icon of readdirSync(iconsDir)) {
    const iconPath = join(iconsDir, icon);
    if (statSync(iconPath).isFile()) {
      copyFileSync(iconPath, join(distIconsDir, icon));
    }
  }

  console.log(`✅ Chrome extension v${version} built successfully!`);
  console.log(`📁 Output: ${distDir}`);
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}
