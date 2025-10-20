import { CLI_NAME } from '../../constants/constants';
import { type Command, CommandNames, SubCommandNames } from '../cli-command';

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
