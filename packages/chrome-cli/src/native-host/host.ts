#!/usr/bin/env node

/**
 * Mediator - Bridge between CLI and Chrome Extension
 * Inspired by BroTab architecture
 *
 * - Runs HTTP server for CLI to send commands
 * - Connects to Chrome Extension via stdin/stdout Native Messaging
 * - Forwards messages between CLI and Extension
 */

import { stdin, stdout } from 'node:process';
import { createServer } from 'node:http';
import { appendFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const HTTP_PORT = 8765;

// Log file for debugging
const LOG_FILE = join(homedir(), '.chrome-cli-host.log');

function log(message: string) {
  const timestamp = new Date().toISOString();
  appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`);
  console.error(message); // Also log to stderr for Chrome logs
}

interface Message {
  command: string;
  data?: Record<string, unknown>;
  id: string;
}

interface Response {
  id: string;
  success: boolean;
  result?: unknown;
  error?: string;
}

// Store pending requests from CLI waiting for Extension response
const pendingCLIRequests = new Map<string, (response: Response) => void>();

// Store the message to send to extension when it connects
let messageForExtension: Message | null = null;

/**
 * Read a message from stdin using Native Messaging protocol
 * Format: 4 bytes (uint32 little-endian) length + JSON message
 */
function readMessage(): Promise<Message | null> {
  return new Promise((resolve) => {
    const lengthBuffer = Buffer.alloc(4);
    let lengthRead = 0;

    const readLength = () => {
      const chunk = stdin.read(4 - lengthRead);
      if (chunk) {
        chunk.copy(lengthBuffer, lengthRead);
        lengthRead += chunk.length;

        if (lengthRead === 4) {
          const messageLength = lengthBuffer.readUInt32LE(0);
          readMessageContent(messageLength);
        } else {
          stdin.once('readable', readLength);
        }
      } else {
        stdin.once('readable', readLength);
      }
    };

    const readMessageContent = (length: number) => {
      const messageBuffer = Buffer.alloc(length);
      let messageRead = 0;

      const readContent = () => {
        const chunk = stdin.read(length - messageRead);
        if (chunk) {
          chunk.copy(messageBuffer, messageRead);
          messageRead += chunk.length;

          if (messageRead === length) {
            try {
              const message = JSON.parse(messageBuffer.toString('utf-8'));
              resolve(message);
            } catch (error) {
              console.error('[Host] Error parsing message:', error);
              resolve(null);
            }
          } else {
            stdin.once('readable', readContent);
          }
        } else {
          stdin.once('readable', readContent);
        }
      };

      readContent();
    };

    readLength();
  });
}

/**
 * Write a message to stdout using Native Messaging protocol
 */
function writeMessage(message: Response): void {
  const json = JSON.stringify(message);
  const buffer = Buffer.from(json, 'utf-8');
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32LE(buffer.length, 0);

  stdout.write(lengthBuffer);
  stdout.write(buffer);
}

/**
 * Handle incoming message from CLI
 * This native host acts as a bridge between CLI and Chrome Extension
 */
async function handleMessage(message: Message): Promise<Response> {
  const { command, data, id } = message;

  log(`[Host] Processing command: ${command}`);

  try {
    // Send message to Chrome Extension via chrome.runtime
    // Note: The extension will receive this via the port connection
    const result = await sendToExtension(message);

    return {
      id,
      success: true,
      result
    };
  } catch (error) {
    return {
      id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send message to Chrome Extension
 * Store the message and wait for extension to poll or send it directly if connected
 */
async function sendToExtension(message: Message): Promise<unknown> {
  log(`[Host] Storing message for extension: ${message.command}`);

  return new Promise((resolve, reject) => {
    // Store this request as pending
    pendingCLIRequests.set(message.id, (response: Response) => {
      if (response.success) {
        resolve(response.result);
      } else {
        reject(new Error(response.error || 'Unknown error'));
      }
    });

    // Send the message to extension via stdout
    // The extension that's connected via Native Messaging will receive this
    writeMessage(message as any);

    // Timeout after 10 seconds
    setTimeout(() => {
      if (pendingCLIRequests.has(message.id)) {
        pendingCLIRequests.delete(message.id);
        reject(new Error('Timeout waiting for extension response'));
      }
    }, 10000);
  });
}

/**
 * Main loop - listen for messages from Chrome
 */
async function main() {
  log('[Host] Native messaging host started');
  log(`[Host] Process ID: ${process.pid}`);
  log(`[Host] Node version: ${process.version}`);
  log(`[Host] Log file: ${LOG_FILE}`);

  // Handle process errors
  process.on('uncaughtException', (error) => {
    log(`[Host] Uncaught exception: ${error}`);
    process.exit(1);
  });

  process.on('unhandledRejection', (error) => {
    log(`[Host] Unhandled rejection: ${error}`);
    process.exit(1);
  });

  // Handle stdin errors (but don't exit on 'end' - Chrome closes/reopens stdin)
  stdin.on('error', (error) => {
    log(`[Host] stdin error: ${error}`);
    // Only exit on actual errors, not on normal stdin closure
  });

  // Keep reading messages forever
  while (true) {
    try {
      const message = await readMessage();

      if (!message) {
        log('[Host] Received null message, continuing...');
        continue;
      }

      log(`[Host] Received message: ${JSON.stringify(message)}`);

      const response = await handleMessage(message);
      writeMessage(response);

      log(`[Host] Sent response: ${JSON.stringify(response)}`);
    } catch (error) {
      log(`[Host] Error in main loop: ${error}`);
      // Don't exit on errors, just log and continue
    }
  }

  log('[Host] Native messaging host stopped');
}

// Start the host
main().catch((error) => {
  log(`[Host] Fatal error: ${error}`);
  process.exit(1);
});
