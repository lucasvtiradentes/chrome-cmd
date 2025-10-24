import { Command } from 'commander';
import type { TabsStorageOptions } from '../../../../protocol/commands/definitions/tab.js';
import { CommandNames, SubCommandNames } from '../../../../protocol/commands/definitions.js';
import { createSubCommandFromSchema } from '../../../../protocol/commands/utils.js';
import { colors } from '../../../../shared/utils/helpers/colors.js';
import { logger } from '../../../../shared/utils/helpers/logger.js';
import type { StorageData } from '../../../../shared/utils/types.js';
import { ChromeClient } from '../../../core/clients/chrome.js';
import { commandErrorHandler } from '../../../core/utils/command-error-handler.js';
import { formatBytes, formatExpiry } from '../../../utils/cli-utils.js';

export function createGetStorageCommand(): Command {
  return createSubCommandFromSchema(
    CommandNames.TAB,
    SubCommandNames.TAB_STORAGE,
    async (options: TabsStorageOptions) => {
      const commandPromise = async () => {
        const client = new ChromeClient();
        const tabId = await client.resolveTabWithConfig(options.tab?.toString());
        const storageData = (await client.getTabStorage(tabId)) as StorageData;

        const showAll = !options.cookies && !options.local && !options.session;
        const showCookies = showAll || options.cookies;
        const showLocal = showAll || options.local;
        const showSession = showAll || options.session;

        logger.success('✓ Retrieved storage data');
        logger.info('');

        if (showCookies) {
          logger.bold('Cookies:');
          if (storageData.cookies.length === 0) {
            logger.dim('  No cookies found');
          } else {
            logger.dim(`  Total: ${storageData.cookies.length} cookie(s)\n`);

            storageData.cookies.forEach((cookie, index) => {
              const flags = [];
              if (cookie.httpOnly) flags.push(colors.yellow('HttpOnly'));
              if (cookie.secure) flags.push(colors.green('Secure'));
              if (cookie.sameSite) flags.push(colors.blue(cookie.sameSite));

              const flagsStr = flags.length > 0 ? ` ${flags.join(' ')}` : '';
              const expiry = formatExpiry(cookie.expires);

              logger.info(`${colors.dim(`  [${index + 1}]`)} ${colors.bold(cookie.name)}${flagsStr}`);
              logger.info(`      Value: ${cookie.value}`);
              logger.info(`      Domain: ${cookie.domain} | Path: ${cookie.path}`);
              logger.info(`      Expires: ${expiry} | Size: ${formatBytes(cookie.size)}`);
              logger.info('');
            });
          }
        }

        if (showLocal) {
          logger.bold('localStorage:');
          const localKeys = Object.keys(storageData.localStorage);
          if (localKeys.length === 0) {
            logger.dim('  No items found');
          } else {
            const totalSize = localKeys.reduce((sum, key) => {
              const value = storageData.localStorage[key];
              return sum + key.length + value.length;
            }, 0);

            logger.dim(`  Total: ${localKeys.length} item(s) | Size: ${formatBytes(totalSize * 2)}\n`);

            localKeys.forEach((key, index) => {
              const value = storageData.localStorage[key];
              logger.info(`${colors.dim(`  [${index + 1}]`)} ${colors.bold(key)}`);
              logger.info(`      ${value}`);
              logger.info('');
            });
          }
        }

        if (showSession) {
          logger.bold('sessionStorage:');
          const sessionKeys = Object.keys(storageData.sessionStorage);
          if (sessionKeys.length === 0) {
            logger.dim('  No items found');
          } else {
            const totalSize = sessionKeys.reduce((sum, key) => {
              const value = storageData.sessionStorage[key];
              return sum + key.length + value.length;
            }, 0);

            logger.dim(`  Total: ${sessionKeys.length} item(s) | Size: ${formatBytes(totalSize * 2)}\n`);

            sessionKeys.forEach((key, index) => {
              const value = storageData.sessionStorage[key];
              logger.info(`${colors.dim(`  [${index + 1}]`)} ${colors.bold(key)}`);
              logger.info(`      ${value}`);
              logger.info('');
            });
          }
        }
      };

      await commandPromise().catch(commandErrorHandler('Error getting storage data:'));
    }
  );
}
