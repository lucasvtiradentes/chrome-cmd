import { ChromeCommand } from './commands.js';

export interface CommandMetadata {
  displayName: string;
  description: string;
  formatDetails?: (data: Record<string, unknown>) => string;
}

export type CommandMetadataMap = {
  [K in ChromeCommand]: CommandMetadata;
};

export const COMMAND_METADATA: CommandMetadataMap = {
  [ChromeCommand.LIST_TABS]: {
    displayName: 'List Tabs',
    description: 'List all open tabs'
  },

  [ChromeCommand.CLOSE_TAB]: {
    displayName: 'Close Tab',
    description: 'Close a specific tab',
    formatDetails: (data) => `Close tab ${data?.tabId || 'N/A'}`
  },

  [ChromeCommand.ACTIVATE_TAB]: {
    displayName: 'Activate Tab',
    description: 'Switch to a specific tab',
    formatDetails: (data) => `Activate tab ${data?.tabId || 'N/A'}`
  },

  [ChromeCommand.CREATE_TAB]: {
    displayName: 'Create Tab',
    description: 'Open a new tab',
    formatDetails: (data) => `Create tab: ${data?.url || 'about:blank'}`
  },

  [ChromeCommand.RELOAD_TAB]: {
    displayName: 'Reload Tab',
    description: 'Refresh a tab',
    formatDetails: (data) => `Reload tab ${data?.tabId || 'current'}`
  },

  [ChromeCommand.NAVIGATE_TAB]: {
    displayName: 'Navigate Tab',
    description: 'Navigate to a URL',
    formatDetails: (data) => `Navigate to: ${data?.url || 'N/A'}`
  },

  [ChromeCommand.EXECUTE_SCRIPT]: {
    displayName: 'Execute Script',
    description: 'Run JavaScript code',
    formatDetails: (data) => {
      const code = data?.code as string;
      if (!code) return 'Run JavaScript code';
      return code.length > 50 ? `Execute: ${code.substring(0, 50)}...` : `Execute: ${code}`;
    }
  },

  [ChromeCommand.CAPTURE_SCREENSHOT]: {
    displayName: 'Capture Screenshot',
    description: 'Take a screenshot',
    formatDetails: (data) => `Screenshot (${data?.format || 'png'})`
  },

  [ChromeCommand.GET_TAB_LOGS]: {
    displayName: 'Get Tab Logs',
    description: 'Retrieve console logs',
    formatDetails: (data) => `Get logs for tab ${data?.tabId || 'current'}`
  },

  [ChromeCommand.CLEAR_TAB_LOGS]: {
    displayName: 'Clear Tab Logs',
    description: 'Clear console logs'
  },

  [ChromeCommand.GET_TAB_REQUESTS]: {
    displayName: 'Get Tab Requests',
    description: 'Get network requests',
    formatDetails: (data) => `Get requests for tab ${data?.tabId || 'current'}`
  },

  [ChromeCommand.CLEAR_TAB_REQUESTS]: {
    displayName: 'Clear Tab Requests',
    description: 'Clear network requests'
  },

  [ChromeCommand.START_LOGGING]: {
    displayName: 'Start Logging',
    description: 'Start capturing logs',
    formatDetails: (data) => `Start logging on tab ${data?.tabId || 'current'}`
  },

  [ChromeCommand.STOP_LOGGING]: {
    displayName: 'Stop Logging',
    description: 'Stop capturing logs',
    formatDetails: (data) => `Stop logging on tab ${data?.tabId || 'current'}`
  },

  [ChromeCommand.GET_STORAGE]: {
    displayName: 'Get Storage',
    description: 'Retrieve storage data',
    formatDetails: (data) => {
      const types = data?.types as string[] | undefined;
      return types && types.length > 0 ? `Get storage: ${types.join(', ')}` : 'Retrieve storage data';
    }
  },

  [ChromeCommand.CLICK_ELEMENT]: {
    displayName: 'Click Element',
    description: 'Click on an element',
    formatDetails: (data) => `Click: ${data?.selector || 'element'}`
  },

  [ChromeCommand.CLICK_ELEMENT_BY_TEXT]: {
    displayName: 'Click by Text',
    description: 'Click element by text content',
    formatDetails: (data) => `Click text: "${data?.text || ''}"`
  },

  [ChromeCommand.FILL_INPUT]: {
    displayName: 'Fill Input',
    description: 'Fill an input field',
    formatDetails: (data) => `Fill "${data?.selector || 'input'}" with "${data?.value || ''}"`
  },

  [ChromeCommand.RELOAD_EXTENSION]: {
    displayName: 'Reload Extension',
    description: 'Reload the Chrome extension'
  },

  [ChromeCommand.PING]: {
    displayName: 'Ping',
    description: 'Health check'
  }
};

export function formatCommandDetails(command: string, data: Record<string, unknown>): string {
  if (Object.values(ChromeCommand).includes(command as ChromeCommand)) {
    const metadata = COMMAND_METADATA[command as ChromeCommand];
    if (metadata.formatDetails) {
      return metadata.formatDetails(data);
    }
    return metadata.description;
  }

  return command;
}
