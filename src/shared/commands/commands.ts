import type { Command, SubCommand } from './cli-command.js';
import { isInternalCommand } from './cli-command.js';
import { completionCommandDefinition } from './definitions/completion.js';
import { installCommandDefinition } from './definitions/install.js';
import { profileCommandDefinition } from './definitions/profile.js';
import { tabCommandDefinition } from './definitions/tab.js';
import { updateCommandDefinition } from './definitions/update.js';

export const COMMANDS_SCHEMA: Command[] = [
  tabCommandDefinition,
  profileCommandDefinition,
  installCommandDefinition,
  updateCommandDefinition,
  completionCommandDefinition
];

export function getCommand(name: string): Command | undefined {
  return COMMANDS_SCHEMA.find((cmd) => cmd.name === name || cmd.aliases?.includes(name));
}

export function getSubCommand(commandName: string, subCommandName: string): SubCommand | undefined {
  const command = getCommand(commandName);
  return command?.subcommands?.find((sub) => sub.name === subCommandName || sub.aliases?.includes(subCommandName));
}

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
