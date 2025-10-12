export interface Tab {
  windowId: number;
  tabId: number;
  title: string;
  url: string;
  active: boolean;
  index: number;
}

export interface NativeMessage {
  command: string;
  data?: Record<string, unknown>;
  id: string;
}

export interface NativeResponse {
  id: string;
  success: boolean;
  result?: unknown;
  error?: string;
}
