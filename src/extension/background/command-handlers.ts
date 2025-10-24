import { ProtocolCommand } from '../../bridge/protocol/commands.js';
import type { ProtocolCommandHandlerMap } from '../../bridge/protocol/types.js';
import { getTabLogs } from './commands/inspection/get-logs.js';
import { getTabRequests } from './commands/inspection/get-requests.js';
import { getTabStorage } from './commands/inspection/get-storage.js';
import { captureScreenshot } from './commands/inspection/screenshot.js';
import { clickElement, clickElementByText } from './commands/interaction/click.js';
import { executeScript } from './commands/interaction/execute-script.js';
import { fillInput } from './commands/interaction/input.js';
import { clearTabLogs } from './commands/internal/clear-logs.js';
import { clearTabRequests } from './commands/internal/clear-requests.js';
import { getProfileInfo } from './commands/internal/get-profile-info.js';
import { ping } from './commands/internal/ping.js';
import { reloadExtension } from './commands/internal/reload-extension.js';
import { startLogging } from './commands/internal/start-logging.js';
import { stopLogging } from './commands/internal/stop-logging.js';
import { closeTab } from './commands/navigation/close.js';
import { createTab } from './commands/navigation/create.js';
import { activateTab } from './commands/navigation/focus.js';
import { listTabs } from './commands/navigation/list.js';
import { navigateTab } from './commands/navigation/navigate.js';
import { reloadTab } from './commands/navigation/refresh.js';

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
  [ProtocolCommand.PING]: async () => ping()
};
