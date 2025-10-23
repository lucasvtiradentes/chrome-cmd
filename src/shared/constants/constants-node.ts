import { join } from 'node:path';
import { isDev } from '../utils/environment.js';
import { getPackageInfo } from '../utils/package-info.js';
import { APP_NAME } from './constants.js';

const packageInfo = getPackageInfo();

export const IS_DEV = isDev();
export const APP_NAME_WITH_ENV = `${APP_NAME}${IS_DEV ? ' (DEV)' : ''}`;

export const APP_INFO = {
  name: APP_NAME,
  version: packageInfo.version,
  description: 'Control Chrome from the command line'
};

const PACKAGE_ROOT = packageInfo.root;
const LOGS_DIR = join(PACKAGE_ROOT, 'logs');

export const MEDIATOR_LOCK_FILE = join(PACKAGE_ROOT, 'mediator.lock');
export const MEDIATOR_LOG_FILE = join(LOGS_DIR, 'mediator.log');
export const MEDIATOR_WRAPPER_LOG_FILE = join(LOGS_DIR, 'wrapper.log');
