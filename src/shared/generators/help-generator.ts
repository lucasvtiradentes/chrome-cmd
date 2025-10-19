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

  // Build command name with arguments if they exist
  let commandName = sub.name;
  if (sub.arguments && sub.arguments.length > 0) {
    const argStrings = sub.arguments.map((arg) => (arg.required ? `<${arg.name}>` : `[${arg.name}]`));
    commandName = `${sub.name} ${argStrings.join(' ')}`;
  }

  let output = `${spaces}${commandName.padEnd(27 - indent)} ${sub.description}`;

  // Show argument descriptions only if there are multiple arguments or non-obvious ones
  if (sub.arguments && sub.arguments.length > 1) {
    for (const arg of sub.arguments) {
      output += `\n${formatFlag({ name: arg.name, description: arg.description, type: arg.type })}`;
    }
  }

  // Show flags
  if (sub.flags && sub.flags.length > 0) {
    for (const flag of sub.flags) {
      output += `\n${formatFlag(flag)}`;
    }
  }

  return output;
}

function formatCommand(cmd: Command): string {
  if (cmd.subcommands && cmd.subcommands.length > 0) {
    // Command with subcommands
    let output = `  ${chalk.yellow(cmd.name)}\n`;
    for (const sub of cmd.subcommands) {
      output += `${formatSubCommand(sub)}\n`;
    }
    return output;
  } else {
    // Standalone command (no subcommands)
    return `  ${chalk.yellow(cmd.name.padEnd(25))} ${cmd.description}\n`;
  }
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

  // Limit to 10 examples
  const limitedExamples = examples.slice(0, 10);

  return limitedExamples.map((ex) => `  ${chalk.cyan(`$ ${ex}`)}`).join('\n');
}

export function generateHelp(): string {
  const commandsSection = COMMANDS_SCHEMA.map((cmd) => formatCommand(cmd)).join('\n');
  const examplesSection = generateExamplesSection();

  return `
${chalk.bold('Chrome CLI')}

${chalk.bold('GETTING STARTED')}
  1. Open Chrome and go to ${chalk.cyan('chrome://extensions/')}
  2. Enable ${chalk.bold('"Developer mode"')}
  3. Click ${chalk.bold('"Load unpacked"')} and select the extension folder
  4. Follow the installation guide to configure your profile
  5. Test with ${chalk.cyan(`${APP_NAME} tabs list`)}

${chalk.bold('UNINSTALLING')}
  1. ${chalk.cyan(`${APP_NAME} completion uninstall`.padEnd(42))} ${chalk.dim('# Remove shell completions')}
  2. ${chalk.cyan('npm uninstall -g chrome-cmd'.padEnd(42))} ${chalk.dim('# Uninstall package')}
  3. ${chalk.dim('Manually remove extension from chrome://extensions/')}

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
