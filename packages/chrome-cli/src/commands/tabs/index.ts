import { Command } from 'commander';
import { createListTabsCommand } from './list-tabs.js';
import { createExecuteScriptCommand } from './execute-script.js';

export function createTabsCommand(): Command {
  const tabs = new Command('tabs');
  tabs.description('Manage Chrome tabs');

  tabs.addCommand(createListTabsCommand());
  tabs.addCommand(createExecuteScriptCommand());

  return tabs;
}
