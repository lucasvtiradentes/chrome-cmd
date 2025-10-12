import { APP_NAME } from './constants';

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
  TABS: 'tabs',
  EXTENSION: 'extension',
  MEDIATOR: 'mediator',
  UPDATE: 'update',
  COMPLETION: 'completion'
} as const;

export const SubCommandNames = {
  // Tabs
  TABS_LIST: 'list',
  TABS_SELECT: 'select',
  TABS_FOCUS: 'focus',
  TABS_CREATE: 'create',
  TABS_NAVIGATE: 'navigate',
  TABS_EXEC: 'exec',
  TABS_CLOSE: 'close',
  TABS_REFRESH: 'refresh',
  TABS_SCREENSHOT: 'screenshot',
  TABS_HTML: 'html',
  TABS_LOGS: 'logs',
  TABS_REQUESTS: 'requests',
  TABS_STORAGE: 'storage',
  TABS_CLICK: 'click',
  TABS_INPUT: 'input',
  // Extension
  EXTENSION_INSTALL: 'install',
  EXTENSION_UNINSTALL: 'uninstall',
  EXTENSION_RELOAD: 'reload',
  // Mediator
  MEDIATOR_STATUS: 'status',
  MEDIATOR_KILL: 'kill',
  MEDIATOR_RESTART: 'restart',
  // Completion
  COMPLETION_INSTALL: 'install'
} as const;

export const COMMANDS_SCHEMA: Command[] = [
  {
    name: 'tabs',
    description: 'Manage Chrome tabs',
    subcommands: [
      {
        name: 'list',
        description: 'List all open Chrome tabs',
        examples: [`${APP_NAME} tabs list`]
      },
      {
        name: 'select',
        description: 'Select tab for subsequent commands',
        flags: [
          {
            name: 'index',
            description: 'Tab index to select',
            type: 'number',
            required: true
          }
        ],
        examples: [`${APP_NAME} tabs select 1`]
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
        examples: [`${APP_NAME} tabs focus`, `${APP_NAME} tabs focus --tab 3`]
      },
      {
        name: 'create',
        description: 'Create a new tab',
        flags: [
          {
            name: 'url',
            description: 'URL to open (optional, blank tab if not provided)',
            type: 'string'
          },
          {
            name: '--background',
            description: "Open in background (don't focus)",
            type: 'boolean'
          }
        ],
        examples: [
          `${APP_NAME} tabs create https://google.com`,
          `${APP_NAME} tabs create https://google.com --background`,
          `${APP_NAME} tabs create`
        ]
      },
      {
        name: 'navigate',
        description: 'Navigate tab to a specific URL',
        flags: [
          {
            name: 'url',
            description: 'URL to navigate to',
            type: 'string',
            required: true
          },
          {
            name: '--tab',
            description: 'Override selected tab',
            type: 'number'
          }
        ],
        examples: [
          `${APP_NAME} tabs navigate https://github.com`,
          `${APP_NAME} tabs navigate https://github.com --tab 2`
        ]
      },
      {
        name: 'exec',
        description: 'Execute JavaScript in selected tab',
        flags: [
          {
            name: 'code',
            description: 'JavaScript code to execute',
            type: 'string',
            required: true
          },
          {
            name: '--tab',
            description: 'Override selected tab',
            type: 'number'
          }
        ],
        examples: [
          `${APP_NAME} tabs exec "document.title"`,
          `${APP_NAME} tabs exec "document.images.length"`,
          `${APP_NAME} tabs exec "Array.from(document.querySelectorAll('a')).map(a => a.href)"`,
          `${APP_NAME} tabs exec "2 + 2"`
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
        examples: [`${APP_NAME} tabs close`]
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
        examples: [`${APP_NAME} tabs refresh`]
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
          }
        ],
        examples: [
          `${APP_NAME} tabs screenshot`,
          `${APP_NAME} tabs screenshot --output ~/Downloads/page.png`,
          `${APP_NAME} tabs screenshot --tab 2`
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
          `${APP_NAME} tabs html`,
          `${APP_NAME} tabs html --selector "div.content"`,
          `${APP_NAME} tabs html --raw`,
          `${APP_NAME} tabs html --full`
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
          `${APP_NAME} tabs logs`,
          `${APP_NAME} tabs logs -n 100`,
          `${APP_NAME} tabs logs --error`,
          `${APP_NAME} tabs logs --warn`,
          `${APP_NAME} tabs logs --info --log --debug`,
          `${APP_NAME} tabs logs --error --warn`
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
          `${APP_NAME} tabs requests`,
          `${APP_NAME} tabs requests -n 100`,
          `${APP_NAME} tabs requests --method GET`,
          `${APP_NAME} tabs requests --method POST`,
          `${APP_NAME} tabs requests --status 200`,
          `${APP_NAME} tabs requests --status 404`,
          `${APP_NAME} tabs requests --url "/api"`,
          `${APP_NAME} tabs requests --url "google.com"`,
          `${APP_NAME} tabs requests --all`,
          `${APP_NAME} tabs requests --failed`,
          `${APP_NAME} tabs requests --body`,
          `${APP_NAME} tabs requests --headers`,
          `${APP_NAME} tabs requests --method POST --status 200 --url "/api"`
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
          `${APP_NAME} tabs storage`,
          `${APP_NAME} tabs storage --cookies`,
          `${APP_NAME} tabs storage --local`,
          `${APP_NAME} tabs storage --session`
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
        examples: [`${APP_NAME} tabs click --selector "button.submit"`, `${APP_NAME} tabs click --text "Sign In"`]
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
          `${APP_NAME} tabs input --selector "#username" --value "myuser"`,
          `${APP_NAME} tabs input --selector "#search" --value "query" --submit`
        ]
      }
    ]
  },
  {
    name: 'extension',
    aliases: ['ext'],
    description: 'Manage Chrome extension',
    subcommands: [
      {
        name: 'install',
        description: 'Install Chrome extension (interactive setup)',
        examples: [`${APP_NAME} extension install`]
      },
      {
        name: 'uninstall',
        description: 'Uninstall Chrome extension and remove configuration',
        examples: [`${APP_NAME} extension uninstall`]
      },
      {
        name: 'reload',
        description: 'Reload the Chrome extension',
        examples: [`${APP_NAME} extension reload`]
      }
    ]
  },
  {
    name: 'mediator',
    description: 'Manage mediator server',
    subcommands: [
      {
        name: 'status',
        description: 'Check mediator server status',
        examples: [`${APP_NAME} mediator status`]
      },
      {
        name: 'kill',
        description: 'Kill mediator server process',
        examples: [`${APP_NAME} mediator kill`]
      },
      {
        name: 'restart',
        description: 'Restart mediator server',
        examples: [`${APP_NAME} mediator restart`]
      }
    ]
  },
  {
    name: 'update',
    description: `Update ${APP_NAME} to latest version`,
    examples: [`${APP_NAME} update`]
  },
  {
    name: 'completion',
    description: 'Generate shell completion scripts',
    subcommands: [
      {
        name: 'install',
        description: 'Install shell completion',
        examples: [`${APP_NAME} completion install`]
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
