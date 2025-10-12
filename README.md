<div align="center">
<a href="https://www.google.com/chrome/" target="_blank" rel="noopener noreferrer">
  <img width="64" src="https://raw.githubusercontent.com/alrra/browser-logos/main/src/chrome/chrome.svg" alt="Chrome logo">
</a>
<h2>Chrome CLI</h2>
<p>A CLI tool for controlling Chrome from the terminal</p>
<p>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <br>
  <a href="#rocket-quick-start">Quick Start</a> • <a href="#bulb-usage">Usage</a> • <a href="#package-installation">Installation</a> • <a href="#gear-how-it-works">How It Works</a>
</p>

</div>

## Overview

Control Chrome from the command line: list tabs, execute JavaScript, monitor network, capture screenshots, automate forms. Perfect for integrating with LLMs like [Claude Code](https://www.anthropic.com/claude-code).

**Key features:**
- Tab management
- JavaScript execution
- Console logs
- Network monitoring
- HTML extraction
- Screenshots
- Storage inspection
- Form automation
- Shell completion

## :rocket: Quick Start

```bash
# 1. Install CLI (includes bundled Chrome extension)
npm install -g chrome-cmd

# 2. Run interactive installation
chrome-cmd extension install
# This will guide you through:
#  - Loading the extension in Chrome
#  - Entering the extension ID
#  - Configuring native messaging

# 3. Test
chrome-cmd tabs list
```

## :bulb: Usage

All commands use the **selected tab** by default. Override with `--tab <index>` flag.

<details>
<summary><b>Tab Management</b></summary>

<!-- BEGIN:TAB_MANAGEMENT -->
```bash
# List all open Chrome tabs
npm run dev -- tabs list

# Select tab for subsequent commands
npm run dev -- tabs select 1

# Focus/activate a tab (bring to front)
npm run dev -- tabs focus
npm run dev -- tabs focus --tab 3

# Create a new tab
npm run dev -- tabs create https://google.com
npm run dev -- tabs create https://google.com --background
npm run dev -- tabs create

# Navigate tab to a specific URL
npm run dev -- tabs navigate https://github.com
npm run dev -- tabs navigate https://github.com --tab 2

# Execute JavaScript in selected tab
npm run dev -- tabs exec "document.title"
npm run dev -- tabs exec "document.images.length"
npm run dev -- tabs exec "Array.from(document.querySelectorAll('a')).map(a => a.href)"
npm run dev -- tabs exec "2 + 2"

# Close selected tab
npm run dev -- tabs close

# Reload/refresh selected tab
npm run dev -- tabs refresh

# Capture screenshot of selected tab
npm run dev -- tabs screenshot
npm run dev -- tabs screenshot --output ~/Downloads/page.png
npm run dev -- tabs screenshot --tab 2

# Extract HTML content from selected tab
npm run dev -- tabs html
npm run dev -- tabs html --selector "div.content"
npm run dev -- tabs html --raw
npm run dev -- tabs html --full

# Get console logs from selected tab
npm run dev -- tabs logs
npm run dev -- tabs logs -n 100
npm run dev -- tabs logs --error
npm run dev -- tabs logs --warn
npm run dev -- tabs logs --info --log --debug
npm run dev -- tabs logs --error --warn

# Get network requests from selected tab
npm run dev -- tabs requests
npm run dev -- tabs requests -n 100
npm run dev -- tabs requests --method GET
npm run dev -- tabs requests --method POST
npm run dev -- tabs requests --status 200
npm run dev -- tabs requests --status 404
npm run dev -- tabs requests --url "/api"
npm run dev -- tabs requests --url "google.com"
npm run dev -- tabs requests --all
npm run dev -- tabs requests --failed
npm run dev -- tabs requests --body
npm run dev -- tabs requests --headers
npm run dev -- tabs requests --method POST --status 200 --url "/api"

# Get storage data from selected tab
npm run dev -- tabs storage
npm run dev -- tabs storage --cookies
npm run dev -- tabs storage --local
npm run dev -- tabs storage --session

# Click on an element in selected tab
npm run dev -- tabs click --selector "button.submit"
npm run dev -- tabs click --text "Sign In"

# Fill an input field in selected tab
npm run dev -- tabs input --selector "#username" --value "myuser"
npm run dev -- tabs input --selector "#search" --value "query" --submit

```

<!-- END:TAB_MANAGEMENT -->

</details>

<details>
<summary><b>JavaScript Execution</b></summary>

<!-- BEGIN:JAVASCRIPT -->
```bash
# Execute JavaScript on selected tab
npm run dev -- tabs exec "document.title"
# Output: "GitHub - Chrome CLI"

# More examples
npm run dev -- tabs exec "document.images.length"
npm run dev -- tabs exec "Array.from(document.querySelectorAll('a')).map(a => a.href)"
npm run dev -- tabs exec "2 + 2"
```

<!-- END:JAVASCRIPT -->

</details>

<details>
<summary><b>Console Logs</b></summary>

<!-- BEGIN:LOGS -->
```bash
npm run dev -- tabs logs
npm run dev -- tabs logs -n 100
npm run dev -- tabs logs --error
npm run dev -- tabs logs --warn
npm run dev -- tabs logs --info --log --debug
npm run dev -- tabs logs --error --warn
```

**Features:** Color-coded output, smart object formatting, type filtering, adjustable limit

<!-- END:LOGS -->

</details>

<details>
<summary><b>Network Requests</b></summary>

<!-- BEGIN:REQUESTS -->
```bash
npm run dev -- tabs requests
npm run dev -- tabs requests -n 100
npm run dev -- tabs requests --method GET
npm run dev -- tabs requests --method POST
npm run dev -- tabs requests --status 200
npm run dev -- tabs requests --status 404
npm run dev -- tabs requests --url "/api"
npm run dev -- tabs requests --url "google.com"
npm run dev -- tabs requests --all
npm run dev -- tabs requests --failed
npm run dev -- tabs requests --body
npm run dev -- tabs requests --headers
npm run dev -- tabs requests --method POST --status 200 --url "/api"
```

**Captured data:** URL, method, status, headers, payload, response body, timing, type, errors

<!-- END:REQUESTS -->

</details>

<details>
<summary><b>HTML Extraction</b></summary>

<!-- BEGIN:HTML -->
```bash
npm run dev -- tabs html
npm run dev -- tabs html --selector "div.content"
npm run dev -- tabs html --raw
npm run dev -- tabs html --full
```

**Features:** Pretty printing, CSS selectors, token optimization, raw mode

<!-- END:HTML -->

</details>

<details>
<summary><b>Screenshots</b></summary>

<!-- BEGIN:SCREENSHOTS -->
```bash
npm run dev -- tabs screenshot
npm run dev -- tabs screenshot --output ~/Downloads/page.png
npm run dev -- tabs screenshot --tab 2
```

<!-- END:SCREENSHOTS -->

</details>

<details>
<summary><b>Storage Inspection</b></summary>

<!-- BEGIN:STORAGE -->
```bash
npm run dev -- tabs storage
npm run dev -- tabs storage --cookies
npm run dev -- tabs storage --local
npm run dev -- tabs storage --session
```

**Data includes:** Cookie flags, expiry, size, key-value pairs

<!-- END:STORAGE -->

</details>

<details>
<summary><b>Form Automation</b></summary>

<!-- BEGIN:FORM_AUTOMATION -->
```bash
npm run dev -- tabs click --selector "button.submit"
npm run dev -- tabs click --text "Sign In"
```

```bash
npm run dev -- tabs input --selector "#username" --value "myuser"
npm run dev -- tabs input --selector "#search" --value "query" --submit
```

<!-- END:FORM_AUTOMATION -->

</details>

<details>
<summary><b>System Commands</b></summary>

<!-- BEGIN:SYSTEM_COMMANDS -->
```bash
# Update to latest version
npm run dev -- update

# Shell completion (bash/zsh)
npm run dev -- completion install

npm run dev -- completion uninstall

# Extension management
npm run dev -- extension install    # Install Chrome extension (interactive setup)
npm run dev -- extension uninstall  # Uninstall Chrome extension and remove configuration
npm run dev -- extension reload     # Reload the Chrome extension

# Mediator server management
npm run dev -- mediator status
npm run dev -- mediator kill
npm run dev -- mediator restart
```

<!-- END:SYSTEM_COMMANDS -->

</details>

<details>
<summary><b>Command History</b></summary>

Click the Chrome CLI extension icon in your browser toolbar to view recent commands, execution times, and results.

</details>

## :package: Installation

**Prerequisites:** Node.js 18+, Google Chrome, Linux/macOS/Windows

<details>
<summary><b>Installation steps</b></summary>

**1. Install CLI globally (includes bundled Chrome extension)**

```bash
npm install -g chrome-cmd
```

**2. Run interactive installation**

```bash
chrome-cmd extension install
```

This interactive command will guide you through the complete setup:

1. **Shows the extension path** - Exact location of the bundled Chrome extension
2. **Prompts for extension ID** - After you load the extension in Chrome
3. **Configures native messaging** - Automatically sets up the host connection
4. **Validates everything** - Ensures the extension ID format is correct

The command will:
- Display the extension path for loading in Chrome
- Wait for you to enter the extension ID
- Save the extension ID to config
- Install the native messaging host
- Provide next steps for testing

**3. Test**

```bash
chrome-cmd tabs list
```

**Extension Management Commands:**

```bash
chrome-cmd extension reload     # Reload extension in Chrome
chrome-cmd extension install    # Interactive installation (recommended)
chrome-cmd extension uninstall  # Remove extension config and native host
```

</details>

<details>
<summary><b>Development setup</b></summary>

For local development:

```bash
# Clone repository
git clone https://github.com/lucasvtiradentes/chrome-cmd.git
cd chrome-cmd

# Build CLI
cd packages/cli
npm install
npm run build

# Use with npm run dev
npm run dev -- tabs list
```

Load extension from `packages/chrome-extension/` directory.

</details>

## :gear: How It Works

```
CLI (terminal)
    ↓ HTTP
Mediator Server (localhost:8765)
    ↓ Native Messaging (stdio)
Chrome Extension (Service Worker)
    ↓ chrome.debugger API
Chrome Tabs
```

**Required permissions:**

- `debugger` - Execute JavaScript in tabs
- `scripting` - Inject code in pages
- `tabs` - List and manage tabs
- `storage` - Track command history

**⚠️ Not suitable for Chrome Web Store distribution** (requires debugger permission)

**Inspired by:**

- [BroTab](https://github.com/balta2ar/brotab) - Original Python implementation

**License:** MIT

---

<div align="center">
Made for developers who love the terminal
</div>
