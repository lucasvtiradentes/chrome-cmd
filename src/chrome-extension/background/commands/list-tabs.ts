import type { TabInfo } from '../../../shared/utils/types.js';

export async function listTabs(): Promise<TabInfo[]> {
  const windows = await chrome.windows.getAll({ populate: true });
  const tabs: TabInfo[] = [];

  for (const window of windows) {
    if (!window.tabs || window.id === undefined) continue;
    for (const tab of window.tabs) {
      if (tab.id === undefined) continue;
      tabs.push({
        windowId: window.id,
        tabId: tab.id,
        title: tab.title,
        url: tab.url,
        active: tab.active,
        index: tab.index
      });
    }
  }

  return tabs;
}
