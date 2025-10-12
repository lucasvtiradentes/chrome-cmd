import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

interface Config {
  activeTabId?: number;
}

function getConfigDir(): string {
  const home = homedir();
  return join(home, '.config', 'chrome-cmd');
}

function getConfigPath(): string {
  return join(getConfigDir(), 'config.json');
}

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

export function writeConfig(config: Config): void {
  const configDir = getConfigDir();
  const configPath = getConfigPath();

  mkdirSync(configDir, { recursive: true });

  writeFileSync(configPath, JSON.stringify(config, null, 2));
}

export function getActiveTabId(): number | null {
  const config = readConfig();
  return config.activeTabId ?? null;
}

export function setActiveTabId(tabId: number): void {
  const config = readConfig();
  config.activeTabId = tabId;
  writeConfig(config);
}

export function clearActiveTabId(): void {
  const config = readConfig();
  config.activeTabId = undefined;
  writeConfig(config);
}
