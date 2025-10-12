import chalk from 'chalk';
import { COMMANDS_SCHEMA, type Command, type SubCommand } from '../commands-schema.js';
import { APP_NAME } from '../constants.js';

function formatFlag(flag: { name: string; description?: string; type?: string }): string {
  if (flag.name.startsWith('--') || flag.name.startsWith('-')) {
    return `      ${flag.name.padEnd(25)} ${flag.description || ''}`;
  }
  return `    ${flag.name.padEnd(27)} ${flag.description || ''}`;
}

function formatSubCommand(sub: SubCommand, indent = 4): string {
  const spaces = ' '.repeat(indent);
  let output = `${spaces}${sub.name.padEnd(27 - indent)} ${sub.description}`;

  if (sub.flags && sub.flags.length > 0) {
    for (const flag of sub.flags) {
      output += `\n${formatFlag(flag)}`;
    }
  }

  return output;
}

function formatCommand(cmd: Command): string {
  let output = `  ${chalk.yellow(cmd.name)}`;

  if (cmd.aliases && cmd.aliases.length > 0) {
    output += ` (alias: ${chalk.gray(cmd.aliases.join(', '))})`;
  }

  output += '\n';

  if (cmd.subcommands && cmd.subcommands.length > 0) {
    for (const sub of cmd.subcommands) {
      output += `${formatSubCommand(sub)}\n`;
    }
  } else {
    output += `    ${cmd.description}\n`;
  }

  return output;
}

function generateExamplesSection(): string {
  const examples: string[] = [];

  // Collect all examples from schema
  for (const cmd of COMMANDS_SCHEMA) {
    if (cmd.examples && cmd.examples.length > 0) {
      examples.push(...cmd.examples);
    }

    if (cmd.subcommands) {
      for (const sub of cmd.subcommands) {
        if (sub.examples && sub.examples.length > 0) {
          examples.push(...sub.examples);
        }
      }
    }
  }

  return examples.map((ex) => `  ${chalk.cyan(`$ ${ex}`)}`).join('\n  \n');
}

export function generateHelp(): string {
  const commandsSection = COMMANDS_SCHEMA.map((cmd) => formatCommand(cmd)).join('\n');
  const examplesSection = generateExamplesSection();

  return `
${chalk.bold('Chrome CLI')}

${chalk.bold('GETTING STARTED')}
  ${chalk.cyan(`${APP_NAME} extension install`)}

  1. Open Chrome and go to ${chalk.cyan('chrome://extensions/')}
  2. Enable ${chalk.bold('"Developer mode"')}
  3. Click ${chalk.bold('"Load unpacked"')} and select the extension folder
  4. Run ${chalk.cyan(`${APP_NAME} extension install`)}
  5. Test with ${chalk.cyan(`${APP_NAME} tabs list`)}

${chalk.bold('UNINSTALLING')}
  Before running ${chalk.cyan('npm uninstall -g chrome-cmd')}, clean up:

  1. ${chalk.cyan(`${APP_NAME} completion uninstall`)}    ${chalk.dim('# Remove shell completions')}
  2. ${chalk.cyan(`${APP_NAME} extension uninstall`)}    ${chalk.dim('# Remove extension config')}
  3. ${chalk.cyan('npm uninstall -g chrome-cmd')}  ${chalk.dim('# Uninstall package')}
  4. ${chalk.dim('Manually remove extension from chrome://extensions/')}

${chalk.bold('NEED HELP?')}
  Run ${chalk.cyan(`${APP_NAME} --help`)} or ${chalk.cyan(`${APP_NAME} <command> --help`)}

${chalk.bold('USAGE')}
  ${chalk.cyan(`$ ${APP_NAME}`)} ${chalk.yellow('<command>')} ${chalk.gray('[options]')}

${chalk.bold('COMMANDS')}
${commandsSection}
${chalk.bold('EXAMPLES')}
${examplesSection}
  `;
}
