import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const APP_NAME = 'chrome-cmd';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJsonPath = join(__dirname, '..', '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

export const APP_INFO = {
  name: APP_NAME,
  version: packageJson.version as string,
  description: 'Control Chrome from the command line'
};

export const NATIVE_APP_NAME = 'com.chrome_cli.native';

export const NATIVE_MANIFEST_FILENAME = `${NATIVE_APP_NAME}.json`;

export const MEDIATOR_PORT = 8765;
export const MEDIATOR_HOST = 'localhost';
export const MEDIATOR_URL = `http://${MEDIATOR_HOST}:${MEDIATOR_PORT}`;

export const MEDIATOR_LOG_FILE = join(homedir(), '.chrome-cli-mediator.log');
export const MEDIATOR_LOCK_FILE = join(homedir(), '.chrome-cli-mediator.lock');
export const MEDIATOR_WRAPPER_LOG_FILE = join(homedir(), '.chrome-cli-wrapper.log');
