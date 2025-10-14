import { randomUUID } from 'node:crypto';
import { ChromeCommand } from '../../shared/commands.js';
import { MEDIATOR_URL } from '../../shared/constants.js';
import type { NativeMessage, NativeResponse } from '../../shared/schemas.js';
import { configManager } from './config-manager.js';

export class ExtensionClient {
  private profileDetected = false;
  private async waitForMediator(maxRetries = 10, delayMs = 300): Promise<boolean> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(`${MEDIATOR_URL}/ping`, {
          method: 'GET',
          signal: AbortSignal.timeout(500)
        });

        if (response.ok) {
          return true;
        }
      } catch (_error) {}

      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return false;
  }

  async sendCommand(command: string, data?: Record<string, unknown>): Promise<unknown> {
    const isReady = await this.waitForMediator();
    if (!isReady) {
      throw new Error(
        'Mediator not responding. Please try:\n' +
          '1. Reload the Chrome extension at chrome://extensions/\n' +
          '2. Or run: chrome-cmd mediator restart'
      );
    }

    const id = randomUUID();
    const message: NativeMessage = { command, data, id };

    const timeoutMs = command === 'capture_screenshot' ? 600000 : 5000;

    try {
      const response = await fetch(`${MEDIATOR_URL}/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message),
        signal: AbortSignal.timeout(timeoutMs)
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const result = (await response.json()) as NativeResponse;

      if (result.success) {
        // Auto-detect and update profile name on first successful connection
        if (!this.profileDetected) {
          this.profileDetected = true;
          this.updateProfileInfo().catch(() => {}); // Silent fail
        }
        return result.result;
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('ECONNREFUSED')) {
          throw new Error('Cannot connect to mediator. Is the Chrome extension loaded and connected?');
        }
        throw error;
      }
      throw new Error('Unknown error');
    }
  }

  private async updateProfileInfo(): Promise<void> {
    try {
      const extensionId = configManager.getExtensionId();
      if (!extensionId) return;

      const extensions = configManager.getAllExtensions();
      const currentExtension = extensions.find((ext) => ext.id === extensionId);

      // Only update if profile name is "Detecting..." or "undefined"
      if (!currentExtension) {
        return;
      }

      if (currentExtension.profileName !== 'Detecting...' && currentExtension.profileName !== 'undefined') {
        return;
      }

      // Get profile info from Chrome extension
      const profileInfo = (await this.sendCommand(ChromeCommand.GET_PROFILE_INFO)) as {
        profileName: string;
        extensionPath: string;
      };
      if (profileInfo?.profileName) {
        configManager.updateExtensionProfile(extensionId, profileInfo.profileName, profileInfo.extensionPath);
      }
    } catch {
      // Silent fail - not critical
    }
  }
}
