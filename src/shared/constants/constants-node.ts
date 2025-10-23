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
