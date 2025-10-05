/**
 * Chrome CLI Bridge - Background Service Worker
 * Connects to mediator server via Native Messaging (BroTab architecture)
 */

const NATIVE_APP_NAME = 'com.chrome_cli.native';
let mediatorPort = null;

/**
 * Connect to the mediator via Native Messaging
 */
function connectToMediator() {
  try {
    mediatorPort = chrome.runtime.connectNative(NATIVE_APP_NAME);

    mediatorPort.onMessage.addListener((message) => {
      console.log('[Background] Received from mediator:', message);
      handleCommand(message);
    });

    mediatorPort.onDisconnect.addListener(() => {
      console.log('[Background] Mediator disconnected');
      mediatorPort = null;

      // Try to reconnect after 5 seconds
      setTimeout(() => {
        console.log('[Background] Attempting to reconnect...');
        connectToMediator();
      }, 5000);
    });

    console.log('[Background] Connected to mediator');
  } catch (error) {
    console.error('[Background] Failed to connect to mediator:', error);
  }
}

/**
 * Handle command from mediator
 */
async function handleCommand(message) {
  const { command, data, id } = message;

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

// Initialize on service worker start
console.log('[Background] Service worker started');
connectToMediator();

// Keep service worker alive
chrome.runtime.onStartup.addListener(() => {
  console.log('[Background] Chrome started');
  connectToMediator();
});
