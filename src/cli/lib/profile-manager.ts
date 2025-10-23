import type { Profile } from './config-manager.js';
import { configManager } from './config-manager.js';

export interface MediatorInfo {
  port: number;
  pid: number;
  extensionId: string;
  profileName: string;
  startedAt: string;
  lastSeen: string;
}

export type MediatorsRegistry = Record<string, MediatorInfo>;

export class ProfileManager {
  getActiveProfile(): Profile | null {
    return configManager.getActiveProfile();
  }

  getActiveProfileId(): string | null {
    return configManager.getActiveProfileId();
  }

  getProfileById(profileId: string): Profile | null {
    return configManager.getProfileById(profileId);
  }

  getProfileByExtensionId(extensionId: string): Profile | null {
    return configManager.getProfileByExtensionId(extensionId);
  }

  createProfile(profileName: string, extensionId: string, extensionPath?: string, profileId?: string): string {
    return configManager.createProfile(profileName, extensionId, extensionPath, profileId);
  }

  selectProfile(profileId: string): boolean {
    return configManager.selectProfile(profileId);
  }

  getAllProfiles(): Profile[] {
    return configManager.getAllProfiles();
  }

  removeProfile(profileId: string): void {
    configManager.removeProfile(profileId);
    this.unregisterMediator(profileId);
  }

  updateProfileName(profileId: string, profileName: string): boolean {
    return configManager.updateProfileName(profileId, profileName);
  }

  getActiveTabId(): number | null {
    return configManager.getActiveTabId();
  }

  setActiveTabId(tabId: number): void {
    configManager.setActiveTabId(tabId);
  }

  clearActiveTabId(): void {
    configManager.clearActiveTabId();
  }

  isCompletionInstalled(): boolean {
    return configManager.isCompletionInstalled();
  }

  setCompletionInstalled(installed: boolean): void {
    configManager.setCompletionInstalled(installed);
  }

  readMediatorsRegistry(): MediatorsRegistry {
    return configManager.readMediatorsRegistry();
  }

  writeMediatorsRegistry(registry: MediatorsRegistry): void {
    configManager.writeMediatorsRegistry(registry);
  }

  registerMediator(options: {
    profileId: string;
    port: number;
    pid: number;
    extensionId: string;
    profileName: string;
  }): void {
    const registry = this.readMediatorsRegistry();

    registry[options.profileId] = {
      port: options.port,
      pid: options.pid,
      extensionId: options.extensionId,
      profileName: options.profileName,
      startedAt: new Date().toISOString(),
      lastSeen: new Date().toISOString()
    };

    this.writeMediatorsRegistry(registry);
  }

  unregisterMediator(profileId: string): void {
    const registry = this.readMediatorsRegistry();
    delete registry[profileId];
    this.writeMediatorsRegistry(registry);
  }

  updateMediatorLastSeen(profileId: string): void {
    const registry = this.readMediatorsRegistry();

    if (registry[profileId]) {
      registry[profileId].lastSeen = new Date().toISOString();
      this.writeMediatorsRegistry(registry);
    }
  }

  cleanupStaleMediators(): void {
    const registry = this.readMediatorsRegistry();
    let hasChanges = false;

    for (const [profileId, info] of Object.entries(registry)) {
      try {
        process.kill(info.pid, 0);
      } catch {
        delete registry[profileId];
        hasChanges = true;
      }
    }

    if (hasChanges) {
      this.writeMediatorsRegistry(registry);
    }
  }

  async checkMediatorAlive(port: number): Promise<boolean> {
    try {
      const response = await fetch(`http://localhost:${port}/ping`, {
        method: 'GET',
        signal: AbortSignal.timeout(1000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const profileManager = new ProfileManager();
