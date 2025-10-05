# Chrome CLI Bridge - Extension

Chrome extension that enables command-line control of your browser.

## Features

- ✅ List all open tabs
- ✅ Execute JavaScript in specific tabs
- ✅ Close tabs
- ✅ Activate (focus) tabs
- ✅ Create new tabs

## Installation

### 1. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select this directory (`packages/chrome-extension`)

### 2. Verify Extension is Loaded

You should see "Chrome CLI Bridge" in your extensions list.

## Architecture

This extension uses Chrome's Native Messaging API to communicate with a Node.js CLI tool.

### Message Flow

```
CLI (Node.js)
    ↓
Native Messaging Host (Node.js)
    ↓
Chrome Extension (background.js)
    ↓
Chrome Tabs API
```

### Message Format

Messages from CLI to extension:
```json
{
  "command": "list_tabs",
  "data": {},
  "id": "unique-request-id"
}
```

Messages from extension to CLI:
```json
{
  "id": "unique-request-id",
  "success": true,
  "result": { ... }
}
```

## Supported Commands

### `list_tabs`
Returns all open tabs with their metadata.

### `execute_script`
Execute JavaScript in a specific tab.
```json
{
  "command": "execute_script",
  "data": {
    "tabId": 123,
    "code": "document.title"
  }
}
```

### `close_tab`
Close a specific tab.
```json
{
  "command": "close_tab",
  "data": { "tabId": 123 }
}
```

### `activate_tab`
Bring a tab to focus.
```json
{
  "command": "activate_tab",
  "data": { "tabId": 123 }
}
```

### `create_tab`
Open a new tab.
```json
{
  "command": "create_tab",
  "data": {
    "url": "https://example.com",
    "active": true
  }
}
```

## Development

The extension uses:
- Manifest V3 (latest Chrome extension format)
- Native Messaging API for CLI communication
- Service Worker for background processing

## Troubleshooting

### Extension not connecting to CLI
1. Make sure the native messaging host is properly installed
2. Check Chrome logs: `chrome://extensions/` → "Service worker" → "Inspect"
3. Verify the native messaging host name matches in both extension and CLI config

### Permissions errors
The extension requires:
- `tabs` - To list and manage tabs
- `scripting` - To execute JavaScript
- `nativeMessaging` - To communicate with CLI
- `<all_urls>` - To access all websites for script execution
