/**
 * Unified Configuration Manager for chrome-cmd
 * Manages both extension ID and active tab ID in a single config file
 * Location: ~/.config/chrome-cmd/config.json (XDG standard)
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { APP_NAME } from '../../shared/constants.js';

interface Config {
  extensionId?: string;
  activeTabId?: number;
}

export class ConfigManager {
  private configPath: string;
  private config: Config;

  constructor() {
    // Use XDG standard: ~/.config/chrome-cmd/
    const configDir = join(homedir(), '.config', APP_NAME);
    this.configPath = join(configDir, 'config.json');

    // Ensure config directory exists
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }

    // Load existing config or create new one
    this.config = this.load();
  }

  private load(): Config {
    try {
      if (existsSync(this.configPath)) {
        const data = readFileSync(this.configPath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
    return {};
  }

  private save(): void {
    try {
      writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }

  // Extension ID management
  getExtensionId(): string | undefined {
    return this.config.extensionId;
  }

  setExtensionId(extensionId: string): void {
    this.config.extensionId = extensionId;
    this.save();
  }

  clearExtensionId(): void {
    this.config.extensionId = undefined;
    this.save();
  }

  // Active Tab ID management
  getActiveTabId(): number | null {
    return this.config.activeTabId ?? null;
  }

  setActiveTabId(tabId: number): void {
    this.config.activeTabId = tabId;
    this.save();
  }

  clearActiveTabId(): void {
    this.config.activeTabId = undefined;
    this.save();
  }

  // Utility methods
  getConfigPath(): string {
    return this.configPath;
  }

  getConfig(): Config {
    return { ...this.config };
  }
}

// Singleton instance
export const configManager = new ConfigManager();

// Export convenience functions for backwards compatibility
export function getActiveTabId(): number | null {
  return configManager.getActiveTabId();
}

export function setActiveTabId(tabId: number): void {
  configManager.setActiveTabId(tabId);
}

export function clearActiveTabId(): void {
  configManager.clearActiveTabId();
}

export function readConfig(): Config {
  return configManager.getConfig();
}

export function writeConfig(config: Config): void {
  if (config.extensionId !== undefined) {
    configManager.setExtensionId(config.extensionId);
  }
  if (config.activeTabId !== undefined) {
    configManager.setActiveTabId(config.activeTabId);
  }
}
