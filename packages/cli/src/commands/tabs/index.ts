import { Command } from 'commander';
import { createCloseTabCommand } from './close-tab.js';
import { createExecuteScriptCommand } from './execute-script.js';
import { createGetLogsCommand } from './get-logs.js';
import { createGetRequestsCommand } from './get-requests.js';
import { createListTabsCommand } from './list-tabs.js';
import { createRefreshTabCommand } from './refresh-tab.js';

export function createTabsCommand(): Command {
  const tabs = new Command('tabs');
  tabs.description('Manage Chrome tabs');

  tabs.addCommand(createListTabsCommand());
  tabs.addCommand(createExecuteScriptCommand());
  tabs.addCommand(createCloseTabCommand());
  tabs.addCommand(createRefreshTabCommand());
  tabs.addCommand(createGetLogsCommand());
  tabs.addCommand(createGetRequestsCommand());

  return tabs;
}
