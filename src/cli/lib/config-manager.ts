import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { APP_NAME } from '../../shared/constants.js';

export interface ExtensionInfo {
  uuid: string;
  extensionId: string;
  profileName: string;
  extensionPath?: string;
  installedAt: string;
}

interface Config {
  extensionId?: string;
  extensions?: ExtensionInfo[];
  activeTabId?: number;
  completionInstalled?: boolean;
}

export class ConfigManager {
  private configPath: string;
  private config: Config;

  constructor() {
    const configDir = join(homedir(), '.config', APP_NAME);
    this.configPath = join(configDir, 'config.json');

    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }

    this.config = this.load();
  }

  private load(): Config {
    try {
      if (existsSync(this.configPath)) {
        const data = readFileSync(this.configPath, 'utf-8');
        return JSON.parse(data) as Config;
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

  getExtensionId(): string | undefined {
    return this.config.extensionId;
  }

  setExtensionId(extensionId: string, profileName?: string, extensionPath?: string): void {
    // Ensure the extension is in the list before setting as active
    if (!this.config.extensions) {
      this.config.extensions = [];
    }

    // IMPORTANT: Always create a new installation entry
    // Each installation gets a unique UUID, even if same extensionId + profileName
    // This allows reinstalling in the same profile (creates new UUID)
    const newUuid = randomUUID();
    this.config.extensions.push({
      uuid: newUuid,
      extensionId: extensionId,
      profileName: profileName || 'Default',
      extensionPath,
      installedAt: new Date().toISOString()
    });

    this.config.extensionId = extensionId;
    this.save();
  }

  clearExtensionId(): void {
    this.config.extensionId = undefined;
    this.save();
  }

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

  getConfigPath(): string {
    return this.configPath;
  }

  getConfig(): Config {
    return { ...this.config };
  }

  isCompletionInstalled(): boolean {
    return this.config.completionInstalled ?? false;
  }

  setCompletionInstalled(installed: boolean): void {
    this.config.completionInstalled = installed;
    this.save();
  }

  // Extension list management
  getAllExtensions(): ExtensionInfo[] {
    return this.config.extensions ?? [];
  }

  addExtension(extensionId: string, profileName: string, extensionPath?: string): void {
    if (!this.config.extensions) {
      this.config.extensions = [];
    }

    const exists = this.config.extensions.some((ext) => ext.extensionId === extensionId);
    if (!exists) {
      this.config.extensions.push({
        uuid: randomUUID(),
        extensionId: extensionId,
        profileName,
        extensionPath,
        installedAt: new Date().toISOString()
      });
      this.save();
    }
  }

  removeExtension(extensionId: string): void {
    if (!this.config.extensions) {
      return;
    }

    this.config.extensions = this.config.extensions.filter((ext) => ext.extensionId !== extensionId);

    // If the removed extension was the active one, clear it
    if (this.config.extensionId === extensionId) {
      this.config.extensionId = undefined;
    }

    this.save();
  }

  selectExtension(extensionId: string): boolean {
    const extensions = this.getAllExtensions();
    const exists = extensions.some((ext) => ext.extensionId === extensionId);

    if (exists) {
      this.config.extensionId = extensionId;
      this.save();
      return true;
    }

    return false;
  }

  selectExtensionByUuid(uuid: string): boolean {
    const extensions = this.getAllExtensions();
    const extension = extensions.find((ext) => ext.uuid === uuid);

    if (extension) {
      this.config.extensionId = extension.extensionId;
      this.save();
      return true;
    }

    return false;
  }

  updateExtensionProfile(extensionId: string, profileName: string): boolean {
    if (!this.config.extensions) {
      return false;
    }

    const extension = this.config.extensions.find((ext) => ext.extensionId === extensionId);
    if (extension) {
      extension.profileName = profileName;
      this.save();
      return true;
    }

    return false;
  }

  getExtensionByUuid(uuid: string): ExtensionInfo | undefined {
    if (!this.config.extensions) {
      return undefined;
    }

    return this.config.extensions.find((ext) => ext.uuid === uuid);
  }

  getExtensionByExtensionId(extensionId: string): ExtensionInfo | undefined {
    if (!this.config.extensions) {
      return undefined;
    }

    return this.config.extensions.find((ext) => ext.extensionId === extensionId);
  }
}

export const configManager = new ConfigManager();
