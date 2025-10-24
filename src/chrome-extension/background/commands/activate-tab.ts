import type { TabIdData } from '../../../protocol/commands/definitions/tab.js';
import { parseTabId } from '../../../shared/utils/helpers.js';
import type { SuccessResponse } from '../../../shared/utils/types.js';

export async function activateTab({ tabId }: TabIdData): Promise<SuccessResponse> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  const tabIdInt = parseTabId(tabId);
  const tab = await chrome.tabs.get(tabIdInt);
  if (tab.windowId) {
    await chrome.windows.update(tab.windowId, { focused: true });
  }
  await chrome.tabs.update(tabIdInt, { active: true });

  return { success: true };
}
