import chalk from 'chalk';

export function displayHelp(): void {
  console.log(`
${chalk.bold('Chrome CLI')} - Control Chrome from the command line

${chalk.bold('USAGE')}
  ${chalk.cyan('$ chrome-cmd')} ${chalk.yellow('<command>')} ${chalk.gray('[options]')}

${chalk.bold('EXAMPLES')}
  ${chalk.gray('# List all open tabs')}
  ${chalk.cyan('$ chrome-cmd tabs list')}

  ${chalk.gray('# Execute JavaScript in a tab')}
  ${chalk.cyan('$ chrome-cmd tabs exec 123 "document.title"')}

${chalk.bold('GETTING STARTED')}
  1. Install the Chrome extension from packages/chrome-extension
  2. Load it in Chrome at chrome://extensions/
  3. Run commands from this CLI

${chalk.bold('NEED HELP?')}
  Run ${chalk.cyan('chrome-cmd --help')} for more information
  `);
}
