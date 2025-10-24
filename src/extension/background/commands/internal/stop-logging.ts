import type { TabIdData } from '../../../../cli/schemas/definitions/tab.js';
import type { StopLoggingResponse } from '../../../../shared/utils/types.js';
import { parseTabId } from '../../../utils/extension-utils.js';
import { stopLoggingTab } from '../../debugger-manager.js';

export async function stopLogging({ tabId }: TabIdData): Promise<StopLoggingResponse> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  const tabIdInt = parseTabId(tabId);
  await stopLoggingTab(tabIdInt);

  return {
    success: true,
    message: 'Stopped logging',
    tabId: tabIdInt,
    debuggerAttached: false
  };
}
