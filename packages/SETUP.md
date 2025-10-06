# Chrome CLI - Setup Guide

Complete guide to install Chrome CLI from scratch.

## 📋 Prerequisites

- Node.js 18+ (via NVM recommended)
- Google Chrome or Chromium
- Linux or macOS (Windows with WSL)

## 🚀 Installation Steps

### 1. Install Chrome CLI Package

```bash
cd packages/chrome-cli
npm install
npm run build
```

### 2. Install Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the folder: `packages/chrome-extension/`
5. **Copy the Extension ID** (e.g., `gepjnibmadcdhppipakehfcnobiaenhi`)

### 3. Install Native Messaging Host

Run the interactive installer:

```bash
npm run install-host
```

When prompted, paste the **Extension ID** from step 2.

This will:
- Create Native Messaging manifest at `~/.config/google-chrome/NativeMessagingHosts/com.chrome_cli.native.json`
- Configure the extension to communicate with the CLI

### 4. Reload Extension

1. Go back to `chrome://extensions/`
2. Click the **reload icon** on the Chrome CLI Bridge extension
3. Check the Service Worker logs (click "service worker") - you should see:
   ```
   [Background] Service worker started
   [Background] Connected to mediator
   ```

## ✅ Verify Installation

Test that everything works:

```bash
# From packages/chrome-cli directory
npm run dev -- tabs list
```

You should see a list of your open tabs!

## 🧪 Try More Commands

```bash
# List all tabs
npm run dev -- tabs list

# Execute JavaScript in a tab
npm run dev -- tabs exec <tabId> "document.title"

# Math operations
npm run dev -- tabs exec <tabId> "2 + 2"
```

## 📊 View Command History

Click the Chrome CLI extension icon in your browser toolbar to see:
- Recent commands executed
- Time ago for each command
- Command details

## 🔧 Troubleshooting

### "Mediator not responding"

1. Reload the Chrome extension at `chrome://extensions/`
2. Check Service Worker logs for errors
3. Verify Native Messaging manifest exists:
   ```bash
   cat ~/.config/google-chrome/NativeMessagingHosts/com.chrome_cli.native.json
   ```

### "No tab with id: X"

Tab IDs change when tabs are closed/reopened. Run `tabs list` to get current tab IDs.

### Extension not connecting

1. Check that the Extension ID in the Native Messaging manifest matches the installed extension
2. Reload the extension
3. Check wrapper logs:
   ```bash
   tail -f ~/.chrome-cli-wrapper.log
   ```

4. Check mediator logs:
   ```bash
   tail -f ~/.chrome-cli-mediator.log
   ```

## 📁 Project Structure

```
packages/
├── chrome-cli/              # CLI tool
│   ├── src/
│   │   ├── commands/        # CLI commands
│   │   ├── lib/             # Client libraries
│   │   ├── native-host/     # Mediator (BroTab architecture)
│   │   ├── types/           # TypeScript types
│   │   ├── constants.ts
│   │   └── index.ts
│   ├── scripts/
│   │   ├── post-build.sh    # Creates host.sh wrapper
│   │   └── install-host.sh  # Installs Native Messaging
│   └── package.json
│
└── chrome-extension/        # Chrome Extension
    ├── background.js        # Service worker
    ├── popup.html           # Extension popup UI
    ├── popup.css            # Popup styles
    ├── popup.js             # Popup logic
    ├── manifest.json        # Extension config
    └── icons/               # Extension icons
```

## 🏗️ Architecture

The project uses **BroTab-style architecture**:

1. **Chrome Extension** (background.js)
   - Connects to mediator via Native Messaging
   - Executes commands in browser tabs
   - Tracks command history

2. **Mediator** (mediator-host.js)
   - Runs HTTP server on `localhost:8765`
   - Bridges CLI ↔ Extension communication
   - Started automatically by Chrome

3. **CLI** (chrome-cli)
   - Sends HTTP requests to mediator
   - User-friendly command interface
   - Auto-waits for mediator to be ready

## 🔐 Security Notes

This extension requires powerful permissions:
- `debugger` - To execute arbitrary JavaScript
- `scripting` - To inject code in tabs
- `tabs` - To list and manage tabs
- `storage` - To track command history

**This extension is intended for developers and should NOT be published to the Chrome Web Store.**

For production use, distribute via:
- GitHub Releases
- Manual installation instructions
- Developer documentation

## 📝 License

MIT
