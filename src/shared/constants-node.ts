// Node.js-only constants (uses Node.js APIs like fs, path, os)
// Only for CLI usage, NOT for Chrome Extension

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { APP_NAME } from './constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJsonPath = join(__dirname, '..', '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

export const APP_INFO = {
  name: APP_NAME,
  version: packageJson.version as string,
  description: 'Control Chrome from the command line'
};

// Use relative paths from the package installation directory
// This works in both dev and production (npm package)
const PACKAGE_ROOT = join(__dirname, '..', '..');
const LOGS_DIR = join(PACKAGE_ROOT, 'logs');

export const MEDIATOR_LOG_FILE = join(LOGS_DIR, 'mediator.log');
export const MEDIATOR_LOCK_FILE = join(PACKAGE_ROOT, 'mediator.lock');
export const MEDIATOR_WRAPPER_LOG_FILE = join(LOGS_DIR, 'wrapper.log');
