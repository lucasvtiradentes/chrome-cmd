/**
 * Shared constants for chrome-cmd
 */

import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Application name
 */
export const APP_NAME = 'chrome-cmd';

/**
 * Application version (read from package.json)
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// When in dev mode (tsx), __dirname is src/shared/, need to go up 2 levels
// When compiled, __dirname is dist/shared/, also need to go up 2 levels
const packageJsonPath = join(__dirname, '..', '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

/**
 * Application information
 */
export const APP_INFO = {
  name: APP_NAME,
  version: packageJson.version as string,
  description: 'Control Chrome from the command line'
};

/**
 * Native messaging host application name
 * Used by both the Chrome extension and the CLI mediator
 */
export const NATIVE_APP_NAME = 'com.chrome_cli.native';

/**
 * Native messaging host manifest filename
 */
export const NATIVE_MANIFEST_FILENAME = `${NATIVE_APP_NAME}.json`;

/**
 * Mediator server configuration
 */
export const MEDIATOR_PORT = 8765;
export const MEDIATOR_HOST = 'localhost';
export const MEDIATOR_URL = `http://${MEDIATOR_HOST}:${MEDIATOR_PORT}`;

/**
 * Mediator file paths
 */
export const MEDIATOR_LOG_FILE = join(homedir(), '.chrome-cli-mediator.log');
export const MEDIATOR_LOCK_FILE = join(homedir(), '.chrome-cli-mediator.lock');
export const MEDIATOR_WRAPPER_LOG_FILE = join(homedir(), '.chrome-cli-wrapper.log');
