import { ChromeCommand } from '../../shared/commands.js';
import { APP_NAME } from '../../shared/constants.js';
import type { Tab } from '../types.js';
import { configManager } from './config-manager.js';
import { ExtensionClient } from './extension-client.js';

export class ChromeClient {
  private client: ExtensionClient;

  constructor() {
    this.client = new ExtensionClient();
  }

  async listTabs(): Promise<Tab[]> {
    const result = await this.client.sendCommand(ChromeCommand.LIST_TABS);
    return result as Tab[];
  }

  async executeScript(tabId: number, code: string): Promise<unknown> {
    const result = await this.client.sendCommand(ChromeCommand.EXECUTE_SCRIPT, {
      tabId,
      code
    });
    return result;
  }

  async closeTab(tabId: number): Promise<void> {
    await this.client.sendCommand(ChromeCommand.CLOSE_TAB, { tabId });
  }

  async activateTab(tabId: number): Promise<void> {
    await this.client.sendCommand(ChromeCommand.ACTIVATE_TAB, { tabId });
  }

  async createTab(url?: string, active = true): Promise<Tab> {
    const result = await this.client.sendCommand(ChromeCommand.CREATE_TAB, {
      url,
      active
    });
    return (result as { tab: Tab }).tab;
  }

  async ping(): Promise<boolean> {
    try {
      await this.client.sendCommand(ChromeCommand.PING);
      return true;
    } catch {
      return false;
    }
  }

  async reloadTab(tabId: number): Promise<void> {
    await this.client.sendCommand(ChromeCommand.RELOAD_TAB, { tabId });
  }

  async navigateTab(tabId: number, url: string): Promise<void> {
    await this.client.sendCommand(ChromeCommand.NAVIGATE_TAB, { tabId, url });
  }

  async captureScreenshot(
    tabId: number,
    format: 'png' | 'jpeg' = 'png',
    quality = 90
  ): Promise<{ dataUrl: string; format: string; captureTimeMs: number }> {
    const result = await this.client.sendCommand(ChromeCommand.CAPTURE_SCREENSHOT, {
      tabId,
      format,
      quality
    });
    return result as { dataUrl: string; format: string; captureTimeMs: number };
  }

  async getTabLogs(tabId: number): Promise<unknown[]> {
    const result = await this.client.sendCommand(ChromeCommand.GET_TAB_LOGS, { tabId });
    return result as unknown[];
  }

  async getTabRequests(tabId: number, includeBody = false): Promise<unknown[]> {
    const result = await this.client.sendCommand(ChromeCommand.GET_TAB_REQUESTS, {
      tabId,
      includeBody
    });
    return result as unknown[];
  }

  async getTabStorage(tabId: number): Promise<unknown> {
    const result = await this.client.sendCommand(ChromeCommand.GET_STORAGE, { tabId });
    return result;
  }

  async startLogging(tabId: number): Promise<void> {
    await this.client.sendCommand(ChromeCommand.START_LOGGING, { tabId });
  }

  async stopLogging(tabId: number): Promise<void> {
    await this.client.sendCommand(ChromeCommand.STOP_LOGGING, { tabId });
  }

  async clickElement(tabId: number, selector: string): Promise<void> {
    await this.client.sendCommand(ChromeCommand.CLICK_ELEMENT, { tabId, selector });
  }

  async clickElementByText(tabId: number, text: string): Promise<void> {
    await this.client.sendCommand(ChromeCommand.CLICK_ELEMENT_BY_TEXT, { tabId, text });
  }

  async fillInput(tabId: number, selector: string, value: string, submit = false): Promise<void> {
    await this.client.sendCommand(ChromeCommand.FILL_INPUT, { tabId, selector, value, submit });
  }

  async resolveTab(indexOrId: string): Promise<number> {
    const num = parseInt(indexOrId, 10);

    if (num >= 1 && num <= 9 && indexOrId === num.toString()) {
      const tabs = await this.listTabs();
      const tabIndex = num - 1;

      if (tabIndex >= tabs.length) {
        throw new Error(`Tab index ${num} not found. Only ${tabs.length} tabs open.`);
      }

      return tabs[tabIndex].tabId;
    }

    return num;
  }

  async resolveTabWithConfig(indexOrId?: string): Promise<number> {
    if (indexOrId) {
      return this.resolveTab(indexOrId);
    }

    const activeTabId = configManager.getActiveTabId();
    if (activeTabId === null) {
      throw new Error(
        `No tab specified and no active tab set. Use "${APP_NAME} tabs set <indexOrId>" to set an active tab or use the --tab flag.`
      );
    }

    return activeTabId;
  }
}
