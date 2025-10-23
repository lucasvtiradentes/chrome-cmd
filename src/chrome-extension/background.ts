import { ChromeCommand } from '../shared/commands/chrome-command.js';
import type {
  CommandDataType,
  CommandHandler,
  CommandHandlerMap,
  CommandMessage,
  CommandRequest,
  ResponseMessage
} from '../shared/commands/commands-schemas.js';
import { commandHandlers } from './background/command-handlers.js';
import { debuggerAttached } from './background/debugger-manager.js';
import { saveCommandToHistory } from './background/history-manager.js';
import { consoleLogs, networkRequests } from './background/logging-collector.js';
import { connectToMediator, getMediatorPort, updateConnectionStatus } from './background/mediator-connection.js';

async function dispatchCommand(request: CommandRequest, handlers: CommandHandlerMap): Promise<unknown> {
  const handler = handlers[request.command] as CommandHandler<typeof request.command>;
  if (!handler) {
    throw new Error(`No handler registered for command: ${request.command}`);
  }

  return handler(request.data as CommandDataType<typeof request.command>);
}

async function handleCommand(message: CommandMessage): Promise<void> {
  const { command, data = {}, id } = message;

  if (id.startsWith('register_') && 'success' in message) {
    const response = message as unknown as ResponseMessage;
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
    const request: CommandRequest = { command, data } as CommandRequest;

    const result = await dispatchCommand(request, commandHandlers);
    const executionTime = Date.now() - startTime;

    await saveCommandToHistory(command, data, result, true, executionTime);

    const mediatorPort = getMediatorPort();
    if (mediatorPort) {
      mediatorPort.postMessage({ id, success: true, result });
    }
  } catch (error) {
    const executionTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    await saveCommandToHistory(command, data, undefined, false, executionTime, errorMessage);

    const mediatorPort = getMediatorPort();
    if (mediatorPort) {
      mediatorPort.postMessage({ id, success: false, error: errorMessage });
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

  if (message.command === ChromeCommand.RELOAD_EXTENSION) {
    const handler = commandHandlers[ChromeCommand.RELOAD_EXTENSION];
    if (handler) {
      handler({})
        .then((result) => {
          sendResponse(result);
        })
        .catch((error) => {
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

connectToMediator(handleCommand);
