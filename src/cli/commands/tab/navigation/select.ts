import * as readline from 'node:readline';
import { Command } from 'commander';
import type { TabsSelectOptions } from '../../../../shared/commands/definitions/tab.js';
import { CommandNames, SubCommandNames } from '../../../../shared/commands/definitions.js';
import { createSubCommandFromSchema } from '../../../../shared/commands/utils.js';
import { commandErrorHandler } from '../../../../shared/utils/functions/command-error-handler.js';
import { logger } from '../../../../shared/utils/helpers/logger.js';

import { ChromeClient } from '../../../lib/chrome-client.js';
import { profileManager } from '../../../lib/profile-manager.js';

async function selectTab(tabIndex?: number): Promise<void> {
  const client = new ChromeClient();
  let tabId: number;

  if (tabIndex !== undefined) {
    tabId = await client.resolveTab(tabIndex.toString());
  } else {
    const tabs = await client.listTabs();
    const activeTabId = profileManager.getActiveTabId();

    if (tabs.length === 0) {
      logger.newline();
      logger.warning('⚠  No tabs open');
      logger.newline();
      process.exit(1);
    }

    logger.newline();
    logger.bold('Open Tabs:');
    logger.newline();

    tabs.forEach((tab, index: number) => {
      const isActive = tab.tabId === activeTabId;
      const marker = isActive ? logger.green('●') : '○';
      const status = isActive ? logger.green(' (active)') : '';
      const title = tab.title || 'Untitled';

      logger.raw(`${marker} ${index + 1}. ${title}${status}`);
      logger.dim(`   ID: ${tab.tabId}`);
      logger.dim(`   URL: ${tab.url || 'N/A'}`);
      logger.newline();
    });

    logger.divider(69);
    logger.newline();

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const choice = await new Promise<string>((resolve) => {
      rl.question('Select tab (number or tab ID): ', (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });

    if (!choice) {
      logger.newline();
      logger.warning('✗ No selection made');
      logger.newline();
      process.exit(1);
    }

    const indexChoice = Number.parseInt(choice, 10);
    if (!Number.isNaN(indexChoice) && indexChoice >= 1 && indexChoice <= tabs.length) {
      const selectedTab = tabs[indexChoice - 1];
      if (selectedTab.tabId === undefined) {
        logger.newline();
        logger.error('✗ Selected tab has no ID');
        logger.newline();
        process.exit(1);
      }
      tabId = selectedTab.tabId;
    } else {
      const match = tabs.find((t) => t.tabId === Number.parseInt(choice, 10));
      if (match && match.tabId !== undefined) {
        tabId = match.tabId;
      } else {
        logger.newline();
        logger.error('✗ Invalid selection');
        logger.newline();
        logger.info('Please enter a valid number or tab ID.');
        logger.newline();
        process.exit(1);
      }
    }
  }

  const tabs = await client.listTabs();
  const tab = tabs.find((t) => t.tabId === tabId);

  if (!tab) {
    logger.error(`Error: Tab with ID ${tabId} not found`);
    process.exit(1);
  }

  profileManager.setActiveTabId(tabId);

  logger.blue('⚡ Starting debugger and logging...');
  await client.startLogging(tabId);

  logger.success('✓ Active tab selected successfully');
  logger.newline();
  logger.bold('Active tab:');
  logger.raw(`  ID: ${tabId}`);
  logger.raw(`  Title: ${tab.title || 'Untitled'}`);
  logger.raw(`  URL: ${tab.url || 'N/A'}`);
  logger.raw(`  Debugger: ${logger.green('Attached')}`);
  logger.newline();
  logger.dim('All subsequent tab commands will use this tab unless --tab is specified');
  logger.dim('Console logs and network requests are now being captured in the background');
}

export function createSelectTabCommand(): Command {
  return createSubCommandFromSchema(
    CommandNames.TAB,
    SubCommandNames.TAB_SELECT,
    async (options: TabsSelectOptions) => {
      const commandPromise = async () => {
        await selectTab(options.tab);
      };

      await commandPromise().catch(commandErrorHandler('Error selecting active tab:'));
    }
  );
}
