import { exec } from 'child_process';
import { Command } from 'commander';
import { readFileSync } from 'fs';
import { platform } from 'os';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

import { Logger } from '../lib/logger.js';
import { reinstallCompletionSilently } from './completion.js';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));

export function createUpdateCommand(): Command {
  return new Command('update').description('Update the linear-cmd package to the latest version').action(async () => {
    try {
      Logger.loading('Checking current version...');

      const currentVersion = getCurrentVersion();
      if (!currentVersion) {
        Logger.error('Could not determine current version');
        return;
      }

      Logger.loading('Checking latest version...');

      const latestVersion = await getLatestVersion();
      if (!latestVersion) {
        Logger.error('Could not fetch latest version from npm');
        return;
      }

      Logger.info(`📦 Current version: ${currentVersion}`);
      Logger.info(`📦 Latest version: ${latestVersion}`);

      if (currentVersion === latestVersion) {
        Logger.success('linear-cmd is already up to date!');
        return;
      }

      Logger.loading('Detecting package manager...');

      const packageManager = await detectPackageManager();

      if (!packageManager) {
        Logger.error('Could not detect how linear-cmd was installed');
        Logger.dim('Please update manually using your package manager');
        return;
      }

      Logger.info(`📦 Detected package manager: ${packageManager}`);
      Logger.loading(`Updating linear-cmd from ${currentVersion} to ${latestVersion}...`);

      const updateCommand = getUpdateCommand(packageManager);
      const { stdout, stderr } = await execAsync(updateCommand);

      if (stderr && !stderr.includes('npm WARN')) {
        Logger.error(`Error updating: ${stderr}`);
        return;
      }

      Logger.success(`linear-cmd updated successfully from ${currentVersion} to ${latestVersion}!`);

      if (stdout) {
        Logger.dim(stdout);
      }

      // Attempt to reinstall shell completions silently
      const completionReinstalled = await reinstallCompletionSilently();
      if (completionReinstalled) {
        Logger.dim('✨ Shell completion updated');
        Logger.info('');
        Logger.info('To activate the updated completion, run:');

        const currentShell = process.env.SHELL || '';
        if (currentShell.includes('zsh')) {
          Logger.info('  exec zsh');
        } else if (currentShell.includes('bash')) {
          Logger.info('  exec bash');
        } else {
          Logger.info('  # Restart your shell');
        }
      }
    } catch (error) {
      Logger.error('Error updating', error);
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

  // Default to npm if we can't determine
  return 'npm';
}

async function getGlobalNpmPath(): Promise<string | null> {
  const isWindows = platform() === 'win32';

  try {
    // Try to find the linear-cmd executable
    const whereCommand = isWindows ? 'where' : 'which';
    const { stdout } = await execAsync(`${whereCommand} linear-cmd`);
    const execPath = stdout.trim();

    if (execPath) {
      // On Unix systems, this might be a symlink, so resolve it
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
    // If which/where fails, try npm list
    try {
      const { stdout } = await execAsync('npm list -g --depth=0 linear-cmd');
      if (stdout.includes('linear-cmd')) {
        return 'npm';
      }
    } catch {
      // Continue to other methods
    }
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
    const { stdout } = await execAsync('npm view linear-cmd version');
    return stdout.trim();
  } catch {
    return null;
  }
}

function getUpdateCommand(packageManager: string): string {
  switch (packageManager) {
    case 'npm':
      return 'npm update -g linear-cmd';
    case 'yarn':
      return 'yarn global upgrade linear-cmd';
    case 'pnpm':
      return 'pnpm update -g linear-cmd';
    default:
      return 'npm update -g linear-cmd';
  }
}
