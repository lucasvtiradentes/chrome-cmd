import { accessSync, constants, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import chalk from 'chalk';
import { Command } from 'commander';

import { ConfigManager } from '../lib/config-manager.js';
import { Logger } from '../lib/logger.js';

const ZSH_COMPLETION_SCRIPT = `#compdef linear-cmd linear lin

_linear() {
    local state line context
    typeset -A opt_args

    _arguments -C \
        '1: :_linear_commands' \
        '*::arg:->args'

    case $state in
        args)
            case $line[1] in
                account)
                    _linear_account
                    ;;
                issue)
                    _linear_issue
                    ;;
                project)
                    _linear_project
                    ;;
                document)
                    _linear_document
                    ;;
                completion)
                    _linear_completion
                    ;;
                update)
                    # No subcommands for update
                    ;;
            esac
            ;;
    esac
}

_linear_commands() {
    local commands
    commands=(
        'account:Manage Linear accounts'
        'issue:Manage Linear issues'
        'project:Manage Linear projects'
        'document:Manage Linear documents'
        'update:Update linear-cmd to latest version'
        'completion:Generate shell completion scripts'
    )
    _describe 'command' commands
}

_linear_account() {
    local curcontext="$curcontext" state line
    typeset -A opt_args

    _arguments -C \
        '1: :_linear_account_commands' \
        '*::arg:->args'
}

_linear_account_commands() {
    local account_commands
    account_commands=(
        'add:Add a new Linear account'
        'list:List all configured accounts'
        'remove:Remove an account'
        'test:Test connection of all accounts'
    )
    _describe 'account command' account_commands
}

_linear_issue() {
    local curcontext="$curcontext" state line
    typeset -A opt_args

    _arguments -C \
        '1: :_linear_issue_commands' \
        '*::arg:->args'

    case $state in
        args)
            case $line[1] in
                show)
                    _arguments \
                        '-c[Show comments]' \
                        '--comments[Show comments]' \
                        '-f[Output format]:format:(pretty json)' \
                        '--format[Output format]:format:(pretty json)' \
                        '1:issue ID or URL:'
                    ;;
                create)
                    _arguments \
                        '-a[Account name]:account:' \
                        '--account[Account name]:account:' \
                        '-t[Issue title]:title:' \
                        '--title[Issue title]:title:' \
                        '-d[Issue description]:description:' \
                        '--description[Issue description]:description:' \
                        '-p[Priority (0-4)]:priority:(0 1 2 3 4)' \
                        '--priority[Priority (0-4)]:priority:(0 1 2 3 4)' \
                        '-l[Label name]:label:' \
                        '--label[Label name]:label:' \
                        '--team[Team key]:team:' \
                        '--project[Project name]:project:' \
                        '--assignee[Assignee email]:assignee:'
                    ;;
                list)
                    _arguments \
                        '-a[Account name]:account:' \
                        '--account[Account name]:account:' \
                        '--assignee[Filter by assignee]:assignee:' \
                        '--state[Filter by state]:state:' \
                        '--label[Filter by label]:label:' \
                        '--project[Filter by project]:project:' \
                        '--team[Filter by team]:team:'
                    ;;
                update)
                    _arguments \
                        '-a[Account name]:account:' \
                        '--account[Account name]:account:' \
                        '-t[New title]:title:' \
                        '--title[New title]:title:' \
                        '-d[New description]:description:' \
                        '--description[New description]:description:' \
                        '-s[New state]:state:' \
                        '--state[New state]:state:' \
                        '-p[Priority (0-4)]:priority:(0 1 2 3 4)' \
                        '--priority[Priority (0-4)]:priority:(0 1 2 3 4)' \
                        '--assignee[Assignee email or "unassign"]:assignee:' \
                        '--project[Project name or "none"]:project:' \
                        '--team[Team key]:team:' \
                        '--add-label[Add a label]:label:' \
                        '--remove-label[Remove a label]:label:' \
                        '--archive[Archive the issue]' \
                        '1:issue ID or URL:'
                    ;;
                comment)
                    _arguments \
                        '-a[Account name]:account:' \
                        '--account[Account name]:account:' \
                        '1:issue ID or URL:' \
                        '2:comment text:'
                    ;;
            esac
            ;;
    esac
}

_linear_issue_commands() {
    local issue_commands
    issue_commands=(
        'show:Show details of an issue'
        'create:Create a new issue'
        'list:List all issues grouped by status'
        'update:Update an issue'
        'comment:Add a comment to an issue'
    )
    _describe 'issue command' issue_commands
}

_linear_project() {
    local curcontext="$curcontext" state line
    typeset -A opt_args

    _arguments -C \
        '1: :_linear_project_commands' \
        '*::arg:->args'

    case $state in
        args)
            case $line[1] in
                list)
                    _arguments \
                        '-a[Account name]:account:' \
                        '--account[Account name]:account:' \
                        '--team[Filter by team]:team:' \
                        '-f[Output format]:format:(pretty json)' \
                        '--format[Output format]:format:(pretty json)' \
                        '--limit[Maximum projects to return]:limit:'
                    ;;
                show)
                    _arguments \
                        '-f[Output format]:format:(pretty json)' \
                        '--format[Output format]:format:(pretty json)' \
                        '1:project ID or URL:'
                    ;;
                issues)
                    _arguments \
                        '-f[Output format]:format:(pretty json)' \
                        '--format[Output format]:format:(pretty json)' \
                        '1:project ID or URL:'
                    ;;
                create)
                    _arguments \
                        '-a[Account name]:account:' \
                        '--account[Account name]:account:' \
                        '-n[Project name]:name:' \
                        '--name[Project name]:name:' \
                        '-d[Project description]:description:' \
                        '--description[Project description]:description:' \
                        '--team[Team key]:team:' \
                        '--state[Project state]:state:(planned started paused completed canceled)' \
                        '--target-date[Target date (YYYY-MM-DD)]:date:'
                    ;;
                delete)
                    _arguments \
                        '-a[Account name]:account:' \
                        '--account[Account name]:account:' \
                        '-y[Skip confirmation]' \
                        '--yes[Skip confirmation]' \
                        '1:project ID or URL:'
                    ;;
            esac
            ;;
    esac
}

_linear_project_commands() {
    local project_commands
    project_commands=(
        'list:List all projects'
        'show:Show details of a project'
        'issues:List all issues in a project'
        'create:Create a new project'
        'delete:Delete a project'
    )
    _describe 'project command' project_commands
}

_linear_document() {
    local curcontext="$curcontext" state line
    typeset -A opt_args

    _arguments -C \
        '1: :_linear_document_commands' \
        '*::arg:->args'

    case $state in
        args)
            case $line[1] in
                show)
                    _arguments \
                        '-f[Output format]:format:(pretty json)' \
                        '--format[Output format]:format:(pretty json)' \
                        '1:document ID or URL:'
                    ;;
                add)
                    _arguments \
                        '-a[Account name]:account:' \
                        '--account[Account name]:account:' \
                        '-t[Document title]:title:' \
                        '--title[Document title]:title:' \
                        '-c[Document content]:content:' \
                        '--content[Document content]:content:' \
                        '-p[Project ID or URL]:project:' \
                        '--project[Project ID or URL]:project:'
                    ;;
                delete)
                    _arguments \
                        '-y[Skip confirmation]' \
                        '--yes[Skip confirmation]' \
                        '1:document ID or URL:'
                    ;;
            esac
            ;;
    esac
}

_linear_document_commands() {
    local document_commands
    document_commands=(
        'show:Show details of a document'
        'add:Create a new document'
        'delete:Delete a document'
    )
    _describe 'document command' document_commands
}

_linear_completion() {
    local completion_commands
    completion_commands=(
        'install:Install shell completion'
    )
    _describe 'completion command' completion_commands
}

_linear "$@"
`;

const BASH_COMPLETION_SCRIPT = `#!/bin/bash

_linear_completion() {
    local cur prev words cword
    _init_completion || return

    # Main commands
    local commands="account issue project document update completion"

    # Account subcommands
    local account_commands="add list remove test"

    # Issue subcommands
    local issue_commands="show create list update comment"

    # Project subcommands
    local project_commands="list show issues create delete"

    # Document subcommands
    local document_commands="show add delete"

    # Common flags
    local account_flag="-a --account"
    local format_flag="-f --format"
    local yes_flag="-y --yes"

    if [[ \$cword -eq 1 ]]; then
        COMPREPLY=(\$(compgen -W "\$commands" -- "\$cur"))
    elif [[ \$cword -eq 2 ]]; then
        case "\${COMP_WORDS[1]}" in
            account)
                COMPREPLY=(\$(compgen -W "\$account_commands" -- "\$cur"))
                ;;
            issue)
                COMPREPLY=(\$(compgen -W "\$issue_commands" -- "\$cur"))
                ;;
            project)
                COMPREPLY=(\$(compgen -W "\$project_commands" -- "\$cur"))
                ;;
            document)
                COMPREPLY=(\$(compgen -W "\$document_commands" -- "\$cur"))
                ;;
            completion)
                COMPREPLY=(\$(compgen -W "install" -- "\$cur"))
                ;;
        esac
    elif [[ \$cword -ge 3 ]]; then
        # Handle flags based on command and subcommand
        case "\${COMP_WORDS[1]}" in
            issue)
                case "\${COMP_WORDS[2]}" in
                    show)
                        if [[ \$cur == -* ]]; then
                            COMPREPLY=(\$(compgen -W "-c --comments -f --format" -- "\$cur"))
                        elif [[ \$prev == "-f" || \$prev == "--format" ]]; then
                            COMPREPLY=(\$(compgen -W "pretty json" -- "\$cur"))
                        fi
                        ;;
                    create)
                        if [[ \$cur == -* ]]; then
                            COMPREPLY=(\$(compgen -W "-a --account -t --title -d --description -p --priority -l --label --team --project --assignee" -- "\$cur"))
                        elif [[ \$prev == "-p" || \$prev == "--priority" ]]; then
                            COMPREPLY=(\$(compgen -W "0 1 2 3 4" -- "\$cur"))
                        fi
                        ;;
                    list)
                        if [[ \$cur == -* ]]; then
                            COMPREPLY=(\$(compgen -W "-a --account --assignee --state --label --project --team" -- "\$cur"))
                        fi
                        ;;
                    update)
                        if [[ \$cur == -* ]]; then
                            COMPREPLY=(\$(compgen -W "-a --account -t --title -d --description -s --state -p --priority --assignee --project --team --add-label --remove-label --archive" -- "\$cur"))
                        elif [[ \$prev == "-p" || \$prev == "--priority" ]]; then
                            COMPREPLY=(\$(compgen -W "0 1 2 3 4" -- "\$cur"))
                        fi
                        ;;
                    comment)
                        if [[ \$cur == -* ]]; then
                            COMPREPLY=(\$(compgen -W "-a --account" -- "\$cur"))
                        fi
                        ;;
                esac
                ;;
            project)
                case "\${COMP_WORDS[2]}" in
                    list)
                        if [[ \$cur == -* ]]; then
                            COMPREPLY=(\$(compgen -W "-a --account --team -f --format --limit" -- "\$cur"))
                        elif [[ \$prev == "-f" || \$prev == "--format" ]]; then
                            COMPREPLY=(\$(compgen -W "pretty json" -- "\$cur"))
                        fi
                        ;;
                    show)
                        if [[ \$cur == -* ]]; then
                            COMPREPLY=(\$(compgen -W "-f --format" -- "\$cur"))
                        elif [[ \$prev == "-f" || \$prev == "--format" ]]; then
                            COMPREPLY=(\$(compgen -W "pretty json" -- "\$cur"))
                        fi
                        ;;
                    issues)
                        if [[ \$cur == -* ]]; then
                            COMPREPLY=(\$(compgen -W "-f --format" -- "\$cur"))
                        elif [[ \$prev == "-f" || \$prev == "--format" ]]; then
                            COMPREPLY=(\$(compgen -W "pretty json" -- "\$cur"))
                        fi
                        ;;
                    create)
                        if [[ \$cur == -* ]]; then
                            COMPREPLY=(\$(compgen -W "-a --account -n --name -d --description --team --state --target-date" -- "\$cur"))
                        elif [[ \$prev == "--state" ]]; then
                            COMPREPLY=(\$(compgen -W "planned started paused completed canceled" -- "\$cur"))
                        fi
                        ;;
                    delete)
                        if [[ \$cur == -* ]]; then
                            COMPREPLY=(\$(compgen -W "-a --account -y --yes" -- "\$cur"))
                        fi
                        ;;
                esac
                ;;
            document)
                case "\${COMP_WORDS[2]}" in
                    show)
                        if [[ \$cur == -* ]]; then
                            COMPREPLY=(\$(compgen -W "-f --format" -- "\$cur"))
                        elif [[ \$prev == "-f" || \$prev == "--format" ]]; then
                            COMPREPLY=(\$(compgen -W "pretty json" -- "\$cur"))
                        fi
                        ;;
                    add)
                        if [[ \$cur == -* ]]; then
                            COMPREPLY=(\$(compgen -W "-a --account -t --title -c --content -p --project" -- "\$cur"))
                        fi
                        ;;
                    delete)
                        if [[ \$cur == -* ]]; then
                            COMPREPLY=(\$(compgen -W "-y --yes" -- "\$cur"))
                        fi
                        ;;
                esac
                ;;
        esac
    fi
}

complete -F _linear_completion linear-cmd
complete -F _linear_completion linear
complete -F _linear_completion lin
`;

export function createCompletionCommand(): Command {
  const completion = new Command('completion');
  completion.description('Generate shell completion scripts');

  completion
    .command('install')
    .description('Install shell completion for your current shell')
    .action(async () => {
      const shell = detectShell();
      const configManager = new ConfigManager();

      try {
        switch (shell) {
          case 'zsh':
            await installZshCompletion();
            break;
          case 'bash':
            await installBashCompletion();
            break;
          default:
            Logger.error(`❌ Unsupported shell: ${shell}`);
            Logger.info('');
            Logger.info('🐚 Supported shells: zsh, bash');
            Logger.info('💡 Please switch to a supported shell to use autocompletion');
            process.exit(1);
        }

        // Mark completion as installed in config
        configManager.markCompletionInstalled();
      } catch (error) {
        Logger.error(`Failed to install completion: ${error}`);
        process.exit(1);
      }
    });

  return completion;
}

/**
 * Reinstall completion silently (used after update) - only if already installed
 */
export async function reinstallCompletionSilently(): Promise<boolean> {
  const configManager = new ConfigManager();

  // Only reinstall if user had previously installed completions
  if (!configManager.isCompletionInstalled()) {
    return false;
  }

  const shell = detectShell();

  try {
    switch (shell) {
      case 'zsh':
        await installZshCompletion(true);
        // Remove ZSH completion cache to force reload
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
  const fs = require('fs');

  try {
    // Remove all .zcompdump* files (including hostname variants like .zcompdump.hostname.pid)
    const files = fs.readdirSync(homeDir);
    for (const file of files) {
      if (file.startsWith('.zcompdump')) {
        const fullPath = join(homeDir, file);
        try {
          fs.unlinkSync(fullPath);
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
        // Check if we can write to this directory
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

  const completionFile = join(targetDir, '_linear');
  writeFileSync(completionFile, ZSH_COMPLETION_SCRIPT);

  if (!silent) {
    Logger.success(`✅ Zsh completion installed to ${completionFile}`);
    Logger.info('');
    Logger.info('To activate completion, add this to your ~/.zshrc:');
    Logger.info(chalk.cyan(`  fpath=(${targetDir} $fpath)`));
    Logger.info(chalk.cyan('  autoload -U compinit && compinit'));
    Logger.info('');
    Logger.info('Then restart your shell or run:');
    Logger.info(chalk.cyan('  source ~/.zshrc'));

    // Check if fpath already includes the directory
    try {
      const zshrc = join(homeDir, '.zshrc');
      if (existsSync(zshrc)) {
        const zshrcContent = require('fs').readFileSync(zshrc, 'utf8');
        if (!zshrcContent.includes(targetDir)) {
          Logger.info('');
          Logger.warning('⚠️  Remember to add the fpath line to your ~/.zshrc for autocompletion to work!');
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
        // Check if we can write to this directory
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

  const completionFile = join(targetDir, 'linear');
  writeFileSync(completionFile, BASH_COMPLETION_SCRIPT);

  if (!silent) {
    Logger.success(`✅ Bash completion installed to ${completionFile}`);
    Logger.info('');
    Logger.info('To activate completion, add this to your ~/.bashrc:');
    Logger.info(chalk.cyan(`  source ${completionFile}`));
    Logger.info('');
    Logger.info('Then restart your shell or run:');
    Logger.info(chalk.cyan('  source ~/.bashrc'));
  }
}
