import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import chalk from 'chalk';
import { Command } from 'commander';
import { MEDIATOR_PORT } from '../../shared/constants.js';

const execAsync = promisify(exec);

export function createMediatorCommand(): Command {
  const mediator = new Command('mediator');
  mediator.description('Manage the mediator server');

  mediator
    .command('status')
    .description('Check mediator server status')
    .action(async () => {
      try {
        const result = await checkMediatorStatus();
        if (result.running) {
          console.log(chalk.green('✓ Mediator is running'));
          console.log(chalk.gray(`  PID: ${result.pid}`));
          console.log(chalk.gray(`  Port: ${MEDIATOR_PORT}`));
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
    .description('Kill the mediator server process')
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
    .description('Restart the mediator server')
    .action(async () => {
      try {
        console.log(chalk.blue('⟳ Restarting mediator...'));

        const killed = await killMediator();
        if (killed) {
          console.log(chalk.gray('  → Killed old process'));
        }

        // Wait a bit for port to be released
        await new Promise((resolve) => setTimeout(resolve, 1000));

        console.log(chalk.gray('  → Waiting for Chrome extension to restart it...'));
        console.log('');
        console.log(chalk.yellow('Please reload the Chrome extension at chrome://extensions/'));
        console.log(chalk.gray('The extension will automatically start a new mediator instance'));
      } catch (error) {
        console.error(chalk.red('Error restarting mediator:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  return mediator;
}

async function checkMediatorStatus(): Promise<{ running: boolean; pid?: number }> {
  try {
    // Check if port is in use
    const { stdout } = await execAsync(`lsof -i :${MEDIATOR_PORT} -t`);
    const pid = parseInt(stdout.trim(), 10);

    if (pid) {
      return { running: true, pid };
    }
  } catch {
    // lsof returns error if port not in use
  }

  return { running: false };
}

async function killMediator(): Promise<boolean> {
  try {
    // Find process using the port
    const { stdout } = await execAsync(`lsof -i :${MEDIATOR_PORT} -t`);
    const pid = stdout.trim();

    if (pid) {
      // Kill the process
      await execAsync(`kill -9 ${pid}`);
      return true;
    }
  } catch {
    // No process found or already killed
  }

  return false;
}
