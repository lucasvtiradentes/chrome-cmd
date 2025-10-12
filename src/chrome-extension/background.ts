/**
 * Chrome CLI Bridge - Background Service Worker
 * Connects to mediator server via Native Messaging (BroTab architecture)
 */

import { ChromeCommand } from '../shared/commands.js';
import { dispatchCommand, escapeJavaScriptString, type CommandHandlerMap } from '../shared/helpers.js';
import { NATIVE_APP_NAME } from '../shared/constants.js';
import type {
  CaptureScreenshotData,
  ClickElementByTextData,
  ClickElementData,
  CommandMessage,
  CommandRequest,
  CreateTabData,
  ExecuteScriptData,
  FillInputData,
  GetTabRequestsData,
  NavigateTabData,
  TabIdData
} from '../shared/schemas.js';
import type {
  CaptureScreenshotResponse,
  CreateTabResponse,
  HistoryItem,
  LogEntry,
  NetworkRequestEntry,
  StartLoggingResponse,
  StopLoggingResponse,
  StorageData,
  SuccessResponse,
  TabInfo
} from '../shared/types.js';
import type {
  ConsoleAPICalledParams,
  ExceptionThrownParams,
  LogEntryAddedParams,
  NetworkGetCookiesResponse,
  NetworkGetResponseBodyResponse,
  NetworkLoadingFailedParams,
  NetworkLoadingFinishedParams,
  NetworkRequestExtraInfoParams,
  NetworkRequestWillBeSentParams,
  NetworkResponseExtraInfoParams,
  NetworkResponseReceivedParams,
  RuntimeEvaluateResponse
} from './types';

let mediatorPort: chrome.runtime.Port | null = null;
let reconnectAttempts = 0;
let keepaliveInterval: ReturnType<typeof setInterval> | null = null;

// Console logs storage: tabId -> array of log entries
const consoleLogs = new Map<number, LogEntry[]>();
// Network requests storage: tabId -> array of request entries
const networkRequests = new Map<number, NetworkRequestEntry[]>();
// Track which tabs have debugger attached for logging
const debuggerAttached = new Set<number>();

/**
 * Connect to the mediator via Native Messaging
 */
function connectToMediator(): void {
  // Prevent multiple connections
  if (mediatorPort) {
    console.log('[Background] Already connected to mediator, skipping...');
    return;
  }

  try {
    mediatorPort = chrome.runtime.connectNative(NATIVE_APP_NAME);

    mediatorPort.onMessage.addListener((message: CommandMessage) => {
      console.log('[Background] Received from mediator:', message);
      handleCommand(message);
    });

    mediatorPort.onDisconnect.addListener(() => {
      const lastError = chrome.runtime.lastError;
      console.log('[Background] Mediator disconnected:', lastError?.message || 'Unknown reason');
      mediatorPort = null;

      // Clear keepalive
      if (keepaliveInterval) {
        clearInterval(keepaliveInterval);
        keepaliveInterval = null;
      }

      // Try to reconnect with exponential backoff
      reconnectAttempts++;
      const delay = Math.min(1000 * 2 ** (reconnectAttempts - 1), 30000); // Max 30s
      console.log(`[Background] Reconnecting in ${delay}ms (attempt ${reconnectAttempts})...`);

      setTimeout(() => {
        connectToMediator();
      }, delay);
    });

    console.log('[Background] Connected to mediator');
    reconnectAttempts = 0;

    // Send keepalive ping every 30 seconds to keep connection alive
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
    }, 30000);
  } catch (error) {
    console.error('[Background] Failed to connect to mediator:', error);

    // Retry connection
    reconnectAttempts++;
    const delay = Math.min(1000 * 2 ** (reconnectAttempts - 1), 30000);
    setTimeout(() => {
      connectToMediator();
    }, delay);
  }
}

/**
 * Save command to history
 */
async function saveCommandToHistory(command: string, data: Record<string, unknown>): Promise<void> {
  // Don't save ping commands
  if (command === ChromeCommand.PING || command.startsWith('keepalive')) {
    return;
  }

  const historyItem: HistoryItem = {
    command,
    data,
    timestamp: Date.now()
  };

  const result = await chrome.storage.local.get(['commandHistory']);
  const history: HistoryItem[] = (result.commandHistory as HistoryItem[]) || [];

  // Keep last 100 commands
  history.push(historyItem);
  if (history.length > 100) {
    history.shift();
  }

  await chrome.storage.local.set({ commandHistory: history });
}

/**
 * Command handlers map - Type-safe dispatcher pattern
 * TypeScript automatically validates that each handler has the correct signature!
 * NO "as" type assertions needed - the dispatchCommand helper handles type narrowing!
 */
const commandHandlers: CommandHandlerMap = {
  [ChromeCommand.LIST_TABS]: async () => listTabs(),
  [ChromeCommand.EXECUTE_SCRIPT]: async (data) => executeScript(data),
  [ChromeCommand.CLOSE_TAB]: async (data) => closeTab(data),
  [ChromeCommand.ACTIVATE_TAB]: async (data) => activateTab(data),
  [ChromeCommand.CREATE_TAB]: async (data) => createTab(data),
  [ChromeCommand.RELOAD_TAB]: async (data) => reloadTab(data),
  [ChromeCommand.GET_TAB_LOGS]: async (data) => getTabLogs(data),
  [ChromeCommand.CLEAR_TAB_LOGS]: async (data) => clearTabLogs(data),
  [ChromeCommand.GET_TAB_REQUESTS]: async (data) => getTabRequests(data),
  [ChromeCommand.CLEAR_TAB_REQUESTS]: async (data) => clearTabRequests(data),
  [ChromeCommand.START_LOGGING]: async (data) => startLogging(data),
  [ChromeCommand.STOP_LOGGING]: async (data) => stopLogging(data),
  [ChromeCommand.GET_STORAGE]: async (data) => getTabStorage(data),
  [ChromeCommand.NAVIGATE_TAB]: async (data) => navigateTab(data),
  [ChromeCommand.CAPTURE_SCREENSHOT]: async (data) => captureScreenshot(data),
  [ChromeCommand.CLICK_ELEMENT]: async (data) => clickElement(data),
  [ChromeCommand.CLICK_ELEMENT_BY_TEXT]: async (data) => clickElementByText(data),
  [ChromeCommand.FILL_INPUT]: async (data) => fillInput(data),
  [ChromeCommand.RELOAD_EXTENSION]: async () => reloadExtension(),
  [ChromeCommand.PING]: async () => ({ status: 'ok', message: 'pong' })
};

async function handleCommand(message: CommandMessage): Promise<void> {
  const { command, data = {}, id } = message;

  // Save to history
  await saveCommandToHistory(command, data);

  try {
    // Create discriminated union request
    const request: CommandRequest = { command, data } as CommandRequest;

    // Dispatch command with automatic type narrowing - NO "as" needed!
    const result = await dispatchCommand(request, commandHandlers);

    // Send response back to mediator
    if (mediatorPort) {
      mediatorPort.postMessage({ id, success: true, result });
    }
  } catch (error) {
    // Send error response back to mediator
    if (mediatorPort) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      mediatorPort.postMessage({ id, success: false, error: errorMessage });
    }
  }
}

/**
 * List all open tabs
 * Returns format: { windowId, tabId, title, url, active }
 */
async function listTabs(): Promise<TabInfo[]> {
  const windows = await chrome.windows.getAll({ populate: true });
  const tabs: TabInfo[] = [];

  for (const window of windows) {
    if (!window.tabs) continue;
    for (const tab of window.tabs) {
      tabs.push({
        windowId: window.id,
        tabId: tab.id,
        title: tab.title,
        url: tab.url,
        active: tab.active,
        index: tab.index
      });
    }
  }

  return tabs;
}

/**
 * Execute JavaScript in a specific tab using Chrome Debugger API
 * This is the official way to execute arbitrary code in Manifest V3
 */
async function executeScript({ tabId, code }: ExecuteScriptData): Promise<unknown> {
  if (!tabId || !code) {
    throw new Error('tabId and code are required');
  }

  const tabIdInt = parseInt(String(tabId), 10);
  console.log('[Background] Executing script in tab', tabIdInt, ':', code);

  try {
    // Attach debugger to tab
    await chrome.debugger.attach({ tabId: tabIdInt }, '1.3');
    console.log('[Background] Debugger attached');

    // Execute code using Runtime.evaluate
    const result = await chrome.debugger.sendCommand({ tabId: tabIdInt }, 'Runtime.evaluate', {
      expression: code,
      returnByValue: true,
      awaitPromise: true
    });

    console.log('[Background] Debugger result:', result);

    // Detach debugger
    await chrome.debugger.detach({ tabId: tabIdInt });
    console.log('[Background] Debugger detached');

    // Return the result value
    const evaluateResult = result as RuntimeEvaluateResponse;
    if (evaluateResult.exceptionDetails) {
      throw new Error(evaluateResult.exceptionDetails.exception?.description || 'Script execution failed');
    }

    return evaluateResult.result?.value;
  } catch (error) {
    // Try to detach debugger on error
    try {
      await chrome.debugger.detach({ tabId: tabIdInt });
    } catch (_e) {
      // Ignore detach errors
    }
    throw error;
  }
}

/**
 * Close a specific tab
 */
async function closeTab({ tabId }: TabIdData): Promise<SuccessResponse> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  await chrome.tabs.remove(parseInt(String(tabId), 10));
  return { success: true };
}

/**
 * Activate (focus) a specific tab
 */
async function activateTab({ tabId }: TabIdData): Promise<SuccessResponse> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  const tab = await chrome.tabs.get(parseInt(String(tabId), 10));
  if (tab.windowId) {
    await chrome.windows.update(tab.windowId, { focused: true });
  }
  await chrome.tabs.update(parseInt(String(tabId), 10), { active: true });

  return { success: true };
}

/**
 * Create a new tab
 */
async function createTab({ url, active = true }: CreateTabData): Promise<CreateTabResponse> {
  const tab = await chrome.tabs.create({
    url: url || 'about:blank',
    active
  });

  return {
    success: true,
    tab: {
      windowId: tab.windowId,
      tabId: tab.id,
      title: tab.title,
      url: tab.url
    }
  };
}

/**
 * Reload/refresh a specific tab
 */
async function reloadTab({ tabId }: TabIdData): Promise<SuccessResponse> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  await chrome.tabs.reload(parseInt(String(tabId), 10));
  return { success: true };
}

/**
 * Navigate a specific tab to a URL
 */
async function navigateTab({ tabId, url }: NavigateTabData): Promise<SuccessResponse> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  if (!url) {
    throw new Error('url is required');
  }

  await chrome.tabs.update(parseInt(String(tabId), 10), { url });
  return { success: true };
}

/**
 * Capture screenshot of a specific tab
 */
async function captureScreenshot({
  tabId,
  format = 'png',
  quality = 90
}: CaptureScreenshotData): Promise<CaptureScreenshotResponse> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  const tabIdInt = parseInt(String(tabId), 10);
  const startTime = Date.now();

  try {
    // Get tab information to get the window ID
    const tab = await chrome.tabs.get(tabIdInt);

    // Make sure the window is focused
    await chrome.windows.update(tab.windowId, { focused: true });

    // Make sure the tab is active in its window to capture it
    await chrome.tabs.update(tabIdInt, { active: true });

    // Wait for the tab to be fully ready and visible
    // Poll until the tab is confirmed active
    let retries = 0;
    const maxRetries = 20;
    while (retries < maxRetries) {
      const updatedTab = await chrome.tabs.get(tabIdInt);
      if (updatedTab.active && updatedTab.status === 'complete') {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
      retries++;
    }

    // Small safety wait to ensure rendering is complete (reduced from 1s to 300ms)
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Capture the visible tab
    const options = {
      format: format // 'png' or 'jpeg'
    };

    // Only add quality for jpeg format
    if (format === 'jpeg') {
      (options as chrome.tabs.CaptureVisibleTabOptions & { quality: number }).quality = quality;
    }

    console.log('[Background] ⏱️  Starting captureVisibleTab (', Date.now() - startTime, 'ms )');
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, options);
    console.log(
      '[Background] ⏱️  Screenshot captured! Size:',
      dataUrl.length,
      'bytes (',
      Date.now() - startTime,
      'ms )'
    );

    const totalTime = Date.now() - startTime;
    console.log('[Background] ✅ TOTAL TIME:', totalTime, 'ms (', (totalTime / 1000).toFixed(2), 'seconds )');

    return {
      success: true,
      dataUrl: dataUrl,
      format: format,
      captureTimeMs: totalTime
    };
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('[Background] ❌ Error capturing screenshot after', totalTime, 'ms:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to capture screenshot: ${errorMessage}`);
  }
}

/**
 * Attach debugger to a tab and start capturing console logs and network requests
 */
async function startLoggingTab(tabIdInt: number): Promise<void> {
  if (debuggerAttached.has(tabIdInt)) {
    console.log('[Background] Already logging tab', tabIdInt);
    return;
  }

  try {
    // Attach debugger to tab
    await chrome.debugger.attach({ tabId: tabIdInt }, '1.3');
    debuggerAttached.add(tabIdInt);

    // Initialize logs and requests arrays for this tab
    if (!consoleLogs.has(tabIdInt)) {
      consoleLogs.set(tabIdInt, []);
    }
    if (!networkRequests.has(tabIdInt)) {
      networkRequests.set(tabIdInt, []);
    }

    // Enable Console domain
    await chrome.debugger.sendCommand({ tabId: tabIdInt }, 'Console.enable');

    // Enable Runtime domain
    await chrome.debugger.sendCommand({ tabId: tabIdInt }, 'Runtime.enable');

    // Enable Log domain
    await chrome.debugger.sendCommand({ tabId: tabIdInt }, 'Log.enable');

    // Enable Network domain for request tracking with extra info
    await chrome.debugger.sendCommand({ tabId: tabIdInt }, 'Network.enable', {
      maxTotalBufferSize: 10000000,
      maxResourceBufferSize: 5000000,
      maxPostDataSize: 5000000
    });

    console.log('[Background] Started logging tab', tabIdInt);
  } catch (error) {
    debuggerAttached.delete(tabIdInt);
    throw error;
  }
}

/**
 * Stop logging a tab and detach debugger
 */
async function stopLoggingTab(tabIdInt: number): Promise<void> {
  if (!debuggerAttached.has(tabIdInt)) {
    return;
  }

  try {
    await chrome.debugger.detach({ tabId: tabIdInt });
    debuggerAttached.delete(tabIdInt);
    console.log('[Background] Stopped logging tab', tabIdInt);
  } catch (error) {
    console.error('[Background] Error stopping logging:', error);
  }
}

/**
 * Get console logs from a specific tab
 */
async function getTabLogs({
  tabId
}: TabIdData): Promise<LogEntry[] | Array<{ type: string; timestamp: number; message: string }>> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  const tabIdInt = parseInt(String(tabId), 10);

  // Check if debugger is attached
  if (!debuggerAttached.has(tabIdInt)) {
    throw new Error('Debugger not attached to this tab. Use "chrome-cmd tabs set <indexOrId>" first to start logging.');
  }

  // Return stored logs
  const logs = consoleLogs.get(tabIdInt) || [];

  if (logs.length === 0) {
    return [
      {
        type: 'info',
        timestamp: Date.now(),
        message: 'No console logs captured yet. Interact with the page to see new logs.'
      }
    ];
  }

  return logs;
}

/**
 * Clear console logs for a specific tab
 */
async function clearTabLogs({ tabId }: TabIdData): Promise<SuccessResponse> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  const tabIdInt = parseInt(String(tabId), 10);
  consoleLogs.set(tabIdInt, []);

  return { success: true, message: 'Logs cleared' };
}

/**
 * Get network requests from a specific tab
 */
async function getTabRequests({
  tabId,
  includeBody
}: GetTabRequestsData): Promise<NetworkRequestEntry[] | Array<{ type: string; timestamp: number; message: string }>> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  const tabIdInt = parseInt(String(tabId), 10);

  // Check if debugger is attached
  if (!debuggerAttached.has(tabIdInt)) {
    throw new Error('Debugger not attached to this tab. Use "chrome-cmd tabs set <indexOrId>" first to start logging.');
  }

  // Return stored requests
  const requests = networkRequests.get(tabIdInt) || [];

  if (requests.length === 0) {
    return [
      {
        type: 'info',
        timestamp: Date.now(),
        message: 'No network requests captured yet. Reload the page or interact with it to see new requests.'
      }
    ];
  }

  // If includeBody is requested, fetch response bodies for requests
  if (includeBody && debuggerAttached.has(tabIdInt)) {
    for (const request of requests) {
      // Only fetch body for finished requests that we haven't already fetched
      if (request.finished && !request.failed && !request.responseBody && request.response) {
        try {
          const response = await chrome.debugger.sendCommand({ tabId: tabIdInt }, 'Network.getResponseBody', {
            requestId: request.requestId
          });

          const bodyResponse = response as NetworkGetResponseBodyResponse;
          if (bodyResponse.body) {
            request.responseBody = bodyResponse.body;
            request.responseBodyBase64 = bodyResponse.base64Encoded;
          }
        } catch (error) {
          // Some requests may not have bodies or may have been cleared
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.log('[Background] Could not get response body for', request.url, errorMessage);
        }
      }
    }
  }

  // Enrich requests with cookie information from Network.getCookies
  if (debuggerAttached.has(tabIdInt)) {
    for (const request of requests) {
      try {
        // Get cookies for this request's URL
        const cookiesResponse = await chrome.debugger.sendCommand({ tabId: tabIdInt }, 'Network.getCookies', {
          urls: [request.url]
        });

        const cookies = (cookiesResponse as NetworkGetCookiesResponse).cookies;
        if (cookies && cookies.length > 0) {
          // Build Cookie header from cookies
          const cookieHeader = cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');

          // Add Cookie header to request headers (only if not already present)
          if (cookieHeader && !request.headers.Cookie && !request.headers.cookie) {
            request.headers = request.headers || {};
            request.headers.Cookie = cookieHeader;
          }
        }
      } catch (error) {
        // Ignore errors getting cookies for individual requests
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log('[Background] Could not get cookies for', request.url, errorMessage);
      }
    }
  }

  return requests;
}

/**
 * Clear network requests for a specific tab
 */
async function clearTabRequests({ tabId }: TabIdData): Promise<SuccessResponse> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  const tabIdInt = parseInt(String(tabId), 10);
  networkRequests.set(tabIdInt, []);

  return { success: true, message: 'Requests cleared' };
}

/**
 * Start logging for a specific tab (console logs and network requests)
 */
async function startLogging({ tabId }: TabIdData): Promise<StartLoggingResponse> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  const tabIdInt = parseInt(String(tabId), 10);
  await startLoggingTab(tabIdInt);

  return {
    success: true,
    message: 'Started logging console and network activity',
    tabId: tabIdInt,
    debuggerAttached: true
  };
}

/**
 * Stop logging for a specific tab
 */
async function stopLogging({ tabId }: TabIdData): Promise<StopLoggingResponse> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  const tabIdInt = parseInt(String(tabId), 10);
  await stopLoggingTab(tabIdInt);

  return {
    success: true,
    message: 'Stopped logging',
    tabId: tabIdInt,
    debuggerAttached: false
  };
}

/**
 * Get storage data (cookies, localStorage, sessionStorage) from a specific tab
 */
async function getTabStorage({ tabId }: TabIdData): Promise<StorageData> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  const tabIdInt = parseInt(String(tabId), 10);

  try {
    // Get tab information to get the URL
    const tab = await chrome.tabs.get(tabIdInt);
    const tabUrl = tab.url;

    // Attach debugger to tab temporarily if not already attached
    const wasAttached = debuggerAttached.has(tabIdInt);

    if (!wasAttached) {
      await chrome.debugger.attach({ tabId: tabIdInt }, '1.3');
    }

    try {
      // Get cookies using Network.getCookies
      const cookiesResponse = await chrome.debugger.sendCommand({ tabId: tabIdInt }, 'Network.getCookies', {
        urls: [tabUrl]
      });

      // Get localStorage using Runtime.evaluate
      const localStorageResult = await chrome.debugger.sendCommand({ tabId: tabIdInt }, 'Runtime.evaluate', {
        expression: `
            (() => {
              const items = {};
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                items[key] = localStorage.getItem(key);
              }
              return items;
            })()
          `,
        returnByValue: true
      });

      // Get sessionStorage using Runtime.evaluate
      const sessionStorageResult = await chrome.debugger.sendCommand({ tabId: tabIdInt }, 'Runtime.evaluate', {
        expression: `
            (() => {
              const items = {};
              for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                items[key] = sessionStorage.getItem(key);
              }
              return items;
            })()
          `,
        returnByValue: true
      });

      // Detach debugger if we attached it
      if (!wasAttached) {
        await chrome.debugger.detach({ tabId: tabIdInt });
      }

      // Return structured storage data
      const cookiesResult = cookiesResponse as NetworkGetCookiesResponse;
      const localStorageEval = localStorageResult as RuntimeEvaluateResponse;
      const sessionStorageEval = sessionStorageResult as RuntimeEvaluateResponse;

      const cookies = cookiesResult.cookies || [];
      const localStorage = (localStorageEval.result?.value as StorageData['localStorage']) || {};
      const sessionStorage = (sessionStorageEval.result?.value as StorageData['sessionStorage']) || {};

      return {
        cookies,
        localStorage,
        sessionStorage
      };
    } catch (error) {
      // Detach debugger if we attached it
      if (!wasAttached) {
        try {
          await chrome.debugger.detach({ tabId: tabIdInt });
        } catch (_e) {
          // Ignore detach errors
        }
      }
      throw error;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get storage data: ${errorMessage}`);
  }
}

/**
 * Click on an element in a specific tab
 */
async function clickElement({ tabId, selector }: ClickElementData): Promise<SuccessResponse> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  if (!selector) {
    throw new Error('selector is required');
  }

  const tabIdInt = parseInt(String(tabId), 10);

  try {
    // Attach debugger to tab temporarily
    const wasAttached = debuggerAttached.has(tabIdInt);

    if (!wasAttached) {
      await chrome.debugger.attach({ tabId: tabIdInt }, '1.3');
    }

    try {
      // Execute click using Runtime.evaluate
      const result = await chrome.debugger.sendCommand({ tabId: tabIdInt }, 'Runtime.evaluate', {
        expression: `
            (() => {
              const element = document.querySelector('${selector}');
              if (!element) {
                throw new Error('Element not found: ${selector}');
              }
              element.click();
              return { success: true };
            })()
          `,
        returnByValue: true,
        awaitPromise: true
      });

      // Detach debugger if we attached it
      if (!wasAttached) {
        await chrome.debugger.detach({ tabId: tabIdInt });
      }

      const evaluateResult = result as RuntimeEvaluateResponse;
      if (evaluateResult.exceptionDetails) {
        throw new Error(evaluateResult.exceptionDetails.exception?.description || 'Failed to click element');
      }

      return { success: true };
    } catch (error) {
      // Detach debugger if we attached it
      if (!wasAttached) {
        try {
          await chrome.debugger.detach({ tabId: tabIdInt });
        } catch (_e) {
          // Ignore detach errors
        }
      }
      throw error;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to click element: ${errorMessage}`);
  }
}

/**
 * Click on an element by text content in a specific tab
 */
async function clickElementByText({ tabId, text }: ClickElementByTextData): Promise<SuccessResponse> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  if (!text) {
    throw new Error('text is required');
  }

  const tabIdInt = parseInt(String(tabId), 10);

  try {
    // Attach debugger to tab temporarily
    const wasAttached = debuggerAttached.has(tabIdInt);

    if (!wasAttached) {
      await chrome.debugger.attach({ tabId: tabIdInt }, '1.3');
    }

    try {
      // Escape text for safe insertion in JavaScript string
      const escapedText = escapeJavaScriptString(text);

      // Execute click using Runtime.evaluate
      const result = await chrome.debugger.sendCommand({ tabId: tabIdInt }, 'Runtime.evaluate', {
        expression: `
            (() => {
              // Find element by text content
              const elements = Array.from(document.querySelectorAll('*'));
              const element = elements.find(el => {
                // Check if element's direct text content matches
                const text = Array.from(el.childNodes)
                  .filter(node => node.nodeType === Node.TEXT_NODE)
                  .map(node => node.textContent.trim())
                  .join(' ');
                return text === '${escapedText}' || el.textContent.trim() === '${escapedText}';
              });

              if (!element) {
                throw new Error('Element not found with text: ${escapedText}');
              }

              element.click();
              return { success: true };
            })()
          `,
        returnByValue: true,
        awaitPromise: true
      });

      // Detach debugger if we attached it
      if (!wasAttached) {
        await chrome.debugger.detach({ tabId: tabIdInt });
      }

      const evaluateResult = result as RuntimeEvaluateResponse;
      if (evaluateResult.exceptionDetails) {
        throw new Error(evaluateResult.exceptionDetails.exception?.description || 'Failed to click element by text');
      }

      return { success: true };
    } catch (error) {
      // Detach debugger if we attached it
      if (!wasAttached) {
        try {
          await chrome.debugger.detach({ tabId: tabIdInt });
        } catch (_e) {
          // Ignore detach errors
        }
      }
      throw error;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to click element by text: ${errorMessage}`);
  }
}

/**
 * Reload the extension
 */
async function reloadExtension(): Promise<SuccessResponse> {
  console.log('[Background] Reloading extension...');

  // Use chrome.runtime.reload() to reload the extension
  chrome.runtime.reload();

  // This won't be reached as the extension will reload immediately
  return { success: true, message: 'Extension reloaded' };
}

/**
 * Fill an input field in a specific tab
 */
async function fillInput({ tabId, selector, value, submit = false }: FillInputData): Promise<SuccessResponse> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  if (!selector) {
    throw new Error('selector is required');
  }

  if (!value) {
    throw new Error('value is required');
  }

  const tabIdInt = parseInt(String(tabId), 10);

  try {
    // Attach debugger to tab temporarily
    const wasAttached = debuggerAttached.has(tabIdInt);

    if (!wasAttached) {
      await chrome.debugger.attach({ tabId: tabIdInt }, '1.3');
    }

    try {
      // First, focus the element and set value
      const escapedSelector = escapeJavaScriptString(selector);
      const escapedValue = escapeJavaScriptString(value);

      // Set the value using Runtime.evaluate
      const setValueResult = await chrome.debugger.sendCommand({ tabId: tabIdInt }, 'Runtime.evaluate', {
        expression: `
            (() => {
              const element = document.querySelector('${escapedSelector}');
              if (!element) {
                throw new Error('Element not found: ${escapedSelector}');
              }

              // Focus the element
              element.focus();

              // Set value using native setter for React compatibility
              const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype,
                'value'
              ).set;
              nativeInputValueSetter.call(element, '${escapedValue}');

              // Dispatch input event for React/Vue
              element.dispatchEvent(new Event('input', { bubbles: true }));

              // Dispatch change event
              element.dispatchEvent(new Event('change', { bubbles: true }));

              return element.value;
            })()
          `,
        returnByValue: true
      });

      const evaluateResult = setValueResult as RuntimeEvaluateResponse;
      console.log('[Background] Input value set to:', evaluateResult.result?.value);

      // Press Enter if submit flag is true
      if (submit) {
        // Wait for React/Vue to process the input
        await new Promise((resolve) => setTimeout(resolve, 150));

        // Dispatch Enter key events using Input API
        await chrome.debugger.sendCommand({ tabId: tabIdInt }, 'Input.dispatchKeyEvent', {
          type: 'rawKeyDown',
          key: 'Enter',
          code: 'Enter',
          windowsVirtualKeyCode: 13,
          nativeVirtualKeyCode: 13
        });

        await chrome.debugger.sendCommand({ tabId: tabIdInt }, 'Input.dispatchKeyEvent', {
          type: 'keyUp',
          key: 'Enter',
          code: 'Enter',
          windowsVirtualKeyCode: 13,
          nativeVirtualKeyCode: 13
        });

        console.log('[Background] Enter key pressed');
      }

      // Detach debugger if we attached it
      if (!wasAttached) {
        await chrome.debugger.detach({ tabId: tabIdInt });
      }

      return { success: true };
    } catch (error) {
      // Detach debugger if we attached it
      if (!wasAttached) {
        try {
          await chrome.debugger.detach({ tabId: tabIdInt });
        } catch (_e) {
          // Ignore detach errors
        }
      }
      throw error;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fill input: ${errorMessage}`);
  }
}

/**
 * Handle debugger events (console logs)
 */
chrome.debugger.onEvent.addListener((source, method, params) => {
  const tabId = source.tabId;

  if (!debuggerAttached.has(tabId)) {
    return;
  }

  // Handle console API calls (console.log, console.error, etc.)
  if (method === 'Runtime.consoleAPICalled') {
    const consoleParams = params as ConsoleAPICalledParams;
    const logEntry = {
      type: consoleParams.type, // 'log', 'error', 'warning', 'info', etc.
      timestamp: consoleParams.timestamp,
      args: consoleParams.args.map((arg) => {
        // Return primitive values directly
        if (arg.value !== undefined) {
          return arg.value;
        }

        // For objects, try to get the preview or serialize
        if (arg.type === 'object' || arg.type === 'array') {
          // If we have a preview with properties, build the object
          if (arg.preview?.properties) {
            const obj = {};
            for (const prop of arg.preview.properties) {
              obj[prop.name] =
                prop.value !== undefined
                  ? prop.value
                  : prop.valuePreview?.description || prop.valuePreview?.type || 'unknown';
            }
            return obj;
          }
          // If we have subtype info
          if (arg.subtype === 'array' && arg.preview && arg.preview.properties) {
            return arg.preview.properties.map((p) => p.value);
          }
          // Fallback to description
          if (arg.description) {
            return arg.description;
          }
        }

        // For other types, use description if available
        if (arg.description !== undefined) {
          return arg.description;
        }

        return String(arg.type || 'unknown');
      }),
      stackTrace: consoleParams.stackTrace
    };

    // Get or create logs array for this tab
    if (!consoleLogs.has(tabId)) {
      consoleLogs.set(tabId, []);
    }

    const logs = consoleLogs.get(tabId);
    logs.push(logEntry);

    // Keep only last 1000 logs per tab
    if (logs.length > 1000) {
      logs.shift();
    }

    console.log(`[Background] Captured console.${consoleParams.type}`, tabId, logEntry.args);
  }

  // Handle console messages (errors, warnings from the page)
  if (method === 'Runtime.exceptionThrown') {
    const exceptionParams = params as ExceptionThrownParams;
    const logEntry = {
      type: 'error',
      timestamp: exceptionParams.timestamp,
      args: [
        exceptionParams.exceptionDetails.text || exceptionParams.exceptionDetails.exception?.description || 'Error'
      ],
      stackTrace: exceptionParams.exceptionDetails.stackTrace
    };

    if (!consoleLogs.has(tabId)) {
      consoleLogs.set(tabId, []);
    }

    const logs = consoleLogs.get(tabId);
    logs.push(logEntry);

    if (logs.length > 1000) {
      logs.shift();
    }

    console.log('[Background] Captured exception', tabId, logEntry.args);
  }

  // Handle Log domain messages
  if (method === 'Log.entryAdded') {
    const logParams = params as LogEntryAddedParams;
    const logEntry = {
      type: logParams.entry.level, // 'verbose', 'info', 'warning', 'error'
      timestamp: logParams.entry.timestamp,
      args: [logParams.entry.text],
      source: logParams.entry.source,
      url: logParams.entry.url,
      lineNumber: logParams.entry.lineNumber
    };

    if (!consoleLogs.has(tabId)) {
      consoleLogs.set(tabId, []);
    }

    const logs = consoleLogs.get(tabId);
    logs.push(logEntry);

    if (logs.length > 1000) {
      logs.shift();
    }

    console.log('[Background] Captured log entry', tabId, logEntry.args);
  }

  // Handle Network events (HTTP requests)
  if (method === 'Network.requestWillBeSent') {
    const networkParams = params as NetworkRequestWillBeSentParams;
    const requestId = networkParams.requestId;
    const request = networkParams.request;

    const requestEntry = {
      requestId: requestId,
      url: request.url,
      method: request.method,
      headers: request.headers,
      postData: request.postData,
      timestamp: networkParams.timestamp,
      type: networkParams.type, // Document, Stylesheet, Image, Script, XHR, Fetch, etc.
      initiator: networkParams.initiator
    };

    if (!networkRequests.has(tabId)) {
      networkRequests.set(tabId, []);
    }

    const requests = networkRequests.get(tabId);
    requests.push(requestEntry);

    // Keep only last 500 requests per tab
    if (requests.length > 500) {
      requests.shift();
    }

    console.log('[Background] Captured request', tabId, request.method, request.url);
  }

  // Handle Network request extra info (includes sensitive headers like Cookie)
  if (method === 'Network.requestWillBeSentExtraInfo') {
    const extraInfoParams = params as NetworkRequestExtraInfoParams;
    const requestId = extraInfoParams.requestId;

    if (!networkRequests.has(tabId)) {
      return;
    }

    const requests = networkRequests.get(tabId);
    const requestEntry = requests.find((r) => r.requestId === requestId);

    if (requestEntry) {
      // Merge extra headers with existing headers (extra headers may include Cookie, etc.)
      requestEntry.headers = {
        ...requestEntry.headers,
        ...extraInfoParams.headers
      };
    }
  }

  // Handle Network response received
  if (method === 'Network.responseReceived') {
    const responseParams = params as NetworkResponseReceivedParams;
    const requestId = responseParams.requestId;
    const response = responseParams.response;

    if (!networkRequests.has(tabId)) {
      return;
    }

    const requests = networkRequests.get(tabId);
    const requestEntry = requests.find((r) => r.requestId === requestId);

    if (requestEntry) {
      requestEntry.response = {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        mimeType: response.mimeType,
        timing: response.timing
      };
    }
  }

  // Handle Network response extra info (includes sensitive headers like Set-Cookie)
  if (method === 'Network.responseReceivedExtraInfo') {
    const extraResponseParams = params as NetworkResponseExtraInfoParams;
    const requestId = extraResponseParams.requestId;

    if (!networkRequests.has(tabId)) {
      return;
    }

    const requests = networkRequests.get(tabId);
    const requestEntry = requests.find((r) => r.requestId === requestId);

    if (requestEntry?.response) {
      // Merge extra headers with existing response headers
      requestEntry.response.headers = {
        ...requestEntry.response.headers,
        ...extraResponseParams.headers
      };
    }
  }

  // Handle Network loading finished
  if (method === 'Network.loadingFinished') {
    const finishedParams = params as NetworkLoadingFinishedParams;
    const requestId = finishedParams.requestId;

    if (!networkRequests.has(tabId)) {
      return;
    }

    const requests = networkRequests.get(tabId);
    const requestEntry = requests.find((r) => r.requestId === requestId);

    if (requestEntry) {
      requestEntry.finished = true;
      requestEntry.encodedDataLength = finishedParams.encodedDataLength;
    }
  }

  // Handle Network loading failed
  if (method === 'Network.loadingFailed') {
    const failedParams = params as NetworkLoadingFailedParams;
    const requestId = failedParams.requestId;

    if (!networkRequests.has(tabId)) {
      return;
    }

    const requests = networkRequests.get(tabId);
    const requestEntry = requests.find((r) => r.requestId === requestId);

    if (requestEntry) {
      requestEntry.failed = true;
      requestEntry.errorText = failedParams.errorText;
      requestEntry.canceled = failedParams.canceled;
    }
  }
});

/**
 * Handle debugger detach (cleanup)
 */
chrome.debugger.onDetach.addListener((source, reason) => {
  const tabId = source.tabId;
  debuggerAttached.delete(tabId);
  console.log('[Background] Debugger detached from tab', tabId, 'reason:', reason);
});

/**
 * Handle tab close (cleanup)
 */
chrome.tabs.onRemoved.addListener((tabId) => {
  debuggerAttached.delete(tabId);
  consoleLogs.delete(tabId);
  networkRequests.delete(tabId);
  console.log('[Background] Tab removed, cleaned up logs and requests:', tabId);
});

// Initialize on service worker start
console.log('[Background] Service worker started');
connectToMediator();
