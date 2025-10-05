# Chrome CLI

Control your Chrome browser from the command line! 🚀

## Features

- ✅ List all open tabs
- ✅ Execute JavaScript in any tab
- ✅ Close tabs
- ✅ Activate tabs
- ✅ Create new tabs
- ✅ Works with your daily Chrome (keeps you logged in!)

## Installation

### 1. Install the Chrome Extension

```bash
cd packages/chrome-extension
```

1. Open Chrome: `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `packages/chrome-extension` directory

### 2. Install the CLI

```bash
cd packages/chrome-cli
pnpm install
pnpm run build
```

### 3. Link CLI globally (optional)

```bash
npm link
# or
pnpm link --global
```

## Usage

### List all tabs

```bash
# Using npm run dev
npm run dev -- tabs list

# Or after building
chrome-cli tabs list
```

Output:
```
Found 3 tab(s):

● [123] GitHub
  https://github.com

○ [124] Stack Overflow
  https://stackoverflow.com

○ [125] Google
  https://google.com
```

### Execute JavaScript in a tab

```bash
# Get tab title
npm run dev -- tabs exec 123 "document.title"

# Get all links
npm run dev -- tabs exec 123 "Array.from(document.querySelectorAll('a')).map(a => a.href)"

# Interact with WhatsApp Web
npm run dev -- tabs exec 123 "document.querySelectorAll('.message').length"
```

## How it Works

```
┌─────────────────────────────────────────┐
│  Terminal                               │
│  $ chrome-cli tabs list                 │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  CLI (Node.js)                          │
│  packages/chrome-cli                    │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Native Messaging Host (Node.js)        │
│  Bridges CLI ↔ Extension               │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Chrome Extension                       │
│  background.js (Service Worker)         │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Chrome Tabs API                        │
│  Your actual Chrome tabs                │
└─────────────────────────────────────────┘
```

## Architecture

This project is inspired by [BroTab](https://github.com/balta2ar/brotab) but built with modern TypeScript and following the structure of the linear-cmd CLI.

### Key Components

1. **Chrome Extension** (`packages/chrome-extension`)
   - Manifest V3
   - Service worker that communicates via Native Messaging
   - Uses Chrome Tabs API

2. **CLI Tool** (`packages/chrome-cli`)
   - TypeScript with Commander.js
   - Modular command structure
   - Type-safe

3. **Native Messaging Host**
   - Node.js bridge between CLI and extension
   - Implements Chrome's Native Messaging protocol
   - Handles stdin/stdout communication

## Development

### Run in development mode

```bash
npm run dev -- tabs list
```

### Build for production

```bash
npm run build
```

### Type checking

```bash
npm run typecheck
```

## Commands

### `tabs list`
List all open tabs with their IDs, titles, and URLs.

### `tabs exec <tabId> <code>`
Execute JavaScript code in a specific tab.

**Examples:**
```bash
# Get page title
chrome-cli tabs exec 123 "document.title"

# Count images
chrome-cli tabs exec 123 "document.images.length"

# Get all paragraph text
chrome-cli tabs exec 123 "Array.from(document.querySelectorAll('p')).map(p => p.textContent)"
```

## Troubleshooting

### Extension not connecting

1. Check if extension is loaded: `chrome://extensions/`
2. Look for errors in extension console: Click "Service worker" → "Inspect"
3. Verify native messaging host is installed

### CLI not finding tabs

1. Make sure Chrome extension is installed and enabled
2. Native messaging host needs to be properly configured
3. Check that extension ID matches in native messaging manifest

## Roadmap

- [ ] Implement full native messaging host
- [ ] Add tab search/filter
- [ ] Add tab navigation (previous/next)
- [ ] Add support for Firefox
- [ ] Add shell completion
- [ ] Package for npm

## Inspired By

- [BroTab](https://github.com/balta2ar/brotab) - Original Python implementation
- [chrome-cli](https://github.com/prasmussen/chrome-cli) - macOS-only alternative

## License

MIT
