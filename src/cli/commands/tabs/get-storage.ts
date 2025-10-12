import chalk from 'chalk';
import { Command } from 'commander';
import { formatBytes, formatExpiry } from '../../../shared/helpers.js';
import type { StorageData } from '../../../shared/types.js';
import { ChromeClient } from '../../lib/chrome-client.js';

export function createGetStorageCommand(): Command {
  const getStorage = new Command('storage');
  getStorage
    .description('Get cookies, localStorage, and sessionStorage from a specific tab')
    .option('--tab <index>', 'Tab index (1-9) (overrides selected tab)')
    .option('--cookies', 'Show only cookies')
    .option('--local', 'Show only localStorage')
    .option('--session', 'Show only sessionStorage')
    .action(async (options: { tab?: string; cookies?: boolean; local?: boolean; session?: boolean }) => {
      try {
        const client = new ChromeClient();
        const tabId = await client.resolveTabWithConfig(options.tab);
        const storageData = (await client.getTabStorage(tabId)) as StorageData;

        const showAll = !options.cookies && !options.local && !options.session;
        const showCookies = showAll || options.cookies;
        const showLocal = showAll || options.local;
        const showSession = showAll || options.session;

        console.log(chalk.green('✓ Retrieved storage data'));
        console.log('');

        if (showCookies) {
          console.log(chalk.bold.cyan('Cookies:'));
          if (storageData.cookies.length === 0) {
            console.log(chalk.gray('  No cookies found'));
          } else {
            console.log(chalk.gray(`  Total: ${storageData.cookies.length} cookie(s)\n`));

            storageData.cookies.forEach((cookie, index) => {
              const flags = [];
              if (cookie.httpOnly) flags.push(chalk.yellow('HttpOnly'));
              if (cookie.secure) flags.push(chalk.green('Secure'));
              if (cookie.sameSite) flags.push(chalk.blue(cookie.sameSite));

              const flagsStr = flags.length > 0 ? ` ${flags.join(' ')}` : '';
              const expiry = formatExpiry(cookie.expires);

              console.log(`${chalk.gray(`  [${index + 1}]`)} ${chalk.bold(cookie.name)}${flagsStr}`);
              console.log(`      Value: ${cookie.value}`);
              console.log(`      Domain: ${cookie.domain} | Path: ${cookie.path}`);
              console.log(`      Expires: ${expiry} | Size: ${formatBytes(cookie.size)}`);
              console.log('');
            });
          }
        }

        if (showLocal) {
          console.log(chalk.bold.magenta('localStorage:'));
          const localKeys = Object.keys(storageData.localStorage);
          if (localKeys.length === 0) {
            console.log(chalk.gray('  No items found'));
          } else {
            const totalSize = localKeys.reduce((sum, key) => {
              const value = storageData.localStorage[key];
              return sum + key.length + value.length;
            }, 0);

            console.log(chalk.gray(`  Total: ${localKeys.length} item(s) | Size: ${formatBytes(totalSize * 2)}\n`));

            localKeys.forEach((key, index) => {
              const value = storageData.localStorage[key];
              console.log(`${chalk.gray(`  [${index + 1}]`)} ${chalk.bold(key)}`);
              console.log(`      ${value}`);
              console.log('');
            });
          }
        }

        if (showSession) {
          console.log(chalk.bold.yellow('sessionStorage:'));
          const sessionKeys = Object.keys(storageData.sessionStorage);
          if (sessionKeys.length === 0) {
            console.log(chalk.gray('  No items found'));
          } else {
            const totalSize = sessionKeys.reduce((sum, key) => {
              const value = storageData.sessionStorage[key];
              return sum + key.length + value.length;
            }, 0);

            console.log(chalk.gray(`  Total: ${sessionKeys.length} item(s) | Size: ${formatBytes(totalSize * 2)}\n`));

            sessionKeys.forEach((key, index) => {
              const value = storageData.sessionStorage[key];
              console.log(`${chalk.gray(`  [${index + 1}]`)} ${chalk.bold(key)}`);
              console.log(`      ${value}`);
              console.log('');
            });
          }
        }
      } catch (error) {
        console.error(chalk.red('Error getting storage data:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  return getStorage;
}
