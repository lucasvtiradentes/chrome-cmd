#!/usr/bin/env node

import { appendFileSync, existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname } from 'node:path';
import { stdin, stdout } from 'node:process';
import { MEDIATOR_PORT } from '../../shared/constants.js';
import { MEDIATOR_LOCK_FILE, MEDIATOR_LOG_FILE } from '../../shared/constants-node.js';

// Ensure log directory exists
const logDir = dirname(MEDIATOR_LOG_FILE);
const lockDir = dirname(MEDIATOR_LOCK_FILE);
if (!existsSync(logDir)) {
  mkdirSync(logDir, { recursive: true });
}
if (!existsSync(lockDir)) {
  mkdirSync(lockDir, { recursive: true });
}

function log(message: string) {
  const timestamp = new Date().toISOString();
  appendFileSync(MEDIATOR_LOG_FILE, `[${timestamp}] ${message}\n`);
  console.error(message);
}

const pendingRequests = new Map<string, any>();

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

        pendingRequests.set(id, res);

        sendToExtension({ ...command, id });

        const timeoutMs = command.command === 'capture_screenshot' ? 600000 : 10000;
        setTimeout(() => {
          if (pendingRequests.has(id)) {
            pendingRequests.delete(id);
            res.writeHead(504);
            res.end(JSON.stringify({ success: false, error: 'Timeout' }));
          }
        }, timeoutMs);
      } catch (_error) {
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

function sendToExtension(message: any) {
  const json = JSON.stringify(message);
  const buffer = Buffer.from(json, 'utf-8');
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32LE(buffer.length, 0);

  stdout.write(lengthBuffer);
  stdout.write(buffer);

  log(`[NativeMsg] Sent to extension: ${message.command}`);
}

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

function startHttpServer(): Promise<boolean> {
  return new Promise((resolve) => {
    httpServer.once('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        log(`[HTTP] Port ${MEDIATOR_PORT} already in use - will relay messages to existing server`);
        resolve(false);
      } else {
        log(`[HTTP] Server error: ${error}`);
        resolve(false);
      }
    });

    httpServer.listen(MEDIATOR_PORT, 'localhost', () => {
      log(`[HTTP] Server running on http://localhost:${MEDIATOR_PORT}`);
      resolve(true);
    });
  });
}

function isAnotherMediatorRunning(): boolean {
  if (!existsSync(MEDIATOR_LOCK_FILE)) {
    return false;
  }

  try {
    const pid = parseInt(readFileSync(MEDIATOR_LOCK_FILE, 'utf-8').trim(), 10);

    try {
      process.kill(pid, 0);
      log(`[Mediator] Found existing mediator with PID ${pid}`);
      return true;
    } catch {
      log(`[Mediator] Removing stale lock file (PID ${pid} not running)`);
      unlinkSync(MEDIATOR_LOCK_FILE);
      return false;
    }
  } catch {
    unlinkSync(MEDIATOR_LOCK_FILE);
    return false;
  }
}

function createLockFile() {
  writeFileSync(MEDIATOR_LOCK_FILE, process.pid.toString());
  log(`[Mediator] Created lock file with PID ${process.pid}`);

  process.on('exit', () => {
    try {
      unlinkSync(MEDIATOR_LOCK_FILE);
      log('[Mediator] Removed lock file');
    } catch {}
  });
}

async function main() {
  log('[Mediator] Starting...');

  const anotherMediatorRunning = isAnotherMediatorRunning();

  if (anotherMediatorRunning) {
    log('[Mediator] Another mediator is already running. Running in relay mode (stdin/stdout only).');

    // Run in relay mode: just handle stdin/stdout communication
    // The HTTP server is already running in another process
    while (true) {
      try {
        const message = await readFromExtension();
        if (message) {
          handleExtensionMessage(message);
        }
      } catch (error) {
        log(`[Mediator] Error reading message in relay mode: ${error}`);
        break;
      }
    }
    return;
  }

  createLockFile();

  const serverStarted = await startHttpServer();

  if (!serverStarted) {
    log('[Mediator] Failed to start HTTP server. Exiting.');
    process.exit(1);
  }

  log('[Mediator] This instance is the primary mediator');

  while (true) {
    try {
      const message = await readFromExtension();
      if (message) {
        handleExtensionMessage(message);
      }
    } catch (error) {
      log(`[Mediator] Error reading message: ${error}`);
    }
  }
}

process.on('uncaughtException', (error) => {
  log(`[Mediator] Uncaught exception: ${error}`);
});

process.on('unhandledRejection', (error) => {
  log(`[Mediator] Unhandled rejection: ${error}`);
});

main().catch((error) => {
  log(`[Mediator] Fatal error in main: ${error}`);

  setTimeout(() => {
    log('[Mediator] Restarting...');
    main().catch((e) => log(`[Mediator] Restart failed: ${e}`));
  }, 5000);
});
