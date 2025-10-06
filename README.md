<div align="center">
<a href="https://www.google.com/chrome/" target="_blank" rel="noopener noreferrer">
  <img width="64" src="https://raw.githubusercontent.com/alrra/browser-logos/main/src/chrome/chrome.svg" alt="Chrome logo">
</a>
<h2>Chrome CLI</h2>
<p>Control your Chrome browser from the command line</p>
<p>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <br>
  <a href="#star-features">Features</a> • <a href="#question-motivation">Motivation</a> • <a href="#rocket-quick-start">Quick Start</a> • <a href="#bulb-usage">Usage</a> • <a href="#package-installation">Installation</a> • <a href="#gear-how-it-works">How It Works</a>
</p>

</div>

## :zap: Overview

Install a Chrome extension and CLI tool to send commands to your browser from the terminal. List tabs, execute JavaScript, and automate browser tasks - perfect for integrating Chrome with LLMs like Claude Code.

## :star: Features

- **List all open tabs** - See all your Chrome tabs from terminal
- **Execute JavaScript** - Run any JS code in specific tabs
- **Command history** - View recent commands in extension popup
- **Tab management** - Close, activate, and create tabs
- **Auto-update** - Built-in command to update to latest version
- **Shell completion** - Tab completion for bash and zsh
- **Works with daily Chrome** - No separate debugging instance needed
- **BroTab-style architecture** - Fast and reliable Native Messaging bridge

## :question: Motivation

Why build a CLI for Chrome?

Because I want to enable LLMs like [Claude Code](https://www.anthropic.com/claude-code) to interact with my browser tabs - checking WhatsApp Web messages, extracting page data, or automating repetitive tasks. This tool provides secure, programmatic access to Chrome via command line.

## :rocket: Quick Start

```bash
# 1. Build CLI
cd packages/cli
npm install
npm run build

# 2. Install extension (chrome://extensions/)
# Load unpacked: packages/chrome-extension/

# 3. Setup Native Messaging
npm run dev -- host install
# Paste your Extension ID when prompted

# 4. Start using
npm run dev -- tabs list
```

## :bulb: Usage

### List all tabs

```bash
npm run dev -- tabs list
```

Output:

```
Found 3 tab(s):

● [1850981595] GitHub - Chrome CLI
  https://github.com/you/chrome-cmd

○ [1850981606] Stack Overflow
  https://stackoverflow.com

○ [1850981612] Google
  https://google.com
```

### Execute JavaScript

You can use either **tab index** (1-9) or **tab ID** for all commands:

```bash
# Using tab index (1 = first tab, 2 = second tab, etc.)
npm run dev -- tabs exec 1 "document.title"
# Output: "GitHub - Chrome CLI"

# Using tab ID
npm run dev -- tabs exec 1850981595 "document.title"
# Output: "GitHub - Chrome CLI"

# Count images
npm run dev -- tabs exec 1 "document.images.length"
# Output: 12

# Get all links
npm run dev -- tabs exec 2 "Array.from(document.querySelectorAll('a')).map(a => a.href)"
# Output: ["https://...", "https://..."]

# Math operations
npm run dev -- tabs exec 1 "2 + 2"
# Output: 4
```

### Close a tab

```bash
# Close first tab
npm run dev -- tabs close 1

# Close by tab ID
npm run dev -- tabs close 1850981595
```

### Refresh a tab

```bash
# Refresh second tab
npm run dev -- tabs refresh 2

# Refresh by tab ID
npm run dev -- tabs refresh 1850981595
```

### Get console logs

```bash
# Get logs from first tab
npm run dev -- tabs logs 1

# Get logs by tab ID
npm run dev -- tabs logs 1850981595
```

### View command history

Click the Chrome CLI extension icon in your browser toolbar to see:

- Recent commands executed
- Time ago for each command
- Command details and results

### Update to latest version

```bash
npm run dev -- update
```

Automatically checks npm for the latest version and updates chrome-cmd. If you have shell completions installed, they will be updated automatically.

### Install shell completion

```bash
npm run dev -- completion install
```

Enables tab completion for bash or zsh. After installation:

**Zsh:**
```bash
source ~/.zshrc
```

**Bash:**
```bash
source ~/.bashrc
```

Then you can use tab completion:
```bash
npm run dev -- tabs <TAB>   # Shows: list, exec, close, refresh, logs
npm run dev -- host <TAB>   # Shows: install, uninstall
```

### Manage Native Messaging Host

**Install:**
```bash
npm run dev -- host install
```

**Uninstall:**
```bash
npm run dev -- host uninstall
```

Useful for troubleshooting or switching Chrome extension IDs.

## :package: Installation

### Prerequisites

- Node.js 18+ (via NVM recommended)
- Google Chrome or Chromium
- Linux or macOS (Windows with WSL)

### Step 1: Build CLI

```bash
cd packages/cli
npm install
npm run build
```

### Step 2: Install Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select folder: `packages/chrome-extension/`
5. **Copy the Extension ID** (e.g., `gepjnibmadcdhppipakehfcnobiaenhi`)

### Step 3: Setup Native Messaging Host

Run the interactive installer:

```bash
npm run dev -- host install
```

When prompted, paste the **Extension ID** from Step 2.

> **Note:** Once installed globally, you can use `chrome-cmd host install` instead.

This creates the Native Messaging manifest at:

- Linux: `~/.config/google-chrome/NativeMessagingHosts/com.chrome_cli.native.json`
- macOS: `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.chrome_cli.native.json`

### Step 4: Reload Extension

1. Go to `chrome://extensions/`
2. Click **reload** icon on Chrome CLI Bridge extension
3. Verify connection in Service Worker logs:
   ```
   [Background] Service worker started
   [Background] Connected to mediator
   ```

### Step 5: Test

```bash
npm run dev -- tabs list
```

You should see your open tabs! 🎉

## :gear: How It Works

```
┌─────────────────────────────────────────┐
│  Terminal                               │
│  $ npm run dev -- tabs list             │
└─────────────────────────────────────────┘
              ↓ HTTP
┌─────────────────────────────────────────┐
│  Mediator (localhost:8765)              │
│  Node.js HTTP server                    │
│  dist/native-host/mediator-host.js      │
└─────────────────────────────────────────┘
              ↓ Native Messaging (stdio)
┌─────────────────────────────────────────┐
│  Chrome Extension                       │
│  background.js (Service Worker)         │
└─────────────────────────────────────────┘
              ↓ chrome.debugger API
┌─────────────────────────────────────────┐
│  Chrome Tabs                            │
│  Execute JavaScript in pages            │
└─────────────────────────────────────────┘
```

## :books: Inspired By

- [BroTab](https://github.com/balta2ar/brotab) - Original Python implementation
- [chrome-cmd](https://github.com/prasmussen/chrome-cmd) - macOS-only alternative

## :lock: Security Notes

This extension requires powerful permissions:

- `debugger` - Execute arbitrary JavaScript in tabs
- `scripting` - Inject code in pages
- `tabs` - List and manage tabs
- `storage` - Track command history

**⚠️ This extension is NOT suitable for Chrome Web Store distribution.**

## :memo: License

MIT

---

<div align="center">
Made with ❤️ for developers who love the terminal
</div>
