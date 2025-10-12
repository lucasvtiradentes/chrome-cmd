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

      // Only try to reinstall completion on Unix-like systems (Linux/macOS)
      const isUnix = platform() !== 'win32';
      if (isUnix) {
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
      }
    } catch (error) {
      console.error(chalk.red('Error updating:'), error);
    }
  });
}

async function detectPackageManager(): Promise<string | null> {
  const isWindows = platform() === 'win32';

  // Method 1: Try to get the executable path and analyze it
  const execPath = await getExecutablePath();
  if (execPath) {
    const manager = detectManagerFromPath(execPath);
    if (manager) {
      return manager;
    }
  }

  // Method 2: Check npm global list as fallback
  try {
    const npmCheckCmd = isWindows
      ? `npm list -g --depth=0 ${APP_NAME} 2>nul`
      : `npm list -g --depth=0 ${APP_NAME} 2>/dev/null`;

    const { stdout } = await execAsync(npmCheckCmd);
    if (stdout.includes(APP_NAME)) {
      return 'npm';
    }
  } catch {
    // Ignore errors
  }

  // Method 3: Check other package managers
  try {
    const managers = ['pnpm', 'yarn'];
    for (const manager of managers) {
      const checkCmd = isWindows
        ? `${manager} list -g ${APP_NAME} 2>nul`
        : `${manager} list -g ${APP_NAME} 2>/dev/null`;

      try {
        const { stdout } = await execAsync(checkCmd);
        if (stdout.includes(APP_NAME)) {
          return manager;
        }
      } catch {}
    }
  } catch {
    // Ignore errors
  }

  return null;
}

async function getExecutablePath(): Promise<string | null> {
  const isWindows = platform() === 'win32';
  const isMac = platform() === 'darwin';

  try {
    // Step 1: Find the executable location
    const whereCommand = isWindows ? 'where' : 'which';
    const { stdout } = await execAsync(`${whereCommand} ${APP_NAME}`);

    // Windows 'where' can return multiple lines, take the first one
    const execPath = stdout.trim().split('\n')[0].trim();

    if (!execPath) {
      return null;
    }

    // Step 2: Resolve symlinks (Unix-like systems only)
    if (!isWindows) {
      try {
        // macOS doesn't have readlink -f, try different approaches
        if (isMac) {
          // Try readlink without -f first
          try {
            const { stdout: linkedPath } = await execAsync(`readlink "${execPath}"`);
            if (linkedPath.trim()) {
              return linkedPath.trim();
            }
          } catch {
            // readlink failed, maybe it's not a symlink
            return execPath;
          }
        } else {
          // Linux has readlink -f
          const { stdout: realPath } = await execAsync(`readlink -f "${execPath}"`);
          return realPath.trim() || execPath;
        }
      } catch {
        return execPath;
      }
    }

    return execPath;
  } catch {
    return null;
  }
}

function detectManagerFromPath(path: string): string | null {
  // Normalize path separators for Windows
  const normalizedPath = path.replace(/\\/g, '/').toLowerCase();

  // Check for package manager patterns
  const patterns = [
    { manager: 'pnpm', patterns: ['/pnpm/', '/.pnpm/'] },
    { manager: 'yarn', patterns: ['/yarn/', '/.yarn/'] },
    { manager: 'npm', patterns: ['/npm/', '/node_modules/', '/node/'] }
  ];

  // Check in priority order (pnpm, yarn, then npm)
  for (const { manager, patterns: managerPatterns } of patterns) {
    if (managerPatterns.some((pattern) => normalizedPath.includes(pattern))) {
      return manager;
    }
  }

  // Default to npm if we found the executable but couldn't determine the manager
  return 'npm';
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
