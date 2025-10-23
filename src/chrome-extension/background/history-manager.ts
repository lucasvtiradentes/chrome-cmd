import { isInternalCommand } from '../../shared/commands/chrome-command.js';
import type { HistoryItem } from '../../shared/utils/types.js';

export async function saveCommandToHistory(
  command: string,
  data: Record<string, unknown>,
  result?: unknown,
  success?: boolean,
  executionTime?: number,
  error?: string
): Promise<void> {
  if (isInternalCommand(command)) {
    return;
  }

  const isUserCommand = !isInternalCommand(command);

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
  const MAX_HISTORY_ITEMS = 100;
  if (history.length > MAX_HISTORY_ITEMS) {
    history.shift();
  }

  await chrome.storage.local.set({ commandHistory: history });
}
