import chalk from 'chalk';
import { APP_NAME } from '../../shared/constants.js';

export function displayHelp(): void {
  console.log(`
${chalk.bold('Chrome CLI')}

${chalk.bold('USAGE')}
  ${chalk.cyan(`$ ${APP_NAME}`)} ${chalk.yellow('<command>')} ${chalk.gray('[options]')}

${chalk.bold('COMMANDS')}
  ${chalk.yellow('tabs')}
    list                    List all open Chrome tabs
    select <index>          Select tab for subsequent commands
    focus [--tab]           Focus/activate a tab
    create [url] [opts]     Create a new tab
      --background            Open in background
    navigate <url> [--tab]  Navigate tab to a specific URL
    exec <code> [--tab]     Execute JavaScript in selected tab
    close [--tab]           Close selected tab
    refresh [--tab]         Reload selected tab
    screenshot [opts]       Capture screenshot of selected tab
      --tab <index>           Override selected tab
      --output <path>         Output file path
    html [options]          Extract HTML content from selected tab
      --tab <index>           Override selected tab
      --selector <selector>   CSS selector
      --raw                   Output raw HTML
      --full                  Include SVG and style tags
    logs [options]          Get console logs from selected tab
      --tab <index>           Override selected tab
      -n <count>              Show only last N logs
      --log                   Show only log messages
      --info                  Show only info messages
      --warn                  Show only warning messages
      --error                 Show only error messages
      --debug                 Show only debug messages
    requests [opts]         Get network requests from selected tab
      --tab <index>           Override selected tab
      -n <count>              Show only last N requests
      --method <method>       Filter by HTTP method
      --status <code>         Filter by status code
      --url <pattern>         Filter by URL pattern
      --failed                Show only failed requests
      --all                   Show all request types
      --body                  Include response bodies
      --headers               Include request and response headers
    storage [options]       Get storage data from selected tab
      --tab <index>           Override selected tab
      --cookies               Show only cookies
      --local                 Show only localStorage
      --session               Show only sessionStorage
    click [options]         Click on an element in selected tab
      --tab <index>           Override selected tab
      --selector <selector>   CSS selector of element
      --text <text>           Find element by text content
    input [options]         Fill an input field in selected tab
      --tab <index>           Override selected tab
      --selector <selector>   CSS selector of input element
      --value <value>         Value to fill
      --submit                Press Enter after filling

  ${chalk.yellow('extension')} (alias: ${chalk.gray('ext')})
    install                 Install Chrome extension
    uninstall               Uninstall Chrome extension
    reload                  Reload the Chrome extension

  ${chalk.yellow('mediator')}
    status                  Check mediator server status
    kill                    Kill mediator server process
    restart                 Restart mediator server

  ${chalk.yellow('update')}                    Update ${APP_NAME} to latest version
  ${chalk.yellow('completion')}
    install                 Install shell completion

${chalk.bold('EXAMPLES')}
  ${chalk.cyan(`$ ${APP_NAME} tabs list`)}

  ${chalk.cyan(`$ ${APP_NAME} tabs select 1`)}
  ${chalk.cyan(`$ ${APP_NAME} tabs exec "document.title"`)}
  ${chalk.cyan(`$ ${APP_NAME} tabs logs --error`)}
  ${chalk.cyan(`$ ${APP_NAME} tabs refresh`)}

  ${chalk.cyan(`$ ${APP_NAME} tabs create https://google.com`)}
  ${chalk.cyan(`$ ${APP_NAME} tabs create https://google.com --background`)}
  ${chalk.cyan(`$ ${APP_NAME} tabs navigate https://github.com`)}
  ${chalk.cyan(`$ ${APP_NAME} tabs focus --tab 2`)}

  ${chalk.cyan(`$ ${APP_NAME} tabs screenshot`)}
  ${chalk.cyan(`$ ${APP_NAME} tabs screenshot --output ~/Downloads/page.png`)}
  ${chalk.cyan(`$ ${APP_NAME} tabs html`)}
  ${chalk.cyan(`$ ${APP_NAME} tabs html --selector "div.content" --raw`)}

  ${chalk.cyan(`$ ${APP_NAME} tabs logs`)}
  ${chalk.cyan(`$ ${APP_NAME} tabs logs -n 100`)}
  ${chalk.cyan(`$ ${APP_NAME} tabs logs --error`)}
  ${chalk.cyan(`$ ${APP_NAME} tabs logs --warn`)}

  ${chalk.cyan(`$ ${APP_NAME} tabs requests`)}
  ${chalk.cyan(`$ ${APP_NAME} tabs requests --all`)}
  ${chalk.cyan(`$ ${APP_NAME} tabs requests --method POST`)}
  ${chalk.cyan(`$ ${APP_NAME} tabs requests --status 404`)}
  ${chalk.cyan(`$ ${APP_NAME} tabs requests --url "/api"`)}
  ${chalk.cyan(`$ ${APP_NAME} tabs requests --body`)}
  ${chalk.cyan(`$ ${APP_NAME} tabs requests --headers`)}

  ${chalk.cyan(`$ ${APP_NAME} tabs storage`)}
  ${chalk.cyan(`$ ${APP_NAME} tabs storage --cookies`)}
  ${chalk.cyan(`$ ${APP_NAME} tabs storage --local`)}

  ${chalk.cyan(`$ ${APP_NAME} tabs click --selector "button.submit"`)}
  ${chalk.cyan(`$ ${APP_NAME} tabs click --text "Sign In"`)}
  ${chalk.cyan(`$ ${APP_NAME} tabs input --selector "#search" --value "query" --submit`)}

  ${chalk.cyan(`$ ${APP_NAME} mediator status`)}
  ${chalk.cyan(`$ ${APP_NAME} mediator kill`)}

  ${chalk.cyan(`$ ${APP_NAME} extension install`)}
  ${chalk.cyan(`$ ${APP_NAME} extension uninstall`)}
  ${chalk.cyan(`$ ${APP_NAME} extension reload`)}

${chalk.bold('GETTING STARTED')}
  ${chalk.cyan(`${APP_NAME} extension install`)}

  1. Open Chrome and go to ${chalk.cyan('chrome://extensions/')}
  2. Enable ${chalk.bold('"Developer mode"')}
  3. Click ${chalk.bold('"Load unpacked"')} and select the extension folder
  4. Run ${chalk.cyan(`${APP_NAME} extension install`)}
  5. Test with ${chalk.cyan(`${APP_NAME} tabs list`)}

${chalk.bold('NEED HELP?')}
  Run ${chalk.cyan(`${APP_NAME} --help`)} or ${chalk.cyan(`${APP_NAME} <command> --help`)}
  `);
}
