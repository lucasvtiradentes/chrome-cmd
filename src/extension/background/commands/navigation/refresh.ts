import type { TabIdData } from '../../../../cli/schemas/definitions/tab.js';
import type { SuccessResponse } from '../../../../shared/utils/types.js';
import { parseTabId } from '../../../utils/extension-utils.js';
import { debuggerAttached, startLoggingTab } from '../../debugger-manager.js';
import { initializeTabLogging } from '../../logging-collector.js';

export async function reloadTab({ tabId }: TabIdData): Promise<SuccessResponse> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  const tabIdInt = parseTabId(tabId);
  const wasLogging = debuggerAttached.has(tabIdInt);

  if (wasLogging) {
    initializeTabLogging(tabIdInt);
  }

  await chrome.tabs.reload(tabIdInt);

  if (wasLogging) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await startLoggingTab(tabIdInt);
  }

  return { success: true };
}
