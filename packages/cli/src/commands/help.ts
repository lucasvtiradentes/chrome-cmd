import chalk from 'chalk';

export function displayHelp(): void {
  console.log(`
${chalk.bold('Chrome CLI')} - Control Chrome from the command line

${chalk.bold('USAGE')}
  ${chalk.cyan('$ chrome-cmd')} ${chalk.yellow('<command>')} ${chalk.gray('[options]')}

${chalk.bold('COMMANDS')}
  ${chalk.yellow('tabs')}
    list                    List all open Chrome tabs
    exec <id> <code>        Execute JavaScript in a specific tab
    close <id>              Close a specific tab
    refresh <id>            Reload/refresh a specific tab
    logs <id> [options]     Get console logs from a specific tab
      -n <count>              Show only last N logs (default: 50)
      --log                   Show only log messages
      --info                  Show only info messages
      --warn                  Show only warning messages
      --error                 Show only error messages
      --debug                 Show only debug messages

  ${chalk.yellow('host')}
    install                 Install Native Messaging Host
    uninstall               Uninstall Native Messaging Host

  ${chalk.yellow('mediator')}
    status                  Check mediator server status
    kill                    Kill mediator server process
    restart                 Restart mediator server

  ${chalk.yellow('update')}                    Update chrome-cmd to latest version
  ${chalk.yellow('completion')}
    install                 Install shell completion

${chalk.bold('EXAMPLES')}
  ${chalk.gray('# List all open tabs')}
  ${chalk.cyan('$ chrome-cmd tabs list')}

  ${chalk.gray('# Execute JavaScript using tab index (1-9) or tab ID')}
  ${chalk.cyan('$ chrome-cmd tabs exec 1 "document.title"')}
  ${chalk.cyan('$ chrome-cmd tabs exec 1850982197 "console.log(\'hello\')"')}

  ${chalk.gray('# Get console logs from a tab')}
  ${chalk.cyan('$ chrome-cmd tabs logs 2')}
  ${chalk.cyan('$ chrome-cmd tabs logs 2 -n 100')}     ${chalk.gray('# Show last 100 logs')}
  ${chalk.cyan('$ chrome-cmd tabs logs 2 --error')}    ${chalk.gray('# Show only errors')}
  ${chalk.cyan('$ chrome-cmd tabs logs 2 --warn')}     ${chalk.gray('# Show only warnings')}

  ${chalk.gray('# Close or refresh tabs')}
  ${chalk.cyan('$ chrome-cmd tabs close 1')}
  ${chalk.cyan('$ chrome-cmd tabs refresh 2')}

  ${chalk.gray('# Manage mediator server')}
  ${chalk.cyan('$ chrome-cmd mediator status')}
  ${chalk.cyan('$ chrome-cmd mediator kill')}

${chalk.bold('GETTING STARTED')}
  1. Install the Chrome extension from packages/chrome-extension
  2. Load it in Chrome at chrome://extensions/
  3. Run ${chalk.cyan('chrome-cmd host install')} and provide your extension ID
  4. Reload the extension
  5. Run ${chalk.cyan('chrome-cmd tabs list')} to test

${chalk.bold('NEED HELP?')}
  Run ${chalk.cyan('chrome-cmd --help')} or ${chalk.cyan('chrome-cmd <command> --help')} for more information
  `);
}
