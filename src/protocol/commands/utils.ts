import { Command } from 'commander';
import { type Command as CommandSchema, type SubCommand } from './definitions.js';
import { COMMANDS_SCHEMA } from './schema.js';

export function getCommand(name: string): CommandSchema | undefined {
  return COMMANDS_SCHEMA.find((cmd) => cmd.name === name || cmd.aliases?.includes(name));
}

export function getSubCommand(commandName: string, subCommandName: string): SubCommand | undefined {
  const command = getCommand(commandName);
  return command?.subcommands?.find((sub) => sub.name === subCommandName || sub.aliases?.includes(subCommandName));
}

export { formatCommandDetails, getCommandIcon } from './browser-utils.js';

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

export function createSubCommandFromSchema<TArgs extends unknown[] = unknown[]>(
  commandName: string,
  subCommandName: string,
  action: (...args: TArgs) => void | Promise<void>
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

  if (schema.arguments && schema.arguments.length > 0) {
    for (const arg of schema.arguments) {
      const argString = arg.required ? `<${arg.name}>` : `[${arg.name}]`;
      command.argument(argString, arg.description);
    }
  }

  if (schema.flags && schema.flags.length > 0) {
    for (const flag of schema.flags) {
      let flagString = flag.name;

      if (flag.alias) {
        flagString = `${flag.alias}, ${flagString}`;
      }

      if (flag.type === 'string') {
        flagString += ' <value>';
      } else if (flag.type === 'number') {
        flagString += ' <number>';
      }

      command.option(flagString, flag.description);
    }
  }

  command.action(action);

  return command;
}
