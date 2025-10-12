import {
  accessSync,
  constants,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync
} from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import chalk from 'chalk';
import { Command } from 'commander';
import { createCommandFromSchema, createSubCommandFromSchema } from '../../shared/command-builder.js';
import { CommandNames, SubCommandNames } from '../../shared/commands-schema.js';
import { generateBashCompletion, generateZshCompletion } from '../../shared/generators/completion-generator.js';
import { configManager } from '../lib/config-manager.js';

const ZSH_COMPLETION_SCRIPT = generateZshCompletion();
const BASH_COMPLETION_SCRIPT = generateBashCompletion();

function createInstallCommand(): Command {
  return createSubCommandFromSchema(CommandNames.COMPLETION, SubCommandNames.COMPLETION_INSTALL, async () => {
    const shell = detectShell();

    try {
      switch (shell) {
        case 'zsh':
          await installZshCompletion();
          break;
        case 'bash':
          await installBashCompletion();
          break;
        default:
          console.error(chalk.red(`❌ Unsupported shell: ${shell}`));
          console.log('');
          console.log('🐚 Supported shells: zsh, bash');
          console.log('💡 Please switch to a supported shell to use autocompletion');
          process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`Failed to install completion: ${error}`));
      process.exit(1);
    }
  });
}

function createUninstallCommand(): Command {
  return createSubCommandFromSchema(CommandNames.COMPLETION, SubCommandNames.COMPLETION_UNINSTALL, async () => {
    const shell = detectShell();

    try {
      switch (shell) {
        case 'zsh':
          await uninstallZshCompletion();
          break;
        case 'bash':
          await uninstallBashCompletion();
          break;
        default:
          console.error(chalk.red(`❌ Unsupported shell: ${shell}`));
          console.log('');
          console.log('🐚 Supported shells: zsh, bash');
          process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`Failed to uninstall completion: ${error}`));
      process.exit(1);
    }
  });
}

export function createCompletionCommand(): Command {
  const completion = createCommandFromSchema(CommandNames.COMPLETION);

  completion.addCommand(createInstallCommand());
  completion.addCommand(createUninstallCommand());

  return completion;
}

export async function reinstallCompletionSilently(): Promise<boolean> {
  try {
    // Check if user has previously installed completion
    if (!configManager.isCompletionInstalled()) {
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

async function clearZshCompletionCache(): Promise<void> {
  const homeDir = homedir();

  try {
    const files = readdirSync(homeDir);
    for (const file of files) {
      if (file.startsWith('.zcompdump')) {
        const fullPath = join(homeDir, file);
        try {
          unlinkSync(fullPath);
        } catch {}
      }
    }

    const cacheDirs = [join(homeDir, '.zsh_cache'), join(homeDir, '.cache', 'zsh'), join(homeDir, '.zcompcache')];

    for (const cacheDir of cacheDirs) {
      if (existsSync(cacheDir)) {
        try {
          const cacheFiles = readdirSync(cacheDir);
          for (const file of cacheFiles) {
            if (file.includes('compdump') || file.includes('_chrome')) {
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

function detectShell(): string {
  const shell = process.env.SHELL || '';

  if (shell.includes('zsh')) {
    return 'zsh';
  } else if (shell.includes('bash')) {
    return 'bash';
  }

  return 'zsh';
}

async function installZshCompletion(silent = false): Promise<void> {
  const homeDir = homedir();

  const possibleDirs = [
    join(homeDir, '.oh-my-zsh', 'completions'),
    join(homeDir, '.zsh', 'completions'),
    join(homeDir, '.config', 'zsh', 'completions'),
    join(homeDir, '.local', 'share', 'zsh', 'site-functions'),
    '/usr/local/share/zsh/site-functions'
  ];

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
    targetDir = join(homeDir, '.zsh', 'completions');
    mkdirSync(targetDir, { recursive: true });
  }

  const completionFile = join(targetDir, '_chrome');
  writeFileSync(completionFile, ZSH_COMPLETION_SCRIPT);

  // Save that completion was installed
  configManager.setCompletionInstalled(true);

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
      const zshrc = join(homeDir, '.zshrc');
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

async function installBashCompletion(silent = false): Promise<void> {
  const homeDir = homedir();

  const possibleDirs = [
    join(homeDir, '.bash_completion.d'),
    join(homeDir, '.local', 'share', 'bash-completion', 'completions'),
    '/usr/local/etc/bash_completion.d',
    '/etc/bash_completion.d'
  ];

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
    targetDir = join(homeDir, '.bash_completion.d');
    mkdirSync(targetDir, { recursive: true });
  }

  const completionFile = join(targetDir, 'chrome');
  writeFileSync(completionFile, BASH_COMPLETION_SCRIPT);

  // Save that completion was installed
  configManager.setCompletionInstalled(true);

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

async function uninstallZshCompletion(silent = false): Promise<void> {
  const homeDir = homedir();

  const possibleDirs = [
    join(homeDir, '.oh-my-zsh', 'completions'),
    join(homeDir, '.zsh', 'completions'),
    join(homeDir, '.config', 'zsh', 'completions'),
    join(homeDir, '.local', 'share', 'zsh', 'site-functions'),
    '/usr/local/share/zsh/site-functions'
  ];

  let foundFiles = 0;

  for (const dir of possibleDirs) {
    const completionFile = join(dir, '_chrome');
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

  // Clear zsh completion cache
  await clearZshCompletionCache();

  // Mark completion as uninstalled
  configManager.setCompletionInstalled(false);

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

async function uninstallBashCompletion(silent = false): Promise<void> {
  const homeDir = homedir();

  const possibleDirs = [
    join(homeDir, '.bash_completion.d'),
    join(homeDir, '.local', 'share', 'bash-completion', 'completions'),
    '/usr/local/etc/bash_completion.d',
    '/etc/bash_completion.d'
  ];

  let foundFiles = 0;

  for (const dir of possibleDirs) {
    const completionFile = join(dir, 'chrome');
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

  // Mark completion as uninstalled
  configManager.setCompletionInstalled(false);

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

export async function uninstallCompletionSilently(): Promise<boolean> {
  try {
    // Check if user has previously installed completion
    if (!configManager.isCompletionInstalled()) {
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
