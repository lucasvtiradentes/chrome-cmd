import { CLI_NAME } from '../../constants/constants';
import { type Command, CommandNames, SubCommandNames } from '../cli-command';

export const tabCommandDefinition: Command = {
  name: CommandNames.TAB,
  description: 'Manage Chrome tabs',
  subcommands: [
    {
      name: SubCommandNames.TAB_LIST,
      description: 'List all open Chrome tabs',
      examples: [`${CLI_NAME} tab list`],
      icon: '📋'
    },
    {
      name: SubCommandNames.TAB_SELECT,
      description: 'Select tab for subsequent commands',
      flags: [
        {
          name: '--tab',
          description: 'Tab index to select (shows interactive list if not provided)',
          type: 'number'
        }
      ],
      examples: [`${CLI_NAME} tab select`, `${CLI_NAME} tab select --tab 1`]
    },
    {
      name: SubCommandNames.TAB_FOCUS,
      description: 'Focus/activate a tab (bring to front)',
      flags: [
        {
          name: '--tab',
          description: 'Override selected tab',
          type: 'number'
        }
      ],
      examples: [`${CLI_NAME} tab focus`, `${CLI_NAME} tab focus --tab 3`],
      icon: '🎯',
      formatDetails: (data) => `Activate tab ${data?.tabId || 'N/A'}`
    },
    {
      name: SubCommandNames.TAB_CREATE,
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
      ],
      icon: '➕',
      formatDetails: (data) => `Create tab: ${data?.url || 'about:blank'}`
    },
    {
      name: SubCommandNames.TAB_NAVIGATE,
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
      examples: [`${CLI_NAME} tab navigate https://github.com`, `${CLI_NAME} tab navigate https://github.com --tab 2`],
      icon: '🧭',
      formatDetails: (data) => `Navigate to: ${data?.url || 'N/A'}`
    },
    {
      name: SubCommandNames.TAB_EXEC,
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
      ],
      icon: '⚡',
      formatDetails: (data) => {
        const code = data?.code as string;
        if (!code) return 'Run JavaScript code';
        return code.length > 50 ? `Execute: ${code.substring(0, 50)}...` : `Execute: ${code}`;
      }
    },
    {
      name: SubCommandNames.TAB_CLOSE,
      description: 'Close selected tab',
      flags: [
        {
          name: '--tab',
          description: 'Override selected tab',
          type: 'number'
        }
      ],
      examples: [`${CLI_NAME} tab close`],
      icon: '✖️',
      formatDetails: (data) => `Close tab ${data?.tabId || 'N/A'}`
    },
    {
      name: SubCommandNames.TAB_REFRESH,
      description: 'Reload/refresh selected tab',
      flags: [
        {
          name: '--tab',
          description: 'Override selected tab',
          type: 'number'
        }
      ],
      examples: [`${CLI_NAME} tab refresh`],
      icon: '🔄',
      formatDetails: (data) => `Reload tab ${data?.tabId || 'current'}`
    },
    {
      name: SubCommandNames.TAB_SCREENSHOT,
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
      ],
      icon: '📸',
      formatDetails: (data) => `Screenshot (${data?.format || 'png'})`
    },
    {
      name: SubCommandNames.TAB_HTML,
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
          name: '--include-compacted-tags',
          description: 'Include SVG and style tags',
          type: 'boolean'
        }
      ],
      examples: [
        `${CLI_NAME} tab html`,
        `${CLI_NAME} tab html --selector "div.content"`,
        `${CLI_NAME} tab html --raw`,
        `${CLI_NAME} tab html --include-compacted-tags`
      ]
    },
    {
      name: SubCommandNames.TAB_LOGS,
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
      name: SubCommandNames.TAB_REQUESTS,
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
      name: SubCommandNames.TAB_STORAGE,
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
      name: SubCommandNames.TAB_CLICK,
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
      name: SubCommandNames.TAB_INPUT,
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
};
