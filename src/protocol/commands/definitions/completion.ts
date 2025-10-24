import { CLI_NAME } from '../../../shared/constants/constants.js';
import { type Command, CommandNames, SubCommandNames } from '../definitions.js';

export const completionCommandDefinition: Command = {
  name: CommandNames.COMPLETION,
  description: 'Manage shell completion scripts',
  subcommands: [
    {
      name: SubCommandNames.COMPLETION_INSTALL,
      description: 'Install shell completion',
      examples: [`${CLI_NAME} completion install`]
    },
    {
      name: SubCommandNames.COMPLETION_UNINSTALL,
      description: 'Uninstall shell completion',
      examples: [`${CLI_NAME} completion uninstall`]
    }
  ]
};
