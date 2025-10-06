/**
 * Chrome Client
 * High-level API for controlling Chrome
 */

import type { Tab } from '../types/index.js';
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
    const result = await this.client.sendCommand('list_tabs');
    return result as Tab[];
  }

  /**
   * Execute JavaScript in a specific tab
   */
  async executeScript(tabId: number, code: string): Promise<unknown> {
    const result = await this.client.sendCommand('execute_script', {
      tabId,
      code
    });
    return result;
  }

  /**
   * Close a tab
   */
  async closeTab(tabId: number): Promise<void> {
    await this.client.sendCommand('close_tab', { tabId });
  }

  /**
   * Activate (focus) a tab
   */
  async activateTab(tabId: number): Promise<void> {
    await this.client.sendCommand('activate_tab', { tabId });
  }

  /**
   * Create a new tab
   */
  async createTab(url?: string, active = true): Promise<Tab> {
    const result = await this.client.sendCommand('create_tab', {
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
      await this.client.sendCommand('ping');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Reload/refresh a tab
   */
  async reloadTab(tabId: number): Promise<void> {
    await this.client.sendCommand('reload_tab', { tabId });
  }

  /**
   * Get console logs from a tab
   */
  async getTabLogs(tabId: number): Promise<unknown[]> {
    const result = await this.client.sendCommand('get_tab_logs', { tabId });
    return result as unknown[];
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
}
