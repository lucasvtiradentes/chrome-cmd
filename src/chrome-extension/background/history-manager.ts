import { ChromeCommand } from '../../shared/commands/commands.js';
import { MAX_HISTORY_ITEMS } from '../../shared/constants/limits.js';
import type { HistoryItem } from '../../shared/types.js';

const INTERNAL_COMMANDS = new Set([
  ChromeCommand.PING,
  ChromeCommand.RELOAD_EXTENSION,
  ChromeCommand.GET_PROFILE_INFO,
  'keepalive'
]);

export async function saveCommandToHistory(
  command: string,
  data: Record<string, unknown>,
  result?: unknown,
  success?: boolean,
  executionTime?: number,
  error?: string
): Promise<void> {
  if (command === ChromeCommand.PING || command.startsWith('keepalive')) {
    return;
  }

  const isUserCommand = !INTERNAL_COMMANDS.has(command as ChromeCommand);

  const historyItem: HistoryItem = {
    command,
    data,
    timestamp: Date.now(),
    result,
    success,
    executionTime,
    error,
    isUserCommand
  };

  const storageResult = await chrome.storage.local.get(['commandHistory']);
  const history: HistoryItem[] = (storageResult.commandHistory as HistoryItem[]) || [];

  history.push(historyItem);
  if (history.length > MAX_HISTORY_ITEMS) {
    history.shift();
  }

  await chrome.storage.local.set({ commandHistory: history });
}
