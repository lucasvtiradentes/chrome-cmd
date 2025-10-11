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

const ZSH_COMPLETION_SCRIPT = `#compdef chrome-cmd chromecmd chr

_chrome() {
    local state line context
    typeset -A opt_args

    _arguments -C \
        '1: :_chrome_commands' \
        '*::arg:->args'

    case $state in
        args)
            case $line[1] in
                tabs)
                    _chrome_tabs
                    ;;
                host)
                    _chrome_host
                    ;;
                mediator)
                    _chrome_mediator
                    ;;
                completion)
                    _chrome_completion
                    ;;
                update)
                    # No subcommands for update
                    ;;
            esac
            ;;
    esac
}

_chrome_commands() {
    local commands
    commands=(
        'tabs:Manage Chrome tabs'
        'host:Manage Native Messaging Host'
        'mediator:Manage mediator server'
        'update:Update chrome-cmd to latest version'
        'completion:Generate shell completion scripts'
    )
    _describe 'command' commands
}

_chrome_tabs() {
    local curcontext="$curcontext" state line
    typeset -A opt_args

    _arguments -C \
        '1: :_chrome_tabs_commands' \
        '*::arg:->args'
}

_chrome_tabs_commands() {
    local tabs_commands
    tabs_commands=(
        'list:List all open Chrome tabs'
        'select:Select tab for subsequent commands'
        'focus:Focus/activate a tab (bring to front)'
        'create:Create a new tab'
        'navigate:Navigate tab to a specific URL'
        'exec:Execute JavaScript in selected tab'
        'close:Close selected tab'
        'refresh:Reload/refresh selected tab'
        'screenshot:Capture screenshot of selected tab'
        'html:Extract HTML content from selected tab'
        'logs:Get console logs from selected tab'
        'requests:Get network requests from selected tab'
        'storage:Get storage data from selected tab'
        'click:Click on an element in selected tab'
        'input:Fill an input field in selected tab'
    )
    _describe 'tabs command' tabs_commands
}

_chrome_host() {
    local curcontext="$curcontext" state line
    typeset -A opt_args

    _arguments -C \
        '1: :_chrome_host_commands' \
        '*::arg:->args'
}

_chrome_host_commands() {
    local host_commands
    host_commands=(
        'install:Install Native Messaging Host'
        'uninstall:Uninstall Native Messaging Host'
    )
    _describe 'host command' host_commands
}

_chrome_mediator() {
    local curcontext="$curcontext" state line
    typeset -A opt_args

    _arguments -C \
        '1: :_chrome_mediator_commands' \
        '*::arg:->args'
}

_chrome_mediator_commands() {
    local mediator_commands
    mediator_commands=(
        'status:Check mediator server status'
        'kill:Kill mediator server process'
        'restart:Restart mediator server'
    )
    _describe 'mediator command' mediator_commands
}

_chrome_completion() {
    local completion_commands
    completion_commands=(
        'install:Install shell completion'
    )
    _describe 'completion command' completion_commands
}

_chrome "$@"
`;

const BASH_COMPLETION_SCRIPT = `#!/bin/bash

_chrome_completion() {
    local cur prev words cword
    _init_completion || return

    # Main commands
    local commands="tabs host mediator update completion"

    # Tabs subcommands
    local tabs_commands="list select focus create navigate exec close refresh screenshot html logs requests storage click input"

    # Host subcommands
    local host_commands="install uninstall"

    # Mediator subcommands
    local mediator_commands="status kill restart"

    if [[ $cword -eq 1 ]]; then
        COMPREPLY=($(compgen -W "$commands" -- "$cur"))
    elif [[ $cword -eq 2 ]]; then
        case "\${COMP_WORDS[1]}" in
            tabs)
                COMPREPLY=($(compgen -W "$tabs_commands" -- "$cur"))
                ;;
            host)
                COMPREPLY=($(compgen -W "$host_commands" -- "$cur"))
                ;;
            mediator)
                COMPREPLY=($(compgen -W "$mediator_commands" -- "$cur"))
                ;;
            completion)
                COMPREPLY=($(compgen -W "install" -- "$cur"))
                ;;
        esac
    fi
}

complete -F _chrome_completion chrome-cmd
complete -F _chrome_completion chromecmd
complete -F _chrome_completion chr
`;

export function createCompletionCommand(): Command {
  const completion = new Command('completion');
  completion.description('Generate shell completion scripts');

  completion
    .command('install')
    .description('Install shell completion for your current shell')
    .action(async () => {
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

  return completion;
}

/**
 * Reinstall completion silently (used after update) - only if already installed
 */
export async function reinstallCompletionSilently(): Promise<boolean> {
  // Check if completion was previously installed by looking for completion files
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

    // Reinstall silently
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

/**
 * Clear ZSH completion cache to force reload
 */
async function clearZshCompletionCache(): Promise<void> {
  const homeDir = homedir();

  try {
    const files = readdirSync(homeDir);
    for (const file of files) {
      if (file.startsWith('.zcompdump')) {
        const fullPath = join(homeDir, file);
        try {
          unlinkSync(fullPath);
        } catch {
          // Ignore errors when deleting individual cache files
        }
      }
    }
  } catch {
    // Ignore errors when reading directory
  }
}

function detectShell(): string {
  const shell = process.env.SHELL || '';

  if (shell.includes('zsh')) {
    return 'zsh';
  } else if (shell.includes('bash')) {
    return 'bash';
  }

  // Fallback to zsh if we can't detect
  return 'zsh';
}

async function installZshCompletion(silent = false): Promise<void> {
  const homeDir = homedir();

  // Try different zsh completion directories (prioritize user directories)
  const possibleDirs = [
    join(homeDir, '.oh-my-zsh', 'completions'),
    join(homeDir, '.zsh', 'completions'),
    join(homeDir, '.config', 'zsh', 'completions'),
    join(homeDir, '.local', 'share', 'zsh', 'site-functions'),
    '/usr/local/share/zsh/site-functions'
  ];

  let targetDir: string | null = null;

  // Find the first existing and writable directory
  for (const dir of possibleDirs) {
    if (existsSync(dir)) {
      try {
        accessSync(dir, constants.W_OK);
        targetDir = dir;
        break;
      } catch {}
    }
  }

  // If no existing directory found, create one in user's home
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

    // Check if fpath already includes the directory
    try {
      const zshrc = join(homeDir, '.zshrc');
      if (existsSync(zshrc)) {
        const zshrcContent = readFileSync(zshrc, 'utf8');
        if (!zshrcContent.includes(targetDir)) {
          console.log('');
          console.log(chalk.yellow('⚠️  Remember to add the fpath line to your ~/.zshrc for autocompletion to work!'));
        }
      }
    } catch (_error) {
      // Ignore errors when checking .zshrc
    }
  }
}

async function installBashCompletion(silent = false): Promise<void> {
  const homeDir = homedir();

  // Try different bash completion directories (prioritize user directories)
  const possibleDirs = [
    join(homeDir, '.bash_completion.d'),
    join(homeDir, '.local', 'share', 'bash-completion', 'completions'),
    '/usr/local/etc/bash_completion.d',
    '/etc/bash_completion.d'
  ];

  let targetDir: string | null = null;

  // Find the first existing and writable directory
  for (const dir of possibleDirs) {
    if (existsSync(dir)) {
      try {
        accessSync(dir, constants.W_OK);
        targetDir = dir;
        break;
      } catch {}
    }
  }

  // If no existing directory found, create one in user's home
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
