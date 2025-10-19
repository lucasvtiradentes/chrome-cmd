#!/usr/bin/env node

import { appendFileSync, existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { stdin, stdout } from 'node:process';
import { APP_NAME, MEDIATOR_PORT } from '../../shared/constants.js';
import {
  MEDIATOR_LOCK_FILE,
  MEDIATOR_LOG_FILE,
  MEDIATOR_PORT_RANGE_END,
  MEDIATOR_PORT_RANGE_START
} from '../../shared/constants-node.js';
import { registerMediator, unregisterMediator } from '../../shared/mediators-registry.js';

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

let profileId: string | null = null;
let profileName: string | null = null;
let extensionId: string | null = null;
let assignedPort: number | null = null;

async function findAvailablePort(): Promise<number> {
  for (let port = MEDIATOR_PORT_RANGE_START; port <= MEDIATOR_PORT_RANGE_END; port++) {
    try {
      await new Promise<void>((resolve, reject) => {
        const testServer = createServer();
        testServer.once('error', (err: any) => {
          testServer.close();
          reject(err);
        });
        testServer.once('listening', () => {
          testServer.close();
          resolve();
        });
        testServer.listen(port, 'localhost');
      });
      return port;
    } catch {
      // Port occupied, try next
    }
  }
  throw new Error(`No available ports in range ${MEDIATOR_PORT_RANGE_START}-${MEDIATOR_PORT_RANGE_END}`);
}

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

async function handleRegister(message: any) {
  log('[Mediator] Processing REGISTER command');

  const { data, id } = message;
  extensionId = data?.extensionId;
  const installationId = data?.installationId;
  profileName = data?.profileName || 'Unknown';

  log(`[Mediator] Extension ID: ${extensionId}`);
  log(`[Mediator] Installation ID: ${installationId}`);
  log(`[Mediator] Profile Name: ${profileName}`);

  if (!installationId) {
    log(`[Mediator] ERROR: No installationId provided`);
    sendToExtension({
      id,
      success: false,
      error: 'installationId is required'
    });
    return;
  }

  try {
    const configPath = join(homedir(), '.config', APP_NAME, 'config.json');

    let config: any = {};
    const configExists = existsSync(configPath);

    if (configExists) {
      const configData = readFileSync(configPath, 'utf-8');
      config = JSON.parse(configData);
    }

    let profile = config.profiles?.find((p: any) => p.id === installationId);

    if (!profile) {
      log(`[Mediator] No profile found for installationId ${installationId}`);
      log(`[Mediator] Creating new profile...`);

      profile = {
        id: installationId,
        profileName: profileName,
        extensionId: extensionId,
        installedAt: new Date().toISOString()
      };

      if (!config.profiles) {
        config.profiles = [];
      }

      config.profiles.push(profile);

      const isFirstProfile = config.profiles.length === 1;
      if (isFirstProfile) {
        config.activeProfileId = installationId;
        log(`[Mediator] First profile - auto-activated`);
      } else {
        log(`[Mediator] Additional profile - not activated (use 'chrome-cmd extension select' to activate)`);
      }

      const configDir = dirname(configPath);
      if (!existsSync(configDir)) {
        mkdirSync(configDir, { recursive: true });
      }

      writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
      log(`[Mediator] Created profile with ID: ${installationId}`);
      log(`[Mediator] Profile Name: ${profileName}`);
    } else {
      log(`[Mediator] Found existing profile: ${profile.id}`);

      if (profile.profileName !== profileName) {
        log(`[Mediator] Updating profile name: "${profile.profileName}" → "${profileName}"`);
        profile.profileName = profileName;
        writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
      }
    }

    profileId = profile.id;
    log(`[Mediator] Profile ID resolved: ${profileId}`);

    registerMediator(profileId!, assignedPort!, process.pid, extensionId!, profileName!);
    log(`[Mediator] Registered in mediators.json`);

    sendToExtension({
      id,
      success: true,
      result: { profileId, port: assignedPort }
    });

    log(`[Mediator] Registration complete!`);
  } catch (error) {
    log(`[Mediator] ERROR during registration: ${error}`);
    sendToExtension({
      id,
      success: false,
      error: `Registration failed: ${error}`
    });
  }
}

function handleExtensionMessage(message: any) {
  log(`[NativeMsg] Received from extension: ${JSON.stringify(message)}`);

  if (message.command === 'REGISTER' || message.command === 'register') {
    handleRegister(message);
    return;
  }

  const { id } = message;
  const httpRes = pendingRequests.get(id);

  if (httpRes) {
    pendingRequests.delete(id);
    httpRes.writeHead(200, { 'Content-Type': 'application/json' });
    httpRes.end(JSON.stringify(message));
    log(`[HTTP] Sent response to CLI`);
  }
}

function startHttpServer(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    httpServer.once('error', (error: any) => {
      log(`[HTTP] Server error on port ${port}: ${error}`);
      resolve(false);
    });

    httpServer.listen(port, 'localhost', () => {
      log(`[HTTP] Server running on http://localhost:${port}`);
      resolve(true);
    });
  });
}

async function isAnotherMediatorRunning(): Promise<boolean> {
  if (!existsSync(MEDIATOR_LOCK_FILE)) {
    return false;
  }

  try {
    const lockContent = readFileSync(MEDIATOR_LOCK_FILE, 'utf-8').trim();

    // Try to parse as JSON (new format) or as plain PID (old format)
    let pid: number;
    let lockInfo: { pid: number; startedAt?: string; version?: string };

    try {
      lockInfo = JSON.parse(lockContent);
      pid = lockInfo.pid;
      log(`[Mediator] Found lock file: PID ${pid}, started ${lockInfo.startedAt || 'unknown'}`);
    } catch {
      // Old format: just PID
      pid = parseInt(lockContent, 10);
      lockInfo = { pid };
      log(`[Mediator] Found old format lock file: PID ${pid}`);
    }

    try {
      process.kill(pid, 0);
      log(`[Mediator] Found existing mediator with PID ${pid}`);

      // Verify the HTTP server is actually running
      try {
        const response = await fetch(`http://localhost:${MEDIATOR_PORT}/ping`, {
          method: 'GET',
          signal: AbortSignal.timeout(1000)
        });

        if (response.ok) {
          log(`[Mediator] HTTP server verified - mediator is healthy`);
          return true;
        } else {
          log(`[Mediator] HTTP server responded with error - removing stale lock`);
          unlinkSync(MEDIATOR_LOCK_FILE);
          return false;
        }
      } catch (fetchError) {
        log(`[Mediator] HTTP server not responding - removing stale lock`);
        unlinkSync(MEDIATOR_LOCK_FILE);

        // Kill the stale process if it exists but HTTP server is not responding
        try {
          process.kill(pid, 'SIGTERM');
          log(`[Mediator] Killed stale process ${pid}`);
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch {
          // Process might already be dead
        }

        return false;
      }
    } catch {
      log(`[Mediator] Removing stale lock file (PID ${pid} not running)`);
      unlinkSync(MEDIATOR_LOCK_FILE);
      return false;
    }
  } catch {
    log(`[Mediator] Error reading lock file - removing it`);
    try {
      unlinkSync(MEDIATOR_LOCK_FILE);
    } catch {}
    return false;
  }
}

function createLockFile() {
  const lockData = {
    pid: process.pid,
    startedAt: new Date().toISOString(),
    version: process.env.npm_package_version || 'unknown'
  };

  writeFileSync(MEDIATOR_LOCK_FILE, JSON.stringify(lockData, null, 2));
  log(`[Mediator] Created lock file with PID ${process.pid}`);

  process.on('exit', () => {
    try {
      unlinkSync(MEDIATOR_LOCK_FILE);
      log('[Mediator] Removed lock file');
    } catch {}
  });

  // Also handle SIGTERM and SIGINT
  const cleanup = () => {
    try {
      unlinkSync(MEDIATOR_LOCK_FILE);
      log('[Mediator] Removed lock file on signal');
    } catch {}
    process.exit(0);
  };

  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);
}

async function main() {
  log('[Mediator] Starting...');

  try {
    assignedPort = await findAvailablePort();
    log(`[Mediator] Using port ${assignedPort}`);
  } catch (error) {
    log(`[Mediator] FATAL: ${error}`);
    process.exit(1);
  }

  const serverStarted = await startHttpServer(assignedPort);

  if (!serverStarted) {
    log('[Mediator] FATAL: Failed to start HTTP server');
    process.exit(1);
  }

  log('[Mediator] HTTP server started successfully');
  log('[Mediator] Waiting for REGISTER command from extension...');

  while (true) {
    try {
      const message = await readFromExtension();
      if (message) {
        handleExtensionMessage(message);
      }
    } catch (error) {
      log(`[Mediator] Error reading message: ${error}`);
      break;
    }
  }
}

process.on('exit', () => {
  if (profileId) {
    log(`[Mediator] Cleaning up, unregistering profile ${profileId}`);
    unregisterMediator(profileId);
  }
});

process.on('SIGTERM', () => {
  if (profileId) {
    unregisterMediator(profileId);
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  if (profileId) {
    unregisterMediator(profileId);
  }
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  log(`[Mediator] Uncaught exception: ${error}`);
});

process.on('unhandledRejection', (error) => {
  log(`[Mediator] Unhandled rejection: ${error}`);
});

main().catch((error) => {
  log(`[Mediator] Fatal error in main: ${error}`);
  process.exit(1);
});
