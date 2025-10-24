import { BRIDGE_CONFIG } from '../../bridge/bridge.config.js';
import { BRIDGE_APP_NAME } from '../../shared/constants/constants.js';
import type { ProtocolMessage } from '../../shared/utils/types.js';

let bridgePort: chrome.runtime.Port | null = null;
let reconnectAttempts = 0;
let keepaliveInterval: ReturnType<typeof setInterval> | null = null;

export function updateConnectionStatus(connected: boolean): void {
  chrome.storage.local.set({ bridgeConnected: connected });
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
  if (!bridgePort) {
    console.error('[Background] Cannot send REGISTER: bridgePort is null');
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

  bridgePort.postMessage({
    command: 'REGISTER',
    id,
    data: {
      extensionId,
      installationId,
      profileName
    }
  });
}

export function connectToBridge(handleCommand: (message: ProtocolMessage) => Promise<void>): void {
  if (bridgePort) {
    console.log('[Background] Already connected to bridge, skipping...');
    return;
  }

  try {
    bridgePort = chrome.runtime.connectNative(BRIDGE_APP_NAME);

    bridgePort.onMessage.addListener((message: ProtocolMessage) => {
      console.log('[Background] Received from bridge:', message);
      handleCommand(message);
    });

    bridgePort.onDisconnect.addListener(() => {
      const lastError = chrome.runtime.lastError;
      console.log('[Background] Bridge disconnected:', lastError?.message || 'Unknown reason');
      bridgePort = null;
      updateConnectionStatus(false);

      if (keepaliveInterval) {
        clearInterval(keepaliveInterval);
        keepaliveInterval = null;
      }

      reconnectAttempts++;
      const delay = Math.min(
        BRIDGE_CONFIG.RECONNECT_BASE_DELAY * 2 ** (reconnectAttempts - 1),
        BRIDGE_CONFIG.MAX_RECONNECT_DELAY
      );
      console.log(`[Background] Reconnecting in ${delay}ms (attempt ${reconnectAttempts})...`);

      setTimeout(() => {
        connectToBridge(handleCommand);
      }, delay);
    });

    console.log('[Background] Connected to bridge');
    reconnectAttempts = 0;

    setTimeout(async () => {
      if (bridgePort) {
        await sendRegisterCommand();
      }
    }, BRIDGE_CONFIG.REGISTER_COMMAND_DELAY);

    if (keepaliveInterval) clearInterval(keepaliveInterval);
    keepaliveInterval = setInterval(() => {
      if (bridgePort) {
        try {
          bridgePort.postMessage({
            command: 'ping',
            id: `keepalive_${Date.now()}`
          });
        } catch (error) {
          console.error('[Background] Keepalive failed:', error);
        }
      }
    }, BRIDGE_CONFIG.KEEPALIVE_INTERVAL);
  } catch (error) {
    console.error('[Background] Failed to connect to bridge:', error);
    updateConnectionStatus(false);

    reconnectAttempts++;
    const delay = Math.min(
      BRIDGE_CONFIG.RECONNECT_BASE_DELAY * 2 ** (reconnectAttempts - 1),
      BRIDGE_CONFIG.MAX_RECONNECT_DELAY
    );
    setTimeout(() => {
      connectToBridge(handleCommand);
    }, delay);
  }
}

export function getBridgePort(): chrome.runtime.Port | null {
  return bridgePort;
}
