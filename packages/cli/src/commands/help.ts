import chalk from 'chalk';

export function displayHelp(): void {
  console.log(`
${chalk.bold('Chrome CLI')} - Control Chrome from the command line

${chalk.bold('USAGE')}
  ${chalk.cyan('$ chrome-cmd')} ${chalk.yellow('<command>')} ${chalk.gray('[options]')}

${chalk.bold('COMMANDS')}
  ${chalk.yellow('tabs')}
    list                    List all open Chrome tabs
    select <index>          Select tab for subsequent commands
    focus [--tab]           Focus/activate a tab (bring to front)
    create [url] [opts]     Create a new tab
      --background            Open in background (not focused)
    navigate <url> [--tab]  Navigate tab to a specific URL
    exec <code> [--tab]     Execute JavaScript in selected tab (or use --tab)
    close [--tab]           Close selected tab (or use --tab)
    refresh [--tab]         Reload/refresh selected tab (or use --tab)
    screenshot [opts]       Capture screenshot of selected tab (PNG format)
      --tab <index>           Override selected tab
      --output <path>         Output file path
    html [options]          Extract HTML content from selected tab
      --tab <index>           Override selected tab
      --selector <selector>   CSS selector (default: "body")
      --raw                   Output raw HTML (no formatting)
      --full                  Include SVG and style tags
    logs [options]          Get console logs from selected tab
      --tab <index>           Override selected tab
      -n <count>              Show only last N logs (default: 50)
      --log                   Show only log messages
      --info                  Show only info messages
      --warn                  Show only warning messages
      --error                 Show only error messages
      --debug                 Show only debug messages
    requests [opts]         Get network requests from selected tab (XHR/Fetch by default)
      --tab <index>           Override selected tab
      -n <count>              Show only last N requests (default: 50)
      --method <method>       Filter by HTTP method (GET, POST, etc.)
      --status <code>         Filter by status code (200, 404, etc.)
      --failed                Show only failed requests
      --all                   Show all request types (not just XHR/Fetch)
      --body                  Include response bodies
    storage [options]       Get storage data from selected tab
      --tab <index>           Override selected tab
      --cookies               Show only cookies
      --local                 Show only localStorage
      --session               Show only sessionStorage
    click [options]         Click on an element in selected tab
      --tab <index>           Override selected tab
      --selector <selector>   CSS selector of element to click
      --text <text>           Find element by text content
    input [options]         Fill an input field in selected tab
      --tab <index>           Override selected tab
      --selector <selector>   CSS selector of input element (required)
      --value <value>         Value to fill (required)
      --submit                Press Enter after filling

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

  ${chalk.gray('# Select tab (recommended workflow)')}
  ${chalk.cyan('$ chrome-cmd tabs select 1')}           ${chalk.gray('# Select tab 1')}
  ${chalk.cyan('$ chrome-cmd tabs exec "document.title"')}   ${chalk.gray('# Execute on selected tab')}
  ${chalk.cyan('$ chrome-cmd tabs logs --error')}       ${chalk.gray('# Get logs from selected tab')}
  ${chalk.cyan('$ chrome-cmd tabs refresh')}            ${chalk.gray('# Refresh selected tab')}

  ${chalk.gray('# Create and manage tabs')}
  ${chalk.cyan('$ chrome-cmd tabs create https://google.com')}           ${chalk.gray('# Create tab with URL')}
  ${chalk.cyan('$ chrome-cmd tabs create https://google.com --background')} ${chalk.gray('# Create in background')}
  ${chalk.cyan('$ chrome-cmd tabs navigate https://github.com')}        ${chalk.gray('# Navigate selected tab')}
  ${chalk.cyan('$ chrome-cmd tabs focus --tab 2')}                      ${chalk.gray('# Focus tab 2')}

  ${chalk.gray('# Capture and extract content')}
  ${chalk.cyan('$ chrome-cmd tabs screenshot')}                         ${chalk.gray('# Screenshot selected tab (PNG)')}
  ${chalk.cyan('$ chrome-cmd tabs screenshot --output ~/Downloads/page.png')} ${chalk.gray('# Custom path')}
  ${chalk.cyan('$ chrome-cmd tabs html')}                               ${chalk.gray('# Extract HTML (pretty)')}
  ${chalk.cyan('$ chrome-cmd tabs html --selector "div.content" --raw')} ${chalk.gray('# Extract specific element')}

  ${chalk.gray('# Get console logs from selected tab')}
  ${chalk.cyan('$ chrome-cmd tabs logs')}
  ${chalk.cyan('$ chrome-cmd tabs logs -n 100')}        ${chalk.gray('# Show last 100 logs')}
  ${chalk.cyan('$ chrome-cmd tabs logs --error')}       ${chalk.gray('# Show only errors')}
  ${chalk.cyan('$ chrome-cmd tabs logs --warn')}        ${chalk.gray('# Show only warnings')}

  ${chalk.gray('# Get network requests from selected tab')}
  ${chalk.cyan('$ chrome-cmd tabs requests')}                  ${chalk.gray('# Show XHR/Fetch only (default)')}
  ${chalk.cyan('$ chrome-cmd tabs requests --all')}            ${chalk.gray('# Show all request types')}
  ${chalk.cyan('$ chrome-cmd tabs requests --method POST')}    ${chalk.gray('# Only POST requests')}
  ${chalk.cyan('$ chrome-cmd tabs requests --status 404')}     ${chalk.gray('# Only 404 errors')}
  ${chalk.cyan('$ chrome-cmd tabs requests --body')}           ${chalk.gray('# Include response bodies')}

  ${chalk.gray('# Get storage data')}
  ${chalk.cyan('$ chrome-cmd tabs storage')}            ${chalk.gray('# All storage (cookies, localStorage, sessionStorage)')}
  ${chalk.cyan('$ chrome-cmd tabs storage --cookies')}  ${chalk.gray('# Only cookies')}
  ${chalk.cyan('$ chrome-cmd tabs storage --local')}    ${chalk.gray('# Only localStorage')}

  ${chalk.gray('# Automate interactions')}
  ${chalk.cyan('$ chrome-cmd tabs click --selector "button.submit"')}   ${chalk.gray('# Click by selector')}
  ${chalk.cyan('$ chrome-cmd tabs click --text "Sign In"')}             ${chalk.gray('# Click by text')}
  ${chalk.cyan('$ chrome-cmd tabs input --selector "#search" --value "query" --submit')}

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
