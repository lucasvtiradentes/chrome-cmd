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
import { generateBashCompletion, generateZshCompletion } from '../../shared/generators/completion-generator';

const ZSH_COMPLETION_SCRIPT = generateZshCompletion();
const BASH_COMPLETION_SCRIPT = generateBashCompletion();

export function createCompletionCommand(): Command {
  const completion = createCommandFromSchema(CommandNames.COMPLETION);

  completion.addCommand(
    createSubCommandFromSchema(CommandNames.COMPLETION, SubCommandNames.COMPLETION_INSTALL, async () => {
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
    })
  );

  return completion;
}

export async function reinstallCompletionSilently(): Promise<boolean> {
  const homeDir = homedir();
  const shell = detectShell();

  try {
    let completionExists = false;

    if (shell === 'zsh') {
      const possibleFiles = [
        join(homeDir, '.oh-my-zsh', 'completions', '_chrome'),
        join(homeDir, '.zsh', 'completions', '_chrome'),
        join(homeDir, '.config', 'zsh', 'completions', '_chrome'),
        join(homeDir, '.local', 'share', 'zsh', 'site-functions', '_chrome')
      ];
      completionExists = possibleFiles.some((f) => existsSync(f));
    } else if (shell === 'bash') {
      const possibleFiles = [
        join(homeDir, '.bash_completion.d', 'chrome'),
        join(homeDir, '.local', 'share', 'bash-completion', 'completions', 'chrome')
      ];
      completionExists = possibleFiles.some((f) => existsSync(f));
    }

    if (!completionExists) {
      return false;
    }

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
