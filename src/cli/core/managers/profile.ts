import type { Profile } from './config.js';
import { configManager } from './config.js';

export interface BridgeInfo {
  port: number;
  pid: number;
  extensionId: string;
  profileName: string;
  startedAt: string;
  lastSeen: string;
}

export type BridgesRegistry = Record<string, BridgeInfo>;

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
    this.unregisterBridge(profileId);
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

  readBridgesRegistry(): BridgesRegistry {
    return configManager.readBridgesRegistry();
  }

  writeBridgesRegistry(registry: BridgesRegistry): void {
    configManager.writeBridgesRegistry(registry);
  }

  registerBridge(options: {
    profileId: string;
    port: number;
    pid: number;
    extensionId: string;
    profileName: string;
  }): void {
    const registry = this.readBridgesRegistry();

    registry[options.profileId] = {
      port: options.port,
      pid: options.pid,
      extensionId: options.extensionId,
      profileName: options.profileName,
      startedAt: new Date().toISOString(),
      lastSeen: new Date().toISOString()
    };

    this.writeBridgesRegistry(registry);
  }

  unregisterBridge(profileId: string): void {
    const registry = this.readBridgesRegistry();
    delete registry[profileId];
    this.writeBridgesRegistry(registry);
  }

  updateBridgeLastSeen(profileId: string): void {
    const registry = this.readBridgesRegistry();

    if (registry[profileId]) {
      registry[profileId].lastSeen = new Date().toISOString();
      this.writeBridgesRegistry(registry);
    }
  }

  cleanupStaleBridges(): void {
    const registry = this.readBridgesRegistry();
    let hasChanges = false;

    for (const [profileId, info] of Object.entries(registry)) {
      if (!this.isProcessRunning(info.pid)) {
        delete registry[profileId];
        hasChanges = true;
      }
    }

    if (hasChanges) {
      this.writeBridgesRegistry(registry);
    }
  }

  private isProcessRunning(pid: number): boolean {
    try {
      process.kill(pid, 0);
      return true;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error) {
        const nodeError = error as NodeJS.ErrnoException;
        return nodeError.code === 'EPERM';
      }
      return false;
    }
  }

  async checkBridgeAlive(port: number): Promise<boolean> {
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
