<div align="center">
<a href="https://linear.app" target="_blank" rel="noopener noreferrer">
  <img width="64" src="https://raw.githubusercontent.com/linear/linear/master/docs/logo.svg" alt="Linear logo">
</a>
<h2>Linear cmd</h2>
<p>A GitHub CLI-like tool for Linear</p>
<p>
  <a href="https://www.npmjs.com/package/linear-cmd"><img src="https://img.shields.io/npm/v/linear-cmd.svg" alt="npm version"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <br>
  <a href="#star-features">Features</a> • <a href="#question-motivation">Motivation</a> • <a href="#rocket-quick-start">Quick Start</a> • <a href="#bulb-usage">Usage</a> • <a href="#wrench-development">Development</a>
</p>

</div>

## :star: Features

- **Multi-account support** - Manage multiple Linear accounts
- **Complete issue management** - Create, list, update, comment
- **Project & document support** - Full project and document operations
- **Smart account discovery** - Automatically finds the right account
- **Advanced filtering** - Filter by assignee, state, labels, teams
- **Self-updating** - Built-in update mechanism

## :question: Motivation

Why build this when we already have [Linear MCP](https://linear.app/docs/mcp)?

Because I want to paste a Linear issue link into [Claude Code](https://www.anthropic.com/claude-code) and have it work with multiple Linear accounts (work + personal).

## :rocket: Quick Start

```bash
# Install
npm install linear-cmd -g

# Setup account
linear account add

# Start using
linear issue show WORK-123
```

## :bulb: Usage

### Commands Overview

```bash
linear --help                    # Show help
linear update                    # Update to latest version
```

<details>
<summary><b>Account Management</b></summary>

```bash
linear account add               # Add account
linear account list              # List accounts
linear account remove [NAME]     # Remove account
linear account test              # Test connection
```

</details>

<details>
<summary><b>Issue Operations</b></summary>

```bash
# View issues
linear issue show <url|ID>
linear issue show WORK-123 --account work

# List issues (grouped by status)
linear issue list -a work
linear issue list -a work --assignee me
linear issue list -a work --state "In Progress"
linear issue list -a work --team "TES"

# Create issue
linear issue create -a work
linear issue create -a work --team "TES" --title "Bug fix"

# Update issue
linear issue update WORK-123
linear issue update WORK-123 --state "Done"

# Add comment
linear issue comment WORK-123
linear issue comment WORK-123 "Nice work!"
```

</details>

<details>
<summary><b>Project Operations</b></summary>

```bash
linear project list -a work           # List projects
linear project show <project-url>     # Show details
linear project issues <project-url>   # List project issues
linear project create -a work         # Create project
linear project delete <project-url>   # Delete project
```

</details>

<details>
<summary><b>Document Operations</b></summary>

```bash
linear document show <document-url>    # Show document
linear document add -a work            # Create document
linear document delete <document-url>  # Delete document
```

</details>

<details>
<summary><b>Shell Completion</b></summary>

```bash
# Install completion
linear completion install

# Reload shell
source ~/.zshrc   # for zsh
source ~/.bashrc  # for bash

# Use tab completion
linear <TAB>
linear issue <TAB>
```

</details>

## :wrench: Development

```bash
pnpm install                     # Install dependencies
pnpm run dev                     # Run in development
pnpm run build                   # Build for production
pnpm run test:e2e                # Run E2E tests
```

## :scroll: License

MIT License - see [LICENSE](LICENSE) file for details.
