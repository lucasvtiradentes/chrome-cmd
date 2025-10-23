// ============================================================================
// CLI Command Definitions (Command, SubCommand, COMMANDS_SCHEMA)
// ============================================================================

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
  COMPLETION: 'completion',
  INSTALL: 'install',
  UPDATE: 'update'
} as const;

export enum ProtocolCommand {
  TAB_LIST = 'TAB_LIST',
  TAB_FOCUS = 'TAB_FOCUS',
  TAB_CREATE = 'TAB_CREATE',
  TAB_NAVIGATE = 'TAB_NAVIGATE',
  TAB_EXEC = 'TAB_EXEC',
  TAB_CLOSE = 'TAB_CLOSE',
  TAB_REFRESH = 'TAB_REFRESH',
  TAB_SCREENSHOT = 'TAB_SCREENSHOT',
  TAB_HTML = 'TAB_HTML',
  TAB_LOGS = 'TAB_LOGS',
  TAB_REQUESTS = 'TAB_REQUESTS',
  TAB_STORAGE = 'TAB_STORAGE',
  TAB_CLICK = 'TAB_CLICK',
  TAB_INPUT = 'TAB_INPUT',

  PING = 'PING',
  RELOAD_EXTENSION = 'RELOAD_EXTENSION',
  GET_PROFILE_INFO = 'GET_PROFILE_INFO',
  REGISTER = 'REGISTER',
  START_LOGGING = 'START_LOGGING',
  STOP_LOGGING = 'STOP_LOGGING',
  CLEAR_TAB_LOGS = 'CLEAR_TAB_LOGS',
  CLEAR_TAB_REQUESTS = 'CLEAR_TAB_REQUESTS',
  CLICK_ELEMENT_BY_TEXT = 'CLICK_ELEMENT_BY_TEXT'
}

export const INTERNAL_COMMANDS = new Set<string>([
  ProtocolCommand.PING,
  ProtocolCommand.RELOAD_EXTENSION,
  ProtocolCommand.GET_PROFILE_INFO,
  ProtocolCommand.REGISTER,
  ProtocolCommand.START_LOGGING,
  ProtocolCommand.STOP_LOGGING,
  ProtocolCommand.CLEAR_TAB_LOGS,
  ProtocolCommand.CLEAR_TAB_REQUESTS,
  ProtocolCommand.CLICK_ELEMENT_BY_TEXT,
  'keepalive'
]);

export function isInternalCommand(command: string): boolean {
  return INTERNAL_COMMANDS.has(command);
}

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
