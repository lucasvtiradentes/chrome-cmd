import type { FillInputData } from '../../../../protocol/commands/definitions/tab.js';
import { formatErrorMessage } from '../../../../shared/utils/functions/format-error-message.js';
import { escapeJavaScriptString, parseTabId } from '../../../../shared/utils/helpers.js';
import type { SuccessResponse } from '../../../../shared/utils/types.js';
import { withDebugger } from '../../debugger-manager.js';

export async function fillInput({ tabId, selector, value, submit = false }: FillInputData): Promise<SuccessResponse> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  if (!selector) {
    throw new Error('selector is required');
  }

  if (!value) {
    throw new Error('value is required');
  }

  const tabIdInt = parseTabId(tabId);

  try {
    const escapedSelector = escapeJavaScriptString(selector);
    const escapedValue = escapeJavaScriptString(value);

    return await withDebugger(tabIdInt, async () => {
      const setValueResult = await chrome.debugger.sendCommand({ tabId: tabIdInt }, 'Runtime.evaluate', {
        expression: `
            (() => {
              const element = document.querySelector('${escapedSelector}');
              if (!element) {
                throw new Error('Element not found: ${escapedSelector}');
              }

              element.focus();

              const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype,
                'value'
              ).set;
              nativeInputValueSetter.call(element, '${escapedValue}');

              element.dispatchEvent(new Event('input', { bubbles: true }));
              element.dispatchEvent(new Event('change', { bubbles: true }));

              return element.value;
            })()
          `,
        returnByValue: true
      });

      const evaluateResult = setValueResult as chrome.debugger.DebuggerResult;
      console.log('[Background] Input value set to:', evaluateResult.result?.value);

      if (submit) {
        const INPUT_SUBMIT_DELAY = 150;
        await new Promise((resolve) => setTimeout(resolve, INPUT_SUBMIT_DELAY));

        await chrome.debugger.sendCommand({ tabId: tabIdInt }, 'Input.dispatchKeyEvent', {
          type: 'rawKeyDown',
          key: 'Enter',
          code: 'Enter',
          windowsVirtualKeyCode: 13,
          nativeVirtualKeyCode: 13
        });

        await chrome.debugger.sendCommand({ tabId: tabIdInt }, 'Input.dispatchKeyEvent', {
          type: 'keyUp',
          key: 'Enter',
          code: 'Enter',
          windowsVirtualKeyCode: 13,
          nativeVirtualKeyCode: 13
        });

        console.log('[Background] Enter key pressed');
      }

      return { success: true };
    });
  } catch (error) {
    throw new Error(`Failed to fill input: ${formatErrorMessage(error)}`);
  }
}
