import { getPackageInfo } from '../utils/functions/get-package-info.js';
import { isDev } from '../utils/functions/is-development-env.js';
import { APP_NAME } from './constants.js';

const packageInfo = getPackageInfo();

export const IS_DEV = isDev();
const APP_NAME_WITH_ENV = `${APP_NAME}${IS_DEV ? ' (DEV)' : ''}`;

export const APP_INFO = {
  name: APP_NAME_WITH_ENV,
  version: packageInfo.version,
  description: 'Chrome CMD - Control Chrome from the command line'
};
