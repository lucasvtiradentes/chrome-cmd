declare namespace chrome.debugger {
  interface DebuggerResult {
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

  interface NetworkCookiesResponse {
    cookies?: Array<{
      name: string;
      value: string;
      domain: string;
      path: string;
      expires?: number;
      size: number;
      httpOnly: boolean;
      secure: boolean;
      sameSite?: string;
    }>;
  }

  interface NetworkResponseBody {
    body: string;
    base64Encoded: boolean;
  }

  interface ConsoleAPICalledParams {
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

  interface ExceptionThrownParams {
    timestamp: number;
    exceptionDetails: {
      text?: string;
      exception?: {
        description?: string;
      };
      stackTrace?: unknown;
    };
  }

  interface LogEntryAddedParams {
    entry: {
      level: string;
      timestamp: number;
      text: string;
      source?: string;
      url?: string;
      lineNumber?: number;
    };
  }

  interface NetworkRequestParams {
    requestId: string;
    request: {
      url: string;
      method: string;
      headers: Record<string, string>;
      postData?: string;
    };
    timestamp: number;
    type: string;
    initiator?: unknown;
  }

  interface NetworkResponseParams {
    requestId: string;
    response: {
      status: number;
      statusText: string;
      headers: Record<string, string>;
      mimeType: string;
      timing?: unknown;
    };
  }

  interface NetworkExtraInfoParams {
    requestId: string;
    headers: Record<string, string>;
  }

  interface NetworkLoadingFinishedParams {
    requestId: string;
    encodedDataLength: number;
  }

  interface NetworkLoadingFailedParams {
    requestId: string;
    errorText: string;
    canceled: boolean;
  }
}

declare namespace chrome.tabs {
  interface CaptureVisibleTabOptions {
    format?: string;
    quality?: number;
  }
}
