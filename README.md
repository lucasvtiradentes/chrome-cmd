<div align="center">
<a href="https://www.google.com/chrome/" target="_blank" rel="noopener noreferrer">
  <img width="64" src="https://raw.githubusercontent.com/alrra/browser-logos/main/src/chrome/chrome.svg" alt="Chrome logo">
</a>
<h2>Chrome CLI</h2>
<p>
  <a href="#rocket-quick-start">Quick Start</a> • <a href="#bulb-usage">Usage</a> • <a href="#package-additional-information">Additional Information</a> • <a href="#star-inspiration">Inspiration</a>
</p>
</div>

## Overview

Control Chrome from the command line: list tabs, execute JavaScript, monitor network, capture screenshots, automate forms.

<div align="center">
  <img width="80%" src="https://raw.githubusercontent.com/lucasvtiradentes/chrome-cmd/main/.github/images/demo.webp">
</div>

## :sparkles: Features

✔️ **Tab control** - list, create, close, focus, and navigate tabs from terminal
✔️ **JavaScript execution** - run code in any tab and get instant results
✔️ **Network inspection** - capture HTTP requests with headers, payloads, and response bodies
✔️ **Console monitoring** - view color-coded logs with smart formatting and type filtering
✔️ **Screenshots** - capture full-page or viewport screenshots with single command
✔️ **Form automation** - click elements and fill input fields programmatically
✔️ **Storage inspection** - view cookies, localStorage, and sessionStorage data
✔️ **Multi-profile support** - manage multiple Chrome profiles with seamless switching

## :rocket: Quick Start

```bash
# 1. Install
npm install -g chrome-cmd

# 2. Run setup command
chrome-cmd extension
# → Shows extension path
# → Waits for you to load it in Chrome

# 3. Load extension in Chrome
# → Open chrome://extensions/
# → Enable "Developer mode"
# → Click "Load unpacked" and select the path shown above
# → Copy the Extension ID

# 4. Paste Extension ID in terminal
# → The terminal is waiting for the ID
# → Paste and press Enter

# 5. Done!
chrome-cmd tabs list
```

## :bulb: Usage

All commands use the **selected tab** by default. Override with `--tab <index>` flag.

<details>
<summary><b>Tab Management</b></summary>

<!-- BEGIN:TAB_MANAGEMENT -->
```bash
# List all open Chrome tabs
chrome-cmd tabs list

# Select tab for subsequent commands
chrome-cmd tabs select 1

# Focus/activate a tab (bring to front)
chrome-cmd tabs focus
chrome-cmd tabs focus --tab 3

# Create a new tab
chrome-cmd tabs create https://google.com
chrome-cmd tabs create https://google.com --background
chrome-cmd tabs create

# Navigate tab to a specific URL
chrome-cmd tabs navigate https://github.com
chrome-cmd tabs navigate https://github.com --tab 2

# Execute JavaScript in selected tab
chrome-cmd tabs exec "document.title"
chrome-cmd tabs exec "document.images.length"
chrome-cmd tabs exec "Array.from(document.querySelectorAll('a')).map(a => a.href)"
chrome-cmd tabs exec "2 + 2"

# Close selected tab
chrome-cmd tabs close

# Reload/refresh selected tab
chrome-cmd tabs refresh

# Capture screenshot of selected tab
chrome-cmd tabs screenshot
chrome-cmd tabs screenshot --output ~/Downloads/page.png
chrome-cmd tabs screenshot --tab 2
chrome-cmd tabs screenshot --only-viewport

# Extract HTML content from selected tab
chrome-cmd tabs html
chrome-cmd tabs html --selector "div.content"
chrome-cmd tabs html --raw
chrome-cmd tabs html --full

# Get console logs from selected tab
chrome-cmd tabs logs
chrome-cmd tabs logs -n 100
chrome-cmd tabs logs --error
chrome-cmd tabs logs --warn
chrome-cmd tabs logs --info --log --debug
chrome-cmd tabs logs --error --warn

# Get network requests from selected tab
chrome-cmd tabs requests
chrome-cmd tabs requests -n 100
chrome-cmd tabs requests --method GET
chrome-cmd tabs requests --method POST
chrome-cmd tabs requests --status 200
chrome-cmd tabs requests --status 404
chrome-cmd tabs requests --url "/api"
chrome-cmd tabs requests --url "google.com"
chrome-cmd tabs requests --all
chrome-cmd tabs requests --failed
chrome-cmd tabs requests --body
chrome-cmd tabs requests --headers
chrome-cmd tabs requests --method POST --status 200 --url "/api"

# Get storage data from selected tab
chrome-cmd tabs storage
chrome-cmd tabs storage --cookies
chrome-cmd tabs storage --local
chrome-cmd tabs storage --session

# Click on an element in selected tab
chrome-cmd tabs click --selector "button.submit"
chrome-cmd tabs click --text "Sign In"

# Fill an input field in selected tab
chrome-cmd tabs input --selector "#username" --value "myuser"
chrome-cmd tabs input --selector "#search" --value "query" --submit

```

<!-- END:TAB_MANAGEMENT -->

</details>

<details>
<summary><b>JavaScript Execution</b></summary>

<!-- BEGIN:JAVASCRIPT -->
```bash
# Execute JavaScript on selected tab
chrome-cmd tabs exec "document.title"
# Output: "GitHub - Chrome CLI"

# More examples
chrome-cmd tabs exec "document.images.length"
chrome-cmd tabs exec "Array.from(document.querySelectorAll('a')).map(a => a.href)"
chrome-cmd tabs exec "2 + 2"
```

<!-- END:JAVASCRIPT -->

</details>

<details>
<summary><b>Console Logs</b></summary>

<!-- BEGIN:LOGS -->
```bash
chrome-cmd tabs logs
chrome-cmd tabs logs -n 100
chrome-cmd tabs logs --error
chrome-cmd tabs logs --warn
chrome-cmd tabs logs --info --log --debug
chrome-cmd tabs logs --error --warn
```

**Features:** Color-coded output, smart object formatting, type filtering, adjustable limit

<!-- END:LOGS -->

</details>

<details>
<summary><b>Network Requests</b></summary>

<!-- BEGIN:REQUESTS -->
```bash
chrome-cmd tabs requests
chrome-cmd tabs requests -n 100
chrome-cmd tabs requests --method GET
chrome-cmd tabs requests --method POST
chrome-cmd tabs requests --status 200
chrome-cmd tabs requests --status 404
chrome-cmd tabs requests --url "/api"
chrome-cmd tabs requests --url "google.com"
chrome-cmd tabs requests --all
chrome-cmd tabs requests --failed
chrome-cmd tabs requests --body
chrome-cmd tabs requests --headers
chrome-cmd tabs requests --method POST --status 200 --url "/api"
```

**Captured data:** URL, method, status, headers, payload, response body, timing, type, errors

<!-- END:REQUESTS -->

</details>

<details>
<summary><b>HTML Extraction</b></summary>

<!-- BEGIN:HTML -->
```bash
chrome-cmd tabs html
chrome-cmd tabs html --selector "div.content"
chrome-cmd tabs html --raw
chrome-cmd tabs html --full
```

**Features:** Pretty printing, CSS selectors, token optimization, raw mode

<!-- END:HTML -->

</details>

<details>
<summary><b>Screenshots</b></summary>

<!-- BEGIN:SCREENSHOTS -->
```bash
chrome-cmd tabs screenshot
chrome-cmd tabs screenshot --output ~/Downloads/page.png
chrome-cmd tabs screenshot --tab 2
chrome-cmd tabs screenshot --only-viewport
```

<!-- END:SCREENSHOTS -->

</details>

<details>
<summary><b>Storage Inspection</b></summary>

<!-- BEGIN:STORAGE -->
```bash
chrome-cmd tabs storage
chrome-cmd tabs storage --cookies
chrome-cmd tabs storage --local
chrome-cmd tabs storage --session
```

**Data includes:** Cookie flags, expiry, size, key-value pairs

<!-- END:STORAGE -->

</details>

<details>
<summary><b>Form Automation</b></summary>

<!-- BEGIN:FORM_AUTOMATION -->
```bash
chrome-cmd tabs click --selector "button.submit"
chrome-cmd tabs click --text "Sign In"
```

```bash
chrome-cmd tabs input --selector "#username" --value "myuser"
chrome-cmd tabs input --selector "#search" --value "query" --submit
```

<!-- END:FORM_AUTOMATION -->

</details>

<details>
<summary><b>System Commands</b></summary>

<!-- BEGIN:SYSTEM_COMMANDS -->
```bash
# Update to latest version
chrome-cmd update

# Shell completion (bash/zsh)
chrome-cmd completion install

chrome-cmd completion uninstall

# Profile management
chrome-cmd profile remove           # Remove profile and native host configuration
chrome-cmd profile select           # Select active profile from configured profiles

```

<!-- END:SYSTEM_COMMANDS -->

</details>

<details>
<summary><b>Command History</b></summary>

Click the Chrome CLI extension icon in your browser toolbar to view recent commands, execution times, and results.

</details>

## :package: Additional Information

**Prerequisites:** Node.js 18+, Google Chrome, Linux/macOS/Windows

<details>
<summary><b>Multi-Profile Support</b></summary>

You can use chrome-cmd with multiple Chrome profiles. Just repeat the Quick Start setup for each profile:

1. Open your other Chrome profile
2. Run `chrome-cmd extension` again
3. Load the extension and paste the Extension ID

To switch between profiles:

```bash
chrome-cmd profile select
# → Shows list of registered profiles
# → Type the profile number
# → All commands now run on selected profile
```

</details>

<details>
<summary><b>Uninstallation</b></summary>

To completely remove chrome-cmd, run these commands in order:

```bash
# 1. Remove shell completions (if installed)
chrome-cmd completion uninstall

# 2. Manually remove the Chrome extension
# Open chrome://extensions/ and click "Remove" on the Chrome CLI extension

# 3. Uninstall the CLI package
npm uninstall -g chrome-cmd
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

<details>
<summary><b>How it works</b></summary>

The architecture uses a 3-layer design to enable terminal control of Chrome:

```
┌──────────────────────────────────────────────────────────────────────┐
│  LAYER 1: Command Line Interface                                     │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ $ chrome-cmd tabs exec "document.title"                        │  │
│  │                                                                │  │
│  │ • Commander.js for CLI parsing                                 │  │
│  │ • ExtensionClient sends HTTP to mediator                       │  │
│  │ • ConfigManager selects active Chrome profile                  │  │
│  └────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬─────────────────────────────────────┘
                                 │
                          HTTP POST Request
                       http://localhost:8765-8774
                                 │
┌────────────────────────────────▼─────────────────────────────────────┐
│  LAYER 2: Mediator Server (Native Host)                              │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ Node.js HTTP Server + Native Messaging Bridge                  │  │
│  │                                                                │  │
│  │ • One instance per Chrome profile (auto-started)               │  │
│  │ • HTTP server on dynamic port (8765-8774)                      │  │
│  │ • Converts HTTP ↔ Chrome Native Messaging (stdin/stdout)       │  │
│  │ • Registered in ~/.config/chrome-cmd/mediators.json            │  │
│  └────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬─────────────────────────────────────┘
                                 │
                     Native Messaging Protocol
                         (stdin/stdout JSON)
                                 │
┌────────────────────────────────▼─────────────────────────────────────┐
│  LAYER 3: Chrome Extension (Service Worker)                          │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ background.ts - Main command handler                           │  │
│  │                                                                │  │
│  │ • Connects to mediator via chrome.runtime.connectNative()      │  │
│  │ • Dispatches commands to chrome.debugger API                   │  │
│  │ • Returns results through mediator to CLI                      │  │
│  │ • popup.ts shows command history                               │  │
│  └────────────────────────────┬───────────────────────────────────┘  │
└────────────────────────────────┼─────────────────────────────────────┘
                                 │
                      Chrome Debugger Protocol (CDP)
                       chrome.debugger.sendCommand()
                                 │
                    ┌────────────▼─────────────┐
                    │      Chrome Tabs         │
                    │                          │
                    │ • Execute JavaScript     │
                    │ • Network monitoring     │
                    │ • Console log capture    │
                    │ • Screenshots            │
                    │ • DOM manipulation       │
                    └──────────────────────────┘
```

**Key Features:**
- **Multi-profile support**: Each Chrome profile gets its own mediator instance
- **Auto-recovery**: Mediator auto-starts when extension connects
- **Port allocation**: Dynamic ports (8765-8774) prevent conflicts
- **Bi-directional**: Commands flow down, results flow back up

**Required permissions:**

- `debugger` - Execute JavaScript, capture screenshots, monitor network/console
- `scripting` - Inject content script for command details modal in popup
- `tabs` - List and manage tabs, navigate, focus windows
- `nativeMessaging` - Connect CLI to Chrome extension via native host
- `storage` - Track command history in extension popup
- `identity` + `identity.email` - Auto-detect Chrome profile name (email)
- `management` - Get extension installation info

**⚠️ Not suitable for Chrome Web Store distribution** (requires debugger permission)

</details>

## :star: Inspiration

- [BroTab](https://github.com/balta2ar/brotab) - Original Python implementation

---

<div align="center">
  <p>
    <a target="_blank" href="https://www.linkedin.com/in/lucasvtiradentes/"><img src="https://img.shields.io/badge/-linkedin-blue?logo=Linkedin&logoColor=white" alt="LinkedIn"></a>
    <a target="_blank" href="mailto:lucasvtiradentes@gmail.com"><img src="https://img.shields.io/badge/gmail-red?logo=gmail&logoColor=white" alt="Gmail"></a>
  </p>
  <p>Made with ❤️ by <b>Lucas Vieira</b></p>
</div>
