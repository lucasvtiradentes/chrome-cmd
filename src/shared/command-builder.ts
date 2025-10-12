import { Command } from 'commander';
import { type CommandFlag, getCommand, getSubCommand } from './commands-schema.js';

// ============================================================================
// Type Helpers for Command Options
// ============================================================================

export type SubCommandOptions<_CommandName extends string, _SubCommandName extends string> = Record<
  string,
  string | number | boolean | undefined
>;

export type TabsListOptions = Record<string, never>;
export type TabsSelectOptions = Record<string, never>;
export type TabsFocusOptions = { tab?: number };
export type TabsCreateOptions = { background?: boolean };
export type TabsNavigateOptions = { tab?: number };
export type TabsExecOptions = { tab?: number };
export type TabsCloseOptions = { tab?: number };
export type TabsRefreshOptions = { tab?: number };
export type TabsScreenshotOptions = { tab?: number; output?: string };
export type TabsHtmlOptions = { tab?: number; selector?: string; raw?: boolean; full?: boolean };
export type TabsLogsOptions = {
  tab?: number;
  n?: number;
  error?: boolean;
  warn?: boolean;
  info?: boolean;
  log?: boolean;
  debug?: boolean;
};
export type TabsRequestsOptions = {
  tab?: number;
  n?: number;
  method?: string;
  status?: number;
  url?: string;
  failed?: boolean;
  all?: boolean;
  body?: boolean;
  headers?: boolean;
};
export type TabsStorageOptions = { tab?: number; cookies?: boolean; local?: boolean; session?: boolean };
export type TabsClickOptions = { tab?: number; selector?: string; text?: string };
export type TabsInputOptions = { tab?: number; selector?: string; value?: string; submit?: boolean };

export function createCommandFromSchema(commandName: string, action?: () => void): Command {
  const schema = getCommand(commandName);

  if (!schema) {
    throw new Error(`Command "${commandName}" not found in schema`);
  }

  const command = new Command(schema.name);
  command.description(schema.description);

  if (schema.aliases && schema.aliases.length > 0) {
    for (const alias of schema.aliases) {
      command.alias(alias);
    }
  }

  if (action) {
    command.action(action);
  }

  return command;
}

export function createSubCommandFromSchema<TAction extends (...args: any[]) => void | Promise<void>>(
  commandName: string,
  subCommandName: string,
  action: TAction
): Command {
  const schema = getSubCommand(commandName, subCommandName);

  if (!schema) {
    throw new Error(`SubCommand "${commandName} ${subCommandName}" not found in schema`);
  }

  const command = new Command(schema.name);
  command.description(schema.description);

  if (schema.aliases && schema.aliases.length > 0) {
    for (const alias of schema.aliases) {
      command.alias(alias);
    }
  }

  // Collect positional arguments
  const positionalArgs: CommandFlag[] = [];

  // Add flags from schema
  if (schema.flags && schema.flags.length > 0) {
    for (const flag of schema.flags) {
      // Skip non-flag arguments (those without -- or -)
      if (!flag.name.startsWith('-')) {
        positionalArgs.push(flag);
        continue;
      }

      // Handle flags with options
      let flagString = flag.name;

      if (flag.alias) {
        flagString = `${flag.alias}, ${flagString}`;
      }

      // Add type hint for string/number flags
      if (flag.type === 'string') {
        flagString += ' <value>';
      } else if (flag.type === 'number') {
        flagString += ' <number>';
      }

      command.option(flagString, flag.description);
    }
  }

  for (const arg of positionalArgs) {
    const argString = arg.required ? `<${arg.name}>` : `[${arg.name}]`;
    command.argument(argString, arg.description);
  }

  command.action(action);

  return command;
}

export function getCommandDescription(commandName: string): string {
  const schema = getCommand(commandName);
  return schema?.description || '';
}

export function getSubCommandDescription(commandName: string, subCommandName: string): string {
  const schema = getSubCommand(commandName, subCommandName);
  return schema?.description || '';
}
