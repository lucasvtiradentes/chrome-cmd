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

/**
 * Format bytes to human-readable size
 * @param bytes - Number of bytes
 * @returns Formatted string (e.g., "1.5 KB", "2.3 MB")
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format cookie expiry time
 * @param expires - Unix timestamp in seconds (or -1 for session)
 * @returns Human-readable expiry string (e.g., "2d 5h", "Session", "Expired")
 */
export function formatExpiry(expires?: number): string {
  if (!expires || expires === -1) return 'Session';

  const date = new Date(expires * 1000);
  const now = new Date();

  if (date < now) return 'Expired';

  const diff = date.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h`;
  return '<1h';
}

/**
 * Format timestamp to locale time string
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted time string (e.g., "3:45:12 PM")
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}

/**
 * Format any value to human-readable string with proper indentation
 * Handles primitives, arrays, and objects with smart formatting
 * @param value - Value to format
 * @param indent - Indentation string (default: '  ')
 * @returns Formatted string representation
 */
export function formatValue(value: unknown, indent = '  '): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  const type = typeof value;

  if (type === 'string') return value as string;
  if (type === 'number' || type === 'boolean') return String(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    if (value.length <= 3 && value.every((v) => typeof v !== 'object' || v === null)) {
      return `[${value.map((v) => formatValue(v, '')).join(', ')}]`;
    }
    return JSON.stringify(value, null, 2)
      .split('\n')
      .map((line) => indent + line)
      .join('\n')
      .trim();
  }

  if (type === 'object') {
    const keys = Object.keys(value as object);
    if (keys.length === 0) return '{}';
    if (keys.length <= 3) {
      const pairs = keys.map((k) => `${k}: ${formatValue((value as Record<string, unknown>)[k], '')}`);
      return `{ ${pairs.join(', ')} }`;
    }
    return JSON.stringify(value, null, 2)
      .split('\n')
      .map((line) => indent + line)
      .join('\n')
      .trim();
  }

  return String(value);
}

/**
 * Get HTTP status color category (framework-agnostic)
 * Returns color name that can be used with any coloring library
 * @param status - HTTP status code
 * @param failed - Whether the request failed
 * @returns Color category name ('green', 'yellow', 'red', 'blue', 'gray')
 */
export function getStatusColorCategory(status?: number, failed?: boolean): string {
  if (failed) return 'red';
  if (!status) return 'gray';
  if (status >= 200 && status < 300) return 'green';
  if (status >= 300 && status < 400) return 'blue';
  if (status >= 400 && status < 500) return 'yellow';
  if (status >= 500) return 'red';
  return 'gray';
}
