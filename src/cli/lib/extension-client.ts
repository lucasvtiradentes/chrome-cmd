import { randomUUID } from 'node:crypto';
import { ChromeCommand } from '../../shared/commands/commands.js';
import type { NativeMessage, NativeResponse } from '../../shared/schemas.js';
import { profileManager } from './profile-manager.js';

export class ExtensionClient {
  private profileDetected = false;
  async sendCommand(command: string, data?: Record<string, unknown>): Promise<unknown> {
    const activeProfile = profileManager.getActiveProfile();

    if (!activeProfile) {
      throw new Error('No active profile selected.\n' + 'Please run: chrome-cmd extension select');
    }

    const mediators = profileManager.readMediatorsRegistry();
    const mediator = mediators[activeProfile.id];

    if (!mediator) {
      throw new Error(
        `Mediator not found for profile "${activeProfile.profileName}".\n` +
          'The Chrome extension may not be running or connected.\n' +
          'Please reload the Chrome extension at chrome://extensions/'
      );
    }

    const isAlive = await profileManager.checkMediatorAlive(mediator.port);
    if (!isAlive) {
      throw new Error(
        `Mediator for profile "${activeProfile.profileName}" is not responding.\n` +
          `Expected on port ${mediator.port} (PID: ${mediator.pid}).\n` +
          'Please reload the Chrome extension at chrome://extensions/'
      );
    }

    const port = mediator.port;
    const url = `http://localhost:${port}/command`;

    const id = randomUUID();
    const message: NativeMessage = { command, data, id };

    const timeoutMs = command === 'capture_screenshot' ? 600000 : 5000;

    try {
      const response = await fetch(url, {
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
        if (!this.profileDetected) {
          this.profileDetected = true;
          this.updateProfileInfo().catch(() => {});
        }
        return result.result;
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('ECONNREFUSED')) {
          throw new Error(
            `Cannot connect to mediator for profile "${activeProfile.profileName}".\n` +
              'The Chrome extension may have crashed or disconnected.\n' +
              'Please reload the extension.'
          );
        }
        throw error;
      }
      throw new Error('Unknown error');
    }
  }

  private async updateProfileInfo(): Promise<void> {
    try {
      const activeProfile = profileManager.getActiveProfile();
      if (!activeProfile) return;

      if (activeProfile.profileName !== 'Detecting...' && activeProfile.profileName !== 'undefined') {
        return;
      }

      const profileInfo = (await this.sendCommand(ChromeCommand.GET_PROFILE_INFO)) as {
        profileName: string;
      };

      if (profileInfo?.profileName) {
        profileManager.updateProfileName(activeProfile.id, profileInfo.profileName);
      }
    } catch {
      // Silent fail - not critical
    }
  }
}
