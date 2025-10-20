// ============================================================================
// CLI Command Definitions (Command, SubCommand, COMMANDS_SCHEMA)
// ============================================================================

import type { ChromeCommand } from './chrome-command';

export interface CommandArgument {
  name: string;
  description: string;
  type: 'string' | 'number';
  required?: boolean;
}

export interface CommandFlag {
  name: string;
  alias?: string;
  description: string;
  type: 'string' | 'boolean' | 'number';
  required?: boolean;
  choices?: string[];
}

export interface SubCommand {
  name: string;
  aliases?: string[];
  description: string;
  arguments?: CommandArgument[];
  flags?: CommandFlag[];
  examples?: string[];
  bashCompletion?: string;
  zshCompletion?: string;
  icon?: string;
  chromeCommand?: ChromeCommand;
  formatDetails?: (data: Record<string, unknown>) => string;
  isInternal?: boolean;
}

export interface Command {
  name: string;
  aliases?: string[];
  description: string;
  subcommands?: SubCommand[];
  flags?: CommandFlag[];
  examples?: string[];
}

export const CommandNames = {
  TAB: 'tab',
  PROFILE: 'profile',
  INSTALL: 'install',
  UPDATE: 'update',
  COMPLETION: 'completion'
} as const;

export const SubCommandNames = {
  TAB_LIST: 'list',
  TAB_SELECT: 'select',
  TAB_FOCUS: 'focus',
  TAB_CREATE: 'create',
  TAB_NAVIGATE: 'navigate',
  TAB_EXEC: 'exec',
  TAB_CLOSE: 'close',
  TAB_REFRESH: 'refresh',
  TAB_SCREENSHOT: 'screenshot',
  TAB_HTML: 'html',
  TAB_LOGS: 'logs',
  TAB_REQUESTS: 'requests',
  TAB_STORAGE: 'storage',
  TAB_CLICK: 'click',
  TAB_INPUT: 'input',
  PROFILE_REMOVE: 'remove',
  PROFILE_SELECT: 'select',
  COMPLETION_INSTALL: 'install',
  COMPLETION_UNINSTALL: 'uninstall'
} as const;
