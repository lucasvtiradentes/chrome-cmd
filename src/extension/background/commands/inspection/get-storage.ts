import type { TabIdData } from '../../../../protocol/commands/definitions/tab.js';
import type { StorageData } from '../../../../shared/utils/types.js';
import { parseTabId } from '../../../utils/extension-utils.js';
import { formatErrorMessage } from '../../../utils/format-error-message.js';
import { withDebugger } from '../../debugger-manager.js';

export async function getTabStorage({ tabId }: TabIdData): Promise<StorageData> {
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
