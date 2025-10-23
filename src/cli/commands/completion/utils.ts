import { accessSync, constants, existsSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import chalk from 'chalk';
import {
  generateBashCompletion,
  generateZshCompletion
} from '../../../shared/commands/generators/completion-generator.js';
import { FILES_CONFIG } from '../../../shared/configs/files.config.js';
import { PathHelper } from '../../../shared/utils/helpers/path.helper.js';
import { detectShell as detectShellUtil } from '../../../shared/utils/helpers/shell-utils.js';
import { profileManager } from '../../lib/profile-manager.js';

const ZSH_COMPLETION_SCRIPT = generateZshCompletion();
const BASH_COMPLETION_SCRIPT = generateBashCompletion();

export function detectShell(): 'bash' | 'zsh' | null {
  return detectShellUtil();
}

export async function clearZshCompletionCache(): Promise<void> {
  try {
    const files = readdirSync(FILES_CONFIG.HOME);
    for (const file of files) {
      if (file.startsWith('.zcompdump')) {
        const fullPath = join(FILES_CONFIG.HOME, file);
        try {
          unlinkSync(fullPath);
        } catch {}
      }
    }

    const cacheDirs = [
      join(FILES_CONFIG.HOME, '.zsh_cache'),
      join(FILES_CONFIG.HOME, '.cache', 'zsh'),
      join(FILES_CONFIG.HOME, '.zcompcache')
    ];

    for (const cacheDir of cacheDirs) {
      if (existsSync(cacheDir)) {
        try {
          const cacheFiles = readdirSync(cacheDir);
          for (const file of cacheFiles) {
            if (file.includes('compdump') || file.includes('_chrome-cmd')) {
              try {
                unlinkSync(join(cacheDir, file));
              } catch {}
            }
          }
        } catch {}
      }
    }
  } catch {}
}

export async function installZshCompletion(silent = false): Promise<void> {
  const possibleDirs = FILES_CONFIG.ZSH_COMPLETION_DIRS;

  let targetDir: string | null = null;

  for (const dir of possibleDirs) {
    if (existsSync(dir)) {
      try {
        accessSync(dir, constants.W_OK);
        targetDir = dir;
        break;
      } catch {}
    }
  }

  if (!targetDir) {
    targetDir = join(FILES_CONFIG.HOME, '.zsh', 'completions');
  }

  const completionFile = join(targetDir, '_chrome-cmd');
  PathHelper.ensureDir(completionFile);
  writeFileSync(completionFile, ZSH_COMPLETION_SCRIPT);

  profileManager.setCompletionInstalled(true);

  if (!silent) {
    console.log(chalk.green(`✅ Zsh completion installed to ${completionFile}`));
    console.log('');
    console.log('To activate completion, add this to your ~/.zshrc:');
    console.log(chalk.cyan(`  fpath=(${targetDir} $fpath)`));
    console.log(chalk.cyan('  autoload -U compinit && compinit'));
    console.log('');
    console.log('Then restart your shell or run:');
    console.log(chalk.cyan('  source ~/.zshrc'));

    try {
      const zshrc = join(FILES_CONFIG.HOME, '.zshrc');
      if (existsSync(zshrc)) {
        const zshrcContent = readFileSync(zshrc, 'utf8');
        if (!zshrcContent.includes(targetDir)) {
          console.log('');
          console.log(chalk.yellow('⚠️  Remember to add the fpath line to your ~/.zshrc for autocompletion to work!'));
        }
      }
    } catch (_error) {}
  }
}

export async function installBashCompletion(silent = false): Promise<void> {
  const possibleDirs = FILES_CONFIG.BASH_COMPLETION_DIRS;

  let targetDir: string | null = null;

  for (const dir of possibleDirs) {
    if (existsSync(dir)) {
      try {
        accessSync(dir, constants.W_OK);
        targetDir = dir;
        break;
      } catch {}
    }
  }

  if (!targetDir) {
    targetDir = join(FILES_CONFIG.HOME, '.bash_completion.d');
  }

  const completionFile = join(targetDir, 'chrome-cmd');
  PathHelper.ensureDir(completionFile);
  writeFileSync(completionFile, BASH_COMPLETION_SCRIPT);

  profileManager.setCompletionInstalled(true);

  if (!silent) {
    console.log(chalk.green(`✅ Bash completion installed to ${completionFile}`));
    console.log('');
    console.log('To activate completion, add this to your ~/.bashrc:');
    console.log(chalk.cyan(`  source ${completionFile}`));
    console.log('');
    console.log('Then restart your shell or run:');
    console.log(chalk.cyan('  source ~/.bashrc'));
  }
}

export async function uninstallZshCompletion(silent = false): Promise<void> {
  const possibleDirs = FILES_CONFIG.ZSH_COMPLETION_DIRS;

  let foundFiles = 0;

  for (const dir of possibleDirs) {
    const completionFile = join(dir, '_chrome-cmd');
    if (existsSync(completionFile)) {
      try {
        unlinkSync(completionFile);
        foundFiles++;
        if (!silent) {
          console.log(chalk.green(`✅ Removed completion file: ${completionFile}`));
        }
      } catch (error) {
        if (!silent) {
          console.error(chalk.yellow(`⚠️  Could not remove ${completionFile}: ${error}`));
        }
      }
    }
  }

  await clearZshCompletionCache();

  profileManager.setCompletionInstalled(false);

  if (!silent) {
    if (foundFiles === 0) {
      console.log(chalk.yellow('⚠️  No completion files found'));
    } else {
      console.log('');
      console.log(chalk.green('✅ Zsh completion uninstalled successfully'));
      console.log('');
      console.log('Restart your shell or run:');
      console.log(chalk.cyan('  source ~/.zshrc'));
    }
  }
}

export async function uninstallBashCompletion(silent = false): Promise<void> {
  const possibleDirs = FILES_CONFIG.BASH_COMPLETION_DIRS;

  let foundFiles = 0;

  for (const dir of possibleDirs) {
    const completionFile = join(dir, 'chrome-cmd');
    if (existsSync(completionFile)) {
      try {
        unlinkSync(completionFile);
        foundFiles++;
        if (!silent) {
          console.log(chalk.green(`✅ Removed completion file: ${completionFile}`));
        }
      } catch (error) {
        if (!silent) {
          console.error(chalk.yellow(`⚠️  Could not remove ${completionFile}: ${error}`));
        }
      }
    }
  }

  profileManager.setCompletionInstalled(false);

  if (!silent) {
    if (foundFiles === 0) {
      console.log(chalk.yellow('⚠️  No completion files found'));
    } else {
      console.log('');
      console.log(chalk.green('✅ Bash completion uninstalled successfully'));
      console.log('');
      console.log('Restart your shell or run:');
      console.log(chalk.cyan('  source ~/.bashrc'));
    }
  }
}

export async function reinstallCompletionSilently(): Promise<boolean> {
  try {
    if (!profileManager.isCompletionInstalled()) {
      return false;
    }

    const shell = detectShell();

    switch (shell) {
      case 'zsh':
        await installZshCompletion(true);
        await clearZshCompletionCache();
        return true;
      case 'bash':
        await installBashCompletion(true);
        return true;
      default:
        return false;
    }
  } catch {
    return false;
  }
}

export async function uninstallCompletionSilently(): Promise<boolean> {
  try {
    if (!profileManager.isCompletionInstalled()) {
      return false;
    }

    const shell = detectShell();

    switch (shell) {
      case 'zsh':
        await uninstallZshCompletion(true);
        return true;
      case 'bash':
        await uninstallBashCompletion(true);
        return true;
      default:
        return false;
    }
  } catch {
    return false;
  }
}
