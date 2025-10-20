import { CLI_NAME } from '../constants/constants-node.js';

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
}

export interface Command {
  name: string;
  aliases?: string[];
  description: string;
  subcommands?: SubCommand[];
  flags?: CommandFlag[];
  examples?: string[];
}

// ============================================================================
// Command Names Constants - Use these instead of strings
// ============================================================================

export const CommandNames = {
  TAB: 'tab',
  PROFILE: 'profile',
  INSTALL: 'install',
  UPDATE: 'update',
  COMPLETION: 'completion'
} as const;

export const SubCommandNames = {
  // Tab
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
  // Profile
  PROFILE_REMOVE: 'remove',
  PROFILE_SELECT: 'select',
  // Completion
  COMPLETION_INSTALL: 'install',
  COMPLETION_UNINSTALL: 'uninstall'
} as const;

export const COMMANDS_SCHEMA: Command[] = [
  {
    name: 'tab',
    description: 'Manage Chrome tabs',
    subcommands: [
      {
        name: 'list',
        description: 'List all open Chrome tabs',
        examples: [`${CLI_NAME} tab list`]
      },
      {
        name: 'select',
        description: 'Select tab for subsequent commands',
        arguments: [
          {
            name: 'index',
            description: 'Tab index to select',
            type: 'number',
            required: true
          }
        ],
        examples: [`${CLI_NAME} tab select 1`]
      },
      {
        name: 'focus',
        description: 'Focus/activate a tab (bring to front)',
        flags: [
          {
            name: '--tab',
            description: 'Override selected tab',
            type: 'number'
          }
        ],
        examples: [`${CLI_NAME} tab focus`, `${CLI_NAME} tab focus --tab 3`]
      },
      {
        name: 'create',
        description: 'Create a new tab',
        arguments: [
          {
            name: 'url',
            description: 'URL to open (optional, blank tab if not provided)',
            type: 'string'
          }
        ],
        flags: [
          {
            name: '--background',
            description: "Open in background (don't focus)",
            type: 'boolean'
          }
        ],
        examples: [
          `${CLI_NAME} tab create https://google.com`,
          `${CLI_NAME} tab create https://google.com --background`,
          `${CLI_NAME} tab create`
        ]
      },
      {
        name: 'navigate',
        description: 'Navigate tab to a specific URL',
        arguments: [
          {
            name: 'url',
            description: 'URL to navigate to',
            type: 'string',
            required: true
          }
        ],
        flags: [
          {
            name: '--tab',
            description: 'Override selected tab',
            type: 'number'
          }
        ],
        examples: [`${CLI_NAME} tab navigate https://github.com`, `${CLI_NAME} tab navigate https://github.com --tab 2`]
      },
      {
        name: 'exec',
        description: 'Execute JavaScript in selected tab',
        arguments: [
          {
            name: 'code',
            description: 'JavaScript code to execute',
            type: 'string',
            required: true
          }
        ],
        flags: [
          {
            name: '--tab',
            description: 'Override selected tab',
            type: 'number'
          }
        ],
        examples: [
          `${CLI_NAME} tab exec "document.title"`,
          `${CLI_NAME} tab exec "document.images.length"`,
          `${CLI_NAME} tab exec "Array.from(document.querySelectorAll('a')).map(a => a.href)"`,
          `${CLI_NAME} tab exec "2 + 2"`
        ]
      },
      {
        name: 'close',
        description: 'Close selected tab',
        flags: [
          {
            name: '--tab',
            description: 'Override selected tab',
            type: 'number'
          }
        ],
        examples: [`${CLI_NAME} tab close`]
      },
      {
        name: 'refresh',
        description: 'Reload/refresh selected tab',
        flags: [
          {
            name: '--tab',
            description: 'Override selected tab',
            type: 'number'
          }
        ],
        examples: [`${CLI_NAME} tab refresh`]
      },
      {
        name: 'screenshot',
        description: 'Capture screenshot of selected tab',
        flags: [
          {
            name: '--tab',
            description: 'Override selected tab',
            type: 'number'
          },
          {
            name: '--output',
            description: 'Output file path',
            type: 'string'
          },
          {
            name: '--only-viewport',
            description: 'Capture only visible viewport (not full page)',
            type: 'boolean'
          }
        ],
        examples: [
          `${CLI_NAME} tab screenshot`,
          `${CLI_NAME} tab screenshot --output ~/Downloads/page.png`,
          `${CLI_NAME} tab screenshot --tab 2`,
          `${CLI_NAME} tab screenshot --only-viewport`
        ]
      },
      {
        name: 'html',
        description: 'Extract HTML content from selected tab',
        flags: [
          {
            name: '--tab',
            description: 'Override selected tab',
            type: 'number'
          },
          {
            name: '--selector',
            description: 'CSS selector',
            type: 'string'
          },
          {
            name: '--raw',
            description: 'Output raw HTML',
            type: 'boolean'
          },
          {
            name: '--full',
            description: 'Include SVG and style tags',
            type: 'boolean'
          }
        ],
        examples: [
          `${CLI_NAME} tab html`,
          `${CLI_NAME} tab html --selector "div.content"`,
          `${CLI_NAME} tab html --raw`,
          `${CLI_NAME} tab html --full`
        ]
      },
      {
        name: 'logs',
        description: 'Get console logs from selected tab',
        flags: [
          {
            name: '--tab',
            description: 'Override selected tab',
            type: 'number'
          },
          {
            name: '-n',
            description: 'Show only last N logs',
            type: 'number'
          },
          {
            name: '--error',
            description: 'Show only error messages',
            type: 'boolean'
          },
          {
            name: '--warn',
            description: 'Show only warning messages',
            type: 'boolean'
          },
          {
            name: '--info',
            description: 'Show only info messages',
            type: 'boolean'
          },
          {
            name: '--log',
            description: 'Show only log messages',
            type: 'boolean'
          },
          {
            name: '--debug',
            description: 'Show only debug messages',
            type: 'boolean'
          }
        ],
        examples: [
          `${CLI_NAME} tab logs`,
          `${CLI_NAME} tab logs -n 100`,
          `${CLI_NAME} tab logs --error`,
          `${CLI_NAME} tab logs --warn`,
          `${CLI_NAME} tab logs --info --log --debug`,
          `${CLI_NAME} tab logs --error --warn`
        ]
      },
      {
        name: 'requests',
        description: 'Get network requests from selected tab',
        flags: [
          {
            name: '--tab',
            description: 'Override selected tab',
            type: 'number'
          },
          {
            name: '-n',
            description: 'Show only last N requests',
            type: 'number'
          },
          {
            name: '--method',
            description: 'Filter by HTTP method',
            type: 'string'
          },
          {
            name: '--status',
            description: 'Filter by status code',
            type: 'number'
          },
          {
            name: '--url',
            description: 'Filter by URL pattern',
            type: 'string'
          },
          {
            name: '--failed',
            description: 'Show only failed requests',
            type: 'boolean'
          },
          {
            name: '--all',
            description: 'Show all request types',
            type: 'boolean'
          },
          {
            name: '--body',
            description: 'Include response bodies',
            type: 'boolean'
          },
          {
            name: '--headers',
            description: 'Include request and response headers',
            type: 'boolean'
          }
        ],
        examples: [
          `${CLI_NAME} tab requests`,
          `${CLI_NAME} tab requests -n 100`,
          `${CLI_NAME} tab requests --method GET`,
          `${CLI_NAME} tab requests --method POST`,
          `${CLI_NAME} tab requests --status 200`,
          `${CLI_NAME} tab requests --status 404`,
          `${CLI_NAME} tab requests --url "/api"`,
          `${CLI_NAME} tab requests --url "google.com"`,
          `${CLI_NAME} tab requests --all`,
          `${CLI_NAME} tab requests --failed`,
          `${CLI_NAME} tab requests --body`,
          `${CLI_NAME} tab requests --headers`,
          `${CLI_NAME} tab requests --method POST --status 200 --url "/api"`
        ]
      },
      {
        name: 'storage',
        description: 'Get storage data from selected tab',
        flags: [
          {
            name: '--tab',
            description: 'Override selected tab',
            type: 'number'
          },
          {
            name: '--cookies',
            description: 'Show only cookies',
            type: 'boolean'
          },
          {
            name: '--local',
            description: 'Show only localStorage',
            type: 'boolean'
          },
          {
            name: '--session',
            description: 'Show only sessionStorage',
            type: 'boolean'
          }
        ],
        examples: [
          `${CLI_NAME} tab storage`,
          `${CLI_NAME} tab storage --cookies`,
          `${CLI_NAME} tab storage --local`,
          `${CLI_NAME} tab storage --session`
        ]
      },
      {
        name: 'click',
        description: 'Click on an element in selected tab',
        flags: [
          {
            name: '--tab',
            description: 'Override selected tab',
            type: 'number'
          },
          {
            name: '--selector',
            description: 'CSS selector of element',
            type: 'string'
          },
          {
            name: '--text',
            description: 'Find element by text content',
            type: 'string'
          }
        ],
        examples: [`${CLI_NAME} tab click --selector "button.submit"`, `${CLI_NAME} tab click --text "Sign In"`]
      },
      {
        name: 'input',
        description: 'Fill an input field in selected tab',
        flags: [
          {
            name: '--tab',
            description: 'Override selected tab',
            type: 'number'
          },
          {
            name: '--selector',
            description: 'CSS selector of input element',
            type: 'string',
            required: true
          },
          {
            name: '--value',
            description: 'Value to fill',
            type: 'string',
            required: true
          },
          {
            name: '--submit',
            description: 'Press Enter after filling',
            type: 'boolean'
          }
        ],
        examples: [
          `${CLI_NAME} tab input --selector "#username" --value "myuser"`,
          `${CLI_NAME} tab input --selector "#search" --value "query" --submit`
        ]
      }
    ]
  },
  {
    name: 'profile',
    description: 'Manage extension profiles',
    subcommands: [
      {
        name: 'remove',
        description: 'Remove profile and native host configuration',
        examples: [`${CLI_NAME} profile remove`]
      },
      {
        name: 'select',
        description: 'Select active profile from configured profiles',
        examples: [`${CLI_NAME} profile select`]
      }
    ]
  },
  {
    name: 'install',
    description: 'Install Chrome CMD extension and setup native messaging',
    examples: [`${CLI_NAME} install`]
  },
  {
    name: 'update',
    description: `Update ${CLI_NAME} to latest version`,
    examples: [`${CLI_NAME} update`]
  },
  {
    name: 'completion',
    description: 'Manage shell completion scripts',
    subcommands: [
      {
        name: 'install',
        description: 'Install shell completion',
        examples: [`${CLI_NAME} completion install`]
      },
      {
        name: 'uninstall',
        description: 'Uninstall shell completion',
        examples: [`${CLI_NAME} completion uninstall`]
      }
    ]
  }
];

// Helper functions to work with the schema
export function getAllCommands(): Command[] {
  return COMMANDS_SCHEMA;
}

export function getCommand(name: string): Command | undefined {
  return COMMANDS_SCHEMA.find((cmd) => cmd.name === name || cmd.aliases?.includes(name));
}

export function getSubCommand(commandName: string, subCommandName: string): SubCommand | undefined {
  const command = getCommand(commandName);
  return command?.subcommands?.find((sub) => sub.name === subCommandName || sub.aliases?.includes(subCommandName));
}
