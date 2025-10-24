import type { ExecuteScriptData } from '../../../../protocol/commands/definitions/tab.js';
import { parseTabId } from '../../../utils/extension-utils.js';
import { withDebugger } from '../../debugger-manager.js';

export async function executeScript({ tabId, code }: ExecuteScriptData): Promise<unknown> {
  if (!tabId || !code) {
    throw new Error('tabId and code are required');
  }

  const tabIdInt = parseTabId(tabId);
  console.log('[Background] Executing script in tab', tabIdInt, ':', code);

  return withDebugger(tabIdInt, async () => {
    const result = await chrome.debugger.sendCommand({ tabId: tabIdInt }, 'Runtime.evaluate', {
      expression: code,
      returnByValue: true,
      awaitPromise: true
    });

    console.log('[Background] Debugger result:', result);

    const evaluateResult = result as chrome.debugger.DebuggerResult;
    if (evaluateResult.exceptionDetails) {
      throw new Error(evaluateResult.exceptionDetails.exception?.description || 'Script execution failed');
    }

    return evaluateResult.result?.value;
  });
}
