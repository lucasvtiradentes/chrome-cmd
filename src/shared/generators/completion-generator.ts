import { COMMANDS_SCHEMA } from '../commands-schema.js';
import { APP_NAME } from '../constants.js';

export function generateZshCompletion(): string {
  const commands = COMMANDS_SCHEMA.map((cmd) => `        '${cmd.name}:${cmd.description}'`).join('\n');

  let completionFunctions = '';

  // Generate completion functions for each command with subcommands
  for (const cmd of COMMANDS_SCHEMA) {
    if (cmd.subcommands && cmd.subcommands.length > 0) {
      const commandsName = `_chrome_${cmd.name}_commands`;

      // Generate subcommand completion functions
      let subcommandCases = '';
      for (const sub of cmd.subcommands) {
        if (sub.flags && sub.flags.length > 0) {
          const aliases = sub.aliases ? `|${sub.aliases.join('|')}` : '';
          const flagArgs = sub.flags
            .map((flag) => {
              if (flag.type === 'boolean') {
                return `        '${flag.name}[${flag.description}]'`;
              } else {
                return `        '${flag.name}=[${flag.description}]:${flag.type}:'`;
              }
            })
            .join(' \\\n');

          subcommandCases += `            ${sub.name}${aliases})
                _arguments -C \\
${flagArgs}
                ;;
`;
        }
      }

      completionFunctions += `
_chrome_${cmd.name}() {
    local curcontext="$curcontext" state line
    typeset -A opt_args

    _arguments -C \\
        '1: :${commandsName}' \\
        '*::arg:->args'

    case $state in
        args)
            case $line[1] in
${subcommandCases}            esac
            ;;
    esac
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

  // Generate flag variables for each subcommand
  const flagVars = COMMANDS_SCHEMA.filter((cmd) => cmd.subcommands && cmd.subcommands.length > 0)
    .flatMap((cmd) =>
      cmd
        .subcommands!.filter((sub) => sub.flags && sub.flags.length > 0)
        .map((sub) => {
          const flags = sub.flags!.map((flag) => flag.name).join(' ');
          return `    local ${cmd.name}_${sub.name}_flags="${flags}"`;
        })
    )
    .join('\n');

  const caseStatements = COMMANDS_SCHEMA.filter((cmd) => cmd.subcommands && cmd.subcommands.length > 0)
    .map((cmd) => {
      const aliases = cmd.aliases ? `|${cmd.aliases.join('|')}` : '';
      return `            ${cmd.name}${aliases})
                COMPREPLY=($(compgen -W "$${cmd.name}_commands" -- "$cur"))
                ;;`;
    })
    .join('\n');

  // Generate flag completion for subcommands
  const flagCases = COMMANDS_SCHEMA.filter((cmd) => cmd.subcommands && cmd.subcommands.length > 0)
    .flatMap((cmd) =>
      cmd
        .subcommands!.filter((sub) => sub.flags && sub.flags.length > 0)
        .map((sub) => {
          const aliases = sub.aliases ? `|${sub.aliases.join('|')}` : '';
          return `            ${cmd.name}:${sub.name}${aliases})
                COMPREPLY=($(compgen -W "$${cmd.name}_${sub.name}_flags" -- "$cur"))
                ;;`;
        })
    )
    .join('\n');

  return `#!/bin/bash

_chrome_completion() {
    local cur prev words cword
    _init_completion || return

    # Main commands
    local commands="${mainCommands}"

    # Subcommands
${subcommandVars}

    # Flags
${flagVars}

    if [[ $cword -eq 1 ]]; then
        COMPREPLY=($(compgen -W "$commands" -- "$cur"))
    elif [[ $cword -eq 2 ]]; then
        case "\${COMP_WORDS[1]}" in
${caseStatements}
        esac
    elif [[ $cword -gt 2 ]]; then
        # Complete flags for subcommands
        local cmd_sub="\${COMP_WORDS[1]}:\${COMP_WORDS[2]}"
        case "$cmd_sub" in
${flagCases}
        esac
    fi
}

complete -F _chrome_completion ${APP_NAME}
complete -F _chrome_completion chromecmd
complete -F _chrome_completion chr
`;
}
