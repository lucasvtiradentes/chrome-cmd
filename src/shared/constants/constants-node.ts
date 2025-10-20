// Node.js-only constants (uses Node.js APIs like fs, path, os)
// Only for CLI usage, NOT for Chrome Extension

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { APP_NAME } from './constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function findPackageRoot(startDir: string): string {
  let current = startDir;
  while (current !== '/') {
    const packageJsonPath = join(current, 'package.json');
    if (existsSync(packageJsonPath)) {
      return current;
    }
    current = dirname(current);
  }
  throw new Error('package.json not found');
}

const packageRoot = findPackageRoot(__dirname);
const packageJsonPath = join(packageRoot, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

const isGlobalInstall = __dirname.includes('/node_modules/');
export const IS_DEV = !isGlobalInstall && process.env.NODE_ENV !== 'production';
export const APP_NAME_WITH_ENV = `${APP_NAME}${IS_DEV ? ' (DEV)' : ''}`;

export const APP_INFO = {
  name: APP_NAME,
  version: packageJson.version as string,
  description: 'Control Chrome from the command line'
};

const PACKAGE_ROOT = packageRoot;
const LOGS_DIR = join(PACKAGE_ROOT, 'logs');

export const MEDIATOR_LOG_FILE = join(LOGS_DIR, 'mediator.log');
export const MEDIATOR_LOCK_FILE = join(PACKAGE_ROOT, 'mediator.lock');
export const MEDIATOR_WRAPPER_LOG_FILE = join(LOGS_DIR, 'wrapper.log');

export const MEDIATOR_PORT_RANGE_START = 8765;
export const MEDIATOR_PORT_RANGE_END = 8774;
