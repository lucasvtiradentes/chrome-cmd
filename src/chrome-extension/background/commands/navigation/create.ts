import type { CreateTabData } from '../../../../protocol/commands/definitions/tab.js';
import type { CreateTabResponse } from '../../../../shared/utils/types.js';

export async function createTab({ url, active = true }: CreateTabData): Promise<CreateTabResponse> {
  const tab = await chrome.tabs.create({
    url: url || 'about:blank',
    active
  });

  if (tab.id === undefined) {
    throw new Error('Created tab has no ID');
  }

  return {
    success: true,
    tab: {
      windowId: tab.windowId ?? 0,
      tabId: tab.id,
      title: tab.title,
      url: tab.url
    }
  };
}
