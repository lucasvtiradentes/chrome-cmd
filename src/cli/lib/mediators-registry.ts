import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { APP_NAME } from '../../shared/constants/constants.js';

export interface MediatorInfo {
  port: number;
  pid: number;
  extensionId: string;
  profileName: string;
  startedAt: string;
  lastSeen: string;
}

export type MediatorsRegistry = Record<string, MediatorInfo>;

function getRegistryPath(): string {
  return join(homedir(), '.config', APP_NAME, 'mediators.json');
}

export function readMediatorsRegistry(): MediatorsRegistry {
  const registryPath = getRegistryPath();

  if (!existsSync(registryPath)) {
    return {};
  }

  try {
    const data = readFileSync(registryPath, 'utf-8');
    return JSON.parse(data) as MediatorsRegistry;
  } catch (error) {
    console.error('[Registry] Failed to read mediators.json:', error);
    return {};
  }
}

export function writeMediatorsRegistry(registry: MediatorsRegistry): void {
  const registryPath = getRegistryPath();

  try {
    writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf-8');
  } catch (error) {
    console.error('[Registry] Failed to write mediators.json:', error);
  }
}

export function registerMediator(
  profileId: string,
  port: number,
  pid: number,
  extensionId: string,
  profileName: string
): void {
  const registry = readMediatorsRegistry();

  registry[profileId] = {
    port,
    pid,
    extensionId,
    profileName,
    startedAt: new Date().toISOString(),
    lastSeen: new Date().toISOString()
  };

  writeMediatorsRegistry(registry);
}

export function unregisterMediator(profileId: string): void {
  const registry = readMediatorsRegistry();
  delete registry[profileId];
  writeMediatorsRegistry(registry);
}

export function updateMediatorLastSeen(profileId: string): void {
  const registry = readMediatorsRegistry();

  if (registry[profileId]) {
    registry[profileId].lastSeen = new Date().toISOString();
    writeMediatorsRegistry(registry);
  }
}

export function cleanupStaleMediators(): void {
  const registry = readMediatorsRegistry();
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
    writeMediatorsRegistry(registry);
  }
}

export async function checkMediatorAlive(port: number): Promise<boolean> {
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
