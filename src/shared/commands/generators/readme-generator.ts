import { COMMANDS_SCHEMA, type SubCommand } from '../commands-definitions.js';

function _formatSubCommandForReadme(sub: SubCommand): string {
  let output = `# ${sub.name}\n`;

  if (sub.description) {
    output += `${sub.description}\n\n`;
  }

  if (sub.examples && sub.examples.length > 0) {
    output += '```bash\n';
    output += sub.examples.join('\n');
    output += '\n```\n';
  }

  if (sub.flags && sub.flags.length > 0) {
    output += '\n**Flags:**\n';
    for (const flag of sub.flags) {
      output += `- \`${flag.name}\`: ${flag.description}${flag.required ? ' (required)' : ''}\n`;
    }
  }

  return output;
}

function generateTabManagementSection(): string {
  const tabsCommand = COMMANDS_SCHEMA.find((cmd) => cmd.name === 'tab');
  if (!tabsCommand || !tabsCommand.subcommands) return '';

  let output = '```bash\n';

  for (const sub of tabsCommand.subcommands) {
    if (sub.examples && sub.examples.length > 0) {
      output += `# ${sub.description}\n`;
      output += `${sub.examples.join('\n')}\n\n`;
    }
  }

  output += '```\n';
  return output;
}

function generateJavaScriptSection(): string {
  const tabsCommand = COMMANDS_SCHEMA.find((cmd) => cmd.name === 'tab');
  const execSubCommand = tabsCommand?.subcommands?.find((sub) => sub.name === 'exec');

  if (!execSubCommand || !execSubCommand.examples) return '';

  let output = '```bash\n';
  output += '# Execute JavaScript on selected tab\n';
  output += `${execSubCommand.examples[0]}\n`;
  output += '# Output: "GitHub - Chrome CLI"\n\n';
  output += '# More examples\n';
  output += `${execSubCommand.examples.slice(1).join('\n')}\n`;
  output += '```\n';

  return output;
}

function generateSubCommandSection(commandName: string, subCommandName: string): string {
  const command = COMMANDS_SCHEMA.find((cmd) => cmd.name === commandName);
  const subCommand = command?.subcommands?.find((sub) => sub.name === subCommandName);

  if (!subCommand || !subCommand.examples) return '';

  let output = '```bash\n';

  for (const example of subCommand.examples) {
    output += `${example}\n`;
  }

  // Add specific notes based on command
  if (commandName === 'tab') {
    if (subCommandName === 'logs') {
      output += '```\n\n**Features:** Color-coded output, smart object formatting, type filtering, adjustable limit\n';
      return output;
    }
    if (subCommandName === 'requests') {
      output +=
        '```\n\n**Captured data:** URL, method, status, headers, payload, response body, timing, type, errors\n';
      return output;
    }
    if (subCommandName === 'html') {
      output += '```\n\n**Features:** Pretty printing, CSS selectors, token optimization, raw mode\n';
      return output;
    }
    if (subCommandName === 'storage') {
      output += '```\n\n**Data includes:** Cookie flags, expiry, size, key-value pairs\n';
      return output;
    }
  }

  output += '```\n';
  return output;
}

function generateSystemCommandsSection(): string {
  const installCmd = COMMANDS_SCHEMA.find((cmd) => cmd.name === 'install');
  const updateCmd = COMMANDS_SCHEMA.find((cmd) => cmd.name === 'update');
  const completionCmd = COMMANDS_SCHEMA.find((cmd) => cmd.name === 'completion');
  const profileCmd = COMMANDS_SCHEMA.find((cmd) => cmd.name === 'profile');

  let output = '```bash\n';

  // Install
  if (installCmd?.examples) {
    output += '# Install Chrome CMD extension\n';
    output += `${installCmd.examples.join('\n')}\n\n`;
  }

  // Update
  if (updateCmd?.examples) {
    output += '# Update to latest version\n';
    output += `${updateCmd.examples.join('\n')}\n\n`;
  }

  // Completion
  if (completionCmd?.subcommands) {
    output += '# Shell completion (bash/zsh)\n';
    for (const sub of completionCmd.subcommands) {
      if (sub.examples) {
        output += `${sub.examples.join('\n')}\n\n`;
      }
    }
  }

  // Profile management
  if (profileCmd?.subcommands) {
    output += '# Profile management\n';
    for (const sub of profileCmd.subcommands) {
      if (sub.examples) {
        output += `${sub.examples[0].padEnd(35)} # ${sub.description}\n`;
      }
    }
    output += '\n';
  }

  output += '```\n';
  return output;
}

export function generateReadmeSections() {
  return {
    tabManagement: generateTabManagementSection(),
    javascript: generateJavaScriptSection(),
    logs: generateSubCommandSection('tab', 'logs'),
    requests: generateSubCommandSection('tab', 'requests'),
    html: generateSubCommandSection('tab', 'html'),
    screenshots: generateSubCommandSection('tab', 'screenshot'),
    storage: generateSubCommandSection('tab', 'storage'),
    formAutomation: `${generateSubCommandSection('tab', 'click')}\n${generateSubCommandSection('tab', 'input')}`,
    systemCommands: generateSystemCommandsSection()
  };
}
