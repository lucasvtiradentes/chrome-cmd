import { ProtocolCommand } from '../../shared/commands/cli-command.js';
import type {
  CaptureScreenshotData,
  ClickElementByTextData,
  ClickElementData,
  CreateTabData,
  ExecuteScriptData,
  FillInputData,
  GetTabRequestsData,
  NavigateTabData,
  ProtocolCommandHandlerMap,
  TabIdData
} from '../../shared/commands/protocol-command.js';
import { APP_NAME } from '../../shared/constants/constants.js';
import { formatErrorMessage } from '../../shared/utils/functions/format-error-message.js';
import { escapeJavaScriptString, parseTabId } from '../../shared/utils/helpers.js';
import type {
  CaptureScreenshotResponse,
  CreateTabResponse,
  LogEntry,
  NetworkRequestEntry,
  StartLoggingResponse,
  StopLoggingResponse,
  StorageData,
  SuccessResponse,
  TabInfo
} from '../../shared/utils/types.js';
import { debuggerAttached, startLoggingTab, stopLoggingTab, withDebugger } from './debugger-manager.js';
import { consoleLogs, initializeTabLogging, networkRequests } from './logging-collector.js';

async function listTabs(): Promise<TabInfo[]> {
  const windows = await chrome.windows.getAll({ populate: true });
  const tabs: TabInfo[] = [];

  for (const window of windows) {
    if (!window.tabs || window.id === undefined) continue;
    for (const tab of window.tabs) {
      if (tab.id === undefined) continue;
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

  const tabIdInt = parseTabId(tabId);
  console.log('[Background] Executing script in tab', tabIdInt, ':', code);

  return withDebugger(tabIdInt, async () => {
    const result = await chrome.debugger.sendCommand({ tabId: tabIdInt }, 'Runtime.evaluate', {
      expression: code,
      returnByValue: true,
      awaitPromise: true
    });

    console.log('[Background] Debugger result:', result);

    const evaluateResult = result as chrome.debugger.DebuggerResult;
    if (evaluateResult.exceptionDetails) {
      throw new Error(evaluateResult.exceptionDetails.exception?.description || 'Script execution failed');
    }

    return evaluateResult.result?.value;
  });
}

async function closeTab({ tabId }: TabIdData): Promise<SuccessResponse> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  await chrome.tabs.remove(parseTabId(tabId));
  return { success: true };
}

async function activateTab({ tabId }: TabIdData): Promise<SuccessResponse> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  const tabIdInt = parseTabId(tabId);
  const tab = await chrome.tabs.get(tabIdInt);
  if (tab.windowId) {
    await chrome.windows.update(tab.windowId, { focused: true });
  }
  await chrome.tabs.update(tabIdInt, { active: true });

  return { success: true };
}

async function createTab({ url, active = true }: CreateTabData): Promise<CreateTabResponse> {
  const tab = await chrome.tabs.create({
    url: url || 'about:blank',
    active
  });

  if (tab.id === undefined) {
    throw new Error('Created tab has no ID');
  }

  return {
    success: true,
    tab: {
      windowId: tab.windowId ?? 0,
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

  await chrome.tabs.reload(parseTabId(tabId));
  return { success: true };
}

async function navigateTab({ tabId, url }: NavigateTabData): Promise<SuccessResponse> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  if (!url) {
    throw new Error('url is required');
  }

  await chrome.tabs.update(parseTabId(tabId), { url });
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

  const tabIdInt = parseTabId(tabId);
  const startTime = Date.now();

  let shouldDetach = false;

  try {
    console.log('[Background] 🔍 Checking debugger status for tab', tabIdInt);
    console.log('[Background] 🔍 debuggerAttached.has:', debuggerAttached.has(tabIdInt));

    try {
      console.log('[Background] 🔌 Attempting to attach debugger...');
      await chrome.debugger.attach({ tabId: tabIdInt }, '1.3');
      console.log('[Background] ✅ Debugger attached successfully');
      debuggerAttached.add(tabIdInt);
      shouldDetach = true;
    } catch (attachError) {
      const errorMsg = attachError instanceof Error ? attachError.message : String(attachError);
      console.log('[Background] ⚠️  Attach result:', errorMsg);

      if (errorMsg.includes('already')) {
        console.log('[Background] ✅ Debugger already attached, continuing...');
        shouldDetach = false;
      } else {
        throw attachError;
      }
    }

    try {
      console.log('[Background] ⏱️  Starting Page.captureScreenshot (', Date.now() - startTime, 'ms )');

      const screenshotParams: Record<string, unknown> = {
        format: format,
        optimizeForSpeed: true,
        fromSurface: true,
        captureBeyondViewport: fullPage
      };

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

      const dataUrl = `data:image/${format};base64,${(result as { data: string }).data}`;

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
    throw new Error(`Failed to capture screenshot: ${formatErrorMessage(error)}`);
  }
}

async function getTabLogs({
  tabId
}: TabIdData): Promise<LogEntry[] | Array<{ type: string; timestamp: number; message: string }>> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  const tabIdInt = parseTabId(tabId);

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

  const tabIdInt = parseTabId(tabId);
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

  const tabIdInt = parseTabId(tabId);

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

          const bodyResponse = response as chrome.debugger.NetworkResponseBody;
          if (bodyResponse.body) {
            request.responseBody = bodyResponse.body;
            request.responseBodyBase64 = bodyResponse.base64Encoded;
          }
        } catch (error) {
          console.log('[Background] Could not get response body for', request.url, formatErrorMessage(error));
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

        const cookies = (cookiesResponse as chrome.debugger.NetworkCookiesResponse).cookies;
        if (cookies && cookies.length > 0) {
          const cookieHeader = cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');

          if (cookieHeader && !request.headers.Cookie && !request.headers.cookie) {
            request.headers = request.headers || {};
            request.headers.Cookie = cookieHeader;
          }
        }
      } catch (error) {
        console.log('[Background] Could not get cookies for', request.url, formatErrorMessage(error));
      }
    }
  }

  return requests;
}

async function clearTabRequests({ tabId }: TabIdData): Promise<SuccessResponse> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  const tabIdInt = parseTabId(tabId);
  networkRequests.set(tabIdInt, []);

  return { success: true, message: 'Requests cleared' };
}

async function startLogging({ tabId }: TabIdData): Promise<StartLoggingResponse> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  const tabIdInt = parseTabId(tabId);
  initializeTabLogging(tabIdInt);
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

  const tabIdInt = parseTabId(tabId);
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

  const tabIdInt = parseTabId(tabId);

  try {
    const tab = await chrome.tabs.get(tabIdInt);
    const tabUrl = tab.url;

    return await withDebugger(tabIdInt, async () => {
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

      const cookiesResult = cookiesResponse as chrome.debugger.NetworkCookiesResponse;
      const localStorageEval = localStorageResult as chrome.debugger.DebuggerResult;
      const sessionStorageEval = sessionStorageResult as chrome.debugger.DebuggerResult;

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
    });
  } catch (error) {
    throw new Error(`Failed to get storage data: ${formatErrorMessage(error)}`);
  }
}

async function clickElement({ tabId, selector }: ClickElementData): Promise<SuccessResponse> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  if (!selector) {
    throw new Error('selector is required');
  }

  const tabIdInt = parseTabId(tabId);

  try {
    return await withDebugger(tabIdInt, async () => {
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

      const evaluateResult = result as chrome.debugger.DebuggerResult;
      if (evaluateResult.exceptionDetails) {
        throw new Error(evaluateResult.exceptionDetails.exception?.description || 'Failed to click element');
      }

      return { success: true };
    });
  } catch (error) {
    throw new Error(`Failed to click element: ${formatErrorMessage(error)}`);
  }
}

async function clickElementByText({ tabId, text }: ClickElementByTextData): Promise<SuccessResponse> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  if (!text) {
    throw new Error('text is required');
  }

  const tabIdInt = parseTabId(tabId);

  try {
    const escapedText = escapeJavaScriptString(text);

    return await withDebugger(tabIdInt, async () => {
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

      const evaluateResult = result as chrome.debugger.DebuggerResult;
      if (evaluateResult.exceptionDetails) {
        throw new Error(evaluateResult.exceptionDetails.exception?.description || 'Failed to click element by text');
      }

      return { success: true };
    });
  } catch (error) {
    throw new Error(`Failed to click element by text: ${formatErrorMessage(error)}`);
  }
}

async function reloadExtension(): Promise<SuccessResponse> {
  console.log('[Background] Reloading extension...');

  chrome.runtime.reload();

  return { success: true, message: 'Extension reloaded' };
}

async function getProfileInfo(): Promise<{ profileName: string }> {
  try {
    const extensionInfo = await chrome.management.getSelf();

    const profileName = extensionInfo.installType === 'development' ? 'Developer Profile' : 'Chrome User';

    let detectedProfileName = profileName;

    if (chrome.identity?.getProfileUserInfo) {
      try {
        const userInfo = await chrome.identity.getProfileUserInfo();
        if (userInfo?.email) {
          detectedProfileName = userInfo.email;
        }
      } catch {}
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

  const tabIdInt = parseTabId(tabId);

  try {
    const escapedSelector = escapeJavaScriptString(selector);
    const escapedValue = escapeJavaScriptString(value);

    return await withDebugger(tabIdInt, async () => {
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

      const evaluateResult = setValueResult as chrome.debugger.DebuggerResult;
      console.log('[Background] Input value set to:', evaluateResult.result?.value);

      if (submit) {
        const INPUT_SUBMIT_DELAY = 150;
        await new Promise((resolve) => setTimeout(resolve, INPUT_SUBMIT_DELAY));

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

      return { success: true };
    });
  } catch (error) {
    throw new Error(`Failed to fill input: ${formatErrorMessage(error)}`);
  }
}

export const commandHandlers: ProtocolCommandHandlerMap = {
  [ProtocolCommand.TAB_LIST]: async () => listTabs(),
  [ProtocolCommand.TAB_EXEC]: async (data) => executeScript(data),
  [ProtocolCommand.TAB_CLOSE]: async (data) => closeTab(data),
  [ProtocolCommand.TAB_FOCUS]: async (data) => activateTab(data),
  [ProtocolCommand.TAB_CREATE]: async (data) => createTab(data),
  [ProtocolCommand.TAB_REFRESH]: async (data) => reloadTab(data),
  [ProtocolCommand.TAB_LOGS]: async (data) => getTabLogs(data),
  [ProtocolCommand.CLEAR_TAB_LOGS]: async (data) => clearTabLogs(data),
  [ProtocolCommand.TAB_REQUESTS]: async (data) => getTabRequests(data),
  [ProtocolCommand.CLEAR_TAB_REQUESTS]: async (data) => clearTabRequests(data),
  [ProtocolCommand.TAB_STORAGE]: async (data) => getTabStorage(data),
  [ProtocolCommand.TAB_NAVIGATE]: async (data) => navigateTab(data),
  [ProtocolCommand.TAB_SCREENSHOT]: async (data) => captureScreenshot(data),
  [ProtocolCommand.TAB_HTML]: async () => ({ html: '' }),
  [ProtocolCommand.TAB_CLICK]: async (data) => clickElement(data),
  [ProtocolCommand.CLICK_ELEMENT_BY_TEXT]: async (data) => clickElementByText(data),
  [ProtocolCommand.TAB_INPUT]: async (data) => fillInput(data),
  [ProtocolCommand.START_LOGGING]: async (data) => startLogging(data),
  [ProtocolCommand.STOP_LOGGING]: async (data) => stopLogging(data),
  [ProtocolCommand.RELOAD_EXTENSION]: async () => reloadExtension(),
  [ProtocolCommand.REGISTER]: async () => ({ status: 'registered' }),
  [ProtocolCommand.GET_PROFILE_INFO]: async () => getProfileInfo(),
  [ProtocolCommand.PING]: async () => ({ status: 'ok', message: 'pong' })
};
