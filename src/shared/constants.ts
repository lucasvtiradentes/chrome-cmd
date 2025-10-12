/**
 * Shared constants for chrome-cmd
 */

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
