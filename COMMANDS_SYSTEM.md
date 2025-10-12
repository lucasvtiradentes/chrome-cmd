# Commands Schema System

This document explains the centralized commands schema system that manages all CLI command definitions.

## Overview

Previously, command information was duplicated across multiple files:
- `completion.ts` - Shell completion scripts
- `help.ts` - Help text
- `README.md` - Documentation
- Individual command files

Now everything is generated from a single source of truth: `src/shared/commands-schema.ts`

## Architecture

```
src/shared/commands-schema.ts          # Single source of truth
    ↓
src/shared/command-builder.ts          # Helper to create Commander.js commands
    ↓
src/shared/generators/
    ├── completion-generator.ts        # Generates bash/zsh scripts
    ├── help-generator.ts              # Generates help text
    └── readme-generator.ts            # Generates README sections
    ↓
src/cli/commands/
    ├── mediator.ts                    # Uses command builder + schema
    ├── extension.ts                   # Uses command builder + schema
    ├── completion.ts                  # Uses command builder + schema
    ├── update.ts                      # Uses command builder + schema
    ├── help.ts                        # Uses generated help
    └── tabs/*.ts                      # Uses command builder + schema
    ↓
scripts/update-readme.ts               # Updates README.md
```

## Adding or Modifying Commands

### 1. Update the Schema

Edit `src/shared/commands-schema.ts`:

```typescript
export const COMMANDS_SCHEMA: Command[] = [
  {
    name: 'tabs',
    description: 'Manage Chrome tabs',
    subcommands: [
      {
        name: 'list',
        description: 'List all open Chrome tabs',
        examples: ['chrome-cmd tabs list']
      },
      // Add new subcommand here
      {
        name: 'newcommand',
        description: 'Description of new command',
        flags: [
          {
            name: '--flag',
            description: 'Flag description',
            type: 'boolean'
          }
        ],
        examples: [
          'chrome-cmd tabs newcommand',
          'chrome-cmd tabs newcommand --flag'
        ]
      }
    ]
  }
];
```

### 2. Update Command Implementation (if needed)

If you need to implement the command logic, use the command builder with **strong typing** and **constants**:

```typescript
// src/cli/commands/mycommand.ts
import {
  createCommandFromSchema,
  createSubCommandFromSchema,
  type TabsExecOptions // Import pre-defined types
} from '../../shared/command-builder.js';
import {
  CommandNames,
  SubCommandNames
} from '../../shared/commands-schema.js';

export function createMyCommand(): Command {
  // ✅ Use constants instead of strings!
  const myCmd = createCommandFromSchema(CommandNames.TABS);

  // Example 1: Command with no arguments (only flags)
  myCmd.addCommand(
    createSubCommandFromSchema(
      CommandNames.TABS,
      SubCommandNames.TABS_LIST,
      async (options: TabsListOptions) => {
        // options is typed as {}
        console.log('Listing tabs...');
      }
    )
  );

  // Example 2: Command with positional argument + flags
  myCmd.addCommand(
    createSubCommandFromSchema(
      CommandNames.TABS,
      SubCommandNames.TABS_EXEC,
      async (code: string, options: TabsExecOptions) => {
        // code is the positional argument (from schema: name: 'code')
        // options is typed as { tab?: number }
        console.log(code);
        console.log(options.tab); // TypeScript knows this is number | undefined
      }
    )
  );

  // Example 3: Command with multiple positional arguments + flags
  myCmd.addCommand(
    createSubCommandFromSchema(
      CommandNames.TABS,
      SubCommandNames.TABS_INPUT,
      async (selector: string, value: string, options: TabsInputOptions) => {
        // selector and value are positional args (from schema)
        // options is typed as { tab?: number; submit?: boolean }
        console.log(selector, value);
        if (options.submit) {
          console.log('Will submit after input');
        }
      }
    )
  );

  return myCmd;
}
```

The command builder automatically:
- ✅ Reads descriptions from schema
- ✅ Adds flags and options from schema
- ✅ Sets up aliases from schema
- ✅ Configures positional arguments from schema
- ✅ **Provides TypeScript types for options** (via exported types)
- ✅ **Uses constants instead of strings** (prevents typos!)

### 3. Rebuild

```bash
npm run build
```

This automatically regenerates:
- ✅ Shell completion scripts (bash/zsh)
- ✅ Help text
- ✅ CLI command structure
- ✅ Commander.js configuration

### 4. Update README (Optional)

If you added markers in README.md:

```bash
npm run update-readme
```

This updates all sections marked with:
```markdown
<!-- BEGIN:SECTION_NAME -->
...content...
<!-- END:SECTION_NAME -->
```

## Schema Structure

### Command Interface

```typescript
interface Command {
  name: string;              // Command name (e.g., 'tabs')
  aliases?: string[];        // Command aliases (e.g., ['ext'])
  description: string;       // Short description
  subcommands?: SubCommand[]; // Nested subcommands
  flags?: CommandFlag[];     // Command-level flags
  examples?: string[];       // Usage examples
}
```

### SubCommand Interface

```typescript
interface SubCommand {
  name: string;              // Subcommand name (e.g., 'list')
  aliases?: string[];        // Subcommand aliases
  description: string;       // Short description
  flags?: CommandFlag[];     // Subcommand-specific flags
  examples?: string[];       // Usage examples
}
```

### CommandFlag Interface

```typescript
interface CommandFlag {
  name: string;              // Flag name (e.g., '--tab' or '-n')
  alias?: string;            // Short alias (e.g., '-t')
  description: string;       // Flag description
  type: 'string' | 'boolean' | 'number';
  required?: boolean;        // Is this flag required?
  choices?: string[];        // Valid values (for enums)
}
```

## README Markers

The README uses HTML comment markers to identify sections that should be auto-generated:

```markdown
<!-- BEGIN:TAB_MANAGEMENT -->
...generated content...
<!-- END:TAB_MANAGEMENT -->
```

### Available Markers

- `TAB_MANAGEMENT` - Tab management commands
- `JAVASCRIPT` - JavaScript execution examples
- `LOGS` - Console logs examples
- `REQUESTS` - Network requests examples
- `HTML` - HTML extraction examples
- `SCREENSHOTS` - Screenshot examples
- `STORAGE` - Storage inspection examples
- `FORM_AUTOMATION` - Form automation examples
- `SYSTEM_COMMANDS` - System commands

## Generators

### Completion Generator

Generates shell completion scripts for bash and zsh:

```typescript
import { generateBashCompletion, generateZshCompletion } from '../../shared/generators/completion-generator';

const ZSH_COMPLETION_SCRIPT = generateZshCompletion();
const BASH_COMPLETION_SCRIPT = generateBashCompletion();
```

### Help Generator

Generates formatted help text:

```typescript
import { generateHelp } from '../../shared/generators/help-generator';

export function displayHelp(): void {
  console.log(generateHelp());
}
```

### README Generator

Generates markdown sections for README:

```typescript
import { generateReadmeSections } from '../src/shared/generators/readme-generator';

const sections = generateReadmeSections();
// Returns: { tabManagement, javascript, logs, ... }
```

## Benefits

### ✅ DRY (Don't Repeat Yourself)
Define commands once, use everywhere

### ✅ Consistency
Impossible to have discrepancies between docs and code

### ✅ Easy Maintenance
Change in one place updates everything

### ✅ Type Safety
TypeScript ensures schema correctness

### ✅ Automation
README updates automatically

## Command Names Constants

The schema exports constants for all command and subcommand names to **prevent typos**:

```typescript
import { CommandNames, SubCommandNames } from './commands-schema.js';

// Instead of this (error-prone):
createSubCommandFromSchema('extension', 'install', handler); // ❌ Can have typos

// Use this (type-safe):
createSubCommandFromSchema(
  CommandNames.EXTENSION,      // ✅ Autocomplete works!
  SubCommandNames.EXTENSION_INSTALL,  // ✅ TypeScript will error if wrong
  handler
);
```

**Available Constants:**

```typescript
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
  TABS_EXEC: 'exec',
  // ... all subcommands

  // Extension
  EXTENSION_INSTALL: 'install',
  EXTENSION_UNINSTALL: 'uninstall',
  EXTENSION_RELOAD: 'reload',

  // ... and more
} as const;
```

**Benefits:**
- ✅ Autocomplete in IDE
- ✅ Compile-time checking
- ✅ Impossible to have typos
- ✅ Refactoring friendly

## Command Builder Utilities

### createCommandFromSchema(commandName)

Creates a Commander.js command from the schema:

```typescript
const mediator = createCommandFromSchema('mediator');
// Automatically sets:
// - .description() from schema
// - .alias() if aliases exist
```

### createSubCommandFromSchema(commandName, subCommandName, action)

Creates a Commander.js subcommand from the schema with **typed options**:

```typescript
import { type TabsExecOptions } from '../../shared/command-builder.js';

const statusCmd = createSubCommandFromSchema(
  'tabs',
  'exec',
  async (code: string, options: TabsExecOptions) => {
    // code: string - positional argument
    // options: { tab?: number } - typed flags
    console.log(code, options.tab);
  }
);
// Automatically sets:
// - .description() from schema
// - .option() for all flags
// - .argument() for positional args
// - .alias() if aliases exist
```

### Exported Types for Strong Typing

All command options are exported as TypeScript types:

```typescript
// Pre-defined types for all tabs commands
export type TabsListOptions = Record<string, never>;
export type TabsFocusOptions = { tab?: number };
export type TabsExecOptions = { tab?: number };
export type TabsLogsOptions = {
  tab?: number;
  n?: number;
  error?: boolean;
  warn?: boolean;
  info?: boolean;
  log?: boolean;
  debug?: boolean;
};
// ... and many more

// Use them in your commands:
createSubCommandFromSchema('tabs', 'logs', async (options: TabsLogsOptions) => {
  if (options.error) {
    // TypeScript knows this is boolean | undefined
    console.log('Show only errors');
  }
});
```

**Benefits:**
- ✅ Autocomplete in your IDE
- ✅ Type checking at compile time
- ✅ Refactoring safety (rename flags in schema, types update automatically)
- ✅ Self-documenting code

### Helper Functions

```typescript
// Get just the description
const desc = getCommandDescription('mediator');
const subDesc = getSubCommandDescription('mediator', 'status');
```

## Workflow Example

**Scenario:** Add a new flag to the `tabs exec` command

1. **Edit schema** (`src/shared/commands-schema.ts`):
```typescript
{
  name: 'exec',
  description: 'Execute JavaScript in selected tab',
  flags: [
    // ... existing flags ...
    {
      name: '--timeout',
      description: 'Execution timeout in ms',
      type: 'number'
    }
  ],
  examples: [
    // ... existing examples ...
    'chrome-cmd tabs exec "document.title" --timeout 5000'
  ]
}
```

2. **The command implementation automatically gets the flag** (via `createSubCommandFromSchema`)

3. **Rebuild**:
```bash
npm run build
```

4. **Update README** (if needed):
```bash
npm run update-readme
```

5. **Done!** 🎉
   - Shell completion now suggests `--timeout`
   - Help text shows the new flag
   - README examples include it
   - Commander.js command has the option configured

## Scripts

### `npm run build`
Builds the project and regenerates all generated code

### `npm run update-readme`
Updates README.md sections based on schema

### `npm run dev -- --help`
Test help output during development

## Files Reference

### Source of Truth
- `src/shared/commands-schema.ts` - **Edit this to change commands**

### Command Builder
- `src/shared/command-builder.ts` - Creates Commander.js commands from schema

### Generators
- `src/shared/generators/completion-generator.ts`
- `src/shared/generators/help-generator.ts`
- `src/shared/generators/readme-generator.ts`

### Consumers
- `src/cli/commands/*.ts` - All commands use command-builder
- `src/cli/commands/tabs/*.ts` - All tab commands use command-builder
- `scripts/update-readme.ts`

### Generated Output
- Shell completion scripts (in memory)
- Help text (in memory)
- README.md sections (on disk)

## Migration Notes

The old hardcoded strings have been removed from:
- ❌ `completion.ts` - Now uses `generateZshCompletion()` and `generateBashCompletion()`
- ❌ `help.ts` - Now uses `generateHelp()`
- ✅ `README.md` - Now has markers for auto-updating

## Future Improvements

Potential enhancements:
1. Auto-generate command implementation stubs
2. Validate command implementations match schema
3. Generate TypeScript types for command options
4. Create interactive command builder
5. Add command deprecation warnings
