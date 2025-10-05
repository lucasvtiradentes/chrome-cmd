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
}
