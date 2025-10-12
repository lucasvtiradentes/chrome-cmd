/**
 * Shared constants for chrome-cmd
 */

import { homedir } from 'node:os';
import { join } from 'node:path';

/**
 * Application name
 */
export const APP_NAME = 'chrome-cmd';

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
