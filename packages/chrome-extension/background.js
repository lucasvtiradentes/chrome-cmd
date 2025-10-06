/**
 * Chrome CLI Bridge - Background Service Worker
 * Connects to mediator server via Native Messaging (BroTab architecture)
 */

const NATIVE_APP_NAME = 'com.chrome_cli.native';
let mediatorPort = null;
let reconnectAttempts = 0;
let keepaliveInterval = null;

// Console logs storage: tabId -> array of log entries
const consoleLogs = new Map();
// Track which tabs have debugger attached for logging
const debuggerAttached = new Set();

/**
 * Connect to the mediator via Native Messaging
 */
function connectToMediator() {
  // Prevent multiple connections
  if (mediatorPort) {
    console.log('[Background] Already connected to mediator, skipping...');
    return;
  }

  try {
    mediatorPort = chrome.runtime.connectNative(NATIVE_APP_NAME);

    mediatorPort.onMessage.addListener((message) => {
      console.log('[Background] Received from mediator:', message);
      handleCommand(message);
    });

    mediatorPort.onDisconnect.addListener(() => {
      const lastError = chrome.runtime.lastError;
      console.log('[Background] Mediator disconnected:', lastError?.message || 'Unknown reason');
      mediatorPort = null;

      // Clear keepalive
      if (keepaliveInterval) {
        clearInterval(keepaliveInterval);
        keepaliveInterval = null;
      }

      // Try to reconnect with exponential backoff
      reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 30000); // Max 30s
      console.log(`[Background] Reconnecting in ${delay}ms (attempt ${reconnectAttempts})...`);

      setTimeout(() => {
        connectToMediator();
      }, delay);
    });

    console.log('[Background] Connected to mediator');
    reconnectAttempts = 0;

    // Send keepalive ping every 30 seconds to keep connection alive
    if (keepaliveInterval) clearInterval(keepaliveInterval);
    keepaliveInterval = setInterval(() => {
      if (mediatorPort) {
        try {
          mediatorPort.postMessage({ command: 'ping', id: 'keepalive_' + Date.now() });
        } catch (error) {
          console.error('[Background] Keepalive failed:', error);
        }
      }
    }, 30000);

  } catch (error) {
    console.error('[Background] Failed to connect to mediator:', error);

    // Retry connection
    reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 30000);
    setTimeout(() => {
      connectToMediator();
    }, delay);
  }
}

/**
 * Save command to history
 */
async function saveCommandToHistory(command, data) {
  // Don't save ping commands
  if (command === 'ping' || command.startsWith('keepalive')) {
    return;
  }

  const historyItem = {
    command,
    data,
    timestamp: Date.now()
  };

  const result = await chrome.storage.local.get(['commandHistory']);
  const history = result.commandHistory || [];

  // Keep last 100 commands
  history.push(historyItem);
  if (history.length > 100) {
    history.shift();
  }

  await chrome.storage.local.set({ commandHistory: history });
}

/**
 * Handle command from mediator
 */
async function handleCommand(message) {
  const { command, data, id } = message;

  // Save to history
  await saveCommandToHistory(command, data);

  try {
    let result;

    switch (command) {
      case 'list_tabs':
        result = await listTabs();
        break;

      case 'execute_script':
        result = await executeScript(data);
        break;

      case 'close_tab':
        result = await closeTab(data);
        break;

      case 'activate_tab':
        result = await activateTab(data);
        break;

      case 'create_tab':
        result = await createTab(data);
        break;

      case 'reload_tab':
        result = await reloadTab(data);
        break;

      case 'get_tab_logs':
        result = await getTabLogs(data);
        break;

      case 'clear_tab_logs':
        result = await clearTabLogs(data);
        break;

      case 'ping':
        result = { status: 'ok', message: 'pong' };
        break;

      default:
        throw new Error(`Unknown command: ${command}`);
    }

    // Send response back to mediator
    if (mediatorPort) {
      mediatorPort.postMessage({ id, success: true, result });
    }
  } catch (error) {
    // Send error response back to mediator
    if (mediatorPort) {
      mediatorPort.postMessage({ id, success: false, error: error.message });
    }
  }
}

/**
 * List all open tabs
 * Returns format: { windowId, tabId, title, url, active }
 */
async function listTabs() {
  const windows = await chrome.windows.getAll({ populate: true });
  const tabs = [];

  for (const window of windows) {
    for (const tab of window.tabs) {
      tabs.push({
        windowId: window.id,
        tabId: tab.id,
        title: tab.title,
        url: tab.url,
        active: tab.active,
        index: tab.index
      });
    }
  }

  return tabs;
}

/**
 * Execute JavaScript in a specific tab using Chrome Debugger API
 * This is the official way to execute arbitrary code in Manifest V3
 */
async function executeScript({ tabId, code }) {
  if (!tabId || !code) {
    throw new Error('tabId and code are required');
  }

  const tabIdInt = parseInt(tabId);
  console.log('[Background] Executing script in tab', tabIdInt, ':', code);

  try {
    // Attach debugger to tab
    await chrome.debugger.attach({ tabId: tabIdInt }, '1.3');
    console.log('[Background] Debugger attached');

    // Execute code using Runtime.evaluate
    const result = await chrome.debugger.sendCommand(
      { tabId: tabIdInt },
      'Runtime.evaluate',
      {
        expression: code,
        returnByValue: true,
        awaitPromise: true
      }
    );

    console.log('[Background] Debugger result:', result);

    // Detach debugger
    await chrome.debugger.detach({ tabId: tabIdInt });
    console.log('[Background] Debugger detached');

    // Return the result value
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description || 'Script execution failed');
    }

    return result.result?.value;
  } catch (error) {
    // Try to detach debugger on error
    try {
      await chrome.debugger.detach({ tabId: tabIdInt });
    } catch (e) {
      // Ignore detach errors
    }
    throw error;
  }
}

/**
 * Close a specific tab
 */
async function closeTab({ tabId }) {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  await chrome.tabs.remove(parseInt(tabId));
  return { success: true };
}

/**
 * Activate (focus) a specific tab
 */
async function activateTab({ tabId }) {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  const tab = await chrome.tabs.get(parseInt(tabId));
  await chrome.windows.update(tab.windowId, { focused: true });
  await chrome.tabs.update(parseInt(tabId), { active: true });

  return { success: true };
}

/**
 * Create a new tab
 */
async function createTab({ url, active = true }) {
  const tab = await chrome.tabs.create({
    url: url || 'about:blank',
    active
  });

  return {
    success: true,
    tab: {
      windowId: tab.windowId,
      tabId: tab.id,
      title: tab.title,
      url: tab.url
    }
  };
}

/**
 * Reload/refresh a specific tab
 */
async function reloadTab({ tabId }) {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  await chrome.tabs.reload(parseInt(tabId));
  return { success: true };
}

/**
 * Attach debugger to a tab and start capturing console logs
 */
async function startLoggingTab(tabIdInt) {
  if (debuggerAttached.has(tabIdInt)) {
    console.log('[Background] Already logging tab', tabIdInt);
    return;
  }

  try {
    // Attach debugger to tab
    await chrome.debugger.attach({ tabId: tabIdInt }, '1.3');
    debuggerAttached.add(tabIdInt);

    // Initialize logs array for this tab
    if (!consoleLogs.has(tabIdInt)) {
      consoleLogs.set(tabIdInt, []);
    }

    // Enable Console domain
    await chrome.debugger.sendCommand(
      { tabId: tabIdInt },
      'Console.enable'
    );

    // Enable Runtime domain
    await chrome.debugger.sendCommand(
      { tabId: tabIdInt },
      'Runtime.enable'
    );

    // Enable Log domain
    await chrome.debugger.sendCommand(
      { tabId: tabIdInt },
      'Log.enable'
    );

    console.log('[Background] Started logging tab', tabIdInt);
  } catch (error) {
    debuggerAttached.delete(tabIdInt);
    throw error;
  }
}

/**
 * Stop logging a tab and detach debugger
 */
async function stopLoggingTab(tabIdInt) {
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

/**
 * Get console logs from a specific tab
 */
async function getTabLogs({ tabId }) {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  const tabIdInt = parseInt(tabId);

  // Start logging if not already
  if (!debuggerAttached.has(tabIdInt)) {
    await startLoggingTab(tabIdInt);
    // Give it a moment to capture any existing logs
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Return stored logs
  const logs = consoleLogs.get(tabIdInt) || [];

  if (logs.length === 0) {
    return [{
      type: 'info',
      timestamp: Date.now(),
      message: 'No console logs yet. Logs will be captured from now on. Interact with the page to see new logs.'
    }];
  }

  return logs;
}

/**
 * Clear console logs for a specific tab
 */
async function clearTabLogs({ tabId }) {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  const tabIdInt = parseInt(tabId);
  consoleLogs.set(tabIdInt, []);

  return { success: true, message: 'Logs cleared' };
}

/**
 * Handle debugger events (console logs)
 */
chrome.debugger.onEvent.addListener((source, method, params) => {
  const tabId = source.tabId;

  if (!debuggerAttached.has(tabId)) {
    return;
  }

  // Handle console API calls (console.log, console.error, etc.)
  if (method === 'Runtime.consoleAPICalled') {
    const logEntry = {
      type: params.type, // 'log', 'error', 'warning', 'info', etc.
      timestamp: params.timestamp,
      args: params.args.map(arg => {
        if (arg.value !== undefined) {
          return arg.value;
        }
        if (arg.description !== undefined) {
          return arg.description;
        }
        return String(arg);
      }),
      stackTrace: params.stackTrace
    };

    // Get or create logs array for this tab
    if (!consoleLogs.has(tabId)) {
      consoleLogs.set(tabId, []);
    }

    const logs = consoleLogs.get(tabId);
    logs.push(logEntry);

    // Keep only last 1000 logs per tab
    if (logs.length > 1000) {
      logs.shift();
    }

    console.log('[Background] Captured console.' + params.type, tabId, logEntry.args);
  }

  // Handle console messages (errors, warnings from the page)
  if (method === 'Runtime.exceptionThrown') {
    const logEntry = {
      type: 'error',
      timestamp: params.timestamp,
      args: [params.exceptionDetails.text || params.exceptionDetails.exception?.description || 'Error'],
      stackTrace: params.exceptionDetails.stackTrace
    };

    if (!consoleLogs.has(tabId)) {
      consoleLogs.set(tabId, []);
    }

    const logs = consoleLogs.get(tabId);
    logs.push(logEntry);

    if (logs.length > 1000) {
      logs.shift();
    }

    console.log('[Background] Captured exception', tabId, logEntry.args);
  }

  // Handle Log domain messages
  if (method === 'Log.entryAdded') {
    const logEntry = {
      type: params.entry.level, // 'verbose', 'info', 'warning', 'error'
      timestamp: params.entry.timestamp,
      args: [params.entry.text],
      source: params.entry.source,
      url: params.entry.url,
      lineNumber: params.entry.lineNumber
    };

    if (!consoleLogs.has(tabId)) {
      consoleLogs.set(tabId, []);
    }

    const logs = consoleLogs.get(tabId);
    logs.push(logEntry);

    if (logs.length > 1000) {
      logs.shift();
    }

    console.log('[Background] Captured log entry', tabId, logEntry.args);
  }
});

/**
 * Handle debugger detach (cleanup)
 */
chrome.debugger.onDetach.addListener((source, reason) => {
  const tabId = source.tabId;
  debuggerAttached.delete(tabId);
  console.log('[Background] Debugger detached from tab', tabId, 'reason:', reason);
});

/**
 * Handle tab close (cleanup)
 */
chrome.tabs.onRemoved.addListener((tabId) => {
  debuggerAttached.delete(tabId);
  consoleLogs.delete(tabId);
  console.log('[Background] Tab removed, cleaned up logs:', tabId);
});

// Initialize on service worker start
console.log('[Background] Service worker started');
connectToMediator();
