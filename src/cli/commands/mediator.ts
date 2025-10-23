import { exec } from 'node:child_process';
import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { promisify } from 'node:util';
import chalk from 'chalk';
import { Command } from 'commander';
import { FILES_CONFIG } from '../../shared/configs/files.config.js';
import { MEDIATOR_CONFIGS } from '../../shared/configs/mediator.configs.js';

const execAsync = promisify(exec);

export function createMediatorCommand(): Command {
  const mediator = new Command('mediator').description('Manage the native messaging mediator process (internal/debug)');

  mediator
    .command('status')
    .description('Check if mediator is running')
    .action(async () => {
      try {
        const result = await checkMediatorStatus();
        if (result.running) {
          console.log(chalk.green('✓ Mediator is running'));
          console.log(chalk.gray(`  PID: ${result.pid}`));
          console.log(chalk.gray(`  Port: ${MEDIATOR_CONFIGS.PORT}`));
        } else {
          console.log(chalk.yellow('○ Mediator is not running'));
        }
      } catch (error) {
        console.error(chalk.red('Error checking status:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  mediator
    .command('kill')
    .description('Kill the mediator process')
    .action(async () => {
      try {
        const killed = await killMediator();
        if (killed) {
          console.log(chalk.green('✓ Mediator process killed'));
          console.log(chalk.gray('\nTip: The Chrome extension will restart it automatically when needed'));
        } else {
          console.log(chalk.yellow('○ No mediator process found'));
        }
      } catch (error) {
        console.error(chalk.red('Error killing mediator:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  mediator
    .command('restart')
    .description('Restart the mediator process')
    .action(async () => {
      try {
        console.log(chalk.blue('⟳ Restarting mediator...'));
        console.log('');

        // Clean up stale lock file
        const lockCleaned = await cleanLockFile();
        if (lockCleaned) {
          console.log(chalk.gray('  ✓ Cleaned stale lock file'));
        }

        const killed = await killMediator();
        if (killed) {
          console.log(chalk.gray('  ✓ Killed old process'));
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));

        console.log(chalk.gray('  ✓ Waiting for Chrome extension to restart it...'));
        console.log('');
        console.log(chalk.yellow('Please reload the Chrome extension at chrome://extensions/'));
        console.log(chalk.gray('The extension will automatically start a new mediator instance'));
        console.log('');
      } catch (error) {
        console.error(chalk.red('Error restarting mediator:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  return mediator;
}

async function checkMediatorStatus(): Promise<{ running: boolean; pid?: number }> {
  try {
    const { stdout } = await execAsync(`lsof -i :${MEDIATOR_CONFIGS.PORT} -t`);
    const pid = parseInt(stdout.trim(), 10);

    if (pid) {
      return { running: true, pid };
    }
  } catch {}

  return { running: false };
}

async function killMediator(): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`lsof -i :${MEDIATOR_CONFIGS.PORT} -t`);
    const pid = stdout.trim();

    if (pid) {
      await execAsync(`kill -9 ${pid}`);
      return true;
    }
  } catch {}

  return false;
}

async function cleanLockFile(): Promise<boolean> {
  if (!existsSync(FILES_CONFIG.MEDIATOR_LOCK_FILE)) {
    return false;
  }

  try {
    const lockContent = readFileSync(FILES_CONFIG.MEDIATOR_LOCK_FILE, 'utf-8').trim();

    // Try to parse as JSON (new format) or as plain PID (old format)
    let pid: number;
    try {
      const lockData = JSON.parse(lockContent);
      pid = lockData.pid;
    } catch {
      // Old format: just PID
      pid = parseInt(lockContent, 10);
    }

    // Check if process is still running
    try {
      process.kill(pid, 0);
      // Process exists, don't remove lock
      return false;
    } catch {
      // Process doesn't exist, remove stale lock
      unlinkSync(FILES_CONFIG.MEDIATOR_LOCK_FILE);
      return true;
    }
  } catch {
    // Error reading/parsing lock file, remove it
    try {
      unlinkSync(FILES_CONFIG.MEDIATOR_LOCK_FILE);
      return true;
    } catch {
      return false;
    }
  }
}
