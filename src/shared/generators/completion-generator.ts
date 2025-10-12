import { COMMANDS_SCHEMA } from '../commands-schema.js';
import { APP_NAME } from '../constants.js';

export function generateZshCompletion(): string {
  const commands = COMMANDS_SCHEMA.map((cmd) => `        '${cmd.name}:${cmd.description}'`).join('\n');

  let completionFunctions = '';

  // Generate completion functions for each command with subcommands
  for (const cmd of COMMANDS_SCHEMA) {
    if (cmd.subcommands && cmd.subcommands.length > 0) {
      const commandsName = `_chrome_${cmd.name}_commands`;

      completionFunctions += `
_chrome_${cmd.name}() {
    local curcontext="$curcontext" state line
    typeset -A opt_args

    _arguments -C \\
        '1: :${commandsName}' \\
        '*::arg:->args'
}

${commandsName}() {
    local ${cmd.name}_commands
    ${cmd.name}_commands=(
${cmd.subcommands.map((sub) => `        '${sub.name}:${sub.description}'`).join('\n')}
    )
    _describe '${cmd.name} command' ${cmd.name}_commands
}
`;
    }
  }

  // Build the case statement for args
  const caseStatements = COMMANDS_SCHEMA.filter((cmd) => cmd.subcommands && cmd.subcommands.length > 0)
    .map((cmd) => {
      const aliases = cmd.aliases ? `|${cmd.aliases.join('|')}` : '';
      return `                ${cmd.name}${aliases})
                    _chrome_${cmd.name}
                    ;;`;
    })
    .join('\n');

  return `#compdef ${APP_NAME} chromecmd chr

_chrome() {
    local state line context
    typeset -A opt_args

    _arguments -C \\
        '1: :_chrome_commands' \\
        '*::arg:->args'

    case $state in
        args)
            case $line[1] in
${caseStatements}
            esac
            ;;
    esac
}

_chrome_commands() {
    local commands
    commands=(
${commands}
    )
    _describe 'command' commands
}
${completionFunctions}
_chrome "$@"
`;
}

export function generateBashCompletion(): string {
  const mainCommands = COMMANDS_SCHEMA.map((cmd) => cmd.name).join(' ');

  const subcommandVars = COMMANDS_SCHEMA.filter((cmd) => cmd.subcommands && cmd.subcommands.length > 0)
    .map((cmd) => {
      const subcommands = cmd.subcommands?.map((sub) => sub.name).join(' ');
      return `    local ${cmd.name}_commands="${subcommands}"`;
    })
    .join('\n');

  const caseStatements = COMMANDS_SCHEMA.filter((cmd) => cmd.subcommands && cmd.subcommands.length > 0)
    .map((cmd) => {
      const aliases = cmd.aliases ? `|${cmd.aliases.join('|')}` : '';
      return `            ${cmd.name}${aliases})
                COMPREPLY=($(compgen -W "$${cmd.name}_commands" -- "$cur"))
                ;;`;
    })
    .join('\n');

  return `#!/bin/bash

_chrome_completion() {
    local cur prev words cword
    _init_completion || return

    # Main commands
    local commands="${mainCommands}"

    # Subcommands
${subcommandVars}

    if [[ $cword -eq 1 ]]; then
        COMPREPLY=($(compgen -W "$commands" -- "$cur"))
    elif [[ $cword -eq 2 ]]; then
        case "\${COMP_WORDS[1]}" in
${caseStatements}
        esac
    fi
}

complete -F _chrome_completion ${APP_NAME}
complete -F _chrome_completion chromecmd
complete -F _chrome_completion chr
`;
}
