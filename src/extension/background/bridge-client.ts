import { BRIDGE_CONFIGS } from '../../shared/configs/bridge.configs.js';
import { BRIDGE_APP_NAME } from '../../shared/constants/constants.js';
import type { ProtocolMessage } from '../../shared/utils/types.js';

let mediatorPort: chrome.runtime.Port | null = null;
let reconnectAttempts = 0;
let keepaliveInterval: ReturnType<typeof setInterval> | null = null;

export function updateConnectionStatus(connected: boolean): void {
  chrome.storage.local.set({ mediatorConnected: connected });
  console.log('[Background] Connection status updated:', connected ? 'CONNECTED' : 'DISCONNECTED');

  const iconSuffix = connected ? '-connected' : '-disconnected';
  chrome.action.setIcon({
    path: {
      '16': `icons/icon16${iconSuffix}.png`,
      '48': `icons/icon48${iconSuffix}.png`,
      '128': `icons/icon128${iconSuffix}.png`
    }
  });
  console.log('[Background] Icon updated:', iconSuffix);
}

async function sendRegisterCommand(): Promise<void> {
  if (!mediatorPort) {
    console.error('[Background] Cannot send REGISTER: mediatorPort is null');
    return;
  }

  const extensionId = chrome.runtime.id;
  const id = `register_${Date.now()}`;

  const installationId = await new Promise<string>((resolve) => {
    chrome.storage.local.get(['installationId'], (result) => {
      if (result.installationId) {
        resolve(result.installationId);
      } else {
        const newId = crypto.randomUUID();
        chrome.storage.local.set({ installationId: newId }, () => {
          resolve(newId);
        });
      }
    });
  });

  let profileName = extensionId;
  try {
    const userInfo = await chrome.identity.getProfileUserInfo();
    if (userInfo.email) {
      profileName = userInfo.email;
    }
  } catch (error) {
    console.error('[Background] Failed to get user email:', error);
  }

  console.log('[Background] Registering profile:', profileName);

  mediatorPort.postMessage({
    command: 'REGISTER',
    id,
    data: {
      extensionId,
      installationId,
      profileName
    }
  });
}

export function connectToMediator(handleCommand: (message: ProtocolMessage) => Promise<void>): void {
  if (mediatorPort) {
    console.log('[Background] Already connected to mediator, skipping...');
    return;
  }

  try {
    mediatorPort = chrome.runtime.connectNative(BRIDGE_APP_NAME);

    mediatorPort.onMessage.addListener((message: ProtocolMessage) => {
      console.log('[Background] Received from mediator:', message);
      handleCommand(message);
    });

    mediatorPort.onDisconnect.addListener(() => {
      const lastError = chrome.runtime.lastError;
      console.log('[Background] Mediator disconnected:', lastError?.message || 'Unknown reason');
      mediatorPort = null;
      updateConnectionStatus(false);

      if (keepaliveInterval) {
        clearInterval(keepaliveInterval);
        keepaliveInterval = null;
      }

      reconnectAttempts++;
      const delay = Math.min(
        BRIDGE_CONFIGS.RECONNECT_BASE_DELAY * 2 ** (reconnectAttempts - 1),
        BRIDGE_CONFIGS.MAX_RECONNECT_DELAY
      );
      console.log(`[Background] Reconnecting in ${delay}ms (attempt ${reconnectAttempts})...`);

      setTimeout(() => {
        connectToMediator(handleCommand);
      }, delay);
    });

    console.log('[Background] Connected to mediator');
    reconnectAttempts = 0;

    setTimeout(async () => {
      if (mediatorPort) {
        await sendRegisterCommand();
      }
    }, BRIDGE_CONFIGS.REGISTER_COMMAND_DELAY);

    if (keepaliveInterval) clearInterval(keepaliveInterval);
    keepaliveInterval = setInterval(() => {
      if (mediatorPort) {
        try {
          mediatorPort.postMessage({
            command: 'ping',
            id: `keepalive_${Date.now()}`
          });
        } catch (error) {
          console.error('[Background] Keepalive failed:', error);
        }
      }
    }, BRIDGE_CONFIGS.KEEPALIVE_INTERVAL);
  } catch (error) {
    console.error('[Background] Failed to connect to mediator:', error);
    updateConnectionStatus(false);

    reconnectAttempts++;
    const delay = Math.min(
      BRIDGE_CONFIGS.RECONNECT_BASE_DELAY * 2 ** (reconnectAttempts - 1),
      BRIDGE_CONFIGS.MAX_RECONNECT_DELAY
    );
    setTimeout(() => {
      connectToMediator(handleCommand);
    }, delay);
  }
}

export function getMediatorPort(): chrome.runtime.Port | null {
  return mediatorPort;
}
