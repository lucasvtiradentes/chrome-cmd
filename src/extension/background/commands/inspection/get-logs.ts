import type { TabIdData } from '../../../../protocol/commands/definitions/tab.js';
import { APP_NAME } from '../../../../shared/constants/constants.js';
import { parseTabId } from '../../../../shared/utils/helpers.js';
import type { LogEntry } from '../../../../shared/utils/types.js';
import { debuggerAttached } from '../../debugger-manager.js';
import { consoleLogs } from '../../logging-collector.js';

export async function getTabLogs({
  tabId
}: TabIdData): Promise<LogEntry[] | Array<{ type: string; timestamp: number; message: string }>> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  const tabIdInt = parseTabId(tabId);

  if (!debuggerAttached.has(tabIdInt)) {
    throw new Error(
      `Debugger not attached to this tab. Use "${APP_NAME} tabs select <tabIndex>" first to start logging.`
    );
  }

  const logs = consoleLogs.get(tabIdInt) || [];

  if (logs.length === 0) {
    return [
      {
        type: 'info',
        timestamp: Date.now(),
        message: 'No console logs captured yet. Interact with the page to see new logs.'
      }
    ];
  }

  return logs;
}
