/**
 * Chrome Client
 * High-level API for controlling Chrome
 */

import { ChromeCommand } from '@chrome-cmd/shared';
import type { Tab } from '../types/index.js';
import { getActiveTabId } from './config.js';
import { ExtensionClient } from './extension-client.js';

export class ChromeClient {
  private client: ExtensionClient;

  constructor() {
    this.client = new ExtensionClient();
  }

  /**
   * List all open tabs
   */
  async listTabs(): Promise<Tab[]> {
    const result = await this.client.sendCommand(ChromeCommand.LIST_TABS);
    return result as Tab[];
  }

  /**
   * Execute JavaScript in a specific tab
   */
  async executeScript(tabId: number, code: string): Promise<unknown> {
    const result = await this.client.sendCommand(ChromeCommand.EXECUTE_SCRIPT, {
      tabId,
      code
    });
    return result;
  }

  /**
   * Close a tab
   */
  async closeTab(tabId: number): Promise<void> {
    await this.client.sendCommand(ChromeCommand.CLOSE_TAB, { tabId });
  }

  /**
   * Activate (focus) a tab
   */
  async activateTab(tabId: number): Promise<void> {
    await this.client.sendCommand(ChromeCommand.ACTIVATE_TAB, { tabId });
  }

  /**
   * Create a new tab
   */
  async createTab(url?: string, active = true): Promise<Tab> {
    const result = await this.client.sendCommand(ChromeCommand.CREATE_TAB, {
      url,
      active
    });
    return (result as { tab: Tab }).tab;
  }

  /**
   * Ping the extension to check if it's alive
   */
  async ping(): Promise<boolean> {
    try {
      await this.client.sendCommand(ChromeCommand.PING);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Reload/refresh a tab
   */
  async reloadTab(tabId: number): Promise<void> {
    await this.client.sendCommand(ChromeCommand.RELOAD_TAB, { tabId });
  }

  /**
   * Navigate a tab to a specific URL
   */
  async navigateTab(tabId: number, url: string): Promise<void> {
    await this.client.sendCommand(ChromeCommand.NAVIGATE_TAB, { tabId, url });
  }

  /**
   * Capture screenshot of a tab
   */
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

  /**
   * Get console logs from a tab
   */
  async getTabLogs(tabId: number): Promise<unknown[]> {
    const result = await this.client.sendCommand(ChromeCommand.GET_TAB_LOGS, { tabId });
    return result as unknown[];
  }

  /**
   * Get network requests from a tab
   */
  async getTabRequests(tabId: number, includeBody = false): Promise<unknown[]> {
    const result = await this.client.sendCommand(ChromeCommand.GET_TAB_REQUESTS, {
      tabId,
      includeBody
    });
    return result as unknown[];
  }

  /**
   * Get storage data (cookies, localStorage, sessionStorage) from a tab
   */
  async getTabStorage(tabId: number): Promise<unknown> {
    const result = await this.client.sendCommand(ChromeCommand.GET_STORAGE, { tabId });
    return result;
  }

  /**
   * Start logging console and network activity for a tab
   */
  async startLogging(tabId: number): Promise<void> {
    await this.client.sendCommand(ChromeCommand.START_LOGGING, { tabId });
  }

  /**
   * Stop logging console and network activity for a tab
   */
  async stopLogging(tabId: number): Promise<void> {
    await this.client.sendCommand(ChromeCommand.STOP_LOGGING, { tabId });
  }

  /**
   * Click on an element in a tab
   */
  async clickElement(tabId: number, selector: string): Promise<void> {
    await this.client.sendCommand(ChromeCommand.CLICK_ELEMENT, { tabId, selector });
  }

  /**
   * Click on an element by text content
   */
  async clickElementByText(tabId: number, text: string): Promise<void> {
    await this.client.sendCommand(ChromeCommand.CLICK_ELEMENT_BY_TEXT, { tabId, text });
  }

  /**
   * Fill an input field in a tab
   */
  async fillInput(tabId: number, selector: string, value: string, submit = false): Promise<void> {
    await this.client.sendCommand(ChromeCommand.FILL_INPUT, { tabId, selector, value, submit });
  }

  /**
   * Resolve tab by index or ID
   * If input is 1-9, treat as index (1-based)
   * Otherwise treat as tab ID
   */
  async resolveTab(indexOrId: string): Promise<number> {
    const num = parseInt(indexOrId, 10);

    // If it's a small number (1-9), treat as index
    if (num >= 1 && num <= 9 && indexOrId === num.toString()) {
      const tabs = await this.listTabs();
      const tabIndex = num - 1; // Convert to 0-based index

      if (tabIndex >= tabs.length) {
        throw new Error(`Tab index ${num} not found. Only ${tabs.length} tabs open.`);
      }

      return tabs[tabIndex].tabId;
    }

    // Otherwise, treat as tab ID
    return num;
  }

  /**
   * Resolve tab from optional input or config
   * If indexOrId is provided, use it
   * Otherwise, use the active tab ID from config
   */
  async resolveTabWithConfig(indexOrId?: string): Promise<number> {
    if (indexOrId) {
      return this.resolveTab(indexOrId);
    }

    const activeTabId = getActiveTabId();
    if (activeTabId === null) {
      throw new Error(
        'No tab specified and no active tab set. Use "chrome-cmd tabs set <indexOrId>" to set an active tab or use the --tab flag.'
      );
    }

    return activeTabId;
  }
}
