import { ChromeCommand } from '../shared/commands.js';
import { APP_NAME, MEDIATOR_URL, NATIVE_APP_NAME } from '../shared/constants.js';
import { type CommandHandlerMap, dispatchCommand, escapeJavaScriptString } from '../shared/helpers.js';
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
let extensionLockCheckInterval: ReturnType<typeof setInterval> | null = null;

const consoleLogs = new Map<number, LogEntry[]>();

const networkRequests = new Map<number, NetworkRequestEntry[]>();

const debuggerAttached = new Set<number>();

function updateConnectionStatus(connected: boolean): void {
  chrome.storage.local.set({ mediatorConnected: connected });
  console.log('[Background] Connection status updated:', connected ? 'CONNECTED' : 'DISCONNECTED');

  // Update extension icon based on connection status
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

async function checkIfStillActive(): Promise<void> {
  try {
    const extensionInfo = await chrome.management.getSelf();
    const myExtensionId = extensionInfo.id;

    // Check with mediator if this extension is still the active one
    const response = await fetch(`${MEDIATOR_URL}/active-extension`, {
      method: 'GET',
      signal: AbortSignal.timeout(1000)
    });

    if (response.ok) {
      const data = (await response.json()) as { extensionId: string | null };

      if (data.extensionId && data.extensionId !== myExtensionId) {
        console.log(
          `[Background] This extension (${myExtensionId}) is no longer active. Active extension: ${data.extensionId}`
        );
        console.log('[Background] Disconnecting from mediator...');

        // Disconnect from mediator
        if (mediatorPort) {
          mediatorPort.disconnect();
          mediatorPort = null;
        }

        if (keepaliveInterval) {
          clearInterval(keepaliveInterval);
          keepaliveInterval = null;
        }

        if (extensionLockCheckInterval) {
          clearInterval(extensionLockCheckInterval);
          extensionLockCheckInterval = null;
        }

        updateConnectionStatus(false);
      }
    }
  } catch {
    // Silently fail - mediator might not be running
  }
}

function connectToMediator(): void {
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
      updateConnectionStatus(false);

      if (keepaliveInterval) {
        clearInterval(keepaliveInterval);
        keepaliveInterval = null;
      }

      if (extensionLockCheckInterval) {
        clearInterval(extensionLockCheckInterval);
        extensionLockCheckInterval = null;
      }

      reconnectAttempts++;
      const delay = Math.min(1000 * 2 ** (reconnectAttempts - 1), 30000);
      console.log(`[Background] Reconnecting in ${delay}ms (attempt ${reconnectAttempts})...`);

      setTimeout(() => {
        connectToMediator();
      }, delay);
    });

    console.log('[Background] Connected to mediator');
    reconnectAttempts = 0;
    updateConnectionStatus(true);

    // Keepalive ping every 30 seconds
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

    // Check if still active extension every 5 seconds
    if (extensionLockCheckInterval) clearInterval(extensionLockCheckInterval);
    extensionLockCheckInterval = setInterval(() => {
      checkIfStillActive();
    }, 5000);
  } catch (error) {
    console.error('[Background] Failed to connect to mediator:', error);
    updateConnectionStatus(false);

    reconnectAttempts++;
    const delay = Math.min(1000 * 2 ** (reconnectAttempts - 1), 30000);
    setTimeout(() => {
      connectToMediator();
    }, delay);
  }
}

const INTERNAL_COMMANDS = new Set([
  ChromeCommand.PING,
  ChromeCommand.RELOAD_EXTENSION,
  ChromeCommand.GET_PROFILE_INFO,
  'keepalive'
]);

async function saveCommandToHistory(
  command: string,
  data: Record<string, unknown>,
  result?: unknown,
  success?: boolean,
  executionTime?: number,
  error?: string
): Promise<void> {
  if (command === ChromeCommand.PING || command.startsWith('keepalive')) {
    return;
  }

  const isUserCommand = !INTERNAL_COMMANDS.has(command as ChromeCommand);

  const historyItem: HistoryItem = {
    command,
    data,
    timestamp: Date.now(),
    result,
    success,
    executionTime,
    error,
    isUserCommand
  };

  const storageResult = await chrome.storage.local.get(['commandHistory']);
  const history: HistoryItem[] = (storageResult.commandHistory as HistoryItem[]) || [];

  history.push(historyItem);
  if (history.length > 100) {
    history.shift();
  }

  await chrome.storage.local.set({ commandHistory: history });
}

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
  [ChromeCommand.GET_PROFILE_INFO]: async () => getProfileInfo(),
  [ChromeCommand.PING]: async () => ({ status: 'ok', message: 'pong' })
};

async function handleCommand(message: CommandMessage): Promise<void> {
  const { command, data = {}, id } = message;
  const startTime = Date.now();

  try {
    const request: CommandRequest = { command, data } as CommandRequest;

    const result = await dispatchCommand(request, commandHandlers);
    const executionTime = Date.now() - startTime;

    await saveCommandToHistory(command, data, result, true, executionTime);

    if (mediatorPort) {
      mediatorPort.postMessage({ id, success: true, result });
    }
  } catch (error) {
    const executionTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    await saveCommandToHistory(command, data, undefined, false, executionTime, errorMessage);

    if (mediatorPort) {
      mediatorPort.postMessage({ id, success: false, error: errorMessage });
    }
  }
}

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

async function executeScript({ tabId, code }: ExecuteScriptData): Promise<unknown> {
  if (!tabId || !code) {
    throw new Error('tabId and code are required');
  }

  const tabIdInt = parseInt(String(tabId), 10);
  console.log('[Background] Executing script in tab', tabIdInt, ':', code);

  const wasAttached = debuggerAttached.has(tabIdInt);

  try {
    if (!wasAttached) {
      await chrome.debugger.attach({ tabId: tabIdInt }, '1.3');
      debuggerAttached.add(tabIdInt);
      console.log('[Background] Debugger attached');
    } else {
      console.log('[Background] Debugger already attached, reusing connection');
    }

    const result = await chrome.debugger.sendCommand({ tabId: tabIdInt }, 'Runtime.evaluate', {
      expression: code,
      returnByValue: true,
      awaitPromise: true
    });

    console.log('[Background] Debugger result:', result);

    if (!wasAttached) {
      await chrome.debugger.detach({ tabId: tabIdInt });
      debuggerAttached.delete(tabIdInt);
      console.log('[Background] Debugger detached');
    } else {
      console.log('[Background] Keeping debugger attached (was attached before)');
    }

    const evaluateResult = result as RuntimeEvaluateResponse;
    if (evaluateResult.exceptionDetails) {
      throw new Error(evaluateResult.exceptionDetails.exception?.description || 'Script execution failed');
    }

    return evaluateResult.result?.value;
  } catch (error) {
    if (!wasAttached) {
      try {
        await chrome.debugger.detach({ tabId: tabIdInt });
        debuggerAttached.delete(tabIdInt);
      } catch (_e) {}
    }
    throw error;
  }
}

async function closeTab({ tabId }: TabIdData): Promise<SuccessResponse> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  await chrome.tabs.remove(parseInt(String(tabId), 10));
  return { success: true };
}

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

async function reloadTab({ tabId }: TabIdData): Promise<SuccessResponse> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  await chrome.tabs.reload(parseInt(String(tabId), 10));
  return { success: true };
}

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

async function captureScreenshot({
  tabId,
  format = 'png',
  quality = 90,
  fullPage = true
}: CaptureScreenshotData): Promise<CaptureScreenshotResponse> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  const tabIdInt = parseInt(String(tabId), 10);
  const startTime = Date.now();

  let shouldDetach = false;

  try {
    console.log('[Background] 🔍 Checking debugger status for tab', tabIdInt);
    console.log('[Background] 🔍 debuggerAttached.has:', debuggerAttached.has(tabIdInt));

    // Always try to attach - Chrome will throw "Already attached" if it is
    try {
      console.log('[Background] 🔌 Attempting to attach debugger...');
      await chrome.debugger.attach({ tabId: tabIdInt }, '1.3');
      console.log('[Background] ✅ Debugger attached successfully');
      debuggerAttached.add(tabIdInt);
      shouldDetach = true;
    } catch (attachError) {
      const errorMsg = attachError instanceof Error ? attachError.message : String(attachError);
      console.log('[Background] ⚠️  Attach result:', errorMsg);

      // If already attached, that's fine - we can use it
      if (errorMsg.includes('already')) {
        console.log('[Background] ✅ Debugger already attached, continuing...');
        shouldDetach = false;
      } else {
        // If it's a real error, throw it
        throw attachError;
      }
    }

    try {
      console.log('[Background] ⏱️  Starting Page.captureScreenshot (', Date.now() - startTime, 'ms )');

      // Use CDP Page.captureScreenshot with optimizeForSpeed for faster encoding
      const screenshotParams: Record<string, unknown> = {
        format: format,
        optimizeForSpeed: true, // Enable fast encoding
        fromSurface: true, // Capture from surface for better compatibility
        captureBeyondViewport: fullPage // Capture the full page if fullPage is true
      };

      // Add quality parameter for JPEG
      if (format === 'jpeg') {
        screenshotParams.quality = quality;
      }

      const result = await chrome.debugger.sendCommand({ tabId: tabIdInt }, 'Page.captureScreenshot', screenshotParams);

      console.log(
        '[Background] ⏱️  Screenshot captured! Size:',
        (result as { data: string }).data.length,
        'bytes (',
        Date.now() - startTime,
        'ms )'
      );

      // Convert base64 to data URL
      const dataUrl = `data:image/${format};base64,${(result as { data: string }).data}`;

      // Detach debugger if we attached it in this function
      if (shouldDetach) {
        console.log('[Background] 🔌 Detaching debugger...');
        await chrome.debugger.detach({ tabId: tabIdInt });
        debuggerAttached.delete(tabIdInt);
        console.log('[Background] ✅ Debugger detached');
      }

      const totalTime = Date.now() - startTime;
      console.log('[Background] ✅ TOTAL TIME:', totalTime, 'ms (', (totalTime / 1000).toFixed(2), 'seconds )');

      return {
        success: true,
        dataUrl: dataUrl,
        format: format,
        captureTimeMs: totalTime
      };
    } catch (error) {
      // Clean up debugger attachment on error
      if (shouldDetach) {
        try {
          await chrome.debugger.detach({ tabId: tabIdInt });
          debuggerAttached.delete(tabIdInt);
        } catch (_e) {}
      }
      throw error;
    }
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('[Background] ❌ Error capturing screenshot after', totalTime, 'ms:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to capture screenshot: ${errorMessage}`);
  }
}

async function startLoggingTab(tabIdInt: number): Promise<void> {
  if (debuggerAttached.has(tabIdInt)) {
    console.log('[Background] Already logging tab', tabIdInt);
    return;
  }

  try {
    await chrome.debugger.attach({ tabId: tabIdInt }, '1.3');
    debuggerAttached.add(tabIdInt);

    if (!consoleLogs.has(tabIdInt)) {
      consoleLogs.set(tabIdInt, []);
    }
    if (!networkRequests.has(tabIdInt)) {
      networkRequests.set(tabIdInt, []);
    }

    await chrome.debugger.sendCommand({ tabId: tabIdInt }, 'Console.enable');

    await chrome.debugger.sendCommand({ tabId: tabIdInt }, 'Runtime.enable');

    await chrome.debugger.sendCommand({ tabId: tabIdInt }, 'Log.enable');

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

async function getTabLogs({
  tabId
}: TabIdData): Promise<LogEntry[] | Array<{ type: string; timestamp: number; message: string }>> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  const tabIdInt = parseInt(String(tabId), 10);

  if (!debuggerAttached.has(tabIdInt)) {
    throw new Error(
      `Debugger not attached to this tab. Use "${APP_NAME} tabs select <tabIndex>" first to start logging.`
    );
  }

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

async function clearTabLogs({ tabId }: TabIdData): Promise<SuccessResponse> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  const tabIdInt = parseInt(String(tabId), 10);
  consoleLogs.set(tabIdInt, []);

  return { success: true, message: 'Logs cleared' };
}

async function getTabRequests({
  tabId,
  includeBody
}: GetTabRequestsData): Promise<NetworkRequestEntry[] | Array<{ type: string; timestamp: number; message: string }>> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  const tabIdInt = parseInt(String(tabId), 10);

  if (!debuggerAttached.has(tabIdInt)) {
    throw new Error(
      `Debugger not attached to this tab. Use "${APP_NAME} tabs select <tabIndex>" first to start logging.`
    );
  }

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

  if (includeBody && debuggerAttached.has(tabIdInt)) {
    for (const request of requests) {
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
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.log('[Background] Could not get response body for', request.url, errorMessage);
        }
      }
    }
  }

  if (debuggerAttached.has(tabIdInt)) {
    for (const request of requests) {
      try {
        const cookiesResponse = await chrome.debugger.sendCommand({ tabId: tabIdInt }, 'Network.getCookies', {
          urls: [request.url]
        });

        const cookies = (cookiesResponse as NetworkGetCookiesResponse).cookies;
        if (cookies && cookies.length > 0) {
          const cookieHeader = cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');

          if (cookieHeader && !request.headers.Cookie && !request.headers.cookie) {
            request.headers = request.headers || {};
            request.headers.Cookie = cookieHeader;
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log('[Background] Could not get cookies for', request.url, errorMessage);
      }
    }
  }

  return requests;
}

async function clearTabRequests({ tabId }: TabIdData): Promise<SuccessResponse> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  const tabIdInt = parseInt(String(tabId), 10);
  networkRequests.set(tabIdInt, []);

  return { success: true, message: 'Requests cleared' };
}

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

async function getTabStorage({ tabId }: TabIdData): Promise<StorageData> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  const tabIdInt = parseInt(String(tabId), 10);

  try {
    const tab = await chrome.tabs.get(tabIdInt);
    const tabUrl = tab.url;

    const wasAttached = debuggerAttached.has(tabIdInt);

    if (!wasAttached) {
      await chrome.debugger.attach({ tabId: tabIdInt }, '1.3');
    }

    try {
      const cookiesResponse = await chrome.debugger.sendCommand({ tabId: tabIdInt }, 'Network.getCookies', {
        urls: [tabUrl]
      });

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

      if (!wasAttached) {
        await chrome.debugger.detach({ tabId: tabIdInt });
      }

      const cookiesResult = cookiesResponse as NetworkGetCookiesResponse;
      const localStorageEval = localStorageResult as RuntimeEvaluateResponse;
      const sessionStorageEval = sessionStorageResult as RuntimeEvaluateResponse;

      const cookies = (cookiesResult.cookies || []).map((cookie) => ({
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
        expires: cookie.expires,
        size: cookie.size,
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        sameSite: cookie.sameSite
      }));
      const localStorage = (localStorageEval.result?.value as StorageData['localStorage']) || {};
      const sessionStorage = (sessionStorageEval.result?.value as StorageData['sessionStorage']) || {};

      return {
        cookies,
        localStorage,
        sessionStorage
      };
    } catch (error) {
      if (!wasAttached) {
        try {
          await chrome.debugger.detach({ tabId: tabIdInt });
        } catch (_e) {}
      }
      throw error;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get storage data: ${errorMessage}`);
  }
}

async function clickElement({ tabId, selector }: ClickElementData): Promise<SuccessResponse> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  if (!selector) {
    throw new Error('selector is required');
  }

  const tabIdInt = parseInt(String(tabId), 10);

  try {
    const wasAttached = debuggerAttached.has(tabIdInt);

    if (!wasAttached) {
      await chrome.debugger.attach({ tabId: tabIdInt }, '1.3');
    }

    try {
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

      if (!wasAttached) {
        await chrome.debugger.detach({ tabId: tabIdInt });
      }

      const evaluateResult = result as RuntimeEvaluateResponse;
      if (evaluateResult.exceptionDetails) {
        throw new Error(evaluateResult.exceptionDetails.exception?.description || 'Failed to click element');
      }

      return { success: true };
    } catch (error) {
      if (!wasAttached) {
        try {
          await chrome.debugger.detach({ tabId: tabIdInt });
        } catch (_e) {}
      }
      throw error;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to click element: ${errorMessage}`);
  }
}

async function clickElementByText({ tabId, text }: ClickElementByTextData): Promise<SuccessResponse> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  if (!text) {
    throw new Error('text is required');
  }

  const tabIdInt = parseInt(String(tabId), 10);

  try {
    const wasAttached = debuggerAttached.has(tabIdInt);

    if (!wasAttached) {
      await chrome.debugger.attach({ tabId: tabIdInt }, '1.3');
    }

    try {
      const escapedText = escapeJavaScriptString(text);

      const result = await chrome.debugger.sendCommand({ tabId: tabIdInt }, 'Runtime.evaluate', {
        expression: `
            (() => {
              const elements = Array.from(document.querySelectorAll('*'));
              const element = elements.find(el => {
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

      if (!wasAttached) {
        await chrome.debugger.detach({ tabId: tabIdInt });
      }

      const evaluateResult = result as RuntimeEvaluateResponse;
      if (evaluateResult.exceptionDetails) {
        throw new Error(evaluateResult.exceptionDetails.exception?.description || 'Failed to click element by text');
      }

      return { success: true };
    } catch (error) {
      if (!wasAttached) {
        try {
          await chrome.debugger.detach({ tabId: tabIdInt });
        } catch (_e) {}
      }
      throw error;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to click element by text: ${errorMessage}`);
  }
}

async function reloadExtension(): Promise<SuccessResponse> {
  console.log('[Background] Reloading extension...');

  chrome.runtime.reload();

  return { success: true, message: 'Extension reloaded' };
}

async function getProfileInfo(): Promise<{ profileName: string }> {
  try {
    // Get Chrome profile info using management API
    const extensionInfo = await chrome.management.getSelf();

    // Get profile directory from userAgent or chrome.runtime
    // The profile name is stored in chrome.runtime.getManifest() or can be inferred
    const profileName = extensionInfo.installType === 'development' ? 'Developer Profile' : 'Chrome User';

    // Try to get more specific profile info
    let detectedProfileName = profileName;

    // Use chrome.identity API if available to get user email/profile
    if (chrome.identity?.getProfileUserInfo) {
      try {
        const userInfo = await chrome.identity.getProfileUserInfo();
        if (userInfo?.email) {
          detectedProfileName = userInfo.email;
        }
      } catch {
        // Identity API might not be available or user not signed in
      }
    }

    return {
      profileName: detectedProfileName
    };
  } catch (error) {
    console.error('[Background] Error getting profile info:', error);
    return {
      profileName: 'Chrome User'
    };
  }
}

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
    const wasAttached = debuggerAttached.has(tabIdInt);

    if (!wasAttached) {
      await chrome.debugger.attach({ tabId: tabIdInt }, '1.3');
    }

    try {
      const escapedSelector = escapeJavaScriptString(selector);
      const escapedValue = escapeJavaScriptString(value);

      const setValueResult = await chrome.debugger.sendCommand({ tabId: tabIdInt }, 'Runtime.evaluate', {
        expression: `
            (() => {
              const element = document.querySelector('${escapedSelector}');
              if (!element) {
                throw new Error('Element not found: ${escapedSelector}');
              }

              element.focus();

              const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype,
                'value'
              ).set;
              nativeInputValueSetter.call(element, '${escapedValue}');

              element.dispatchEvent(new Event('input', { bubbles: true }));
              element.dispatchEvent(new Event('change', { bubbles: true }));

              return element.value;
            })()
          `,
        returnByValue: true
      });

      const evaluateResult = setValueResult as RuntimeEvaluateResponse;
      console.log('[Background] Input value set to:', evaluateResult.result?.value);

      if (submit) {
        await new Promise((resolve) => setTimeout(resolve, 150));

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

      if (!wasAttached) {
        await chrome.debugger.detach({ tabId: tabIdInt });
      }

      return { success: true };
    } catch (error) {
      if (!wasAttached) {
        try {
          await chrome.debugger.detach({ tabId: tabIdInt });
        } catch (_e) {}
      }
      throw error;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fill input: ${errorMessage}`);
  }
}

chrome.debugger.onEvent.addListener((source, method, params) => {
  const tabId = source.tabId;

  if (!tabId || !debuggerAttached.has(tabId)) {
    return;
  }

  if (method === 'Runtime.consoleAPICalled') {
    const consoleParams = params as ConsoleAPICalledParams;
    const logEntry = {
      type: consoleParams.type,
      timestamp: consoleParams.timestamp,
      args: consoleParams.args.map((arg) => {
        if (arg.value !== undefined) {
          return arg.value;
        }

        if (arg.type === 'object' || arg.type === 'array') {
          if (arg.preview?.properties) {
            const obj: Record<string, unknown> = {};
            for (const prop of arg.preview.properties) {
              obj[prop.name] =
                prop.value !== undefined
                  ? prop.value
                  : prop.valuePreview?.description || prop.valuePreview?.type || 'unknown';
            }
            return obj;
          }

          if (arg.subtype === 'array' && arg.preview && arg.preview.properties) {
            return arg.preview.properties.map((p) => p.value);
          }

          if (arg.description) {
            return arg.description;
          }
        }

        if (arg.description !== undefined) {
          return arg.description;
        }

        return String(arg.type || 'unknown');
      }),
      stackTrace: consoleParams.stackTrace as LogEntry['stackTrace']
    };

    if (!consoleLogs.has(tabId)) {
      consoleLogs.set(tabId, []);
    }

    const logs = consoleLogs.get(tabId);
    if (logs) {
      logs.push(logEntry);

      if (logs.length > 1000) {
        logs.shift();
      }
    }

    console.log(`[Background] Captured console.${consoleParams.type}`, tabId, logEntry.args);
  }

  if (method === 'Runtime.exceptionThrown') {
    const exceptionParams = params as ExceptionThrownParams;
    const logEntry = {
      type: 'error',
      timestamp: exceptionParams.timestamp,
      args: [
        exceptionParams.exceptionDetails.text || exceptionParams.exceptionDetails.exception?.description || 'Error'
      ],
      stackTrace: exceptionParams.exceptionDetails.stackTrace as LogEntry['stackTrace']
    };

    if (!consoleLogs.has(tabId)) {
      consoleLogs.set(tabId, []);
    }

    const logs = consoleLogs.get(tabId);
    if (logs) {
      logs.push(logEntry);

      if (logs.length > 1000) {
        logs.shift();
      }
    }

    console.log('[Background] Captured exception', tabId, logEntry.args);
  }

  if (method === 'Log.entryAdded') {
    const logParams = params as LogEntryAddedParams;
    const logEntry = {
      type: logParams.entry.level,
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
    if (logs) {
      logs.push(logEntry);

      if (logs.length > 1000) {
        logs.shift();
      }
    }

    console.log('[Background] Captured log entry', tabId, logEntry.args);
  }

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
      type: networkParams.type,
      initiator: networkParams.initiator
    };

    if (!networkRequests.has(tabId)) {
      networkRequests.set(tabId, []);
    }

    const requests = networkRequests.get(tabId);
    if (requests) {
      requests.push(requestEntry);

      if (requests.length > 500) {
        requests.shift();
      }
    }

    console.log('[Background] Captured request', tabId, request.method, request.url);
  }

  if (method === 'Network.requestWillBeSentExtraInfo') {
    const extraInfoParams = params as NetworkRequestExtraInfoParams;
    const requestId = extraInfoParams.requestId;

    if (!networkRequests.has(tabId)) {
      return;
    }

    const requests = networkRequests.get(tabId);
    if (requests) {
      const requestEntry = requests.find((r) => r.requestId === requestId);

      if (requestEntry) {
        requestEntry.headers = {
          ...requestEntry.headers,
          ...extraInfoParams.headers
        };
      }
    }
  }

  if (method === 'Network.responseReceived') {
    const responseParams = params as NetworkResponseReceivedParams;
    const requestId = responseParams.requestId;
    const response = responseParams.response;

    if (!networkRequests.has(tabId)) {
      return;
    }

    const requests = networkRequests.get(tabId);
    if (requests) {
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
  }

  if (method === 'Network.responseReceivedExtraInfo') {
    const extraResponseParams = params as NetworkResponseExtraInfoParams;
    const requestId = extraResponseParams.requestId;

    if (!networkRequests.has(tabId)) {
      return;
    }

    const requests = networkRequests.get(tabId);
    if (requests) {
      const requestEntry = requests.find((r) => r.requestId === requestId);

      if (requestEntry?.response) {
        requestEntry.response.headers = {
          ...requestEntry.response.headers,
          ...extraResponseParams.headers
        };
      }
    }
  }

  if (method === 'Network.loadingFinished') {
    const finishedParams = params as NetworkLoadingFinishedParams;
    const requestId = finishedParams.requestId;

    if (!networkRequests.has(tabId)) {
      return;
    }

    const requests = networkRequests.get(tabId);
    if (requests) {
      const requestEntry = requests.find((r) => r.requestId === requestId);

      if (requestEntry) {
        requestEntry.finished = true;
        requestEntry.encodedDataLength = finishedParams.encodedDataLength;
      }
    }
  }

  if (method === 'Network.loadingFailed') {
    const failedParams = params as NetworkLoadingFailedParams;
    const requestId = failedParams.requestId;

    if (!networkRequests.has(tabId)) {
      return;
    }

    const requests = networkRequests.get(tabId);
    if (requests) {
      const requestEntry = requests.find((r) => r.requestId === requestId);

      if (requestEntry) {
        requestEntry.failed = true;
        requestEntry.errorText = failedParams.errorText;
        requestEntry.canceled = failedParams.canceled;
      }
    }
  }
});

chrome.debugger.onDetach.addListener((source, reason) => {
  const tabId = source.tabId;
  if (tabId !== undefined) {
    debuggerAttached.delete(tabId);
    console.log('[Background] Debugger detached from tab', tabId, 'reason:', reason);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  debuggerAttached.delete(tabId);
  consoleLogs.delete(tabId);
  networkRequests.delete(tabId);
  console.log('[Background] Tab removed, cleaned up logs and requests:', tabId);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('[Background] Received message from popup:', message);

  if (message.command === ChromeCommand.RELOAD_EXTENSION) {
    reloadExtension()
      .then((result) => {
        sendResponse(result);
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  sendResponse({ success: false, error: 'Unknown command' });
  return false;
});

console.log('[Background] Service worker started');

// Initialize icon to disconnected state
updateConnectionStatus(false);

// Check if this extension is the active one before connecting
async function initializeExtension() {
  const extensionInfo = await chrome.management.getSelf();
  const myExtensionId = extensionInfo.id;

  // Retry logic: try multiple times with increasing delays
  const maxRetries = 10; // Try for up to ~30 seconds
  const delays = [0, 500, 1000, 2000, 3000, 5000, 5000, 5000, 5000, 5000]; // Backoff delays in ms

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Wait before retry (except first attempt)
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, delays[attempt]));
        console.log(`[Background] Retry attempt ${attempt + 1}/${maxRetries}...`);
      }

      // Check with mediator if this extension should be active
      const response = await fetch(`${MEDIATOR_URL}/active-extension`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000) // Increased timeout to 3 seconds
      });

      if (response.ok) {
        const data = (await response.json()) as { extensionId: string | null };

        if (data.extensionId === myExtensionId) {
          console.log(`[Background] ✓ This extension (${myExtensionId}) is the active one. Connecting...`);
          connectToMediator();
          return; // Success! Exit the retry loop
        } else {
          console.log(
            `[Background] This extension (${myExtensionId}) is NOT active. Active extension: ${data.extensionId}. Staying disconnected.`
          );
          updateConnectionStatus(false);
          return; // Not active, but this is a valid state - exit retry loop
        }
      } else {
        // Mediator responded but with error status
        console.log(`[Background] Mediator responded with status ${response.status}. Retrying...`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.log(`[Background] Attempt ${attempt + 1} failed: ${errorMsg}`);

      // If this is the last attempt, stay disconnected
      if (attempt === maxRetries - 1) {
        console.log(
          `[Background] ✗ Could not verify active extension after ${maxRetries} attempts. Staying disconnected.`
        );
        console.log('[Background] Please ensure the mediator is running and try reloading the extension.');
        updateConnectionStatus(false);
        return; // EXIT
      }
    }
  }

  // If we exited the loop without returning, all attempts failed without throwing exception
  // (e.g., mediator always responded with non-OK status)
  console.log('[Background] ✗ All retry attempts exhausted. Mediator not accessible. Staying disconnected.');
  updateConnectionStatus(false);
}

initializeExtension();
