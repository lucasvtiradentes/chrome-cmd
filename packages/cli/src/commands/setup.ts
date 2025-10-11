import path from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function displaySetup(): void {
  // Find extension path - it's bundled with the CLI
  // When installed globally: /usr/lib/node_modules/chrome-cmd/chrome-extension
  // When running locally: packages/cli/dist/chrome-extension (doesn't exist in dist)
  // The extension is at the root of the package
  const extensionPath = path.resolve(__dirname, '..', '..', 'chrome-extension');

  console.log('');
  console.log(chalk.bold.cyan('╔════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║                                                                    ║'));
  console.log(
    chalk.bold.cyan('║') +
      '  ' +
      chalk.bold.green('Chrome CMD - Setup Instructions') +
      '                              ' +
      chalk.bold.cyan('║')
  );
  console.log(chalk.bold.cyan('║                                                                    ║'));
  console.log(chalk.bold.cyan('╚════════════════════════════════════════════════════════════════════╝'));
  console.log('');

  console.log(chalk.bold.yellow('⚠  Setup Required'));
  console.log('');
  console.log('Follow these steps to complete the Chrome CMD setup:');
  console.log('');

  console.log(`${chalk.bold.cyan('Step 1:')} Open Chrome and navigate to:`);
  console.log(`         ${chalk.bold('chrome://extensions/')}`);
  console.log('');

  console.log(`${chalk.bold.cyan('Step 2:')} Enable ${chalk.bold('"Developer mode"')} (top right corner)`);
  console.log('');

  console.log(`${chalk.bold.cyan('Step 3:')} Click ${chalk.bold('"Load unpacked"')} and select this folder:`);
  console.log('');
  console.log(`         ${chalk.bold.green(extensionPath)}`);
  console.log('');

  console.log(
    `${chalk.bold.cyan('Step 4:')} Copy the ${chalk.bold('Extension ID')} (looks like: abcdefghijklmnopqrstuvwxyz123456)`
  );
  console.log('');

  console.log(`${chalk.bold.cyan('Step 5:')} Run the host install command:`);
  console.log(`         ${chalk.bold('chrome-cmd host install')}`);
  console.log('         (Paste the Extension ID when prompted)');
  console.log('');

  console.log(`${chalk.bold.cyan('Step 6:')} Reload the extension in Chrome`);
  console.log('         (Click the reload icon on the extension card)');
  console.log('');

  console.log(`${chalk.bold.cyan('Step 7:')} Test the connection:`);
  console.log(`         ${chalk.bold('chrome-cmd tabs list')}`);
  console.log('');

  console.log('─────────────────────────────────────────────────────────────────────');
  console.log('');
  console.log(chalk.bold('Troubleshooting:'));
  console.log('');
  console.log('• Extension not working? Check the Service Worker console for errors');
  console.log('• Connection failed? Make sure the extension is reloaded after host install');
  console.log(`• Still stuck? Run ${chalk.cyan('chrome-cmd mediator status')} to check the server`);
  console.log('');
  console.log(chalk.dim('For more help, visit: https://github.com/lucasvtiradentes/chrome-cmd'));
  console.log('');
}
