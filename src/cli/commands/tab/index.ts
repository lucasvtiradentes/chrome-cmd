import { Command } from 'commander';
import { createCommandFromSchema } from '../../../shared/commands/command-builder.js';
import { CommandNames } from '../../../shared/commands/commands-schema.js';
import { createGetHtmlCommand } from './inspection/get-html.js';
import { createGetLogsCommand } from './inspection/get-logs.js';
import { createGetRequestsCommand } from './inspection/get-requests.js';
import { createGetStorageCommand } from './inspection/get-storage.js';
import { createScreenshotTabCommand } from './inspection/screenshot.js';
import { createClickTabCommand } from './interaction/click.js';
import { createExecuteScriptCommand } from './interaction/execute-script.js';
import { createInputTabCommand } from './interaction/input.js';
import { createCloseTabCommand } from './navigation/close.js';
import { createCreateTabCommand } from './navigation/create.js';
import { createFocusTabCommand } from './navigation/focus.js';
import { createListTabsCommand } from './navigation/list.js';
import { createNavigateTabCommand } from './navigation/navigate.js';
import { createRefreshTabCommand } from './navigation/refresh.js';
import { createSelectTabCommand } from './navigation/select.js';

export function createTabCommand(): Command {
  const tab = createCommandFromSchema(CommandNames.TAB);

  tab.addCommand(createListTabsCommand());
  tab.addCommand(createSelectTabCommand());
  tab.addCommand(createFocusTabCommand());
  tab.addCommand(createCreateTabCommand());
  tab.addCommand(createExecuteScriptCommand());
  tab.addCommand(createCloseTabCommand());
  tab.addCommand(createRefreshTabCommand());
  tab.addCommand(createNavigateTabCommand());
  tab.addCommand(createScreenshotTabCommand());
  tab.addCommand(createGetHtmlCommand());
  tab.addCommand(createGetLogsCommand());
  tab.addCommand(createGetRequestsCommand());
  tab.addCommand(createGetStorageCommand());
  tab.addCommand(createClickTabCommand());
  tab.addCommand(createInputTabCommand());

  return tab;
}
