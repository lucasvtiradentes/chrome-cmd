// Node.js-only constants (uses Node.js APIs like fs, path, os)
// Only for CLI usage, NOT for Chrome Extension

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { APP_NAME } from './constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isInDist = __dirname.includes('/dist/src/');
const levelsUp = isInDist ? ['..', '..', '..', '..'] : ['..', '..', '..'];
const packageJsonPath = join(__dirname, ...levelsUp, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

export const IS_DEV = process.env.NODE_ENV !== 'production';
export const APP_NAME_WITH_ENV = `${APP_NAME}${IS_DEV ? ' (DEV)' : ''}`;
export const CLI_NAME = 'chrome-cmd';

export const APP_INFO = {
  name: APP_NAME,
  version: packageJson.version as string,
  description: 'Control Chrome from the command line'
};

const PACKAGE_ROOT = join(__dirname, ...levelsUp);
const LOGS_DIR = join(PACKAGE_ROOT, 'logs');

export const MEDIATOR_LOG_FILE = join(LOGS_DIR, 'mediator.log');
export const MEDIATOR_LOCK_FILE = join(PACKAGE_ROOT, 'mediator.lock');
export const MEDIATOR_WRAPPER_LOG_FILE = join(LOGS_DIR, 'wrapper.log');

export const MEDIATOR_PORT_RANGE_START = 8765;
export const MEDIATOR_PORT_RANGE_END = 8774;
