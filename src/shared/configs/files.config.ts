import { homedir, platform } from 'node:os';
import { join } from 'node:path';
import { APP_NAME, NATIVE_APP_NAME } from '../constants/constants.js';
import { getPackageInfo } from '../utils/functions/get-package-info.js';

const packageInfo = getPackageInfo();
const PACKAGE_ROOT = packageInfo.root;
const CONFIG_DIR =
  platform() === 'win32' ? join(homedir(), 'AppData', 'Roaming', APP_NAME) : join(homedir(), '.config', APP_NAME);

const OS = platform();
const HOME = homedir();

const NATIVE_MANIFEST_DIR =
  OS === 'linux'
    ? join(HOME, '.config', 'google-chrome', 'NativeMessagingHosts')
    : OS === 'darwin'
      ? join(HOME, 'Library', 'Application Support', 'Google', 'Chrome', 'NativeMessagingHosts')
      : OS === 'win32'
        ? join(HOME, 'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'NativeMessagingHosts')
        : '';

const NATIVE_MANIFEST_FILENAME = `${NATIVE_APP_NAME}.json`;

const NATIVE_HOST_FOLDER = 'native-host';

export const FILES_CONFIG = {
  HOME,
  PACKAGE_ROOT,
  LOGS_DIR: join(PACKAGE_ROOT, 'logs'),
  CONFIG_DIR,
  CONFIG_FILE: join(CONFIG_DIR, 'config.json'),
  MEDIATORS_FILE: join(CONFIG_DIR, 'mediators.json'),
  MEDIATOR_LOCK_FILE: join(PACKAGE_ROOT, 'mediator.lock'),
  MEDIATOR_LOG_FILE: join(PACKAGE_ROOT, 'logs', 'mediator.log'),
  MEDIATOR_WRAPPER_LOG_FILE: join(PACKAGE_ROOT, 'logs', 'wrapper.log'),
  DOCS_DIR: join(PACKAGE_ROOT, 'docs'),
  HELP_FILE: join(PACKAGE_ROOT, 'docs', 'help.txt'),
  COMPLETIONS_DIR: join(PACKAGE_ROOT, 'completions'),
  ZSH_COMPLETION_FILE: join(PACKAGE_ROOT, 'completions', '_chrome-cmd'),
  BASH_COMPLETION_FILE: join(PACKAGE_ROOT, 'completions', 'chrome-cmd.bash'),
  README_FILE: join(PACKAGE_ROOT, 'README.md'),
  NATIVE_HOST_FOLDER,
  NATIVE_HOST_DIR: join(PACKAGE_ROOT, NATIVE_HOST_FOLDER),
  NATIVE_HOST_DIST_DIR: join(PACKAGE_ROOT, 'dist', NATIVE_HOST_FOLDER),
  NATIVE_MANIFEST_DIR,
  NATIVE_MANIFEST_FILE: NATIVE_MANIFEST_DIR ? join(NATIVE_MANIFEST_DIR, NATIVE_MANIFEST_FILENAME) : '',
  NATIVE_MANIFEST_FILENAME,
  CHROME_EXTENSION_DEV_DIR: join(PACKAGE_ROOT, 'dist', 'src', 'chrome-extension'),
  CHROME_EXTENSION_PROD_DIR: join(PACKAGE_ROOT, 'src', 'chrome-extension'),
  ZSH_COMPLETION_DIRS: [
    join(HOME, '.oh-my-zsh', 'completions'),
    join(HOME, '.zsh', 'completions'),
    join(HOME, '.config', 'zsh', 'completions'),
    join(HOME, '.local', 'share', 'zsh', 'site-functions'),
    '/usr/local/share/zsh/site-functions'
  ],
  BASH_COMPLETION_DIRS: [
    join(HOME, '.bash_completion.d'),
    join(HOME, '.local', 'share', 'bash-completion', 'completions'),
    '/usr/share/bash-completion/completions',
    '/etc/bash_completion.d'
  ]
} as const;
