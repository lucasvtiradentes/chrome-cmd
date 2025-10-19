import { ChromeCommand } from './commands.js';

export interface CommandMetadata {
  displayName: string;
  description: string;
  icon?: string;
  formatDetails?: (data: Record<string, unknown>) => string;
}

export type CommandMetadataMap = {
  [K in ChromeCommand]: CommandMetadata;
};

export const COMMAND_METADATA: CommandMetadataMap = {
  [ChromeCommand.LIST_TABS]: {
    displayName: 'List Tabs',
    description: 'List all open tabs',
    icon: '📋'
  },

  [ChromeCommand.CLOSE_TAB]: {
    displayName: 'Close Tab',
    description: 'Close a specific tab',
    icon: '✖️',
    formatDetails: (data) => `Close tab ${data?.tabId || 'N/A'}`
  },

  [ChromeCommand.ACTIVATE_TAB]: {
    displayName: 'Activate Tab',
    description: 'Switch to a specific tab',
    icon: '🎯',
    formatDetails: (data) => `Activate tab ${data?.tabId || 'N/A'}`
  },

  [ChromeCommand.CREATE_TAB]: {
    displayName: 'Create Tab',
    description: 'Open a new tab',
    icon: '➕',
    formatDetails: (data) => `Create tab: ${data?.url || 'about:blank'}`
  },

  [ChromeCommand.RELOAD_TAB]: {
    displayName: 'Reload Tab',
    description: 'Refresh a tab',
    icon: '🔄',
    formatDetails: (data) => `Reload tab ${data?.tabId || 'current'}`
  },

  [ChromeCommand.NAVIGATE_TAB]: {
    displayName: 'Navigate Tab',
    description: 'Navigate to a URL',
    icon: '🧭',
    formatDetails: (data) => `Navigate to: ${data?.url || 'N/A'}`
  },

  [ChromeCommand.EXECUTE_SCRIPT]: {
    displayName: 'Execute Script',
    description: 'Run JavaScript code',
    icon: '⚡',
    formatDetails: (data) => {
      const code = data?.code as string;
      if (!code) return 'Run JavaScript code';
      return code.length > 50 ? `Execute: ${code.substring(0, 50)}...` : `Execute: ${code}`;
    }
  },

  [ChromeCommand.CAPTURE_SCREENSHOT]: {
    displayName: 'Capture Screenshot',
    description: 'Take a screenshot',
    icon: '📸',
    formatDetails: (data) => `Screenshot (${data?.format || 'png'})`
  },

  [ChromeCommand.GET_TAB_LOGS]: {
    displayName: 'Get Tab Logs',
    description: 'Retrieve console logs',
    icon: '📝',
    formatDetails: (data) => `Get logs for tab ${data?.tabId || 'current'}`
  },

  [ChromeCommand.CLEAR_TAB_LOGS]: {
    displayName: 'Clear Tab Logs',
    description: 'Clear console logs',
    icon: '🧹'
  },

  [ChromeCommand.GET_TAB_REQUESTS]: {
    displayName: 'Get Tab Requests',
    description: 'Get network requests',
    icon: '🌐',
    formatDetails: (data) => `Get requests for tab ${data?.tabId || 'current'}`
  },

  [ChromeCommand.CLEAR_TAB_REQUESTS]: {
    displayName: 'Clear Tab Requests',
    description: 'Clear network requests',
    icon: '🧹'
  },

  [ChromeCommand.START_LOGGING]: {
    displayName: 'Start Logging',
    description: 'Start capturing logs',
    icon: '▶️',
    formatDetails: (data) => `Start logging on tab ${data?.tabId || 'current'}`
  },

  [ChromeCommand.STOP_LOGGING]: {
    displayName: 'Stop Logging',
    description: 'Stop capturing logs',
    icon: '⏹️',
    formatDetails: (data) => `Stop logging on tab ${data?.tabId || 'current'}`
  },

  [ChromeCommand.GET_STORAGE]: {
    displayName: 'Get Storage',
    description: 'Retrieve storage data',
    icon: '💾',
    formatDetails: (data) => {
      const types = data?.types as string[] | undefined;
      return types && types.length > 0 ? `Get storage: ${types.join(', ')}` : 'Retrieve storage data';
    }
  },

  [ChromeCommand.CLICK_ELEMENT]: {
    displayName: 'Click Element',
    description: 'Click on an element',
    icon: '👆',
    formatDetails: (data) => `Click: ${data?.selector || 'element'}`
  },

  [ChromeCommand.CLICK_ELEMENT_BY_TEXT]: {
    displayName: 'Click by Text',
    description: 'Click element by text content',
    icon: '👆',
    formatDetails: (data) => `Click text: "${data?.text || ''}"`
  },

  [ChromeCommand.FILL_INPUT]: {
    displayName: 'Fill Input',
    description: 'Fill an input field',
    icon: '⌨️',
    formatDetails: (data) => `Fill "${data?.selector || 'input'}" with "${data?.value || ''}"`
  },

  [ChromeCommand.RELOAD_EXTENSION]: {
    displayName: 'Reload Extension',
    description: 'Reload the Chrome extension',
    icon: '🔄'
  },

  [ChromeCommand.REGISTER]: {
    displayName: 'Register',
    description: 'Register extension with mediator',
    icon: '🔌'
  },

  [ChromeCommand.GET_PROFILE_INFO]: {
    displayName: 'Get Profile Info',
    description: 'Get Chrome profile information',
    icon: '👤'
  },

  [ChromeCommand.PING]: {
    displayName: 'Ping',
    description: 'Health check',
    icon: '🏓'
  }
};

export function getCommandIcon(command: string): string {
  if (Object.values(ChromeCommand).includes(command as ChromeCommand)) {
    return COMMAND_METADATA[command as ChromeCommand].icon || '⚙️';
  }
  return '⚙️';
}

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
