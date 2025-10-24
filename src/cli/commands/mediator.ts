import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { Command } from 'commander';
import { BRIDGE_CONFIGS } from '../../shared/configs/bridge.configs.js';
import { FILES_CONFIG } from '../../shared/configs/files.config.js';
import { logger } from '../../shared/utils/helpers/logger.js';
import { execAsync } from '../../shared/utils/helpers.js';

export function createMediatorCommand(): Command {
  const mediator = new Command('mediator').description('Manage the native messaging mediator process (internal/debug)');

  mediator
    .command('status')
    .description('Check if mediator is running')
    .action(async () => {
      try {
        const result = await checkMediatorStatus();
        if (result.running) {
          logger.success('✓ Mediator is running');
          logger.dim(`  PID: ${result.pid}`);
          logger.dim(`  Port: ${BRIDGE_CONFIGS.PORT}`);
        } else {
          logger.warning('○ Mediator is not running');
        }
      } catch (error) {
        logger.error('Error checking status:', error instanceof Error ? error.message : error);
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
          logger.success('✓ Mediator process killed');
          logger.dim('\nTip: The Chrome extension will restart it automatically when needed');
        } else {
          logger.warning('○ No mediator process found');
        }
      } catch (error) {
        logger.error('Error killing mediator:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  mediator
    .command('restart')
    .description('Restart the mediator process')
    .action(async () => {
      try {
        logger.blue('⟳ Restarting mediator...');
        logger.newline();

        const lockCleaned = await cleanLockFile();
        if (lockCleaned) {
          logger.dim('  ✓ Cleaned stale lock file');
        }

        const killed = await killMediator();
        if (killed) {
          logger.dim('  ✓ Killed old process');
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));

        logger.dim('  ✓ Waiting for Chrome extension to restart it...');
        logger.newline();
        logger.warning('Please reload the Chrome extension at chrome://extensions/');
        logger.dim('The extension will automatically start a new mediator instance');
        logger.newline();
      } catch (error) {
        logger.error('Error restarting mediator:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  return mediator;
}

async function checkMediatorStatus(): Promise<{ running: boolean; pid?: number }> {
  try {
    const { stdout } = await execAsync(`lsof -i :${BRIDGE_CONFIGS.PORT} -t`);
    const pid = parseInt(stdout.trim(), 10);

    if (pid) {
      return { running: true, pid };
    }
  } catch {}

  return { running: false };
}

async function killMediator(): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`lsof -i :${BRIDGE_CONFIGS.PORT} -t`);
    const pid = stdout.trim();

    if (pid) {
      await execAsync(`kill -9 ${pid}`);
      return true;
    }
  } catch {}

  return false;
}

async function cleanLockFile(): Promise<boolean> {
  if (!existsSync(FILES_CONFIG.BRIDGE_LOCK_FILE)) {
    return false;
  }

  try {
    const lockContent = readFileSync(FILES_CONFIG.BRIDGE_LOCK_FILE, 'utf-8').trim();

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
      unlinkSync(FILES_CONFIG.BRIDGE_LOCK_FILE);
      return true;
    }
  } catch {
    // Error reading/parsing lock file, remove it
    try {
      unlinkSync(FILES_CONFIG.BRIDGE_LOCK_FILE);
      return true;
    } catch {
      return false;
    }
  }
}
