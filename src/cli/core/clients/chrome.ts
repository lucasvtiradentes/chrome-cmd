import { ProtocolCommand } from '../../../bridge/protocol/commands.js';
import { CLI_NAME } from '../../../shared/constants/constants.js';
import { type TabInfo } from '../../../shared/utils/types.js';
import { profileManager } from '../managers/profile.js';
import { BridgeClient } from './bridge.js';

export class ChromeClient {
  private client: BridgeClient;

  constructor() {
    this.client = new BridgeClient();
  }

  async listTabs(): Promise<TabInfo[]> {
    const result = await this.client.sendCommand(ProtocolCommand.TAB_LIST);
    return result as TabInfo[];
  }

  async executeScript(tabId: number, code: string): Promise<unknown> {
    const result = await this.client.sendCommand(ProtocolCommand.TAB_EXEC, {
      tabId,
      code
    });
    return result;
  }

  async closeTab(tabId: number): Promise<void> {
    await this.client.sendCommand(ProtocolCommand.TAB_CLOSE, { tabId });
  }

  async activateTab(tabId: number): Promise<void> {
    await this.client.sendCommand(ProtocolCommand.TAB_FOCUS, { tabId });
  }

  async createTab(url?: string, active = true): Promise<TabInfo> {
    const result = await this.client.sendCommand(ProtocolCommand.TAB_CREATE, {
      url,
      active
    });
    return (result as { tab: TabInfo }).tab;
  }

  async ping(): Promise<boolean> {
    try {
      await this.client.sendCommand(ProtocolCommand.PING);
      return true;
    } catch {
      return false;
    }
  }

  async reloadTab(tabId: number): Promise<void> {
    await this.client.sendCommand(ProtocolCommand.TAB_REFRESH, { tabId });
  }

  async navigateTab(tabId: number, url: string): Promise<void> {
    await this.client.sendCommand(ProtocolCommand.TAB_NAVIGATE, { tabId, url });
  }

  async captureScreenshot(
    tabId: number,
    format: 'png' | 'jpeg' = 'png',
    quality = 90,
    fullPage = true
  ): Promise<{ dataUrl: string; format: string; captureTimeMs: number }> {
    const result = await this.client.sendCommand(ProtocolCommand.TAB_SCREENSHOT, {
      tabId,
      format,
      quality,
      fullPage
    });
    return result as { dataUrl: string; format: string; captureTimeMs: number };
  }

  async getTabLogs(tabId: number): Promise<unknown[]> {
    const result = await this.client.sendCommand(ProtocolCommand.TAB_LOGS, { tabId });
    return result as unknown[];
  }

  async getTabRequests(tabId: number, includeBody = false, includeCookies = false): Promise<unknown[]> {
    const result = await this.client.sendCommand(ProtocolCommand.TAB_REQUESTS, {
      tabId,
      includeBody,
      includeCookies
    });
    return result as unknown[];
  }

  async getTabStorage(tabId: number): Promise<unknown> {
    const result = await this.client.sendCommand(ProtocolCommand.TAB_STORAGE, { tabId });
    return result;
  }

  async startLogging(tabId: number): Promise<void> {
    await this.client.sendCommand(ProtocolCommand.START_LOGGING, { tabId });
  }

  async stopLogging(tabId: number): Promise<void> {
    await this.client.sendCommand(ProtocolCommand.STOP_LOGGING, { tabId });
  }

  async clickElement(tabId: number, selector: string): Promise<void> {
    await this.client.sendCommand(ProtocolCommand.TAB_CLICK, { tabId, selector });
  }

  async clickElementByText(tabId: number, text: string): Promise<void> {
    await this.client.sendCommand(ProtocolCommand.CLICK_ELEMENT_BY_TEXT, { tabId, text });
  }

  async fillInput(tabId: number, selector: string, value: string, submit = false): Promise<void> {
    await this.client.sendCommand(ProtocolCommand.TAB_INPUT, { tabId, selector, value, submit });
  }

  async resolveTab(tabIndex: string): Promise<number> {
    const num = parseInt(tabIndex, 10);

    if (num >= 1 && num <= 9 && tabIndex === num.toString()) {
      const tabs = await this.listTabs();
      const index = num - 1;

      if (index >= tabs.length) {
        throw new Error(`Tab index ${num} not found. Only ${tabs.length} tabs open.`);
      }

      const tabId = tabs[index].tabId;
      if (tabId === undefined) {
        throw new Error(`Tab at index ${num} has no tabId`);
      }
      return tabId;
    }

    return num;
  }

  async resolveTabWithConfig(tabIndex?: string): Promise<number> {
    if (tabIndex) {
      return this.resolveTab(tabIndex);
    }

    const activeTabId = profileManager.getActiveTabId();
    if (activeTabId === null) {
      throw new Error(
        `No tab specified and no active tab set. Use "${CLI_NAME} tabs select --tab <index>" to set an active tab or use the --tab flag.`
      );
    }

    return activeTabId;
  }
}
