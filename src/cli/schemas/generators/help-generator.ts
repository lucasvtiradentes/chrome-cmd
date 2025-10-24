import { CLI_NAME } from '../../../shared/constants/constants.js';
import { colors } from '../../../shared/utils/helpers/colors.js';
import type { Command, SubCommand } from '../definitions.js';
import { COMMANDS_SCHEMA } from '../schema.js';

const subcommandIdentation = 30;
const subcommandFlagIdentation = 32;

function formatFlag(flag: { name: string; description?: string; type?: string }): string {
  if (flag.name.startsWith('--') || flag.name.startsWith('-')) {
    return `      ${flag.name.padEnd(subcommandIdentation)} ${flag.description || ''}`;
  }
  return `    ${flag.name.padEnd(subcommandFlagIdentation)} ${flag.description || ''}`;
}

function formatSubCommand(sub: SubCommand, indent = 4): string {
  const spaces = ' '.repeat(indent);

  // Build command name with arguments if they exist
  let commandName = sub.name;
  if (sub.arguments && sub.arguments.length > 0) {
    const argStrings = sub.arguments.map((arg) => (arg.required ? `<${arg.name}>` : `[${arg.name}]`));
    commandName = `${sub.name} ${argStrings.join(' ')}`;
  }

  let output = `${spaces}${commandName.padEnd(subcommandFlagIdentation - indent)} ${sub.description}`;

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
    let output = `  ${colors.yellow(cmd.name)}\n`;
    for (const sub of cmd.subcommands) {
      output += `${formatSubCommand(sub)}\n`;
    }
    return output;
  } else {
    // Standalone command (no subcommands)
    return `  ${colors.yellow(cmd.name.padEnd(subcommandIdentation))} ${cmd.description}\n`;
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

  return limitedExamples.map((ex) => `  ${colors.cyan(`$ ${ex}`)}`).join('\n');
}

export function generateHelp(): string {
  const commandsSection = COMMANDS_SCHEMA.map((cmd) => formatCommand(cmd)).join('\n');
  const examplesSection = generateExamplesSection();

  return `
${colors.bold('USAGE')}
  ${colors.cyan(`$ ${CLI_NAME}`)} ${colors.yellow('<command>')} ${colors.gray('[options]')}

${colors.bold('COMMANDS')}
${commandsSection}
${colors.bold('EXAMPLES')}
${examplesSection}
  `;
}
