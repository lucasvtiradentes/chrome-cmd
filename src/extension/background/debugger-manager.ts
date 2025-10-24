export const debuggerAttached = new Set<number>();

export async function startLoggingTab(tabIdInt: number): Promise<void> {
  if (debuggerAttached.has(tabIdInt)) {
    console.log('[Background] Already logging tab', tabIdInt);
    return;
  }

  try {
    await chrome.debugger.attach({ tabId: tabIdInt }, '1.3');
    debuggerAttached.add(tabIdInt);

    await chrome.debugger.sendCommand({ tabId: tabIdInt }, 'Console.enable');

    await chrome.debugger.sendCommand({ tabId: tabIdInt }, 'Runtime.enable');

    await chrome.debugger.sendCommand({ tabId: tabIdInt }, 'Log.enable');

    await chrome.debugger.sendCommand({ tabId: tabIdInt }, 'Network.enable', {
      maxTotalBufferSize: 10000000,
      maxResourceBufferSize: 5000000,
      maxPostDataSize: 5000000
    });

    console.log('[Background] Started logging tab', tabIdInt);
  } catch (error) {
    debuggerAttached.delete(tabIdInt);
    throw error;
  }
}

export async function stopLoggingTab(tabIdInt: number): Promise<void> {
  if (!debuggerAttached.has(tabIdInt)) {
    return;
  }

  try {
    await chrome.debugger.detach({ tabId: tabIdInt });
    debuggerAttached.delete(tabIdInt);
    console.log('[Background] Stopped logging tab', tabIdInt);
  } catch (error) {
    console.error('[Background] Error stopping logging:', error);
  }
}

export async function withDebugger<T>(tabId: number, fn: () => Promise<T>): Promise<T> {
  const wasAttached = debuggerAttached.has(tabId);
  if (!wasAttached) {
    await chrome.debugger.attach({ tabId }, '1.3');
    debuggerAttached.add(tabId);
  }
  try {
    return await fn();
  } finally {
    if (!wasAttached) {
      await chrome.debugger.detach({ tabId });
      debuggerAttached.delete(tabId);
    }
  }
}

chrome.debugger.onDetach.addListener((source, reason) => {
  const tabId = source.tabId;
  if (tabId !== undefined) {
    debuggerAttached.delete(tabId);
    console.log('[Background] Debugger detached from tab', tabId, 'reason:', reason);
  }
});
