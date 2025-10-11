/**
 * Command metadata with type safety
 * This file ensures all commands have their metadata defined
 */

import { ChromeCommand } from './commands';

/**
 * Metadata for a single command
 */
export interface CommandMetadata {
  /** Display name for the command */
  displayName: string;
  /** Short description */
  description: string;
  /** Formatter function that takes command data and returns a formatted string */
  formatDetails?: (data: Record<string, unknown>) => string;
}

/**
 * Type-safe map of all command metadata
 * This ensures every command in ChromeCommand enum has metadata
 */
export type CommandMetadataMap = {
  [K in ChromeCommand]: CommandMetadata;
};

/**
 * Command metadata definitions
 * If you add a new command to ChromeCommand enum and don't add it here,
 * TypeScript will throw a compilation error!
 */
export const COMMAND_METADATA: CommandMetadataMap = {
  // Tab management
  [ChromeCommand.LIST_TABS]: {
    displayName: 'List Tabs',
    description: 'List all open tabs',
    formatDetails: () => 'List all tabs'
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

  // Script execution
  [ChromeCommand.EXECUTE_SCRIPT]: {
    displayName: 'Execute Script',
    description: 'Run JavaScript code',
    formatDetails: (data) => {
      const code = data?.code as string;
      if (!code) return 'Execute: N/A';
      // Truncate long code
      return code.length > 50 ? `Execute: ${code.substring(0, 50)}...` : `Execute: ${code}`;
    }
  },

  // Screenshot
  [ChromeCommand.CAPTURE_SCREENSHOT]: {
    displayName: 'Capture Screenshot',
    description: 'Take a screenshot',
    formatDetails: (data) => {
      const format = data?.format || 'png';
      return `Screenshot (${format})`;
    }
  },

  // Logging and monitoring
  [ChromeCommand.GET_TAB_LOGS]: {
    displayName: 'Get Tab Logs',
    description: 'Retrieve console logs',
    formatDetails: (data) => `Get logs for tab ${data?.tabId || 'current'}`
  },

  [ChromeCommand.CLEAR_TAB_LOGS]: {
    displayName: 'Clear Tab Logs',
    description: 'Clear console logs',
    formatDetails: (data) => `Clear logs for tab ${data?.tabId || 'current'}`
  },

  [ChromeCommand.GET_TAB_REQUESTS]: {
    displayName: 'Get Tab Requests',
    description: 'Get network requests',
    formatDetails: (data) => `Get requests for tab ${data?.tabId || 'current'}`
  },

  [ChromeCommand.CLEAR_TAB_REQUESTS]: {
    displayName: 'Clear Tab Requests',
    description: 'Clear network requests',
    formatDetails: (data) => `Clear requests for tab ${data?.tabId || 'current'}`
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

  // Storage
  [ChromeCommand.GET_STORAGE]: {
    displayName: 'Get Storage',
    description: 'Retrieve storage data',
    formatDetails: (data) => {
      const types = data?.types as string[] | undefined;
      return types ? `Get storage: ${types.join(', ')}` : 'Get storage';
    }
  },

  // Browser automation
  [ChromeCommand.CLICK_ELEMENT]: {
    displayName: 'Click Element',
    description: 'Click on an element',
    formatDetails: (data) => `Click: ${data?.selector || 'N/A'}`
  },

  [ChromeCommand.CLICK_ELEMENT_BY_TEXT]: {
    displayName: 'Click by Text',
    description: 'Click element by text content',
    formatDetails: (data) => `Click text: "${data?.text || 'N/A'}"`
  },

  [ChromeCommand.FILL_INPUT]: {
    displayName: 'Fill Input',
    description: 'Fill an input field',
    formatDetails: (data) => `Fill "${data?.selector || 'N/A'}" with "${data?.value || ''}"`
  },

  // Health check
  [ChromeCommand.PING]: {
    displayName: 'Ping',
    description: 'Health check',
    formatDetails: () => 'Health check ping'
  }
};

/**
 * Get metadata for a command
 */
export function getCommandMetadata(command: ChromeCommand): CommandMetadata {
  return COMMAND_METADATA[command];
}

/**
 * Format command details for display
 */
export function formatCommandDetails(command: string, data: Record<string, unknown>): string {
  // Check if it's a valid ChromeCommand
  if (Object.values(ChromeCommand).includes(command as ChromeCommand)) {
    const metadata = COMMAND_METADATA[command as ChromeCommand];
    if (metadata.formatDetails) {
      return metadata.formatDetails(data);
    }
    return metadata.description;
  }

  // Fallback for unknown commands
  return command;
}
