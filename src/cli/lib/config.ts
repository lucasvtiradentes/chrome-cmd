/**
 * Configuration manager for chrome-cmd
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

interface Config {
  activeTabId?: number;
}

/**
 * Get the config directory path
 */
function getConfigDir(): string {
  const home = homedir();
  return join(home, '.config', 'chrome-cmd');
}

/**
 * Get the config file path
 */
function getConfigPath(): string {
  return join(getConfigDir(), 'config.json');
}

/**
 * Read configuration from disk
 */
export function readConfig(): Config {
  const configPath = getConfigPath();

  if (!existsSync(configPath)) {
    return {};
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

/**
 * Write configuration to disk
 */
export function writeConfig(config: Config): void {
  const configDir = getConfigDir();
  const configPath = getConfigPath();

  // Ensure config directory exists
  mkdirSync(configDir, { recursive: true });

  // Write config file
  writeFileSync(configPath, JSON.stringify(config, null, 2));
}

/**
 * Get the active tab ID from config
 */
export function getActiveTabId(): number | null {
  const config = readConfig();
  return config.activeTabId ?? null;
}

/**
 * Set the active tab ID in config
 */
export function setActiveTabId(tabId: number): void {
  const config = readConfig();
  config.activeTabId = tabId;
  writeConfig(config);
}

/**
 * Clear the active tab ID from config
 */
export function clearActiveTabId(): void {
  const config = readConfig();
  config.activeTabId = undefined;
  writeConfig(config);
}
