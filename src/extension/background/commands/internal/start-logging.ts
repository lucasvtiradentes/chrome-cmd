import type { TabIdData } from '../../../../cli/schemas/definitions/tab.js';
import type { StartLoggingResponse } from '../../../../shared/utils/types.js';
import { parseTabId } from '../../../utils/extension-utils.js';
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
