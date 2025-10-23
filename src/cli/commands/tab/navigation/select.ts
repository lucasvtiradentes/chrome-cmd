import * as readline from 'node:readline';
import chalk from 'chalk';
import { Command } from 'commander';
import { CommandNames, SubCommandNames } from '../../../../shared/commands/cli-command.js';
import type { TabsSelectOptions } from '../../../../shared/commands/protocol-command.js';
import { createSubCommandFromSchema } from '../../../../shared/utils/helpers/command-builder.js';

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
      console.log('');
      console.log(chalk.yellow('⚠  No tabs open'));
      console.log('');
      process.exit(1);
    }

    console.log('');
    console.log(chalk.bold('Open Tabs:'));
    console.log('');

    tabs.forEach((tab, index: number) => {
      const isActive = tab.tabId === activeTabId;
      const marker = isActive ? chalk.green('●') : chalk.dim('○');
      const status = isActive ? chalk.green(' (active)') : '';

      console.log(`${marker} ${chalk.bold(index + 1)}. ${chalk.bold.cyan(tab.title || 'Untitled')}${status}`);
      console.log(`   ${chalk.dim(`ID: ${tab.tabId}`)}`);
      console.log(`   ${chalk.dim(`URL: ${tab.url || 'N/A'}`)}`);
      console.log('');
    });

    console.log('─────────────────────────────────────────────────────────────────────');
    console.log('');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const choice = await new Promise<string>((resolve) => {
      rl.question(chalk.cyan('Select tab (number or tab ID): '), (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });

    if (!choice) {
      console.log('');
      console.log(chalk.yellow('✗ No selection made'));
      console.log('');
      process.exit(1);
    }

    const indexChoice = Number.parseInt(choice, 10);
    if (!Number.isNaN(indexChoice) && indexChoice >= 1 && indexChoice <= tabs.length) {
      const selectedTab = tabs[indexChoice - 1];
      if (selectedTab.tabId === undefined) {
        console.log('');
        console.log(chalk.red('✗ Selected tab has no ID'));
        console.log('');
        process.exit(1);
      }
      tabId = selectedTab.tabId;
    } else {
      const match = tabs.find((t) => t.tabId === Number.parseInt(choice, 10));
      if (match && match.tabId !== undefined) {
        tabId = match.tabId;
      } else {
        console.log('');
        console.log(chalk.red('✗ Invalid selection'));
        console.log('');
        console.log('Please enter a valid number or tab ID.');
        console.log('');
        process.exit(1);
      }
    }
  }

  const tabs = await client.listTabs();
  const tab = tabs.find((t) => t.tabId === tabId);

  if (!tab) {
    console.error(chalk.red(`Error: Tab with ID ${tabId} not found`));
    process.exit(1);
  }

  profileManager.setActiveTabId(tabId);

  console.log(chalk.blue('⚡ Starting debugger and logging...'));
  await client.startLogging(tabId);

  console.log(chalk.green('✓ Active tab selected successfully'));
  console.log('');
  console.log(chalk.bold('Active tab:'));
  console.log(`  ${chalk.cyan('ID:')} ${tabId}`);
  console.log(`  ${chalk.cyan('Title:')} ${tab.title || 'Untitled'}`);
  console.log(`  ${chalk.cyan('URL:')} ${tab.url || 'N/A'}`);
  console.log(`  ${chalk.cyan('Debugger:')} ${chalk.green('Attached')}`);
  console.log('');
  console.log(chalk.dim('All subsequent tab commands will use this tab unless --tab is specified'));
  console.log(chalk.dim('Console logs and network requests are now being captured in the background'));
}

export function createSelectTabCommand(): Command {
  return createSubCommandFromSchema(
    CommandNames.TAB,
    SubCommandNames.TAB_SELECT,
    async (options: TabsSelectOptions) => {
      try {
        await selectTab(options.tab);
      } catch (error) {
        console.error(chalk.red('Error selecting active tab:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    }
  );
}
