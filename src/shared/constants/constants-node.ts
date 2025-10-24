import { getPackageInfo } from '../utils/functions/get-package-info.js';
import { isDev } from '../utils/functions/is-development-env.js';
import { APP_NAME } from './constants.js';

const packageInfo = getPackageInfo();

export const APP_INFO = {
  name: `${APP_NAME}${isDev() ? ' (DEV)' : ''}`,
  version: packageInfo.version,
  description: packageInfo.description
};
