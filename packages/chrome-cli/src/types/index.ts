/**
 * Tab information returned by Chrome
 */
export interface Tab {
  windowId: number;
  tabId: number;
  title: string;
  url: string;
  active: boolean;
  index: number;
}

/**
 * Message sent to native host
 */
export interface NativeMessage {
  command: string;
  data?: Record<string, unknown>;
  id: string;
}

/**
 * Response from native host
 */
export interface NativeResponse {
  id: string;
  success: boolean;
  result?: unknown;
  error?: string;
}
