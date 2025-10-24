import { isInternalCommand } from '../../shared/protocol/commands.js';
import type { SubCommand } from './definitions.js';
import { COMMANDS_SCHEMA } from './schema.js';

function findSubCommandByCliCommand(cliCommand: string): SubCommand | undefined {
  if (isInternalCommand(cliCommand)) {
    return undefined;
  }

  const commandKey = cliCommand.replace('TAB_', '');

  for (const command of COMMANDS_SCHEMA) {
    if (command.subcommands) {
      const found = command.subcommands.find((sub) => {
        const subKey = sub.name.toUpperCase().replace('-', '_');
        return subKey === commandKey || cliCommand.includes(subKey);
      });
      if (found) return found;
    }
  }
  return undefined;
}

export function getCommandIcon(command: string): string {
  const subCommand = findSubCommandByCliCommand(command);
  return subCommand?.icon || 'X';
}

export function formatCommandDetails(command: string, data: Record<string, unknown>): string {
  const subCommand = findSubCommandByCliCommand(command);
  if (subCommand?.formatDetails) {
    return subCommand.formatDetails(data);
  }
  return command;
}
