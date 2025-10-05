#!/usr/bin/env node

/**
 * Mediator - Exactly like BroTab
 *
 * This single process:
 * 1. Connects to Chrome Extension via stdin/stdout (Native Messaging)
 * 2. Runs HTTP server for CLI to send commands
 * 3. Forwards messages between CLI (HTTP) and Extension (Native Messaging)
 */

import { stdin, stdout } from 'node:process';
import { createServer } from 'node:http';
import { appendFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const HTTP_PORT = 8765;
const LOG_FILE = join(homedir(), '.chrome-cli-mediator.log');

function log(message: string) {
  const timestamp = new Date().toISOString();
  appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`);
  console.error(message);
}

// Pending HTTP requests waiting for extension response
const pendingRequests = new Map<string, any>();

/**
 * HTTP Server - for CLI to send commands
 */
const httpServer = createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/command') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const command = JSON.parse(body);
        const id = command.id || Date.now().toString();

        log(`[HTTP] Received command: ${command.command}`);

        // Store HTTP response object
        pendingRequests.set(id, res);

        // Forward to Chrome Extension via stdout (Native Messaging)
        sendToExtension({ ...command, id });

        // Timeout
        setTimeout(() => {
          if (pendingRequests.has(id)) {
            pendingRequests.delete(id);
            res.writeHead(504);
            res.end(JSON.stringify({ success: false, error: 'Timeout' }));
          }
        }, 10000);
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
      }
    });
  } else if (req.method === 'GET' && req.url === '/ping') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok' }));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

/**
 * Send message to Extension via Native Messaging (stdout)
 */
function sendToExtension(message: any) {
  const json = JSON.stringify(message);
  const buffer = Buffer.from(json, 'utf-8');
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32LE(buffer.length, 0);

  stdout.write(lengthBuffer);
  stdout.write(buffer);

  log(`[NativeMsg] Sent to extension: ${message.command}`);
}

/**
 * Read message from Extension via Native Messaging (stdin)
 */
async function readFromExtension(): Promise<any | null> {
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
          readContent(messageLength);
        } else {
          stdin.once('readable', readLength);
        }
      } else {
        stdin.once('readable', readLength);
      }
    };

    const readContent = (length: number) => {
      const messageBuffer = Buffer.alloc(length);
      let messageRead = 0;

      const readChunk = () => {
        const chunk = stdin.read(length - messageRead);
        if (chunk) {
          chunk.copy(messageBuffer, messageRead);
          messageRead += chunk.length;

          if (messageRead === length) {
            try {
              const message = JSON.parse(messageBuffer.toString('utf-8'));
              resolve(message);
            } catch (error) {
              log(`[NativeMsg] Parse error: ${error}`);
              resolve(null);
            }
          } else {
            stdin.once('readable', readChunk);
          }
        } else {
          stdin.once('readable', readChunk);
        }
      };

      readChunk();
    };

    readLength();
  });
}

/**
 * Handle message from Extension - send response to CLI
 */
function handleExtensionMessage(message: any) {
  log(`[NativeMsg] Received from extension: ${JSON.stringify(message)}`);

  const { id } = message;
  const httpRes = pendingRequests.get(id);

  if (httpRes) {
    pendingRequests.delete(id);
    httpRes.writeHead(200, { 'Content-Type': 'application/json' });
    httpRes.end(JSON.stringify(message));
    log(`[HTTP] Sent response to CLI`);
  }
}

/**
 * Start HTTP server with retry
 */
function startHttpServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    httpServer.once('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        log(`[HTTP] Port ${HTTP_PORT} already in use - exiting (another mediator will handle it)`);
        process.exit(0); // Exit cleanly, Chrome will start a new one if needed
      } else {
        reject(error);
      }
    });

    httpServer.listen(HTTP_PORT, 'localhost', () => {
      log(`[HTTP] Server running on http://localhost:${HTTP_PORT}`);
      resolve();
    });
  });
}

/**
 * Main
 */
async function main() {
  log('[Mediator] Starting...');

  // Start HTTP server
  try {
    await startHttpServer();
  } catch (error) {
    log(`[HTTP] Failed to start server: ${error}`);
  }

  // Listen for messages from Extension
  while (true) {
    try {
      const message = await readFromExtension();
      if (message) {
        handleExtensionMessage(message);
      }
    } catch (error) {
      log(`[Mediator] Error reading message: ${error}`);
      // Don't exit, just continue
    }
  }
}

// Handle uncaught errors gracefully
process.on('uncaughtException', (error) => {
  log(`[Mediator] Uncaught exception: ${error}`);
  // Don't exit, keep running
});

process.on('unhandledRejection', (error) => {
  log(`[Mediator] Unhandled rejection: ${error}`);
  // Don't exit, keep running
});

main().catch((error) => {
  log(`[Mediator] Fatal error in main: ${error}`);
  // Try to restart after delay
  setTimeout(() => {
    log('[Mediator] Restarting...');
    main().catch((e) => log(`[Mediator] Restart failed: ${e}`));
  }, 5000);
});
