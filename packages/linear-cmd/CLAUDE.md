# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Build & Development
- `npm run build` - Build TypeScript to dist/
- `npm run dev` - Run TypeScript directly with tsx
- `npm run typecheck` - Check TypeScript types without emitting

### Testing
- `npm run test:e2e` - Run E2E tests (requires LINEAR_API_KEY_E2E env var, 60s timeout)

### Linting & Formatting
- `npm run lint` - Run Biome linter with auto-fix
- `npm run format` - Format code with Biome

## Architecture Overview

This is a CLI tool for Linear.app that provides GitHub CLI-like functionality. Key architectural decisions:

### Command Structure
Commands follow a hierarchical pattern using Commander.js:
- `linear account [add|list|remove|test]` - Account management
- `linear issue [show|create|list|update|comment]` - Issue operations
- `linear project [list|show|issues|create|delete]` - Project management
- `linear document [show|add|delete]` - Document management
- `linear update` - Self-update functionality
- `linear completion install` - Shell completion management

Each command is modular and self-contained in `src/commands/`.

**⚠️ IMPORTANT: Shell Completion Maintenance**
When adding, removing, or modifying commands/subcommands/flags, you MUST update the shell completion scripts in `src/commands/completion.ts`:
- Update `ZSH_COMPLETION_SCRIPT`:
  - Add/modify command and subcommand definitions in `_linear_*_commands` functions
  - Add/modify flags in the corresponding `_arguments` blocks within case statements
  - Include flag descriptions, value completions (e.g., formats, priorities), and argument placeholders
- Update `BASH_COMPLETION_SCRIPT`:
  - Add/modify command lists (e.g., `issue_commands`, `project_commands`)
  - Add/modify flag completions in the `\$cword -ge 3` case statement
  - Include value completions for flags (e.g., `--format` → `pretty json`, `--priority` → `0 1 2 3 4`)
- Test completion works: `npm run build && node dist/index.js completion install`
- Both scripts support:
  - Command and subcommand completion
  - Flag completion (short and long forms: `-f`, `--format`)
  - Context-aware value completion (e.g., formats, priorities, states)
  - Help text for each option

### Configuration Management
The `ConfigManager` class handles all configuration:
- Configs stored in OS-specific directories (Linux: `~/.config/linear-cmd/`)
- Uses JSON5 format for human-readable configs
- Two-tier system: `user_metadata.json` points to active `config.json5`
- Supports multiple Linear accounts with automatic workspace detection

### Linear API Integration
The `LinearAPIClient` wraps the official `@linear/sdk`:
- Smart account detection from issue URLs
- Workspace caching for optimal account selection
- API keys stored securely in local config

### Type Safety
- Uses Zod for runtime validation and type generation
- Strict TypeScript configuration
- Clear separation between Linear API types and internal types

### Testing Strategy
E2E testing approach:
- E2E tests: Full command flows with real API (run sequentially to avoid rate limits)

### Key Design Patterns
- Command Pattern for CLI commands
- Singleton Pattern for ConfigManager
- Adapter Pattern for LinearAPIClient
- Repository Pattern for account data management

## Important Notes

- Always check for existing patterns before implementing new features
- The project uses Biome for linting/formatting, not ESLint/Prettier
- Tests run sequentially in E2E to avoid Linear API rate limits
- Multi-account support is a core feature - maintain compatibility
- Error messages should be user-friendly with helpful hints
- Cross-platform compatibility is required (Linux, macOS, Windows, WSL)