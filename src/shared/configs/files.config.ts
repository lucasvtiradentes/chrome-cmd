import { homedir, platform } from 'node:os';
import { join } from 'node:path';
import { BRIDGE_APP_NAME, CLI_NAME } from '../constants/constants.js';
import { getPackageInfo } from '../utils/functions/get-package-info.js';

const OS = platform();
const HOME = homedir();
const packageInfo = getPackageInfo();
const PACKAGE_ROOT = packageInfo.root;
const CONFIG_DIR =
  platform() === 'win32' ? join(homedir(), 'AppData', 'Roaming', CLI_NAME) : join(homedir(), '.config', CLI_NAME);

const BRIDGE_MANIFEST_DIR =
  OS === 'linux'
    ? join(HOME, '.config', 'google-chrome', 'NativeMessagingHosts')
    : OS === 'darwin'
      ? join(HOME, 'Library', 'Application Support', 'Google', 'Chrome', 'NativeMessagingHosts')
      : OS === 'win32'
        ? join(HOME, 'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'NativeMessagingHosts')
        : '';

const BRIDGE_MANIFEST_FILENAME = `${BRIDGE_APP_NAME}.json`;

const BRIDGE_FOLDER = 'bridge';

export const FILES_CONFIG = {
  HOME,
  PACKAGE_ROOT,
  LOGS_DIR: join(PACKAGE_ROOT, 'logs'),
  CONFIG_DIR,
  CONFIG_FILE: join(CONFIG_DIR, 'config.json'),
  BRIDGES_FILE: join(CONFIG_DIR, 'bridges.json'),
  BRIDGE_LOCK_FILE: join(PACKAGE_ROOT, 'bridge.lock'),
  BRIDGE_LOG_FILE: join(PACKAGE_ROOT, 'logs', 'bridge.log'),
  BRIDGE_WRAPPER_LOG_FILE: join(PACKAGE_ROOT, 'logs', 'wrapper.log'),
  DOCS_DIR: join(PACKAGE_ROOT, 'docs'),
  HELP_FILE: join(PACKAGE_ROOT, 'docs', 'help.txt'),
  COMPLETIONS_DIR: join(PACKAGE_ROOT, 'completions'),
  ZSH_COMPLETION_FILE: join(PACKAGE_ROOT, 'completions', '_chrome-cmd'),
  BASH_COMPLETION_FILE: join(PACKAGE_ROOT, 'completions', 'chrome-cmd.bash'),
  README_FILE: join(PACKAGE_ROOT, 'README.md'),
  BRIDGE_FOLDER,
  BRIDGE_DIR: join(PACKAGE_ROOT, BRIDGE_FOLDER),
  BRIDGE_DIST_DIR: join(PACKAGE_ROOT, 'dist', BRIDGE_FOLDER),
  BRIDGE_MANIFEST_DIR,
  BRIDGE_MANIFEST_FILE: BRIDGE_MANIFEST_DIR ? join(BRIDGE_MANIFEST_DIR, BRIDGE_MANIFEST_FILENAME) : '',
  BRIDGE_MANIFEST_FILENAME,
  EXTENSION_DEV_DIR: join(PACKAGE_ROOT, 'dist', 'extension'),
  EXTENSION_PROD_DIR: join(PACKAGE_ROOT, 'src', 'extension'),
  ZSH_COMPLETION_DIRS:
    OS === 'win32'
      ? []
      : [
          join(HOME, '.oh-my-zsh', 'completions'),
          join(HOME, '.zsh', 'completions'),
          join(HOME, '.config', 'zsh', 'completions'),
          join(HOME, '.local', 'share', 'zsh', 'site-functions'),
          '/usr/local/share/zsh/site-functions'
        ],
  BASH_COMPLETION_DIRS:
    OS === 'win32'
      ? []
      : [
          join(HOME, '.bash_completion.d'),
          join(HOME, '.local', 'share', 'bash-completion', 'completions'),
          '/usr/share/bash-completion/completions',
          '/etc/bash_completion.d'
        ]
} as const;
