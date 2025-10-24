import { ProtocolCommand } from '../shared/protocol/commands.js';
import type {
  ProtocolCommandDataType,
  ProtocolCommandHandler,
  ProtocolCommandHandlerMap,
  ProtocolCommandRequest
} from '../shared/protocol/protocol.js';
import type { ProtocolMessage, ProtocolResponse } from '../shared/utils/types.js';
import { connectToBridge, getBridgePort, updateConnectionStatus } from './background/bridge-client.js';
import { commandHandlers } from './background/command-handlers.js';
import { debuggerAttached } from './background/debugger-manager.js';
import { saveCommandToHistory } from './background/history-manager.js';
import { consoleLogs, networkRequests } from './background/logging-collector.js';

async function dispatchCommand(request: ProtocolCommandRequest, handlers: ProtocolCommandHandlerMap): Promise<unknown> {
  const handler = handlers[request.command] as ProtocolCommandHandler<typeof request.command>;
  if (!handler) {
    throw new Error(`No handler registered for command: ${request.command}`);
  }

  return handler(request.data as ProtocolCommandDataType<typeof request.command>);
}

async function handleCommand(message: ProtocolMessage): Promise<void> {
  const { command, data = {}, id } = message;

  if (id.startsWith('register_') && 'success' in message) {
    const response = message as unknown as ProtocolResponse;
    if (response.success) {
      console.log('[Background] Registration successful');
      updateConnectionStatus(true);
    } else {
      console.error('[Background] Registration failed:', response.error);
      updateConnectionStatus(false);
    }
    return;
  }

  const startTime = Date.now();

  try {
    const request: ProtocolCommandRequest = { command, data } as ProtocolCommandRequest;

    const result = await dispatchCommand(request, commandHandlers);
    const executionTime = Date.now() - startTime;

    await saveCommandToHistory(command, data, result, true, executionTime);

    const bridgePort = getBridgePort();
    if (bridgePort) {
      bridgePort.postMessage({ id, success: true, result });
    }
  } catch (error) {
    const executionTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    await saveCommandToHistory(command, data, undefined, false, executionTime, errorMessage);

    const bridgePort = getBridgePort();
    if (bridgePort) {
      bridgePort.postMessage({ id, success: false, error: errorMessage });
    }
  }
}

chrome.tabs.onRemoved.addListener((tabId) => {
  debuggerAttached.delete(tabId);
  consoleLogs.delete(tabId);
  networkRequests.delete(tabId);
  console.log('[Background] Tab removed, cleaned up logs and requests:', tabId);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('[Background] Received message from popup:', message);

  if (message.command === ProtocolCommand.RELOAD_EXTENSION) {
    const handler = commandHandlers[ProtocolCommand.RELOAD_EXTENSION];
    if (handler) {
      handler({})
        .then((result: unknown) => {
          sendResponse(result);
        })
        .catch((error: Error) => {
          sendResponse({ success: false, error: error.message });
        });
      return true;
    }
  }

  sendResponse({ success: false, error: 'Unknown command' });
  return false;
});

console.log('[Background] Service worker started');

updateConnectionStatus(false);

connectToBridge(handleCommand);
