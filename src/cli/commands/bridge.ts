import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { Command } from 'commander';
import { BRIDGE_CONFIG } from '../../shared/configs/bridge.config.js';
import { FILES_CONFIG } from '../../shared/configs/files.config.js';
import { logger } from '../../shared/utils/helpers/logger.js';
import { execAsync } from '../utils/cli-utils.js';

export function createBridgeCommand(): Command {
  const bridge = new Command('bridge').description('Manage the bridge process (internal/debug)');

  bridge
    .command('status')
    .description('Check if bridge is running')
    .action(async () => {
      try {
        const result = await checkBridgeStatus();
        if (result.running) {
          logger.success('✓ Bridge is running');
          logger.dim(`  PID: ${result.pid}`);
          logger.dim(`  Port: ${BRIDGE_CONFIG.PORT}`);
        } else {
          logger.warning('○ Bridge is not running');
        }
      } catch (error) {
        logger.error('Error checking status:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  bridge
    .command('kill')
    .description('Kill the bridge process')
    .action(async () => {
      try {
        const killed = await killBridge();
        if (killed) {
          logger.success('✓ Bridge process killed');
          logger.dim('\nTip: The Chrome extension will restart it automatically when needed');
        } else {
          logger.warning('○ No bridge process found');
        }
      } catch (error) {
        logger.error('Error killing bridge:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  bridge
    .command('restart')
    .description('Restart the bridge process')
    .action(async () => {
      try {
        logger.blue('⟳ Restarting bridge...');
        logger.newline();

        const lockCleaned = await cleanLockFile();
        if (lockCleaned) {
          logger.dim('  ✓ Cleaned stale lock file');
        }

        const killed = await killBridge();
        if (killed) {
          logger.dim('  ✓ Killed old process');
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));

        logger.dim('  ✓ Waiting for Chrome extension to restart it...');
        logger.newline();
        logger.warning('Please reload the Chrome extension at chrome://extensions/');
        logger.dim('The extension will automatically start a new bridge instance');
        logger.newline();
      } catch (error) {
        logger.error('Error restarting bridge:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  return bridge;
}

async function checkBridgeStatus(): Promise<{ running: boolean; pid?: number }> {
  try {
    const { stdout } = await execAsync(`lsof -i :${BRIDGE_CONFIG.PORT} -t`);
    const pid = parseInt(stdout.trim(), 10);

    if (pid) {
      return { running: true, pid };
    }
  } catch {}

  return { running: false };
}

async function killBridge(): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`lsof -i :${BRIDGE_CONFIG.PORT} -t`);
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
