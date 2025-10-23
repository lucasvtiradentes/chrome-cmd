#!/usr/bin/env node

import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { stdin, stdout } from 'node:process';
import { FILES_CONFIG } from '../../shared/configs/files.config.js';

PathHelper.ensureDir(FILES_CONFIG.MEDIATOR_LOG_FILE);

function log(message: string) {
  const timestamp = new Date().toISOString();
  appendFileSync(FILES_CONFIG.MEDIATOR_LOG_FILE, `[${timestamp}] ${message}\n`);
  console.error(message);
}

import type { ServerResponse } from 'node:http';
import { MEDIATOR_CONFIGS } from '../../shared/configs/mediator.configs.js';
import { PathHelper } from '../../shared/utils/helpers/path.helper.js';
import type { Profile } from '../lib/config-manager.js';
import { profileManager } from '../lib/profile-manager.js';

interface Config {
  activeProfileId?: string;
  profiles?: Profile[];
  activeTabId?: number;
  completionInstalled?: boolean;
}

interface RegisterMessageData {
  extensionId?: string;
  installationId?: string;
  profileName?: string;
}

interface NativeMessage {
  id: string;
  command?: string;
  data?: RegisterMessageData;
  success?: boolean;
  error?: string;
  result?: unknown;
}

const pendingRequests = new Map<string, ServerResponse>();

let profileId: string | null = null;
let profileName: string | null = null;
let extensionId: string | null = null;
let assignedPort: number | null = null;

async function findAvailablePort(): Promise<number> {
  for (let port = MEDIATOR_CONFIGS.PORT_START; port <= MEDIATOR_CONFIGS.PORT_END; port++) {
    try {
      await new Promise<void>((resolve, reject) => {
        const testServer = createServer();
        testServer.once('error', (err: NodeJS.ErrnoException) => {
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
  throw new Error(`No available ports in range ${MEDIATOR_CONFIGS.PORT_START}-${MEDIATOR_CONFIGS.PORT_END}`);
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

function sendToExtension(message: NativeMessage) {
  const json = JSON.stringify(message);
  const buffer = Buffer.from(json, 'utf-8');
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32LE(buffer.length, 0);

  stdout.write(lengthBuffer);
  stdout.write(buffer);

  log(`[NativeMsg] Sent to extension: ${message.command ?? 'response'}`);
}

async function readFromExtension(): Promise<unknown | null> {
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

async function handleRegister(message: NativeMessage) {
  log('[Mediator] Processing REGISTER command');

  const { data, id } = message;
  extensionId = data?.extensionId ?? null;
  const installationId = data?.installationId;
  profileName = data?.profileName ?? 'Unknown';

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
    const configPath = FILES_CONFIG.CONFIG_FILE;

    let config: Config = {};
    const configExists = existsSync(configPath);

    if (configExists) {
      const configData = readFileSync(configPath, 'utf-8');
      config = JSON.parse(configData) as Config;
    }

    let profile = config.profiles?.find((p) => p.id === installationId);

    if (!profile) {
      log(`[Mediator] No profile found for installationId ${installationId}`);
      log(`[Mediator] Creating new profile...`);

      if (!extensionId) {
        log(`[Mediator] ERROR: extensionId is required to create profile`);
        sendToExtension({
          id,
          success: false,
          error: 'extensionId is required'
        });
        return;
      }

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

      PathHelper.ensureDir(configPath);

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

    if (!profileId || !assignedPort || !extensionId || !profileName) {
      log(`[Mediator] ERROR: Missing required data for registration`);
      sendToExtension({
        id,
        success: false,
        error: 'Missing required data for registration'
      });
      return;
    }

    profileManager.registerMediator({
      profileId,
      port: assignedPort,
      pid: process.pid,
      extensionId,
      profileName
    });
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

function handleExtensionMessage(message: unknown) {
  log(`[NativeMsg] Received from extension: ${JSON.stringify(message)}`);

  const typedMessage = message as NativeMessage;

  if (typedMessage.command === 'REGISTER' || typedMessage.command === 'register') {
    handleRegister(typedMessage);
    return;
  }

  const { id } = typedMessage;
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
    httpServer.once('error', (error: unknown) => {
      log(`[HTTP] Server error on port ${port}: ${error}`);
      resolve(false);
    });

    httpServer.listen(port, 'localhost', () => {
      log(`[HTTP] Server running on http://localhost:${port}`);
      resolve(true);
    });
  });
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
    profileManager.unregisterMediator(profileId);
  }
});

process.on('SIGTERM', () => {
  if (profileId) {
    profileManager.unregisterMediator(profileId);
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  if (profileId) {
    profileManager.unregisterMediator(profileId);
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
