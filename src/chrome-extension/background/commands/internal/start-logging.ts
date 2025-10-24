import type { TabIdData } from '../../../../protocol/commands/definitions/tab.js';
import { parseTabId } from '../../../../shared/utils/helpers.js';
import type { StartLoggingResponse } from '../../../../shared/utils/types.js';
import { startLoggingTab } from '../../debugger-manager.js';
import { initializeTabLogging } from '../../logging-collector.js';

export async function startLogging({ tabId }: TabIdData): Promise<StartLoggingResponse> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  const tabIdInt = parseTabId(tabId);
  initializeTabLogging(tabIdInt);
  await startLoggingTab(tabIdInt);

  return {
    success: true,
    message: 'Started logging console and network activity',
    tabId: tabIdInt,
    debuggerAttached: true
  };
}
