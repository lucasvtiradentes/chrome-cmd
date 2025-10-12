// Browser-safe constants (no Node.js APIs)
// Can be used by both CLI and Chrome Extension

export const APP_NAME = 'chrome-cmd';

export const NATIVE_APP_NAME = 'com.chrome_cli.native';
export const NATIVE_MANIFEST_FILENAME = `${NATIVE_APP_NAME}.json`;
export const NATIVE_HOST_FOLDER = 'native-host';

export const MEDIATOR_PORT = 8765;
export const MEDIATOR_HOST = 'localhost';
export const MEDIATOR_URL = `http://${MEDIATOR_HOST}:${MEDIATOR_PORT}`;
