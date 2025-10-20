import type { ChromeCommand } from './chrome-command.js';
import type { Command, SubCommand } from './cli-command.js';
import { completionCommandDefinition } from './definitions/completion.js';
import { installCommandDefinition } from './definitions/install.js';
import { profileCommandDefinition } from './definitions/profile.js';
import { tabCommandDefinition } from './definitions/tab.js';
import { updateCommandDefinition } from './definitions/update.js';

// ============================================================================
// Command UI Metadata (icons and detail formatters for popup/modal)
// ============================================================================

export const COMMANDS_SCHEMA: Command[] = [
  tabCommandDefinition,
  profileCommandDefinition,
  installCommandDefinition,
  updateCommandDefinition,
  completionCommandDefinition
];

export function getAllCommands(): Command[] {
  return COMMANDS_SCHEMA;
}

export function getCommand(name: string): Command | undefined {
  return COMMANDS_SCHEMA.find((cmd) => cmd.name === name || cmd.aliases?.includes(name));
}

export function getSubCommand(commandName: string, subCommandName: string): SubCommand | undefined {
  const command = getCommand(commandName);
  return command?.subcommands?.find((sub) => sub.name === subCommandName || sub.aliases?.includes(subCommandName));
}

function findSubCommandByChromeCommand(chromeCommand: ChromeCommand): SubCommand | undefined {
  for (const command of COMMANDS_SCHEMA) {
    if (command.subcommands) {
      const found = command.subcommands.find((sub) => sub.chromeCommand === chromeCommand);
      if (found) return found;
    }
  }
  return undefined;
}

export function getCommandIcon(command: string): string {
  const subCommand = findSubCommandByChromeCommand(command as ChromeCommand);
  return subCommand?.icon || '⚙️';
}

export function formatCommandDetails(command: string, data: Record<string, unknown>): string {
  const subCommand = findSubCommandByChromeCommand(command as ChromeCommand);
  if (subCommand?.formatDetails) {
    return subCommand.formatDetails(data);
  }
  return command;
}
