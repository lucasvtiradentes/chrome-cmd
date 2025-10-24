import type { TabIdData } from '../../../../protocol/commands/definitions/tab.js';
import type { SuccessResponse } from '../../../../shared/utils/types.js';
import { parseTabId } from '../../../utils/extension-utils.js';

export async function reloadTab({ tabId }: TabIdData): Promise<SuccessResponse> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  await chrome.tabs.reload(parseTabId(tabId));
  return { success: true };
}
