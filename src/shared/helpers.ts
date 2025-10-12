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

/**
 * Format a timestamp as a human-readable "time ago" string
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Human-readable string like "2h ago", "5m ago", "just now"
 */
export function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  if (seconds > 0) return `${seconds}s ago`;
  return 'just now';
}

/**
 * Escape a string for safe use in JavaScript code
 * @param text - Text to escape
 * @returns Escaped string safe for JavaScript context
 */
export function escapeJavaScriptString(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}
