import { MAX_LOGS_PER_TAB, MAX_REQUESTS_PER_TAB } from '../../shared/constants/limits.js';
import type { LogEntry, NetworkRequestEntry } from '../../shared/utils/types.js';
import { debuggerAttached } from './debugger-manager.js';

export const consoleLogs = new Map<number, LogEntry[]>();

export const networkRequests = new Map<number, NetworkRequestEntry[]>();

export function initializeTabLogging(tabIdInt: number): void {
  if (!consoleLogs.has(tabIdInt)) {
    consoleLogs.set(tabIdInt, []);
  }
  if (!networkRequests.has(tabIdInt)) {
    networkRequests.set(tabIdInt, []);
  }
}

chrome.debugger.onEvent.addListener((source, method, params) => {
  const tabId = source.tabId;

  if (!tabId || !debuggerAttached.has(tabId)) {
    return;
  }

  if (method === 'Runtime.consoleAPICalled') {
    const consoleParams = params as chrome.debugger.ConsoleAPICalledParams;
    const logEntry = {
      type: consoleParams.type,
      timestamp: consoleParams.timestamp,
      args: consoleParams.args.map(
        (arg: {
          value?: unknown;
          type?: string;
          subtype?: string;
          description?: string;
          preview?: {
            properties?: Array<{
              name: string;
              value?: unknown;
              valuePreview?: { description?: string; type?: string };
            }>;
          };
        }) => {
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
              return arg.preview.properties.map((p: { value?: unknown }) => p.value);
            }

            if (arg.description) {
              return arg.description;
            }
          }

          if (arg.description !== undefined) {
            return arg.description;
          }

          return String(arg.type || 'unknown');
        }
      ),
      stackTrace: consoleParams.stackTrace as LogEntry['stackTrace']
    };

    if (!consoleLogs.has(tabId)) {
      consoleLogs.set(tabId, []);
    }

    const logs = consoleLogs.get(tabId);
    if (logs) {
      logs.push(logEntry);

      if (logs.length > MAX_LOGS_PER_TAB) {
        logs.shift();
      }
    }

    console.log(`[Background] Captured console.${consoleParams.type}`, tabId, logEntry.args);
  }

  if (method === 'Runtime.exceptionThrown') {
    const exceptionParams = params as chrome.debugger.ExceptionThrownParams;
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

      if (logs.length > MAX_LOGS_PER_TAB) {
        logs.shift();
      }
    }

    console.log('[Background] Captured exception', tabId, logEntry.args);
  }

  if (method === 'Log.entryAdded') {
    const logParams = params as chrome.debugger.LogEntryAddedParams;
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

      if (logs.length > MAX_LOGS_PER_TAB) {
        logs.shift();
      }
    }

    console.log('[Background] Captured log entry', tabId, logEntry.args);
  }

  if (method === 'Network.requestWillBeSent') {
    const networkParams = params as chrome.debugger.NetworkRequestParams;
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

      if (requests.length > MAX_REQUESTS_PER_TAB) {
        requests.shift();
      }
    }

    console.log('[Background] Captured request', tabId, request.method, request.url);
  }

  if (method === 'Network.requestWillBeSentExtraInfo') {
    const extraInfoParams = params as chrome.debugger.NetworkExtraInfoParams;
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
    const responseParams = params as chrome.debugger.NetworkResponseParams;
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
    const extraResponseParams = params as chrome.debugger.NetworkExtraInfoParams;
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
    const finishedParams = params as chrome.debugger.NetworkLoadingFinishedParams;
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
    const failedParams = params as chrome.debugger.NetworkLoadingFailedParams;
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
