/**
 * Extension Client
 * Sends HTTP requests to mediator server (BroTab style)
 */

import { randomUUID } from 'node:crypto';
import type { NativeMessage, NativeResponse } from '../types/index.js';

const MEDIATOR_URL = 'http://localhost:8765';

export class ExtensionClient {
  /**
   * Send command to mediator via HTTP
   */
  async sendCommand(command: string, data?: Record<string, unknown>): Promise<unknown> {
    const id = randomUUID();
    const message: NativeMessage = { command, data, id };

    try {
      const response = await fetch(`${MEDIATOR_URL}/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
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
          throw new Error(
            'Cannot connect to mediator. Is the Chrome extension loaded and connected?'
          );
        }
        throw error;
      }
      throw new Error('Unknown error');
    }
  }
}

