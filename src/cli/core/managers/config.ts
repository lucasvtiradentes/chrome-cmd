import { randomUUID } from 'node:crypto';
import { FILES_CONFIG } from '../../../shared/configs/files.config.js';
import { readJsonFile, writeJsonFile } from '../../../shared/utils/helpers/file-utils.js';
import { PathHelper } from '../../../shared/utils/helpers/path.helper.js';
import type { BridgesRegistry } from './profile.js';

export interface Profile {
  id: string;
  profileName: string;
  extensionId: string;
  extensionPath?: string;
  installedAt: string;
}

interface Config {
  activeProfileId?: string;
  profiles?: Profile[];
  activeTabId?: number;
  completionInstalled?: boolean;
}

export class ConfigManager {
  private configPath: string;
  private bridgesPath: string;
  private config: Config;

  constructor() {
    this.configPath = FILES_CONFIG.CONFIG_FILE;
    this.bridgesPath = FILES_CONFIG.BRIDGES_FILE;

    PathHelper.ensureDir(this.configPath);

    this.config = this.load();
  }

  private load(): Config {
    return readJsonFile<Config>(this.configPath, {});
  }

  private save(): void {
    writeJsonFile(this.configPath, this.config);
  }

  getActiveProfile(): Profile | null {
    if (!this.config.activeProfileId) {
      return null;
    }
    return this.getProfileById(this.config.activeProfileId);
  }

  getActiveProfileId(): string | null {
    return this.config.activeProfileId || null;
  }

  getProfileById(profileId: string): Profile | null {
    if (!this.config.profiles) {
      return null;
    }
    return this.config.profiles.find((p) => p.id === profileId) || null;
  }

  getProfileByExtensionId(extensionId: string): Profile | null {
    if (!this.config.profiles) {
      return null;
    }
    return this.config.profiles.find((p) => p.extensionId === extensionId) || null;
  }

  createProfile(profileName: string, extensionId: string, extensionPath?: string, profileId?: string): string {
    if (!this.config.profiles) {
      this.config.profiles = [];
    }

    const id = profileId || randomUUID();
    const profile: Profile = {
      id,
      profileName,
      extensionId,
      extensionPath,
      installedAt: new Date().toISOString()
    };

    this.config.profiles.push(profile);

    if (!this.config.activeProfileId || this.config.profiles.length === 1) {
      this.config.activeProfileId = id;
    }

    this.save();

    return id;
  }

  selectProfile(profileId: string): boolean {
    const profile = this.getProfileById(profileId);
    if (profile) {
      this.config.activeProfileId = profileId;
      this.save();
      return true;
    }
    return false;
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

  getAllProfiles(): Profile[] {
    return this.config.profiles ?? [];
  }

  removeProfile(profileId: string): void {
    if (!this.config.profiles) {
      return;
    }

    this.config.profiles = this.config.profiles.filter((p) => p.id !== profileId);

    if (this.config.activeProfileId === profileId) {
      this.config.activeProfileId = this.config.profiles.length > 0 ? this.config.profiles[0].id : undefined;
    }

    this.save();
  }

  updateProfileName(profileId: string, profileName: string): boolean {
    if (!this.config.profiles) {
      return false;
    }

    const profile = this.config.profiles.find((p) => p.id === profileId);
    if (profile) {
      profile.profileName = profileName;
      this.save();
      return true;
    }

    return false;
  }

  readBridgesRegistry(): BridgesRegistry {
    return readJsonFile<BridgesRegistry>(this.bridgesPath, {});
  }

  writeBridgesRegistry(registry: BridgesRegistry): void {
    writeJsonFile(this.bridgesPath, registry);
  }
}

export const configManager = new ConfigManager();
