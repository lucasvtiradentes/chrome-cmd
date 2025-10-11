/**
 * Shared types for chrome-cmd
 */

// ============================================================================
// Tab Information
// ============================================================================

export interface TabInfo {
  windowId?: number;
  tabId?: number;
  title?: string;
  url?: string;
  active?: boolean;
  index?: number;
}

// ============================================================================
// History
// ============================================================================

export interface HistoryItem {
  command: string;
  data: Record<string, unknown>;
  timestamp: number;
}

// ============================================================================
// Logging
// ============================================================================

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

// ============================================================================
// Response Types
// ============================================================================

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
