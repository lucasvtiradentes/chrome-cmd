import chalk from 'chalk';
import { Command } from 'commander';
import { createCommandFromSchema } from '../../shared/command-builder.js';
import { CommandNames } from '../../shared/commands-schema.js';
import { getExtensionPath } from '../lib/host-utils.js';

export function createInstallCommand(): Command {
  return createCommandFromSchema(CommandNames.INSTALL).action(async () => {
    const extensionPath = getExtensionPath();

    if (!extensionPath) {
      console.log('');
      console.log(chalk.red('✗ Chrome extension not found'));
      console.log('');
      console.log('The extension should be bundled with the CLI package.');
      console.log('');
      process.exit(1);
    }

    console.log('');
    console.log(chalk.bold('Extension Installation Path'));
    console.log('');
    console.log(chalk.green(extensionPath));
    console.log('');
    console.log('─────────────────────────────────────────────────────────────────────');
    console.log('');
    console.log(chalk.bold('Installation Instructions:'));
    console.log('');
    console.log(`1. Open Chrome and navigate to: ${chalk.cyan('chrome://extensions/')}`);
    console.log(`2. Enable ${chalk.bold('"Developer mode"')} (top right corner)`);
    console.log(`3. Click ${chalk.bold('"Load unpacked"')} and select the folder above`);
    console.log('');
  });
}
