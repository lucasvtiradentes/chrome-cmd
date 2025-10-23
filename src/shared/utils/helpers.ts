import type { ChromeCommand } from '../commands/chrome-command.js';
import type {
  CommandDataType,
  CommandHandler,
  CommandHandlerMap,
  CommandRequest
} from '../commands/commands-schemas.js';

export async function dispatchCommand(request: CommandRequest, handlers: CommandHandlerMap): Promise<unknown> {
  const handler = handlers[request.command] as CommandHandler<typeof request.command>;
  if (!handler) {
    throw new Error(`No handler registered for command: ${request.command}`);
  }

  return handler(request.data as CommandDataType<typeof request.command>);
}

export function createCommandRequest<T extends ChromeCommand>(
  command: T,
  data: CommandDataType<T>
): { command: T; data: CommandDataType<T> } {
  return { command, data };
}

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

export function escapeJavaScriptString(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

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

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}

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

export function getStatusColorCategory(status?: number, failed?: boolean): string {
  if (failed) return 'red';
  if (!status) return 'gray';
  if (status >= 200 && status < 300) return 'green';
  if (status >= 300 && status < 400) return 'blue';
  if (status >= 400 && status < 500) return 'yellow';
  if (status >= 500) return 'red';
  return 'gray';
}

export function parseTabId(tabId: string | number): number {
  return typeof tabId === 'string' ? parseInt(tabId, 10) : tabId;
}
