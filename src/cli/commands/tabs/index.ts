import { Command } from 'commander';
import { createClickTabCommand } from './click-tab.js';
import { createCloseTabCommand } from './close-tab.js';
import { createCreateTabCommand } from './create-tab.js';
import { createExecuteScriptCommand } from './execute-script.js';
import { createFocusTabCommand } from './focus-tab.js';
import { createGetHtmlCommand } from './get-html.js';
import { createGetLogsCommand } from './get-logs.js';
import { createGetRequestsCommand } from './get-requests.js';
import { createGetStorageCommand } from './get-storage.js';
import { createInputTabCommand } from './input-tab.js';
import { createListTabsCommand } from './list-tabs.js';
import { createNavigateTabCommand } from './navigate-tab.js';
import { createRefreshTabCommand } from './refresh-tab.js';
import { createScreenshotTabCommand } from './screenshot-tab.js';
import { createSelectTabCommand } from './select-tab.js';

export function createTabsCommand(): Command {
  const tabs = new Command('tabs');
  tabs.description('Manage Chrome tabs');

  tabs.addCommand(createListTabsCommand());
  tabs.addCommand(createSelectTabCommand());
  tabs.addCommand(createFocusTabCommand());
  tabs.addCommand(createCreateTabCommand());
  tabs.addCommand(createExecuteScriptCommand());
  tabs.addCommand(createCloseTabCommand());
  tabs.addCommand(createRefreshTabCommand());
  tabs.addCommand(createNavigateTabCommand());
  tabs.addCommand(createScreenshotTabCommand());
  tabs.addCommand(createGetHtmlCommand());
  tabs.addCommand(createGetLogsCommand());
  tabs.addCommand(createGetRequestsCommand());
  tabs.addCommand(createGetStorageCommand());
  tabs.addCommand(createClickTabCommand());
  tabs.addCommand(createInputTabCommand());

  return tabs;
}
