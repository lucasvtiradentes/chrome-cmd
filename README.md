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

**Key features:** Tab management • JavaScript execution • Console logs • Network monitoring • HTML extraction • Screenshots • Storage inspection • Form automation • Shell completion

## :rocket: Quick Start

```bash
# 1. Install CLI (includes bundled Chrome extension)
npm install -g chrome-cmd
# The extension path will be displayed after installation

# 2. Setup Native Messaging
chrome-cmd host install
# This will show the extension path and prompt for Extension ID

# 3. Load extension at chrome://extensions/ (enable Developer mode)
# Use the path shown in the previous step

# 4. Test
chrome-cmd tabs list
```

## :bulb: Usage

All commands use the **selected tab** by default. Override with `--tab <index>` flag.

<details>
<summary><b>Tab Management</b></summary>

```bash
# List all tabs
chrome-cmd tabs list

# Select a tab (recommended - all commands use selected tab)
chrome-cmd tabs select 1

# Focus/activate tab (bring to front)
chrome-cmd tabs focus
chrome-cmd tabs focus --tab 3

# Create new tab
chrome-cmd tabs create https://google.com
chrome-cmd tabs create https://google.com --background  # Don't focus
chrome-cmd tabs create                                  # Blank tab

# Navigate to URL
chrome-cmd tabs navigate https://github.com
chrome-cmd tabs navigate https://github.com --tab 2

# Refresh tab
chrome-cmd tabs refresh

# Close tab
chrome-cmd tabs close
```

</details>

<details>
<summary><b>JavaScript Execution</b></summary>

```bash
# Execute JavaScript on selected tab
chrome-cmd tabs exec "document.title"
# Output: "GitHub - Chrome CLI"

# More examples
chrome-cmd tabs exec "document.images.length"
chrome-cmd tabs exec "Array.from(document.querySelectorAll('a')).map(a => a.href)"
chrome-cmd tabs exec "2 + 2"
```

</details>

<details>
<summary><b>Console Logs</b></summary>

```bash
# Get logs (last 50 by default)
chrome-cmd tabs logs
chrome-cmd tabs logs -n 100

# Filter by type
chrome-cmd tabs logs --error
chrome-cmd tabs logs --warn
chrome-cmd tabs logs --info --log --debug

# Combine filters
chrome-cmd tabs logs --error --warn
```

**Features:** Color-coded output, smart object formatting, type filtering, adjustable limit

</details>

<details>
<summary><b>Network Requests</b></summary>

```bash
# Get requests (last 50, XHR/Fetch only)
chrome-cmd tabs requests
chrome-cmd tabs requests -n 100

# Filter by method
chrome-cmd tabs requests --method GET
chrome-cmd tabs requests --method POST

# Filter by status
chrome-cmd tabs requests --status 200
chrome-cmd tabs requests --status 404

# Include all types or failed requests
chrome-cmd tabs requests --all
chrome-cmd tabs requests --failed

# Include response bodies
chrome-cmd tabs requests --body

# Combine filters
chrome-cmd tabs requests --method POST --status 200
```

**Captured data:** URL, method, status, headers, payload, response body, timing, type, errors

</details>

<details>
<summary><b>HTML Extraction</b></summary>

```bash
# Extract HTML (pretty-printed by default)
chrome-cmd tabs html

# Extract specific element
chrome-cmd tabs html --selector "div.content"

# Raw HTML (no formatting)
chrome-cmd tabs html --raw

# Include SVG and style tags (hidden by default)
chrome-cmd tabs html --full
```

**Features:** Pretty printing, CSS selectors, token optimization, raw mode

</details>

<details>
<summary><b>Screenshots</b></summary>

```bash
# Screenshot selected tab (PNG format)
chrome-cmd tabs screenshot

# Custom output path
chrome-cmd tabs screenshot --output ~/Downloads/page.png

# Screenshot specific tab
chrome-cmd tabs screenshot --tab 2
```

</details>

<details>
<summary><b>Storage Inspection</b></summary>

```bash
# Get all storage (cookies, localStorage, sessionStorage)
chrome-cmd tabs storage

# Get specific storage type
chrome-cmd tabs storage --cookies
chrome-cmd tabs storage --local
chrome-cmd tabs storage --session
```

**Data includes:** Cookie flags, expiry, size, key-value pairs

</details>

<details>
<summary><b>Form Automation</b></summary>

```bash
# Click elements
chrome-cmd tabs click --selector "button.submit"
chrome-cmd tabs click --text "Sign In"

# Fill input fields
chrome-cmd tabs input --selector "#username" --value "myuser"
chrome-cmd tabs input --selector "#search" --value "query" --submit
```

</details>

<details>
<summary><b>System Commands</b></summary>

```bash
# Update to latest version
chrome-cmd update

# Shell completion (bash/zsh)
chrome-cmd completion install

# Mediator server management
chrome-cmd mediator status
chrome-cmd mediator kill
chrome-cmd mediator restart

# Native messaging host
chrome-cmd host install
chrome-cmd host uninstall
```

</details>

<details>
<summary><b>Command History</b></summary>

Click the Chrome CLI extension icon in your browser toolbar to view recent commands, execution times, and results.

</details>

## :package: Installation

**Prerequisites:** Node.js 18+, Google Chrome, Linux/macOS/WSL

<details>
<summary><b>Installation steps</b></summary>

**1. Install CLI globally (includes bundled Chrome extension)**

```bash
npm install -g chrome-cmd
```

After installation, the Chrome extension path will be displayed automatically.

**2. Setup Native Messaging**

```bash
chrome-cmd host install
```

This command will:
- Display the Chrome extension path (bundled with the CLI)
- Prompt for the Extension ID
- Create the native messaging manifest

The manifest is created at:
- Linux: `~/.config/google-chrome/NativeMessagingHosts/com.chrome_cli.native.json`
- macOS: `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.chrome_cli.native.json`

**3. Load Chrome Extension**

- Open `chrome://extensions/`
- Enable **Developer mode** (top-right toggle)
- Click **Load unpacked** → Select the extension path shown in step 2
- **Copy the Extension ID** (e.g., `gepjnibmadcdhppipakehfcnobiaenhi`)
- Run `chrome-cmd host install` again and paste the Extension ID

**Note:** The extension is bundled with the CLI package, so there's no need to download it separately.

**4. Reload Extension**

- Go to `chrome://extensions/`
- Click reload icon on Chrome CLI extension
- Check Service Worker logs for: `[Background] Connected to mediator`

**5. Test**

```bash
chrome-cmd tabs list
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
- [chrome-cmd](https://github.com/prasmussen/chrome-cmd) - macOS alternative

**License:** MIT

---

<div align="center">
Made for developers who love the terminal
</div>
