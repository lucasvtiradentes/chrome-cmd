/**
 * Type definitions for Chrome CLI Bridge
 */

export interface CommandMessage {
  command: string;
  data?: Record<string, unknown>;
  id: string;
}

export interface ResponseMessage {
  id: string;
  success: boolean;
  result?: unknown;
  error?: string;
}

export interface HistoryItem {
  command: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export interface LogEntry {
  type: string;
  timestamp: number;
  args: unknown[];
  stackTrace?: unknown;
  source?: string;
  url?: string;
  lineNumber?: number;
}

export interface NetworkRequestEntry {
  requestId: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  postData?: string;
  timestamp: number;
  type: string;
  initiator?: unknown;
  response?: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    mimeType: string;
    timing?: unknown;
  };
  finished?: boolean;
  failed?: boolean;
  errorText?: string;
  canceled?: boolean;
  encodedDataLength?: number;
  responseBody?: string;
  responseBodyBase64?: boolean;
}

// Command data interfaces
export interface ExecuteScriptData {
  tabId: string | number;
  code: string;
}

export interface TabIdData {
  tabId: string | number;
}

export interface CreateTabData {
  url?: string;
  active?: boolean;
}

export interface NavigateTabData {
  tabId: string | number;
  url: string;
}

export interface CaptureScreenshotData {
  tabId: string | number;
  format?: 'png' | 'jpeg';
  quality?: number;
}

export interface ClickElementData {
  tabId: string | number;
  selector: string;
}

export interface ClickElementByTextData {
  tabId: string | number;
  text: string;
}

export interface FillInputData {
  tabId: string | number;
  selector: string;
  value: string;
  submit?: boolean;
}

export interface GetTabRequestsData {
  tabId: string | number;
  includeBody?: boolean;
}

// Return type interfaces
export interface TabInfo {
  windowId?: number;
  tabId?: number;
  title?: string;
  url?: string;
  active?: boolean;
  index?: number;
}

export interface SuccessResponse {
  success: boolean;
  message?: string;
}

export interface CreateTabResponse {
  success: boolean;
  tab: TabInfo;
}

export interface CaptureScreenshotResponse {
  success: boolean;
  dataUrl: string;
  format: string;
  captureTimeMs: number;
}

export interface StartLoggingResponse {
  success: boolean;
  message: string;
  tabId: number;
  debuggerAttached: boolean;
}

export interface StopLoggingResponse {
  success: boolean;
  message: string;
  tabId: number;
  debuggerAttached: boolean;
}

export interface StorageData {
  cookies: Array<{ name: string; value: string }>;
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
}

// ============================================================================
// Chrome Debugger API Response Types
// ============================================================================

/**
 * Response from chrome.debugger.sendCommand for Runtime.evaluate
 */
export interface RuntimeEvaluateResponse {
  result?: {
    value?: unknown;
  };
  exceptionDetails?: {
    text?: string;
    exception?: {
      description?: string;
    };
    stackTrace?: unknown;
  };
}

/**
 * Response from chrome.debugger.sendCommand for Network.getCookies
 */
export interface NetworkGetCookiesResponse {
  cookies?: Array<{
    name: string;
    value: string;
  }>;
}

/**
 * Response from chrome.debugger.sendCommand for Network.getResponseBody
 */
export interface NetworkGetResponseBodyResponse {
  body?: string;
  base64Encoded?: boolean;
}

// ============================================================================
// Chrome DevTools Protocol Event Types
// ============================================================================

/**
 * Parameters for Runtime.consoleAPICalled event
 */
export interface ConsoleAPICalledParams {
  type: string;
  timestamp: number;
  args: Array<{
    value?: unknown;
    type?: string;
    subtype?: string;
    description?: string;
    preview?: {
      properties?: Array<{
        name: string;
        value?: unknown;
        valuePreview?: {
          description?: string;
          type?: string;
        };
      }>;
    };
  }>;
  stackTrace?: unknown;
}

/**
 * Parameters for Runtime.exceptionThrown event
 */
export interface ExceptionThrownParams {
  timestamp: number;
  exceptionDetails: {
    text?: string;
    exception?: {
      description?: string;
    };
    stackTrace?: unknown;
  };
}

/**
 * Parameters for Log.entryAdded event
 */
export interface LogEntryAddedParams {
  entry: {
    level: string;
    timestamp: number;
    text: string;
    source?: string;
    url?: string;
    lineNumber?: number;
  };
}

/**
 * Parameters for Network.requestWillBeSent event
 */
export interface NetworkRequestWillBeSentParams {
  requestId: string;
  request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    postData?: string;
  };
  timestamp: number;
  type: string;
  initiator: unknown;
}

/**
 * Parameters for Network.requestWillBeSentExtraInfo event
 */
export interface NetworkRequestExtraInfoParams {
  requestId: string;
  headers: Record<string, string>;
}

/**
 * Parameters for Network.responseReceived event
 */
export interface NetworkResponseReceivedParams {
  requestId: string;
  response: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    mimeType: string;
    timing?: unknown;
  };
}

/**
 * Parameters for Network.responseReceivedExtraInfo event
 */
export interface NetworkResponseExtraInfoParams {
  requestId: string;
  headers: Record<string, string>;
}

/**
 * Parameters for Network.loadingFinished event
 */
export interface NetworkLoadingFinishedParams {
  requestId: string;
  encodedDataLength: number;
}

/**
 * Parameters for Network.loadingFailed event
 */
export interface NetworkLoadingFailedParams {
  requestId: string;
  errorText: string;
  canceled: boolean;
}
