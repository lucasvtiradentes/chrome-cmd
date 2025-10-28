import type { GetTabRequestsData } from '../../../../cli/schemas/definitions/tab.js';
import { CLI_NAME } from '../../../../shared/constants/constants.js';
import type { NetworkRequestEntry } from '../../../../shared/utils/types.js';
import { parseTabId } from '../../../utils/extension-utils.js';
import { formatErrorMessage } from '../../../utils/format-error-message.js';
import { debuggerAttached } from '../../debugger-manager.js';
import { networkRequests } from '../../logging-collector.js';

export async function getTabRequests({
  tabId,
  includeBody,
  includeCookies
}: GetTabRequestsData): Promise<NetworkRequestEntry[] | Array<{ type: string; timestamp: number; message: string }>> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  const tabIdInt = parseTabId(tabId);

  if (!debuggerAttached.has(tabIdInt)) {
    throw new Error(
      `Debugger not attached to this tab. Use "${CLI_NAME} tabs select --tab <index>" first to start logging.`
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

  if (includeCookies && debuggerAttached.has(tabIdInt)) {
    for (const request of requests) {
      if (request.headers.Cookie || request.headers.cookie) {
        continue;
      }

      try {
        const cookiesResponse = await chrome.debugger.sendCommand({ tabId: tabIdInt }, 'Network.getCookies', {
          urls: [request.url]
        });

        const cookies = (cookiesResponse as chrome.debugger.NetworkCookiesResponse).cookies;
        if (cookies && cookies.length > 0) {
          const cookieHeader = cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');

          if (cookieHeader) {
            request.headers = request.headers || {};
            request.headers.Cookie = cookieHeader;
          }
        }
      } catch (error) {
        const errorMessage = formatErrorMessage(error);
        if (errorMessage.includes('quota exceeded')) {
          console.warn('[getTabRequests] Quota exceeded while getting cookies for:', request.url);
          break;
        }
      }
    }
  }

  return requests;
}
