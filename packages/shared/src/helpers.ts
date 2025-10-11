/**
 * Type-safe helpers for command handling
 */

import { ChromeCommand } from './commands';
import type { CommandDataType, CommandRequest } from './schemas';

/**
 * Type-safe command handler function signature
 */
export type CommandHandler<T extends ChromeCommand> = (data: CommandDataType<T>) => Promise<unknown>;

/**
 * Map of command handlers
 */
export type CommandHandlerMap = {
  [K in ChromeCommand]: CommandHandler<K>;
};

/**
 * Type-safe command dispatcher
 * Ensures that each command receives the correct data type
 */
export async function dispatchCommand(request: CommandRequest, handlers: CommandHandlerMap): Promise<unknown> {
  const handler = handlers[request.command];
  if (!handler) {
    throw new Error(`No handler registered for command: ${request.command}`);
  }

  // TypeScript will infer the correct data type based on the command
  // biome-ignore lint/suspicious/noExplicitAny: Type narrowing handled by discriminated union
  return handler(request.data as any);
}

/**
 * Create a type-safe command request
 */
export function createCommandRequest<T extends ChromeCommand>(
  command: T,
  data: CommandDataType<T>
): { command: T; data: CommandDataType<T> } {
  return { command, data };
}
