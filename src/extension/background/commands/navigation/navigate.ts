import type { NavigateTabData } from '../../../../cli/schemas/definitions/tab.js';
import type { SuccessResponse } from '../../../../shared/utils/types.js';
import { parseTabId } from '../../../utils/extension-utils.js';

export async function navigateTab({ tabId, url }: NavigateTabData): Promise<SuccessResponse> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  if (!url) {
    throw new Error('url is required');
  }

  await chrome.tabs.update(parseTabId(tabId), { url });
  return { success: true };
}
