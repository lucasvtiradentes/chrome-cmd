import type { TabIdData } from '../../../protocol/commands/definitions/tab.js';
import { parseTabId } from '../../../shared/utils/helpers.js';
import type { SuccessResponse } from '../../../shared/utils/types.js';

export async function closeTab({ tabId }: TabIdData): Promise<SuccessResponse> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  await chrome.tabs.remove(parseTabId(tabId));
  return { success: true };
}
