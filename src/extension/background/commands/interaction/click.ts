import type { ClickElementByTextData, ClickElementData } from '../../../../protocol/commands/definitions/tab.js';
import type { SuccessResponse } from '../../../../shared/utils/types.js';
import { escapeJavaScriptString, parseTabId } from '../../../utils/extension-utils.js';
import { formatErrorMessage } from '../../../utils/format-error-message.js';
import { withDebugger } from '../../debugger-manager.js';

export async function clickElementByText({ tabId, text }: ClickElementByTextData): Promise<SuccessResponse> {
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

export async function clickElement({ tabId, selector }: ClickElementData): Promise<SuccessResponse> {
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
