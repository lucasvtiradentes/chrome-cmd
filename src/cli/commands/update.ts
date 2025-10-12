import { exec } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { platform } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import chalk from 'chalk';
import { Command } from 'commander';
import { createCommandFromSchema } from '../../shared/command-builder.js';
import { CommandNames } from '../../shared/commands-schema.js';
import { APP_NAME } from '../../shared/constants.js';
import { reinstallCompletionSilently } from './completion.js';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));

export function createUpdateCommand(): Command {
  return createCommandFromSchema(CommandNames.UPDATE).action(async () => {
    try {
      console.log(chalk.blue('Checking current version...'));

      const currentVersion = getCurrentVersion();
      if (!currentVersion) {
        console.error(chalk.red('Could not determine current version'));
        return;
      }

      console.log(chalk.blue('Checking latest version...'));

      const latestVersion = await getLatestVersion();
      if (!latestVersion) {
        console.error(chalk.red('Could not fetch latest version from npm'));
        return;
      }

      console.log(`📦 Current version: ${currentVersion}`);
      console.log(`📦 Latest version: ${latestVersion}`);

      if (currentVersion === latestVersion) {
        console.log(chalk.green(`✅ ${APP_NAME} is already up to date!`));
        return;
      }

      console.log(chalk.blue('Detecting package manager...'));

      const packageManager = await detectPackageManager();

      if (!packageManager) {
        console.error(chalk.red(`Could not detect how ${APP_NAME} was installed`));
        console.log(chalk.dim('Please update manually using your package manager'));
        return;
      }

      console.log(`📦 Detected package manager: ${packageManager}`);
      console.log(chalk.blue(`Updating ${APP_NAME} from ${currentVersion} to ${latestVersion}...`));

      const updateCommand = getUpdateCommand(packageManager);
      const { stdout, stderr } = await execAsync(updateCommand);

      if (stderr && !stderr.includes('npm WARN')) {
        console.error(chalk.red(`Error updating: ${stderr}`));
        return;
      }

      console.log(chalk.green(`✅ ${APP_NAME} updated successfully from ${currentVersion} to ${latestVersion}!`));

      if (stdout) {
        console.log(chalk.dim(stdout));
      }

      const completionReinstalled = await reinstallCompletionSilently();
      if (completionReinstalled) {
        console.log('');
        console.log(chalk.green('✨ Shell completion updated'));
        console.log('');
        console.log(chalk.yellow('⚠️  To apply completion changes, run:'));

        const currentShell = process.env.SHELL || '';
        if (currentShell.includes('zsh')) {
          console.log(chalk.cyan('  exec zsh'));
          console.log('');
          console.log(chalk.dim('  Or restart your terminal'));
        } else if (currentShell.includes('bash')) {
          console.log(chalk.cyan('  exec bash'));
          console.log('');
          console.log(chalk.dim('  Or restart your terminal'));
        } else {
          console.log(chalk.cyan('  Restart your shell or terminal'));
        }
      }
    } catch (error) {
      console.error(chalk.red('Error updating:'), error);
    }
  });
}

async function detectPackageManager(): Promise<string | null> {
  const npmPath = await getGlobalNpmPath();

  if (!npmPath) {
    return null;
  }

  const possiblePaths = [
    { manager: 'npm', patterns: ['/npm/', '\\npm\\', '/node/', '\\node\\'] },
    { manager: 'yarn', patterns: ['/yarn/', '\\yarn\\', '/.yarn/', '\\.yarn\\'] },
    { manager: 'pnpm', patterns: ['/pnpm/', '\\pnpm\\', '/.pnpm/', '\\.pnpm\\'] }
  ];

  for (const { manager, patterns } of possiblePaths) {
    if (patterns.some((pattern) => npmPath.includes(pattern))) {
      return manager;
    }
  }

  return 'npm';
}

async function getGlobalNpmPath(): Promise<string | null> {
  const isWindows = platform() === 'win32';

  try {
    const whereCommand = isWindows ? 'where' : 'which';
    const { stdout } = await execAsync(`${whereCommand} ${APP_NAME}`);
    const execPath = stdout.trim();

    if (execPath) {
      if (!isWindows) {
        try {
          const { stdout: realPath } = await execAsync(`readlink -f "${execPath}"`);
          return realPath.trim() || execPath;
        } catch {
          return execPath;
        }
      }
      return execPath;
    }
  } catch {
    try {
      const { stdout } = await execAsync(`npm list -g --depth=0 ${APP_NAME}`);
      if (stdout.includes(APP_NAME)) {
        return 'npm';
      }
    } catch {}
  }

  return null;
}

function getCurrentVersion(): string | null {
  try {
    const packagePath = join(__dirname, '../../package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    return packageJson.version;
  } catch {
    return null;
  }
}

async function getLatestVersion(): Promise<string | null> {
  try {
    const { stdout } = await execAsync(`npm view ${APP_NAME} version`);
    return stdout.trim();
  } catch {
    return null;
  }
}

function getUpdateCommand(packageManager: string): string {
  switch (packageManager) {
    case 'npm':
      return `npm update -g ${APP_NAME}`;
    case 'yarn':
      return `yarn global upgrade ${APP_NAME}`;
    case 'pnpm':
      return `pnpm update -g ${APP_NAME}`;
    default:
      return `npm update -g ${APP_NAME}`;
  }
}
