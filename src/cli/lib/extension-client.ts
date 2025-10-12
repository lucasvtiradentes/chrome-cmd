import { randomUUID } from 'node:crypto';
import { MEDIATOR_URL } from '../../shared/constants.js';
import type { NativeMessage, NativeResponse } from '../../shared/schemas.js';

export class ExtensionClient {
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
      throw new Error('Mediator not responding. Please reload the Chrome extension (chrome://extensions/)');
    }

    const id = randomUUID();
    const message: NativeMessage = { command, data, id };

    const timeoutMs = command === 'capture_screenshot' ? 60000 : 5000;

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
}
