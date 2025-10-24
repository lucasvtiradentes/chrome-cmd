import type { GetTabRequestsData } from '../../../protocol/commands/definitions/tab.js';
import { APP_NAME } from '../../../shared/constants/constants.js';
import { formatErrorMessage } from '../../../shared/utils/functions/format-error-message.js';
import { parseTabId } from '../../../shared/utils/helpers.js';
import type { NetworkRequestEntry } from '../../../shared/utils/types.js';
import { debuggerAttached } from '../debugger-manager.js';
import { networkRequests } from '../logging-collector.js';

export async function getTabRequests({
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
