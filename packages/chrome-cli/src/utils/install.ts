/**
 * Installation utilities for native messaging host
 */

import { writeFileSync, mkdirSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { homedir, platform } from 'node:os';
import { NATIVE_APP_NAME } from '../constants.js';

/**
 * Get the native messaging manifest path for the current platform
 */
export function getNativeManifestPath(): string {
  const os = platform();
  const home = homedir();

  switch (os) {
    case 'linux':
      return join(home, '.config/google-chrome/NativeMessagingHosts', `${NATIVE_APP_NAME}.json`);
    case 'darwin':
      return join(home, 'Library/Application Support/Google/Chrome/NativeMessagingHosts', `${NATIVE_APP_NAME}.json`);
    case 'win32':
      // On Windows, this needs to be in the registry, but we'll provide the path for reference
      return join(home, 'AppData\\Local\\Google\\Chrome\\NativeMessagingHosts', `${NATIVE_APP_NAME}.json`);
    default:
      throw new Error(`Unsupported platform: ${os}`);
  }
}

/**
 * Generate native messaging host manifest
 */
export function generateManifest(hostScriptPath: string): object {
  return {
    name: NATIVE_APP_NAME,
    description: 'Chrome CLI Native Messaging Host',
    path: hostScriptPath,
    type: 'stdio',
    allowed_origins: ['chrome-extension://YOUR_EXTENSION_ID/']
  };
}

/**
 * Install native messaging host
 */
export function installNativeHost(hostScriptPath: string): void {
  const manifestPath = getNativeManifestPath();
  const manifest = generateManifest(hostScriptPath);

  // Create directory if it doesn't exist
  mkdirSync(manifestPath.substring(0, manifestPath.lastIndexOf('/')), { recursive: true });

  // Write manifest
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  // Make host script executable (Unix-like systems)
  if (platform() !== 'win32') {
    chmodSync(hostScriptPath, 0o755);
  }

  console.log(`Native messaging host installed at: ${manifestPath}`);
  console.log('\nNext steps:');
  console.log('1. Build the CLI: npm run build');
  console.log('2. Get your Chrome extension ID from chrome://extensions/');
  console.log('3. Update the manifest at:', manifestPath);
  console.log('4. Replace YOUR_EXTENSION_ID with your actual extension ID');
}
