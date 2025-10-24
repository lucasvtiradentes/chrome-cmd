import { ProtocolCommand } from '../../protocol/commands/definitions.js';
import type { ProtocolCommandHandlerMap } from '../../protocol/commands/protocol.js';
import { activateTab } from './commands/activate-tab.js';
import { captureScreenshot } from './commands/capture-screenshot.js';
import { clearTabLogs } from './commands/clear-tab-logs.js';
import { clearTabRequests } from './commands/clear-tab-requests.js';
import { clickElement, clickElementByText } from './commands/click-element.js';
import { closeTab } from './commands/close-tab.js';
import { createTab } from './commands/create-tab.js';
import { executeScript } from './commands/execute-javascript.js';
import { fillInput } from './commands/fill-input.js';
import { getProfileInfo } from './commands/get-profile-info.js';
import { getTabLogs } from './commands/get-tab-logs.js';
import { getTabStorage } from './commands/get-tab-storage.js';
import { getTabRequests } from './commands/get-tabs-request.js';
import { listTabs } from './commands/list-tabs.js';
import { navigateTab } from './commands/navigate-tab.js';
import { reloadExtension } from './commands/reload-extension.js';
import { reloadTab } from './commands/reload-tab.js';
import { startLogging } from './commands/start-logging.js';
import { stopLogging } from './commands/stop-logging.js';

export const commandHandlers: ProtocolCommandHandlerMap = {
  [ProtocolCommand.TAB_LIST]: async () => listTabs(),
  [ProtocolCommand.TAB_EXEC]: async (data) => executeScript(data),
  [ProtocolCommand.TAB_CLOSE]: async (data) => closeTab(data),
  [ProtocolCommand.TAB_FOCUS]: async (data) => activateTab(data),
  [ProtocolCommand.TAB_CREATE]: async (data) => createTab(data),
  [ProtocolCommand.TAB_REFRESH]: async (data) => reloadTab(data),
  [ProtocolCommand.TAB_LOGS]: async (data) => getTabLogs(data),
  [ProtocolCommand.CLEAR_TAB_LOGS]: async (data) => clearTabLogs(data),
  [ProtocolCommand.TAB_REQUESTS]: async (data) => getTabRequests(data),
  [ProtocolCommand.CLEAR_TAB_REQUESTS]: async (data) => clearTabRequests(data),
  [ProtocolCommand.TAB_STORAGE]: async (data) => getTabStorage(data),
  [ProtocolCommand.TAB_NAVIGATE]: async (data) => navigateTab(data),
  [ProtocolCommand.TAB_SCREENSHOT]: async (data) => captureScreenshot(data),
  [ProtocolCommand.TAB_CLICK]: async (data) => clickElement(data),
  [ProtocolCommand.CLICK_ELEMENT_BY_TEXT]: async (data) => clickElementByText(data),
  [ProtocolCommand.TAB_INPUT]: async (data) => fillInput(data),
  [ProtocolCommand.START_LOGGING]: async (data) => startLogging(data),
  [ProtocolCommand.STOP_LOGGING]: async (data) => stopLogging(data),
  [ProtocolCommand.RELOAD_EXTENSION]: async () => reloadExtension(),
  [ProtocolCommand.GET_PROFILE_INFO]: async () => getProfileInfo(),
  [ProtocolCommand.PING]: async () => ({ status: 'ok', message: 'pong' })
};
