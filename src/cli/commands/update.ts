import { Command } from 'commander';
import { CommandNames } from '../../shared/commands/definitions.js';
import { createCommandFromSchema } from '../../shared/commands/utils.js';
import { APP_NAME } from '../../shared/constants/constants.js';
import { APP_INFO } from '../../shared/constants/constants-node.js';
import { logger } from '../../shared/utils/helpers/logger.js';
import { PathHelper } from '../../shared/utils/helpers/path.helper.js';
import { detectShell, getShellRestartCommand } from '../../shared/utils/helpers/shell-utils.js';
import { execAsync } from '../../shared/utils/helpers.js';
import { reinstallCompletionSilently } from './completion/index.js';

export function createUpdateCommand(): Command {
  return createCommandFromSchema(CommandNames.UPDATE).action(async () => {
    try {
      logger.blue('Checking current version...');

      const currentVersion = APP_INFO.version;

      logger.blue('Checking latest version...');

      const latestVersion = await getLatestVersion();
      if (!latestVersion) {
        logger.error('Could not fetch latest version from npm');
        return;
      }

      logger.info(`📦 Current version: ${currentVersion}`);
      logger.info(`📦 Latest version: ${latestVersion}`);

      if (currentVersion === latestVersion) {
        logger.success(`✅ ${APP_NAME} is already up to date!`);
        return;
      }

      logger.blue('Detecting package manager...');

      const packageManager = await detectPackageManager();

      if (!packageManager) {
        logger.error(`Could not detect how ${APP_NAME} was installed`);
        logger.dim('Please update manually using your package manager');
        return;
      }

      logger.info(`📦 Detected package manager: ${packageManager}`);
      logger.blue(`Updating ${APP_NAME} from ${currentVersion} to ${latestVersion}...`);

      const updateCommand = getUpdateCommand(packageManager);
      const { stdout, stderr } = await execAsync(updateCommand);

      if (stderr && !stderr.includes('npm WARN')) {
        logger.error(`Error updating: ${stderr}`);
        return;
      }

      logger.success(`✅ ${APP_NAME} updated successfully from ${currentVersion} to ${latestVersion}!`);

      if (stdout) {
        logger.dim(stdout);
      }

      const isUnix = !PathHelper.isWindows();
      if (isUnix) {
        const completionReinstalled = await reinstallCompletionSilently();
        if (completionReinstalled) {
          const shell = detectShell();

          logger.newline();
          logger.success('✨ Shell completion updated');
          logger.newline();
          logger.warning('⚠️  To apply completion changes, run:');

          const command = getShellRestartCommand(shell);
          if (command.includes('exec')) {
            logger.cyan(`  ${command}`);
            logger.newline();
            logger.dim('  Or restart your terminal');
          } else {
            logger.cyan(`  ${command}`);
          }
        }
      }
    } catch (error) {
      logger.error('Error updating:', error);
    }
  });
}

async function detectPackageManager(): Promise<string | null> {
  const execPath = await getExecutablePath();
  if (execPath) {
    const manager = detectManagerFromPath(execPath);
    if (manager) {
      return manager;
    }
  }

  const nullRedirect = PathHelper.isWindows() ? '2>nul' : '2>/dev/null';

  const npmCheckCmd = `npm list -g --depth=0 ${APP_NAME} ${nullRedirect}`;
  try {
    const { stdout } = await execAsync(npmCheckCmd);
    if (stdout.includes(APP_NAME)) {
      return 'npm';
    }
  } catch {}

  const managers = ['pnpm', 'yarn'];
  for (const manager of managers) {
    const checkCmd = `${manager} list -g ${APP_NAME} ${nullRedirect}`;
    try {
      const { stdout } = await execAsync(checkCmd);
      if (stdout.includes(APP_NAME)) {
        return manager;
      }
    } catch {}
  }

  return null;
}

async function getExecutablePath(): Promise<string | null> {
  const isWindows = PathHelper.isWindows();
  const isMac = PathHelper.isMac();

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
